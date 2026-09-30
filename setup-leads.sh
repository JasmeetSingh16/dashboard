#!/usr/bin/env bash
# ----------------------------------------------------------------------
# Jaseir AI — one-time VPS setup for lead capture, then deploy.
#
#   curl -fsSL https://raw.githubusercontent.com/JasmeetSingh16/dashboard/main/setup-leads.sh -o /root/setup-leads.sh
#   bash /root/setup-leads.sh
#
# 1. Finds the dashboard + 5 gated agent folders (by their GitHub remote).
# 2. Writes to each app's .env.local:
#      all 6 apps:  REPORT_UNLOCK_SECRET  (same random value everywhere)
#      dashboard:   LEADS_ADMIN_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER,
#                   SMTP_PASS, LEAD_NOTIFY_EMAIL
#    Existing values are kept unless you type a new one. Secrets are
#    generated here and never leave the server.
# 3. Runs deploy.sh (pull, build, restart, roll back on failure).
# Safe to run again.
# ----------------------------------------------------------------------

set -u

NOTIFY_EMAIL_DEFAULT="jasmeetjaseir@gmail.com"
GH_USER="JasmeetSingh16"
AGENTS="ai-lead-qualification ai-planner ai-content-planner conversion-friction-analyzer ai-competitor-comparison"

say() { printf '\n==> %s\n' "$*"; }
ok() { printf '  ✓  %s\n' "$*"; }
bad() { printf '  ✗  %s\n' "$*"; }

GITDIRS="$(find /root /home /var/www /opt -maxdepth 6 \( -name node_modules -o -name .next -o -name venv \) -prune \
  -o -type d -name .git -print 2>/dev/null)"

find_app() { # repo → folder
  local repo="$1" g d
  while IFS= read -r g; do
    [ -z "$g" ] && continue
    d="${g%/.git}"
    if git -c safe.directory='*' -C "$d" remote get-url origin 2>/dev/null | grep -Eq "github\.com[:/]+$GH_USER/$repo(\.git)?/?$"; then
      echo "$d"
      return 0
    fi
  done <<<"$GITDIRS"
  return 1
}

get_env() { # file key → value
  [ -f "$1" ] && grep -E "^$2=" "$1" | tail -1 | cut -d= -f2-
}

set_env() { # file key value
  local f="$1" k="$2" v="$3"
  if [ ! -f "$f" ]; then
    : >"$f"
    chown --reference="$(dirname "$f")" "$f" 2>/dev/null
    chmod 600 "$f"
  fi
  sed -i "/^$k=/d" "$f"
  printf '%s=%s\n' "$k" "$v" >>"$f"
}

say "Finding the apps"
DASH="$(find_app dashboard)" || { bad "dashboard folder not found — stopping."; exit 1; }
ok "dashboard → $DASH"
DASH_ENV="$DASH/.env.local"

# One unlock secret for every app (reuse the dashboard's if it exists).
SECRET="$(get_env "$DASH_ENV" REPORT_UNLOCK_SECRET)"
[ -z "$SECRET" ] && SECRET="$(openssl rand -base64 32)"

set_env "$DASH_ENV" REPORT_UNLOCK_SECRET "$SECRET"
for repo in $AGENTS; do
  if dir="$(find_app "$repo")"; then
    set_env "$dir/.env.local" REPORT_UNLOCK_SECRET "$SECRET"
    ok "$repo → $dir/.env.local"
  else
    bad "$repo not found on this server — skipped"
  fi
done

say "Leads admin key"
ADMIN_KEY="$(get_env "$DASH_ENV" LEADS_ADMIN_KEY)"
[ -z "$ADMIN_KEY" ] && ADMIN_KEY="$(openssl rand -hex 16)"
set_env "$DASH_ENV" LEADS_ADMIN_KEY "$ADMIN_KEY"
(umask 077; printf '%s\n' "$ADMIN_KEY" >/root/jaseir-leads-admin-key.txt)
ok "saved (also in /root/jaseir-leads-admin-key.txt)"

say "Lead notification email (Gmail SMTP)"
CURRENT_PASS="$(get_env "$DASH_ENV" SMTP_PASS)"
[ -n "$CURRENT_PASS" ] && echo "  An app password is already set — press Enter to keep it."
printf '  Paste your 16-letter Gmail app password (input hidden, Enter to skip): '
read -rs PASS </dev/tty
echo
PASS="$(printf '%s' "$PASS" | tr -d ' ')"
[ -z "$PASS" ] && PASS="$CURRENT_PASS"

NOTIFY="$(get_env "$DASH_ENV" LEAD_NOTIFY_EMAIL)"
[ -z "$NOTIFY" ] && NOTIFY="$NOTIFY_EMAIL_DEFAULT"

if [ -n "$PASS" ]; then
  set_env "$DASH_ENV" SMTP_HOST "smtp.gmail.com"
  set_env "$DASH_ENV" SMTP_PORT "465"
  set_env "$DASH_ENV" SMTP_USER "$NOTIFY"
  set_env "$DASH_ENV" SMTP_PASS "$PASS"
  set_env "$DASH_ENV" LEAD_NOTIFY_EMAIL "$NOTIFY"
  ok "emails will go to $NOTIFY"
else
  bad "no app password — leads are still saved, but no emails are sent (run this again later to add it)"
fi

say "Deploying (pull, build, restart)"
curl -fsSL "https://raw.githubusercontent.com/$GH_USER/dashboard/main/deploy.sh" | bash

cat <<EOF

----------------------------------------------------------------------
DONE
  Leads admin:  https://ai.jaseir.com/leads-admin/
  Admin key:    $ADMIN_KEY
                (also saved in /root/jaseir-leads-admin-key.txt)
  Next:         Cloudflare → Caching → Configuration → Purge Everything
----------------------------------------------------------------------
EOF
