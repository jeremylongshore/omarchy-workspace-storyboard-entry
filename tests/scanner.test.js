const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const os = require("node:os")
const path = require("node:path")
const { spawn, spawnSync } = require("node:child_process")
const scanner = path.join(__dirname, "..", "bin", "workspace-storyboard-scan")
const historyHelper = path.join(__dirname, "..", "bin", "workspace-storyboard-history")

test("scanner returns a valid empty envelope when hyprctl exists but has no session", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storyboard-scanner-")); const bin = path.join(root, "bin"); fs.mkdirSync(bin)
  const fake = path.join(bin, "hyprctl")
  fs.writeFileSync(fake, '#!/usr/bin/env bash\nprintf "HYPRLAND_INSTANCE_SIGNATURE not set\\n"\nexit 1\n')
  fs.chmodSync(fake, 0o755)
  const result = spawnSync(scanner, [], { encoding: "utf8", env: { ...process.env, HOME: root, XDG_STATE_HOME: path.join(root, "state"), PATH: bin + ":" + process.env.PATH } })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), { activeId: null, workspaces: [], history: [] })
  fs.rmSync(root, { recursive: true, force: true })
})

// Marketplace security review (#2901) regression tests.
function hyprSetup(payloads) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "storyboard-sec-")); const bin = path.join(root, "bin"); fs.mkdirSync(bin)
  const fake = path.join(bin, "hyprctl")
  fs.writeFileSync(fake, `#!/usr/bin/env bash\ncase "$2" in\n workspaces) printf '%s' ${JSON.stringify(payloads.workspaces)} ;;\n activeworkspace) printf '%s' ${JSON.stringify(payloads.active)} ;;\n activewindow) printf '%s' ${JSON.stringify(payloads.window)} ;;\nesac\n`)
  fs.chmodSync(fake, 0o755)
  const env = { ...process.env, HOME: root, XDG_STATE_HOME: path.join(root, "state"), PATH: bin + ":" + process.env.PATH }
  return { root, env, dir: path.join(root, "state", "omarchy-workspace-storyboard") }
}
const runScan = (env) => { const r = spawnSync(scanner, [], { encoding: "utf8", env }); assert.equal(r.status, 0, r.stderr); return JSON.parse(r.stdout) }
const basePayloads = { workspaces: '[{"id":1,"windows":2,"lastwindowtitle":"t"}]', active: '{"id":1}', window: '{"title":"t","class":"c"}' }
const historyRecord = (id, title = "title", app = "app", at = 1700000000) => ({ id, title, app, at })
const runHistory = (env, record, options = {}) => spawnSync(historyHelper, [], {
  encoding: "utf8", env, input: record ? JSON.stringify(record) : "", ...options
})
const stopRacer = child => {
  if (child.exitCode !== null) return Promise.resolve()
  return new Promise(resolve => { child.once("close", resolve); child.kill() })
}

test("state dir and history are created private (0700/0600)", () => {
  const x = hyprSetup(basePayloads); runScan(x.env)
  assert.equal(fs.statSync(x.dir).mode & 0o777, 0o700)
  assert.equal(fs.statSync(path.join(x.dir, "history.jsonl")).mode & 0o777, 0o600)
  fs.rmSync(x.root, { recursive: true, force: true })
})
test("a symlinked history file is never followed, read or written through", () => {
  const x = hyprSetup(basePayloads)
  fs.mkdirSync(x.dir, { recursive: true })
  const victim = path.join(x.root, "victim"); fs.writeFileSync(victim, "precious")
  fs.symlinkSync(victim, path.join(x.dir, "history.jsonl"))
  const scanned = runScan(x.env)
  assert.equal(fs.readFileSync(victim, "utf8"), "precious")
  assert.equal(fs.lstatSync(path.join(x.dir, "history.jsonl")).isSymbolicLink(), false)
  // the symlink read as an empty trail, so history holds only this scan's record
  assert.equal(scanned.history.length, 1)
  fs.rmSync(x.root, { recursive: true, force: true })
})
test("an oversized client-controlled window title is capped, not stored whole", () => {
  const x = hyprSetup({ ...basePayloads, window: JSON.stringify({ title: "A".repeat(100000), class: "c" }) })
  const scanned = runScan(x.env)
  assert.equal(scanned.history[0].title.length, 256)
  fs.rmSync(x.root, { recursive: true, force: true })
})
test("an oversized history file reads as an empty trail instead of being parsed", () => {
  const x = hyprSetup(basePayloads)
  fs.mkdirSync(x.dir, { recursive: true })
  fs.writeFileSync(path.join(x.dir, "history.jsonl"), '{"id":1,"title":"t","app":"c","at":1}\n'.repeat(4000))
  const scanned = runScan(x.env)
  assert.equal(scanned.history.length, 1) // only this scan's fresh record
  fs.rmSync(x.root, { recursive: true, force: true })
})

