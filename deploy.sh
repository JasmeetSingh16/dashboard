#!/usr/bin/env bash
# ----------------------------------------------------------------------
# Jaseir AI — deploy the redesign to the VPS.
#
#   curl -fsSL https://raw.githubusercontent.com/JasmeetSingh16/dashboard/main/deploy.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/JasmeetSingh16/dashboard/main/deploy.sh | bash -s -- --dry-run
#
# What it does, per app (one at a time; one app failing never stops the rest):
#   1. Finds the app's git checkout (remote github.com/JasmeetSingh16/<repo>)
#      under /root, /home, /var/www and /opt, and how it runs (pm2 or systemd).
#   2. Backs up every app folder (without node_modules/.next/venv) and the
#      booking agent's bookings.json / leads.json.
#   3. Next.js: stash local edits to files this update changes, pull, npm ci,
#      npm run build. Restarts only if the build succeeds. If anything fails
#      it rolls back (old commit, old .next, old packages) so the old version
#      keeps running.
#      Booking agent: stash, pull, restore bookings.json/leads.json, restart.
#   4. Checks every live URL for the new header and runs `pm2 save`.
#
# It never touches nginx, the firewall, Cloudflare, or creates new pm2
# processes / services. No tokens or passwords are used or stored.
# ----------------------------------------------------------------------

set -u

