const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const os = require("node:os")
const { execFileSync } = require("node:child_process")

const root = path.join(__dirname, "..")
const read = name => fs.readFileSync(path.join(root, name), "utf8")

test("marketplace copy uses all 500 characters for the shipped workspace story", () => {
  const manifest = JSON.parse(read("manifest.json"))
  assert.equal(manifest.description.length, 500)
  assert.equal(manifest.barWidget.description.length, 500)
  assert.equal(manifest.barWidget.description, manifest.description)
  for (const claim of ["Hyprland workspaces", "window counts", "active window title", "Up/Down", "application classes", "no network requests", "40 events", "newest eight"]) assert.match(manifest.description, new RegExp(claim))
})

test("banner names and illustrates the local workspace storyboard", () => {
  const banner = read("assets/banner.svg")
  assert.match(banner, /<title id="title">Workspace Storyboard<\/title>/)
  assert.match(banner, /HYPRLAND STATE/)
  assert.match(banner, /BOUNDED HISTORY/)
  assert.match(banner, /<(?:path|circle)\b/)
})

test("render tooling requires 1280x720 provenance and hash-bound approval", () => {
  const render = read("scripts/rig-render.sh")
  assert.match(render, /OMARCHY_RIG_RESOLUTION:-1280x720/)
  assert.match(render, /e2e\/bin/)
  assert.match(render, /export PATH=.*e2e\/bin/)
  assert.match(render, /rawShellLogSha256/)
  assert.match(render, /visualInspection:\{status:"pending"/)
  assert.match(read("scripts/approve-preview.sh"), /product value is visible without reading the README/)
})

test("render fixture proves curated workspace topology and a fixed-argv dispatch", () => {
  const fixture = path.join(root, "e2e/bin/hyprctl")
  assert.ok(fs.statSync(fixture).mode & 0o111, "fixture hyprctl must be executable")
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), "storyboard-render-contract-"))
  const env = { ...process.env, XDG_RUNTIME_DIR: runtime }
  const run = args => execFileSync(fixture, args, { env, encoding: "utf8" })
  try {
    const workspaces = JSON.parse(run(["-j", "workspaces"]))
    assert.deepEqual(workspaces.map(row => row.id), [1, 2, 4, 7])
    assert.equal(JSON.parse(run(["-j", "activeworkspace"])).id, 4)
    run(["dispatch", "workspace", "2"])
    assert.equal(JSON.parse(run(["-j", "activeworkspace"])).id, 2)
    assert.match(JSON.parse(run(["-j", "activewindow"])).title, /Code Review/)
    assert.throws(() => run(["dispatch", "workspace", "99"]), /Command failed/)
  } finally {
    fs.rmSync(runtime, { recursive: true, force: true })
  }
  assert.match(read("e2e/rig-before-shell.sh"), /for workspace in 1 7 4/)
  assert.match(read("e2e/rig-before-capture.sh"), /hyprctl dispatch workspace 2/)
})

test("marketplace contract binds topology, action proof, and image approval", () => {
  const contract = read("contracts/marketplace.md")
  for (const claim of ["500 characters", "1280x720", "four deterministic", "fixed-argv dispatch", "SHA-256"])
    assert.match(contract, new RegExp(claim))
})
