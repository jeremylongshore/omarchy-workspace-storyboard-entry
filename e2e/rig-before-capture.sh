#!/bin/sh
# Prove the fixed-argv workspace action changes the state the panel consumes.
set -eu

scanner="${PLUGIN_DIR:?}/bin/workspace-storyboard-scan"
# The panel's first attempt on current Hyprland: the Lua dispatch form.
reply="$(hyprctl dispatch 'hl.dsp.focus({ workspace = "2" })')"
test "$reply" = ok
switched="$($scanner)"

printf '%s\n' "$switched" | jq -e '
  .activeId == 2 and (.workspaces | length) == 4 and
  (.history | length) >= 4 and .history[0].id == 2 and
  (.history[0].title | contains("Code Review"))
' >/dev/null

grep -Fx 'dispatch:2' "${XDG_RUNTIME_DIR:?}/storyboard-hyprctl.log" >/dev/null
