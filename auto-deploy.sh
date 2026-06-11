#!/usr/bin/env bash
# Auto-deploy the Sovereign Strategy dashboard to Netlify whenever its source
# files change. Wired as a global Claude Code Stop hook. Cheap no-op when the
# files are unchanged since the last deploy (guarded by a content hash).

set -uo pipefail

DIR="$HOME/sovereign-strategy-dashboard"
SITE="7e7952f1-4913-493b-9196-ee472666c6eb"
MARKER="$DIR/.netlify/.last-deploy-hash"
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

# Stage a clean publish dir (only the 4 files — no zip/readme/.netlify).
TMP=$(mktemp -d)
cp "${FILES[@]}" "$TMP"/

if npx -y netlify-cli deploy --prod --dir "$TMP" --site "$SITE" >"$LOG" 2>&1; then
  mkdir -p "$DIR/.netlify"
  printf '%s' "$HASH" > "$MARKER"
  URL=$(grep -Eo 'https://[a-z0-9.-]+netlify\.app' "$LOG" | head -1)
  rm -rf "$TMP"
  printf '{"systemMessage":"✅ Dashboard changes auto-deployed to Netlify (%s)"}\n' "${URL:-https://cosmic-kataifi-286c95.netlify.app}"
else
  rm -rf "$TMP"
  printf '{"systemMessage":"⚠️ Dashboard auto-deploy FAILED — see %s"}\n' "$LOG"
fi
exit 0
