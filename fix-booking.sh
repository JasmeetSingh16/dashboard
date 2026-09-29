#!/usr/bin/env bash
# ----------------------------------------------------------------------
# Jaseir AI — diagnose and fix the booking agent (ai.jaseir.com/ai-booking-agent/).
#
#   curl -fsSL https://raw.githubusercontent.com/JasmeetSingh16/dashboard/main/fix-booking.sh | bash
#
# a) finds the booking agent checkout (remote JasmeetSingh16/ai-booking-agent)
# b) shows how it runs (pm2 / systemd / plain process), its status and logs
# c) repairs file permissions (the first deploy.sh made updated files
#    readable by their owner only, so nginx returned 403 for /static) and
#    makes sure bookings.json / leads.json exist (restored from backup)
# d) pulls the latest code and restarts it exactly the way it ran before
# e) checks it on its local port and on https://ai.jaseir.com/ai-booking-agent/
# f) if it's still down, prints a rollback command — it never runs it for you
#
# Read-only for nginx, firewall and Cloudflare. No tokens or passwords.
# ----------------------------------------------------------------------

set -u

main() {
  exec </dev/null
  umask 022

  local STAMP LOG
  STAMP="$(date +%Y%m%d-%H%M%S)"
  LOG="/root/fix-booking-$STAMP.log"
  exec > >(tee -a "$LOG") 2>&1

  local REPO="ai-booking-agent" GH_USER="JasmeetSingh16"
  local LIVE="https://ai.jaseir.com/ai-booking-agent/"
  local PRE_REDESIGN="29f16cd"

  hr() { printf '%s\n' "----------------------------------------------------------------------"; }
  say() { printf '\n==> %s\n' "$*"; }
  ok() { printf '  ✅ %s\n' "$*"; }
  bad() { printf '  ❌ %s\n' "$*"; }
  info() { printf '     %s\n' "$*"; }

  hr
  echo "Booking agent fix — $STAMP"
  echo "Log: $LOG"
  hr

  if ! command -v pm2 >/dev/null 2>&1; then
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    # shellcheck disable=SC1091
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1
  fi

  home_of() { local h; h="$(getent passwd "$1" 2>/dev/null | cut -d: -f6)"; echo "${h:-/home/$1}"; }
  as_user() { # user cmd...
    local u="$1"; shift
    if [ "$u" = "root" ] || [ -z "$u" ]; then "$@"
    else runuser -u "$u" -- env HOME="$(home_of "$u")" PATH="$PATH" "$@"; fi
  }
  g() { git -c safe.directory='*' -C "$DIR" "$@"; }

  # ------------------------------------------------------------------ #
  # a) Find the folder                                                  #
  # ------------------------------------------------------------------ #
  say "a) Finding the booking agent folder"
  local DIR="" gd d url
  while IFS= read -r gd; do
    d="${gd%/.git}"
    url="$(git -c safe.directory='*' -C "$d" remote get-url origin 2>/dev/null || true)"
    if printf '%s' "$url" | grep -Eiq "github\.com[:/]+$GH_USER/$REPO(\.git)?/?$"; then DIR="$d"; break; fi
  done < <(find /root /home /var/www /opt -maxdepth 6 \
    \( -name node_modules -o -name .next -o -name venv -o -name .cache \) -prune \
    -o -type d -name .git -print 2>/dev/null)

  if [ -z "$DIR" ]; then
    bad "No git checkout of github.com/$GH_USER/$REPO found under /root, /home, /var/www, /opt."
    return 1
  fi
  ok "Folder: $DIR"
  info "Commit: $(g log --oneline -1 2>/dev/null)"

  # ------------------------------------------------------------------ #
  # b) How does it run?                                                 #
  # ------------------------------------------------------------------ #
  say "b) How it runs"
  local MANAGER="" NAME="" RUN_USER="root" PIDS="" CMDLINE="" CMD_CWD=""

  # pm2 (any user running a pm2 daemon)
  if command -v pm2 >/dev/null 2>&1; then
    local u line
    for u in $( (ps -eo user=,args= 2>/dev/null | awk '/PM2 v[0-9]/ && !/awk/ {print $1}'; echo root) | sort -u); do
      line="$(as_user "$u" pm2 jlist 2>/dev/null | python3 -c '
import json, sys
d = sys.argv[1]
lines = sys.stdin.read().strip().splitlines()
try:
    data = json.loads(lines[-1]) if lines else []
except Exception:
    data = []
for p in data:
    e = p.get("pm2_env", {})
    cwd, ex = e.get("pm_cwd") or "", e.get("pm_exec_path") or ""
    if cwd == d or cwd.startswith(d + "/") or ex.startswith(d + "/"):
        print("\t".join([p.get("name", ""), str(p.get("pid") or ""), e.get("status", "")]))
        break
' "$DIR" 2>/dev/null)"
      if [ -n "$line" ]; then
        MANAGER="pm2"; RUN_USER="$u"
        NAME="$(cut -f1 <<<"$line")"; PIDS="$(cut -f2 <<<"$line")"
        info "pm2 process \"$NAME\" (pm2 user $u), status: $(cut -f3 <<<"$line")"
        break
      fi
    done
  fi

  # systemd (includes failed/inactive units)
  if [ -z "$MANAGER" ] && command -v systemctl >/dev/null 2>&1; then
    local unit wd ex
    for unit in $(systemctl list-units --type=service --all --no-legend --plain 2>/dev/null | awk '{print $1}'); do
      wd="$(systemctl show -p WorkingDirectory --value "$unit" 2>/dev/null)"
      ex="$(systemctl show -p ExecStart --value "$unit" 2>/dev/null | tr '\n' ' ')"
      if [ "$wd" = "$DIR" ] || [[ "$wd" == "$DIR/"* ]] || [[ "$ex" == *"$DIR/"* ]] || [[ "$ex" == *"$DIR "* ]]; then
        MANAGER="systemd"; NAME="$unit"
        RUN_USER="$(systemctl show -p User --value "$unit" 2>/dev/null)"; RUN_USER="${RUN_USER:-root}"
        PIDS="$(systemctl show -p MainPID --value "$unit" 2>/dev/null)"; [ "$PIDS" = "0" ] && PIDS=""
        info "systemd service $unit (runs as $RUN_USER): $(systemctl is-active "$unit" 2>/dev/null)"
        info "ExecStart: $ex"
        break
      fi
    done
  fi

  # Plain process (gunicorn / python app.py started by hand)
  if [ -z "$MANAGER" ]; then
    local pid cwd
    for pid in $(pgrep -f "gunicorn|app\.py|flask" 2>/dev/null); do
      cwd="$(readlink "/proc/$pid/cwd" 2>/dev/null)"
      if [ "$cwd" = "$DIR" ]; then
        MANAGER="process"; PIDS="$pid"; CMD_CWD="$cwd"
        RUN_USER="$(ps -o user= -p "$pid" | tr -d ' ')"
        CMDLINE="$(xargs -0 printf '%q ' < "/proc/$pid/cmdline")"
        info "Plain process pid $pid (user $RUN_USER): $CMDLINE"
        break
      fi
    done
  fi

  if [ -z "$MANAGER" ]; then
    bad "Nothing is running it: no pm2 process, systemd service or process found for $DIR."
    info "Clues about how it was started before:"
    grep -hnE "gunicorn|app\.py|booking" /root/.bash_history 2>/dev/null | tail -8 | sed 's/^/       history: /'
    (crontab -l 2>/dev/null | grep -iE "book|gunicorn|app\.py") | sed 's/^/       crontab: /'
  fi

  # Port: from the listening socket, else the start command, else nginx, else app.py's default.
  local PORT="" p
  for p in $PIDS; do
    PORT="$(ss -ltnpH 2>/dev/null | grep -E "pid=${p}[,)]" | awk '{print $4}' | sed -E 's/.*:([0-9]+)$/\1/' | head -1)"
    [ -n "$PORT" ] && break
  done
  if [ -z "$PORT" ]; then
    local src="$CMDLINE"
    [ "$MANAGER" = systemd ] && src="$(systemctl show -p ExecStart --value "$NAME" 2>/dev/null)"
    PORT="$(grep -oE '(-b|--bind)[= ]+[^ ]*:[0-9]+' <<<"$src" | grep -oE '[0-9]+$' | head -1)"
  fi
  local NGINX_UPSTREAM
  NGINX_UPSTREAM="$(grep -rh -A12 "ai-booking-agent" /etc/nginx/ 2>/dev/null | grep -oE 'proxy_pass[[:space:]]+[^;]+' | head -1)"
  [ -n "$NGINX_UPSTREAM" ] && info "nginx sends /ai-booking-agent/ to: ${NGINX_UPSTREAM#proxy_pass }"
  if [ -z "$PORT" ]; then PORT="$(grep -oE ':[0-9]+' <<<"$NGINX_UPSTREAM" | tr -d ':' | head -1)"; fi
  PORT="${PORT:-5005}"
  info "Local port: $PORT"

  say "b) Recent logs (last 50 lines)"
  case "$MANAGER" in
    pm2) as_user "$RUN_USER" pm2 logs "$NAME" --lines 50 --nostream 2>&1 | tail -60 ;;
    systemd) journalctl -u "$NAME" -n 50 --no-pager 2>&1 ;;
    *) info "(no process manager logs)";;
  esac
  echo "  -- nginx errors mentioning upstream/booking (last 10):"
  tail -n 400 /var/log/nginx/error.log 2>/dev/null | grep -iE "upstream|booking|permission|denied" | tail -10 | sed 's/^/     /'
  echo "  -- out-of-memory kills (last 5):"
  (dmesg -T 2>/dev/null || journalctl -k --no-pager 2>/dev/null) | grep -iE "killed process|out of memory" | tail -5 | sed 's/^/     /'

  # ------------------------------------------------------------------ #
  # c) Permissions + data files                                         #
  # ------------------------------------------------------------------ #
  say "c) Repairing permissions and data files"
  # Everything except secrets/data readable by others again (nginx serves /static).
  find "$DIR" \( -name venv -o -name .git -o -name __pycache__ \) -prune -o \
    \( -name '.env*' -o -name bookings.json -o -name leads.json \) -prune -o \
    -exec chmod u+rwX,go+rX {} + 2>/dev/null
  chmod go+rX "$DIR"
  ok "Files readable again (except .env, bookings.json, leads.json)"
  info "static/: $(stat -c '%A %U' "$DIR/static/jaseir-kit.css" 2>/dev/null)"

  local LATEST_BACKUP
  LATEST_BACKUP="$(ls -1d /root/booking-data-backup/*/ 2>/dev/null | sort | tail -1)"
  local f
  for f in bookings.json leads.json; do
    if [ -f "$DIR/$f" ]; then
      ok "$f exists ($(python3 -c "import json;print(len(json.load(open('$DIR/$f'))))" 2>/dev/null || echo '?') entries)"
    elif [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP$f" ]; then
      cp -p "$LATEST_BACKUP$f" "$DIR/$f" && ok "$f restored from $LATEST_BACKUP"
    else
      echo "[]" > "$DIR/$f" && ok "$f created empty (no backup found)"
    fi
    # The app writes these files, so they must belong to the user it runs as.
    chown "$RUN_USER" "$DIR/$f" 2>/dev/null
    chmod 640 "$DIR/$f"
  done

  # ------------------------------------------------------------------ #
  # d) Pull + restart the same way                                      #
  # ------------------------------------------------------------------ #
  say "d) Pulling the latest code"
  g fetch origin main
  local overlap
  overlap="$(comm -12 <(g diff --name-only HEAD origin/main | sort -u) <(g diff --name-only HEAD | sort -u) | sed '/^$/d')"
  if [ -n "$overlap" ]; then
    info "Stashing local edits to files the update changes: $(tr '\n' ' ' <<<"$overlap")"
    # shellcheck disable=SC2046
    g stash push -m "fix-booking $STAMP" -- $(printf '%s\n' "$overlap") >/dev/null 2>&1
  fi
  if g pull --ff-only origin main; then ok "Now at $(g log --oneline -1)"; else bad "git pull failed — continuing with the current code"; fi
  find "$DIR" \( -name venv -o -name .git -o -name __pycache__ \) -prune -o \
    \( -name '.env*' -o -name bookings.json -o -name leads.json \) -prune -o \
    -exec chmod u+rwX,go+rX {} + 2>/dev/null

  say "d) Restarting"
  local RESTART_CMD=""
  case "$MANAGER" in
    pm2)
      RESTART_CMD="pm2 restart $NAME"
      as_user "$RUN_USER" pm2 restart "$NAME" --update-env >/dev/null 2>&1 && ok "pm2 restart $NAME" || bad "pm2 restart failed"
      as_user "$RUN_USER" pm2 save >/dev/null 2>&1
      ;;
    systemd)
      RESTART_CMD="systemctl restart $NAME"
      systemctl restart "$NAME" && ok "systemctl restart $NAME" || bad "systemctl restart failed"
      ;;
    process)
      RESTART_CMD="cd $CMD_CWD && nohup $CMDLINE >> /root/booking-agent.out 2>&1 &"
      kill "$PIDS" 2>/dev/null; sleep 2; kill -9 "$PIDS" 2>/dev/null
      as_user "$RUN_USER" bash -c "cd $(printf '%q' "$CMD_CWD") && nohup $CMDLINE >> /root/booking-agent.out 2>&1 &" \
        && ok "Relaunched: $CMDLINE (output → /root/booking-agent.out)"
      ;;
    *)
      bad "Not restarted — no pm2 process, systemd service or running process to restart."
      ;;
  esac

  # ------------------------------------------------------------------ #
  # e) Check                                                            #
  # ------------------------------------------------------------------ #
  say "e) Checking (up to 30s)"
  local code_local="" code_live="" code_static="" _
  for _ in 1 2 3 4 5 6; do
    sleep 5
    code_local="$(curl -s -o /dev/null -m 10 -w '%{http_code}' "http://127.0.0.1:$PORT/")"
    [ "$code_local" = "200" ] && break
  done
  code_live="$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$LIVE?check=$STAMP")"
  code_static="$(curl -s -o /dev/null -m 20 -w '%{http_code}' "${LIVE}static/jaseir-kit.css?check=$STAMP")"

  local up=1
  if [ "$code_local" = "200" ]; then ok "Local  http://127.0.0.1:$PORT/  → $code_local"; else bad "Local  http://127.0.0.1:$PORT/  → ${code_local:-no answer}"; up=0; fi
  if [ "$code_live" = "200" ]; then ok "Live   $LIVE  → $code_live"; else bad "Live   $LIVE  → ${code_live:-no answer}"; up=0; fi
  if [ "$code_static" = "200" ]; then ok "Static ${LIVE}static/jaseir-kit.css  → $code_static"; else bad "Static ${LIVE}static/jaseir-kit.css  → ${code_static:-no answer}"; up=0; fi

  # ------------------------------------------------------------------ #
  # f) Rollback suggestion                                              #
  # ------------------------------------------------------------------ #
  echo
  hr
  if [ "$up" = 1 ]; then
    echo "✅ Booking agent is UP. Purge the Cloudflare cache so old static files aren't served."
  else
    echo "❌ Booking agent is still DOWN."
    echo
    echo "Please send Claude this whole output (or: tail -n 200 $LOG)."
    echo
    echo "If you want to go back to the pre-redesign version instead, run this"
    echo "ONLY after confirming with Claude:"
    echo
    if [ -n "$RESTART_CMD" ]; then
      echo "  cd $DIR && git -c safe.directory='*' reset --hard $PRE_REDESIGN && $RESTART_CMD"
    else
      echo "  cd $DIR && git -c safe.directory='*' reset --hard $PRE_REDESIGN   # then start it the way you normally do"
    fi
  fi
  echo "Log: $LOG"
  hr
}

main "$@"
