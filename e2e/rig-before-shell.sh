#!/bin/sh
# Build a genuine local re-entry trail through the unchanged shipped scanner.
set -eu

scanner="${PLUGIN_DIR:?}/bin/workspace-storyboard-scan"
test -x "$scanner"

for workspace in 1 7 4; do
  hyprctl dispatch workspace "$workspace"
  "$scanner" >/dev/null
done

seeded="$($scanner)"
printf '%s\n' "$seeded" | jq -e '
  .activeId == 4 and (.workspaces | length) == 4 and
  (.history | length) >= 3 and .history[0].id == 4
' >/dev/null
