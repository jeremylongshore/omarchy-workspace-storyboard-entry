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
