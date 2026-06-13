#!/usr/bin/env bash
# Auto-deploy the Sovereign Strategy dashboard to GitHub Pages whenever its
# source files change. Wired as a global Claude Code Stop hook.
# GitHub Pages serves from the main branch root — no build step needed.

set -uo pipefail

DIR="$HOME/sovereign-strategy-dashboard"
MARKER="$DIR/.last-deploy-hash"
LOG="/tmp/dashboard-auto-deploy.log"
FILES=(index.html styles.css app.js sample-data.js)

# Bail silently if the dashboard isn't on this machine.
[ -d "$DIR" ] || exit 0
cd "$DIR" || exit 0

# All deployable files must be present; otherwise do nothing.
for f in "${FILES[@]}"; do
  [ -f "$f" ] || exit 0
done

# Content hash of just the deployable files.
HASH=$(cat "${FILES[@]}" | shasum -a 256 | awk '{print $1}')
PREV=$(cat "$MARKER" 2>/dev/null || true)

# Unchanged since last deploy -> nothing to do (fast path).
[ "$HASH" = "$PREV" ] && exit 0

# Stage, commit, and push.
if git add index.html styles.css app.js sample-data.js \
  && git diff --cached --quiet && exit 0 \
  ; then
  true
fi

if git add index.html styles.css app.js sample-data.js \
  && git commit -m "Dashboard update [auto-deploy]" \
  && git push origin main >"$LOG" 2>&1; then
  printf '%s' "$HASH" > "$MARKER"
  printf '{"systemMessage":"✅ Dashboard pushed to GitHub Pages (benriggins.github.io/sovereign-strategy-dashboard)"}\n'
else
  printf '{"systemMessage":"⚠️ Dashboard auto-deploy FAILED — see %s"}\n' "$LOG"
fi
exit 0
