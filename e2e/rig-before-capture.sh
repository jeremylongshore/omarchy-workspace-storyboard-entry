#!/bin/sh
# Prove the fixed-argv workspace action changes the state the panel consumes.
set -eu

scanner="${PLUGIN_DIR:?}/bin/workspace-storyboard-scan"
hyprctl dispatch workspace 2
switched="$($scanner)"

printf '%s\n' "$switched" | jq -e '
  .activeId == 2 and (.workspaces | length) == 4 and
  (.history | length) >= 4 and .history[0].id == 2 and
  (.history[0].title | contains("Code Review"))
' >/dev/null

grep -Fx 'dispatch:2' "${XDG_RUNTIME_DIR:?}/storyboard-hyprctl.log" >/dev/null
