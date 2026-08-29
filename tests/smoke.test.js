const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const { spawnSync } = require("node:child_process")
const Model = require("../Model.js")

const root = path.join(__dirname, "..")

test("QML calls only exported model functions and keeps the stock panel contract", () => {
  const qml = fs.readFileSync(path.join(root, "Panel.qml"), "utf8")
  const calls = [...qml.matchAll(/Model\.([A-Za-z][A-Za-z0-9_]*)\(/g)].map(match => match[1])
  assert.ok(calls.length > 0)
  for (const name of new Set(calls)) assert.equal(typeof Model[name], "function", name)
  assert.match(qml, /manageIpc:\s*false/)
  assert.match(qml, /KeyboardPanel\s*\{/)
  assert.match(qml, /anchorItem:\s*root\.anchorItem/)
})

test("stock scanner consumes the Hyprland JSON contract and emits bounded state", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "storyboard-smoke-"))
  try {
    const bin = path.join(temp, "bin"); fs.mkdirSync(bin)
    const fake = path.join(bin, "hyprctl")
    fs.writeFileSync(fake, `#!/bin/sh
case "$2" in
  workspaces) printf '%s' '[{"id":1,"windows":2,"lastwindowtitle":"Editor"},{"id":4,"windows":1,"lastwindowtitle":"Docs"}]' ;;
  activeworkspace) printf '%s' '{"id":4}' ;;
  activewindow) printf '%s' '{"title":"Docs","class":"browser"}' ;;
esac
`)
    fs.chmodSync(fake, 0o755)
    const result = spawnSync(path.join(root, "bin", "workspace-storyboard-scan"), [], {
      encoding: "utf8", timeout: 2000,
      env: { ...process.env, HOME: temp, XDG_STATE_HOME: path.join(temp, "state"), PATH: `${bin}:${process.env.PATH}` }
    })
    assert.equal(result.status, 0, result.stderr)
    const state = JSON.parse(result.stdout)
    assert.equal(state.activeId, 4)
    assert.deepEqual(state.workspaces.map(row => row.id), [1, 4])
    assert.equal(state.history[0].title, "Docs")
  } finally {
    fs.rmSync(temp, { recursive: true, force: true })
  }
})

test("runtime actions remain fixed argv and expose failures", () => {
  const qml = fs.readFileSync(path.join(root, "Panel.qml"), "utf8")
  assert.doesNotMatch(qml, /bash|sh -c|execDetached/)
  assert.match(qml, /\["hyprctl", "dispatch", "workspace", String\(id\)\]/)
  assert.match(qml, /function jump\(id: int\): void \{ root\.go\(id\) \}/)
  assert.match(qml, /\[root\.historyPath, "--clear"\]/)
  assert.match(qml, /WORKSPACE SWITCH FAILED/)
  assert.match(qml, /HISTORY CLEAR FAILED/)
})
