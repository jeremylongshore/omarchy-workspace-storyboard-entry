# Requirements Traceability Matrix: Workspace Storyboard
<!-- Managed by audit-tests. MoSCoW decisions are hash-pinned after review. -->

| Req ID | MoSCoW | Source | Description | Layers | Test files | Status |
|---|---|---|---|---|---|---|
| REQ-WS-001 | MUST | README.md | Show at most 20 valid live workspaces and 40 valid local re-entry events | L3, L4 | tests/model.test.js, tests/scanner.test.js | Covered |
| REQ-WS-002 | MUST | README.md | Bound every Hyprland response, title, history read, final payload, and subprocess | L3, L5 | tests/scanner.test.js, bin/workspace-storyboard-scan | Covered |
| REQ-WS-003 | MUST | Marketplace #2901 | Refuse state path traversal and resist final, temp, parent, FIFO, and oversized hostile entries | L3, L5 | tests/scanner.test.js, tests/fixtures | Covered |
| REQ-WS-004 | MUST | Marketplace #2901 | Serialize concurrent legitimate writers without losing distinct transitions | L3, L4 | tests/scanner.test.js | Covered |
| REQ-WS-005 | MUST | README.md | Keep retained data private, capped, documented, and explicitly clearable | L3, L5 | tests/scanner.test.js, tests/a11y.test.js | Covered |
| REQ-WS-006 | MUST | Panel.qml | Parse scanner output fail-closed and dispatch only revalidated numeric workspace IDs | L3, L5 | tests/model.test.js, tests/smoke.test.js | Covered |
| REQ-WS-007 | MUST | Panel.qml | Expose named button roles and keyboard selection, activation, and clearing | L5, L6 | tests/a11y.test.js | Covered |
| REQ-WS-008 | MUST | submission process | Validate, load, open, exercise fixture dispatch, and render in the Buzz Omarchy shell | L6, L7 | e2e/buzz.sh | Covered |
| REQ-WS-009 | SHOULD | marketplace presentation | Show a readable selected workspace, recent trail, clear control, and keyboard legend | L3, L6 | tests/model.test.js, e2e/buzz.sh | Covered |
