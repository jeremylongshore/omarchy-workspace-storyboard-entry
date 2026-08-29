# User Journeys: Workspace Storyboard
<!-- Managed by audit-tests. Journey criticality is hash-pinned after review. -->

## Journey: return to the right workspace without breaking flow

Personas: keyboard-first workspace operator
Trigger: operator opens Workspace Storyboard from the Omarchy bar
Critical: true
Linked RTM: REQ-WS-001, REQ-WS-006, REQ-WS-007, REQ-WS-008, REQ-WS-009

| # | Step | Layer | Test file | Status |
|---|---|---|---|---|
| 1 | Plugin loads and scans deterministic Hyprland contract data in the stock shell | L6 | tests/smoke.test.js, e2e/buzz.sh | Covered |
| 2 | Panel opens through IPC with the active workspace visibly selected | L5, L6 | tests/a11y.test.js, e2e/buzz.sh | Covered |
| 3 | Up and Down wrap through only current workspaces | L3, L5 | tests/model.test.js, tests/a11y.test.js | Covered |
| 4 | Enter and numeric shortcuts dispatch only a validated workspace ID | L4, L5 | tests/a11y.test.js, tests/smoke.test.js | Covered |
| 5 | A failed dispatch becomes visible instead of silently disappearing | L5 | tests/smoke.test.js | Covered |

Coverage: 5/5 steps (100%)

## Journey: retain useful context without surrendering local privacy

Personas: privacy-conscious Omarchy operator
Trigger: scanner records local, client-controlled window titles during workspace changes
Critical: true
Linked RTM: REQ-WS-002, REQ-WS-003, REQ-WS-004, REQ-WS-005

| # | Step | Layer | Test file | Status |
|---|---|---|---|---|
| 1 | Bound client titles and reject oversized or special history entries | L3, L5 | tests/scanner.test.js | Covered |
| 2 | Traverse every state path component without following symlinks | L5 | tests/scanner.test.js | Covered |
| 3 | Prove final, temp, and parent racers actually attacked without touching victims | L5 | tests/scanner.test.js, tests/fixtures | Covered |
| 4 | Serialize simultaneous legitimate transitions and preserve every distinct event | L3, L4 | tests/scanner.test.js | Covered |
| 5 | Clear all retained events through the panel or helper command | L5, L7 | tests/a11y.test.js, tests/scanner.test.js | Covered |

Coverage: 5/5 steps (100%)
