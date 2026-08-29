# Workspace Storyboard

![Workspace Storyboard banner](assets/banner.svg)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/U5S225PTME)

Workspace Storyboard is a local, bounded re-entry memory for Hyprland
workspaces. It shows active workspaces, their current window count, and a compact
trail of recently active windows so returning to a project has a little context.

It reads local Hyprland JSON only. Every Hyprland response and final payload is
time and byte bounded. History is capped at 40 real transitions, suppresses
unchanged polling duplicates, and is read and published beneath retained state
directory descriptors. Every workspace action revalidates a numeric ID. When
no Hyprland session is available it returns a valid empty state.

## Install

```bash
omarchy plugin add https://github.com/jeremylongshore/omarchy-workspace-storyboard-entry --enable
```

Click a workspace or recent entry to return to it.

## Verify

```bash
npm test
bash scripts/run-plugin-gates.sh
bash scripts/check-lane-freshness.sh
bash scripts/rig-verify.sh .
bash scripts/rig-render.sh . preview.png
```

## License

MIT
