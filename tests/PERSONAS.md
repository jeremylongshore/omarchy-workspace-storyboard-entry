# Personas: Workspace Storyboard
<!-- Managed by audit-tests. -->

## Keyboard-first workspace operator

Tier: local desktop user
Permissions: local plugin and Hyprland workspace commands
Key flows: open the map, select a workspace, jump directly, revisit a recent workspace, clear history
Test coverage:
  - open, select, and direct jump: tests/a11y.test.js and e2e/buzz.sh
  - recent re-entry: tests/model.test.js and tests/scanner.test.js
  - clear retained history: tests/a11y.test.js and tests/scanner.test.js
Coverage: 3/3 flows (100%)

## Privacy-conscious Omarchy operator

Tier: local desktop user
Permissions: local Hyprland metadata only
Key flows: bound untrusted window metadata, protect state, remove retained titles
Test coverage:
  - metadata bounds: tests/model.test.js and tests/scanner.test.js
  - hostile and concurrent state: tests/scanner.test.js and tests/fixtures
  - retention removal: tests/scanner.test.js and README.md
Coverage: 3/3 flows (100%)