test("history suppresses polling duplicates and returns newest re-entry first", () => {
  const x = hyprSetup(basePayloads)
  const first = runHistory(x.env, historyRecord(1, "editor", "code", 1700000000))
  assert.equal(first.status, 0, first.stderr)
  const historyPath = path.join(x.dir, "history.jsonl")
  const firstInode = fs.statSync(historyPath).ino
  const duplicate = runHistory(x.env, historyRecord(1, "editor", "code", 1700000010))
  assert.equal(duplicate.status, 0, duplicate.stderr)
  assert.equal(JSON.parse(duplicate.stdout).length, 1)
  assert.equal(fs.statSync(historyPath).ino, firstInode, "duplicate polls must not rewrite history")
  const second = runHistory(x.env, historyRecord(2, "docs", "browser", 1700000020))
  assert.equal(second.status, 0, second.stderr)
  assert.deepEqual(JSON.parse(second.stdout).map(row => row.id), [2, 1])
  fs.rmSync(x.root, { recursive: true, force: true })
})

test("same-UID final and temporary entry swaps never write through to a victim", async () => {
  const x = hyprSetup(basePayloads); runHistory(x.env, historyRecord(1))
  const victim = path.join(x.root, "victim-final-temp"); fs.writeFileSync(victim, "precious")
  const racer = spawn(process.execPath, [path.join(__dirname, "fixtures", "history-swap-racer.js"), x.dir, victim], { stdio: "ignore" })
  try {
    for (let i = 0; i < 60; i++) runHistory(x.env, historyRecord((i % 8) + 1, `title-${i}`))
    assert.equal(fs.readFileSync(victim, "utf8"), "precious")
  } finally {
    await stopRacer(racer)
    fs.rmSync(x.root, { recursive: true, force: true })
  }
})

test("same-UID parent directory swaps cannot redirect history publication", async () => {
  const x = hyprSetup(basePayloads); runHistory(x.env, historyRecord(1))
  const victimDir = path.join(x.root, "victim-parent"); fs.mkdirSync(victimDir)
  const racer = spawn(process.execPath, [path.join(__dirname, "fixtures", "history-parent-racer.js"), x.dir, victimDir], { stdio: "ignore" })
  try {
    for (let i = 0; i < 60; i++) runHistory(x.env, historyRecord((i % 8) + 1, `title-${i}`))
    assert.equal(fs.existsSync(path.join(victimDir, "history.jsonl")), false)
  } finally {
    await stopRacer(racer)
    if (fs.existsSync(x.dir) && fs.lstatSync(x.dir).isSymbolicLink()) fs.unlinkSync(x.dir)
    if (!fs.existsSync(x.dir) && fs.existsSync(`${x.dir}.parked`)) fs.renameSync(`${x.dir}.parked`, x.dir)
    fs.rmSync(x.root, { recursive: true, force: true })
  }
})

test("FIFO history is rejected without blocking and replaced safely", () => {
  const x = hyprSetup(basePayloads); fs.mkdirSync(x.dir, { recursive: true })
  const fifo = path.join(x.dir, "history.jsonl")
  const made = spawnSync("mkfifo", [fifo], { encoding: "utf8" }); assert.equal(made.status, 0, made.stderr)
  const result = runHistory(x.env, historyRecord(1), { timeout: 1000 })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout).map(row => row.id), [1])
  assert.equal(fs.lstatSync(fifo).isFile(), true)
  fs.rmSync(x.root, { recursive: true, force: true })
})

test("a symlinked state parent is refused rather than traversed", () => {
  const x = hyprSetup(basePayloads)
  const victimDir = path.join(x.root, "victim-state-parent"); fs.mkdirSync(victimDir)
  fs.mkdirSync(path.dirname(x.dir), { recursive: true })
  fs.symlinkSync(victimDir, x.dir, "dir")
  const result = runHistory(x.env, historyRecord(1))
  assert.notEqual(result.status, 0)
  assert.equal(fs.existsSync(path.join(victimDir, "history.jsonl")), false)
  fs.rmSync(x.root, { recursive: true, force: true })
})