main() {
  # Nothing below reads the rest of this script from stdin (curl | bash).
  exec </dev/null

  local DRY_RUN=0
  [ "${1:-}" = "--dry-run" ] && DRY_RUN=1
  [ "${DRY_RUN_ENV:-0}" = "1" ] && DRY_RUN=1

  local STAMP LOG BACKUP BOOKING_BACKUP_DIR
  STAMP="$(date +%Y%m%d-%H%M%S)"
  LOG="${LOG_DIR:-/root}/deploy-$STAMP.log"
  BACKUP="${LOG_DIR:-/root}/backup-before-redesign-$STAMP.tar.gz"
  BOOKING_BACKUP_DIR="${LOG_DIR:-/root}/booking-data-backup/$STAMP"
  local SEARCH_ROOTS="${SEARCH_ROOTS:-/root /home /var/www /opt}"
  local GH_USER="JasmeetSingh16"
  local LIVE="https://ai.jaseir.com"

  # Normal permissions for everything the deploy writes into the apps
  # (nginx must be able to read static files). Only the log and backups
  # below are made private.
  umask 022
  (umask 077; : >"$LOG")
  exec > >(tee -a "$LOG") 2>&1

  # app key | repo name | kind | live path
  local APPS=(
    "dashboard|dashboard|next|/"
    "lead-qualification|ai-lead-qualification|next|/ai-lead-qualification/"
    "seo-planner|ai-planner|next|/ai-planner"
    "content-planner|ai-content-planner|next|/ai-content-planner/"
    "conversion-friction|conversion-friction-analyzer|next|/conversion-friction-analyzer"
    "competitor-comparison|ai-competitor-comparison|next|/ai-competitor-comparison/"
    "booking-agent|ai-booking-agent|flask|/ai-booking-agent/"
  )

  hr() { printf '%s\n' "----------------------------------------------------------------------"; }
  say() { printf '\n==> %s\n' "$*"; }
  warn() { printf '  !  %s\n' "$*"; }
  ok() { printf '  ✓  %s\n' "$*"; }
  bad() { printf '  ✗  %s\n' "$*"; }

  hr
  echo "Jaseir AI redesign deploy — $STAMP"
  [ "$DRY_RUN" = 1 ] && echo "DRY RUN: discovery and plan only, nothing will be changed."
  echo "Log: $LOG"
  hr

  # ------------------------------------------------------------------ #
  # Tooling                                                            #
  # ------------------------------------------------------------------ #
  if ! command -v npm >/dev/null 2>&1; then
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    # shellcheck disable=SC1091
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
  fi
  export PATH="$PATH:/usr/local/bin:/usr/bin"
  say "Tools"
  echo "  node: $(command -v node >/dev/null 2>&1 && node -v || echo 'NOT FOUND')"
  echo "  npm:  $(command -v npm >/dev/null 2>&1 && npm -v || echo 'NOT FOUND')"
  echo "  pm2:  $(command -v pm2 >/dev/null 2>&1 && pm2 -v 2>/dev/null | tail -1 || echo 'not found')"
  echo "  git:  $(git --version 2>/dev/null || echo 'NOT FOUND')"
  if command -v node >/dev/null 2>&1; then
    local NODE_MAJOR NODE_MINOR
    NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
    NODE_MINOR="$(node -p 'process.versions.node.split(".")[1]')"
    if [ "$NODE_MAJOR" -lt 20 ] || { [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 9 ]; }; then
      warn "Next.js 16 needs Node 20.9 or newer; builds will probably fail with this version."
    fi
  fi
  local JSON_TOOL=""
  command -v python3 >/dev/null 2>&1 && JSON_TOOL=python3
  [ -z "$JSON_TOOL" ] && command -v node >/dev/null 2>&1 && JSON_TOOL=node

  owner_of() { stat -c %U "$1" 2>/dev/null || stat -f %Su "$1" 2>/dev/null || echo root; }
  home_of() { local h; h="$(getent passwd "$1" 2>/dev/null | cut -d: -f6)"; echo "${h:-/home/$1}"; }

  # Run a command inside a folder as the folder's owner.
  run_in() {
    local dir="$1" owner="$2"
    shift 2
    if [ "$owner" = "root" ] || [ "$(id -un)" != "root" ] || ! command -v runuser >/dev/null 2>&1; then
      (cd "$dir" && "$@")
    else
      runuser -u "$owner" -- env HOME="$(home_of "$owner")" PATH="$PATH" bash -c 'cd "$1" && shift && "$@"' _ "$dir" "$@"
    fi
  }
  g() { local dir="$1" owner="$2"; shift 2; run_in "$dir" "$owner" git -c safe.directory='*' "$@"; }

  # pm2 as a given user (pm2 keeps one process list per user).
  pm2_as() {
    local u="$1"
    shift
    if [ "$u" = "$(id -un)" ]; then pm2 "$@"
    else runuser -u "$u" -- env HOME="$(home_of "$u")" PATH="$PATH" pm2 "$@"; fi
  }

  # `pm2 jlist` → "user<TAB>name<TAB>cwd<TAB>exec_path<TAB>status" lines.
  pm2_procs_of() {
    local u="$1" jl
    jl="$(pm2_as "$u" jlist 2>/dev/null)"
    [ -z "$jl" ] && return 0
    if [ "$JSON_TOOL" = python3 ]; then
      printf '%s' "$jl" | python3 -c '
import json, sys
u = sys.argv[1]
lines = sys.stdin.read().strip().splitlines()
try:
    data = json.loads(lines[-1]) if lines else []
except Exception:
    data = []
for p in data:
    e = p.get("pm2_env", {})
    print("\t".join([u, p.get("name", ""), e.get("pm_cwd") or "", e.get("pm_exec_path") or "", e.get("status") or ""]))
' "$u"
    else
      printf '%s' "$jl" | node -e '
let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
  let data = []; try { data = JSON.parse(s.trim().split("\n").pop()); } catch {}
  for (const p of data) { const e = p.pm2_env || {}; console.log([process.argv[1], p.name, e.pm_cwd || "", e.pm_exec_path || "", e.status || ""].join("\t")); }
});' "$u"
    fi
  }

  # ------------------------------------------------------------------ #
  # 1. Discover                                                        #
  # ------------------------------------------------------------------ #
  say "1. Discovering app folders under: $SEARCH_ROOTS"

  local GITDIRS
  # shellcheck disable=SC2086
  GITDIRS="$(find $SEARCH_ROOTS -maxdepth 6 \
    \( -name node_modules -o -name .next -o -name venv -o -name .cache -o -name .npm -o -name '*.deploy-backup' \) -prune \
    -o -type d -name .git -print 2>/dev/null)"

  # pm2 processes for every user that runs a pm2 daemon.
  local PM2_PROCS=""
  if command -v pm2 >/dev/null 2>&1 && [ -n "$JSON_TOOL" ]; then
    local u
    for u in $( (ps -eo user=,args= 2>/dev/null | awk '/PM2 v[0-9]/ && !/awk/ {print $1}'; id -un) | sort -u); do
      PM2_PROCS+="$(pm2_procs_of "$u")"$'\n'
    done
  fi

  # systemd services: "unit<TAB>workdir<TAB>execstart"
  local SYSTEMD_UNITS=""
  if command -v systemctl >/dev/null 2>&1; then
    local unit
    for unit in $(systemctl list-units --type=service --all --no-legend --plain 2>/dev/null | awk '{print $1}'); do
      local wd ex
      wd="$(systemctl show -p WorkingDirectory --value "$unit" 2>/dev/null)"
      ex="$(systemctl show -p ExecStart --value "$unit" 2>/dev/null | tr '\n' ' ')"
      [ -n "$wd$ex" ] && SYSTEMD_UNITS+="$unit"$'\t'"$wd"$'\t'"$ex"$'\n'
    done
  fi

  # Results per app (indexed like APPS)
  local -a DIR OWNER MANAGER MGR_NAME MGR_USER
  local -a S_PULL S_BUILD S_RESTART S_LIVE NOTE
  local i
  for i in "${!APPS[@]}"; do
    IFS='|' read -r key repo kind path <<<"${APPS[$i]}"
    DIR[$i]=""; OWNER[$i]=""; MANAGER[$i]=""; MGR_NAME[$i]=""; MGR_USER[$i]=""
    S_PULL[$i]="➖"; S_BUILD[$i]="➖"; S_RESTART[$i]="➖"; S_LIVE[$i]="➖"; NOTE[$i]=""

    local matches=() gd d url
    while IFS= read -r gd; do
      [ -z "$gd" ] && continue
      d="${gd%/.git}"
      url="$(git -c safe.directory='*' -C "$d" remote get-url origin 2>/dev/null || true)"
      if printf '%s' "$url" | grep -Eiq "github\.com[:/]+$GH_USER/$repo(\.git)?/?$"; then
        matches+=("$d")
      fi
    done <<<"$GITDIRS"

    if [ "${#matches[@]}" -eq 0 ]; then
      NOTE[$i]="folder not found"
      continue
    fi

    # Prefer the checkout a pm2 process or systemd service actually runs from.
    local chosen="" m
    for m in "${matches[@]}"; do
      if printf '%s' "$PM2_PROCS" | awk -F'\t' -v d="$m" '$3==d || index($3, d"/")==1 || index($4, d"/")==1 {f=1} END {exit !f}'; then chosen="$m"; break; fi
      if printf '%s' "$SYSTEMD_UNITS" | awk -F'\t' -v d="$m" '$2==d || index($2, d"/")==1 || index($3, d"/") {f=1} END {exit !f}'; then chosen="$m"; break; fi
    done
    [ -z "$chosen" ] && chosen="${matches[0]}"
    [ "${#matches[@]}" -gt 1 ] && NOTE[$i]="${#matches[@]} checkouts found; using this one"
    DIR[$i]="$chosen"
    OWNER[$i]="$(owner_of "$chosen")"

    # How is it run?
    local line
    line="$(printf '%s' "$PM2_PROCS" | awk -F'\t' -v d="$chosen" '$3==d || index($3, d"/")==1 || index($4, d"/")==1' | head -1)"
    if [ -n "$line" ]; then
      MANAGER[$i]="pm2"
      MGR_USER[$i]="$(printf '%s' "$line" | cut -f1)"
      MGR_NAME[$i]="$(printf '%s' "$PM2_PROCS" | awk -F'\t' -v d="$chosen" '$3==d || index($3, d"/")==1 || index($4, d"/")==1 {print $2}' | sort -u | paste -sd' ' -)"
    else
      line="$(printf '%s' "$SYSTEMD_UNITS" | awk -F'\t' -v d="$chosen" '$2==d || index($2, d"/")==1 || index($3, d"/")' | head -1)"
      if [ -n "$line" ]; then
        MANAGER[$i]="systemd"
        MGR_NAME[$i]="$(printf '%s' "$line" | cut -f1)"
      fi
    fi
  done

  echo
  printf '  %-22s %-58s %s\n' "APP" "FOLDER" "RUNS AS"
  printf '  %-22s %-58s %s\n' "---" "------" "-------"
  for i in "${!APPS[@]}"; do
    IFS='|' read -r key repo kind path <<<"${APPS[$i]}"
    local runs="?"
    case "${MANAGER[$i]}" in
      pm2) runs="pm2: ${MGR_NAME[$i]} (user ${MGR_USER[$i]})" ;;
      systemd) runs="systemd: ${MGR_NAME[$i]}" ;;
      *) runs="NOT FOUND — will not be restarted" ;;
    esac
    if [ -z "${DIR[$i]}" ]; then
      printf '  %-22s %-58s %s\n' "$key" "— not found (skipped) —" ""
    else
      printf '  %-22s %-58s %s\n' "$key" "${DIR[$i]}" "$runs"
      [ -n "${NOTE[$i]}" ] && printf '  %-22s %s\n' "" "note: ${NOTE[$i]}"
    fi
  done
  for i in "${!APPS[@]}"; do
    [ -z "${DIR[$i]}" ] && warn "$(cut -d'|' -f1 <<<"${APPS[$i]}"): no git checkout of github.com/$GH_USER/$(cut -d'|' -f2 <<<"${APPS[$i]}") found — skipping."
  done

  # Show local (server-only) edits so they're on record before anything changes.
  say "Local changes on the server (kept in git stash if the update touches them)"
  for i in "${!APPS[@]}"; do
    [ -z "${DIR[$i]}" ] && continue
    local st
    st="$(g "${DIR[$i]}" "${OWNER[$i]}" status --short 2>/dev/null)"
    echo "  [$(cut -d'|' -f1 <<<"${APPS[$i]}")] $(g "${DIR[$i]}" "${OWNER[$i]}" rev-parse --short HEAD 2>/dev/null) on $(g "${DIR[$i]}" "${OWNER[$i]}" rev-parse --abbrev-ref HEAD 2>/dev/null)"
    if [ -n "$st" ]; then printf '%s\n' "$st" | sed 's/^/      /'; else echo "      (clean)"; fi
  done

  if [ "$DRY_RUN" = 1 ]; then
    hr
    echo "DRY RUN complete. Nothing was changed. Run without --dry-run to deploy."
    hr
    return 0
  fi

  # ------------------------------------------------------------------ #
  # 2. Backup                                                          #
  # ------------------------------------------------------------------ #
  say "2. Backing up app folders"
  local found=()
  for i in "${!APPS[@]}"; do [ -n "${DIR[$i]}" ] && found+=("${DIR[$i]}"); done
  if [ "${#found[@]}" -gt 0 ]; then
    if (umask 077; tar --exclude='node_modules' --exclude='.next' --exclude='venv' --exclude='*.deploy-backup' \
      -czf "$BACKUP" "${found[@]}" 2>/dev/null); then
      ok "Backup written: $BACKUP ($(du -h "$BACKUP" | cut -f1))"
    else
      bad "Backup failed. Stopping before any change is made."
      return 1
    fi
  fi

  local BOOK_IDX=""
  for i in "${!APPS[@]}"; do
    [ "$(cut -d'|' -f3 <<<"${APPS[$i]}")" = flask ] && [ -n "${DIR[$i]}" ] && BOOK_IDX="$i"
  done
  if [ -n "$BOOK_IDX" ]; then
    (umask 077; mkdir -p "$BOOKING_BACKUP_DIR")
    local f
    for f in bookings.json leads.json; do
      if [ -f "${DIR[$BOOK_IDX]}/$f" ]; then
        cp -p "${DIR[$BOOK_IDX]}/$f" "$BOOKING_BACKUP_DIR/$f" && ok "Saved $f → $BOOKING_BACKUP_DIR/$f"
      else
        warn "$f not found in ${DIR[$BOOK_IDX]} (nothing to back up)"
      fi
    done
  fi

  # ------------------------------------------------------------------ #
  # 3. Deploy                                                          #
  # ------------------------------------------------------------------ #
  restart_app() { # index
    local j="$1" n rc=0
    case "${MANAGER[$j]}" in
      pm2)
        for n in ${MGR_NAME[$j]}; do pm2_as "${MGR_USER[$j]}" restart "$n" --update-env >/dev/null 2>&1 || rc=1; done
        return $rc
        ;;
      systemd) systemctl restart "${MGR_NAME[$j]}" ;;
      *) return 2 ;;
    esac
  }

  is_running() { # index
    local j="$1" n st
    case "${MANAGER[$j]}" in
      pm2)
        for n in ${MGR_NAME[$j]}; do
          st="$(pm2_procs_of "${MGR_USER[$j]}" | awk -F'\t' -v n="$n" '$2==n {print $5}' | head -1)"
          [ "$st" = "online" ] || return 1
        done
        return 0
        ;;
      systemd) systemctl is-active --quiet "${MGR_NAME[$j]}" ;;
      *) return 0 ;;
    esac
  }

  # Make app files readable by other users (e.g. nginx serving /static),
  # except secrets and runtime data. Repairs files written by the first
  # version of this script, which used a private umask.
  fix_perms() { # dir
    find "$1" \( -name node_modules -o -name .next -o -name venv -o -name .git -o -name __pycache__ \) -prune -o \
      \( -name '.env*' -o -name bookings.json -o -name leads.json \) -prune -o \
      -exec chmod u+rwX,go+rX {} + 2>/dev/null
    chmod go+rX "$1" 2>/dev/null
  }

  # Stash local edits only to files the update changes; everything else
  # (e.g. server-only tweaks, .env files) is left exactly as it is.
  stash_conflicts() { # dir owner
    local d="$1" o="$2" incoming changed overlap
    incoming="$(g "$d" "$o" diff --name-only HEAD origin/main 2>/dev/null)"
    changed="$(g "$d" "$o" diff --name-only HEAD 2>/dev/null)"
    overlap="$(comm -12 <(printf '%s\n' "$incoming" | sort -u) <(printf '%s\n' "$changed" | sort -u) | sed '/^$/d')"
    if [ -n "$overlap" ]; then
      echo "  Stashing local edits to files this update changes:"
      printf '%s\n' "$overlap" | sed 's/^/      /'
      # shellcheck disable=SC2046
      g "$d" "$o" stash push -m "pre-redesign-deploy $STAMP" -- $(printf '%s\n' "$overlap") >/dev/null 2>&1
    fi
  }

  for i in "${!APPS[@]}"; do
    IFS='|' read -r key repo kind path <<<"${APPS[$i]}"
    [ -z "${DIR[$i]}" ] && continue
    local d="${DIR[$i]}" o="${OWNER[$i]}"
    say "3. Deploying $key  ($d)"

    local OLD_HEAD
    OLD_HEAD="$(g "$d" "$o" rev-parse HEAD 2>/dev/null)"

    if ! g "$d" "$o" fetch origin main; then
      bad "git fetch failed"; S_PULL[$i]="❌"; continue
    fi
    stash_conflicts "$d" "$o"
    if g "$d" "$o" pull --ff-only origin main; then
      S_PULL[$i]="✅"; ok "Pulled $(g "$d" "$o" rev-parse --short HEAD)"
      fix_perms "$d"
    else
      bad "git pull failed (see above). Old version left untouched."
      S_PULL[$i]="❌"; continue
    fi

    if [ "$kind" = flask ]; then
      local f
      for f in bookings.json leads.json; do
        if [ -f "$BOOKING_BACKUP_DIR/$f" ]; then
          cp -p "$BOOKING_BACKUP_DIR/$f" "$d/$f" && ok "Restored $f"
        fi
      done
      S_BUILD[$i]="➖"
      if restart_app "$i"; then S_RESTART[$i]="✅"; ok "Restarted"; else S_RESTART[$i]="❌"; bad "Restart failed or no process manager found"; fi
      continue
    fi

    # Next.js: keep a copy of the current build so a failure can be undone.
    rm -rf "$d/.next.deploy-backup"
    [ -d "$d/.next" ] && cp -a "$d/.next" "$d/.next.deploy-backup"

    local built=0
    echo "  npm ci…"
    if run_in "$d" "$o" npm ci --no-audit --no-fund; then
      echo "  npm run build…"
      if run_in "$d" "$o" npm run build; then built=1; fi
    fi

    if [ "$built" = 1 ]; then
      S_BUILD[$i]="✅"; ok "Build succeeded"
      rm -rf "$d/.next.deploy-backup"
      if restart_app "$i"; then S_RESTART[$i]="✅"; ok "Restarted"; else S_RESTART[$i]="❌"; bad "Restart failed or no process manager found"; fi
    else
      S_BUILD[$i]="❌"; S_RESTART[$i]="➖"
      bad "BUILD FAILED for $key — rolling back to the previous version ($OLD_HEAD)."
      g "$d" "$o" reset --hard "$OLD_HEAD" >/dev/null 2>&1
      if [ -d "$d/.next.deploy-backup" ]; then rm -rf "$d/.next" && mv "$d/.next.deploy-backup" "$d/.next"; fi
      echo "  Reinstalling the previous packages…"
      run_in "$d" "$o" npm ci --no-audit --no-fund >/dev/null 2>&1 || warn "npm ci for the old version failed too"
      if ! is_running "$i"; then
        warn "The old process isn't online — restarting the old version."
        restart_app "$i" && S_RESTART[$i]="↩︎ old"
      fi
      NOTE[$i]="build failed — rolled back; local edits (if any) are in: git stash list"
    fi
  done

  # ------------------------------------------------------------------ #
  # 4. Verify                                                          #
  # ------------------------------------------------------------------ #
  say "4. Verifying live pages (waiting 10s for apps to start)"
  sleep 10
  for i in "${!APPS[@]}"; do
    IFS='|' read -r key repo kind path <<<"${APPS[$i]}"
    [ -z "${DIR[$i]}" ] && continue
    local body code
    code="$(curl -s -o /dev/null -w '%{http_code}' -L "$LIVE$path?deploycheck=$STAMP")"
    body="$(curl -s -L "$LIVE$path?deploycheck=$STAMP")"
    if printf '%s' "$body" | grep -q 'jk-header'; then
      S_LIVE[$i]="✅"; ok "$LIVE$path  (HTTP $code, new header found)"
    else
      S_LIVE[$i]="❌"; bad "$LIVE$path  (HTTP $code, new header NOT found)"
    fi
  done

  if command -v pm2 >/dev/null 2>&1; then
    local u
    for u in $(for i in "${!APPS[@]}"; do [ "${MANAGER[$i]}" = pm2 ] && echo "${MGR_USER[$i]}"; done | sort -u); do
      pm2_as "$u" save >/dev/null 2>&1 && ok "pm2 save ($u)"
    done
  fi

  # ------------------------------------------------------------------ #
  # 5. Summary                                                         #
  # ------------------------------------------------------------------ #
  echo
  hr
  echo "SUMMARY"
  hr
  printf '  %-22s %-8s %-8s %-10s %-6s %s\n' "APP" "PULLED" "BUILT" "RESTARTED" "LIVE" "NOTE"
  for i in "${!APPS[@]}"; do
    IFS='|' read -r key repo kind path <<<"${APPS[$i]}"
    [ -z "${DIR[$i]}" ] && NOTE[$i]="not found on server — skipped"
    printf '  %-22s %-8s %-8s %-10s %-6s %s\n' "$key" "${S_PULL[$i]}" "${S_BUILD[$i]}" "${S_RESTART[$i]}" "${S_LIVE[$i]}" "${NOTE[$i]}"
  done
  hr
  echo "Backup:          $BACKUP"
  [ -n "$BOOK_IDX" ] && echo "Booking data:    $BOOKING_BACKUP_DIR"
  echo "Full log:        $LOG"
  echo "Next step:       purge the Cloudflare cache (Caching → Configuration → Purge Everything)."
  hr
}

main "$@"
