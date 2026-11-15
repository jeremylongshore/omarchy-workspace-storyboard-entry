# Changelog

Notable changes to this plugin.

Entries are derived from this repository's commit history, so every line
corresponds to a real change. The format follows Keep a Changelog and the
project uses Semantic Versioning.

Regenerate after a release with:

```bash
scripts/gen-changelog.py . "<Plugin Name>" "<version>"
```

The generator normalises em and en dashes, because a changelog is shipped prose
and gate c28 refuses them.

## [Unreleased]

Nothing yet.

## [0.2.1] - 2026-11-15

### Fixed

- Jump to a workspace on Hyprland 0.57. Its `hyprctl dispatch` evaluates the
  argument as Lua, so the classic `dispatch workspace N` was a syntax error and
  every click failed. A click now sends
  `hl.dsp.focus({ workspace = "N" })` first, the form Omarchy itself uses, and
  falls back to the classic form when the reply is not exactly `ok` with exit
  status 0.
- Qualify Omarchy's palette as `Commons.Color`, as the shell contract requires
  now that Qt 6.12 has its own `Color` type. A contract test fails on any bare
  `Color.` in the shipped QML.

### Changed

- Seed the rig render's isolated home with the current-theme state a real
  Omarchy install has, so first-party shell plugins on current Omarchy do not
  log warnings the render would read as plugin warnings.
- The render fixture's `hyprctl` accepts the Lua dispatch form and replies `ok`
  like hyprctl, and the pre-capture hook drives the Lua form.
- Bump `actions/setup-node` to 7.1.0 and the MiniMax review action to the
  fork's current main (`cfb2c72`), with the audit harness re-pinned.

## [0.2.0] - 2026-08-29

### Added

- Keyboard selection, direct workspace shortcuts, and accessible action names.
- A visible control and command for clearing retained local workspace history.
- Concurrent-writer, active-racer, publication-cleanup, accessibility, smoke,
  mutation, audit, and Buzz acceptance coverage.

### Changed

- Serialized legitimate history writers with a private descriptor-checked lock.
- Bound CI permissions and upgraded the test lane to current pinned actions.
- Reframed Buzz evidence to distinguish real Omarchy rendering from fixture
  Hyprland inputs in the headless container.

## [0.1.0] - 2026-08-27

### Added

- Initial plugin.
