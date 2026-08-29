# Workspace Storyboard Test Audit

Date: 2026-08-29
Scope: maintainer-grade individual marketplace re-audit

## Outcome

The prior submission proved descriptor-bound hostile-path handling but omitted
four product-critical layers: concurrent legitimate writes, retention removal,
keyboard accessibility, and readable marketplace evidence. This remediation
adds those behaviors and tests them at the layer where each failure can occur.

## Evidence map

- Static: Perl compile, ShellCheck, actionlint, vendored Omarchy gates, npm audit
- Unit: presentation parsing, bounds, labels, and selection transitions
- Integration: real scanner and history subprocesses against local filesystem fixtures
- Security: ready/attacked same-UID racers, path traversal, FIFO, oversized input,
  private modes, publication cleanup, and concurrent legitimate writers
- Accessibility: named button roles and keyboard activation contract
- Mutation: Stryker over all Model.js behavior with a 90 percent blocking floor
- Stability: full scanner and race suite repeated three times
- Acceptance: validator, qmllint, real Omarchy shell load, IPC panel open,
  deterministic fixture scan and dispatch, and a Buzz-captured preview

## Evidence boundary

Buzz runs the actual Omarchy shell and plugin QML inside `omarchy-rig`. Its
headless compositor is Sway, so the Hyprland JSON and dispatch command are local
fixtures with logged fixed argv. This is not represented as a live Hyprland
compositor test. Stock-shape Hyprland JSON is covered independently by the smoke
and scanner suites.

## Remaining advisories

- The audit harness browser-oriented accessibility heuristic cannot discover
  QML `Accessible` properties. `tests/a11y.test.js` is the platform-specific
  executable control.
- There is no network API or schema migration, so those layers are waived.
