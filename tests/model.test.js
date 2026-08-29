const test = require("node:test")
const assert = require("node:assert/strict")
const M = require("../Model.js")
const now = 1_700_000_000_000
const raw = (x) => JSON.stringify(x)

test("clean and workspace ids fail closed", () => {
  assert.equal(M.clean('<b>x</b>\x00'), "bx/b")
  assert.equal(M.clean("x".repeat(80), 8).length, 8)
  assert.equal(M.clean("short", 8), "short")
  assert.equal(M.clean(undefined), "")
  assert.equal(M.clean(null), "")
  assert.equal(M.clean(""), "")
  for (const value of [0, -1, 1.2, 1000, "1", NaN]) assert.equal(M.validId(value), false)
  assert.equal(M.validId(7), true)
  assert.equal(M.validId(999), true)
})

test("storyboard accepts bounded valid local workspace state", () => {
  const state = M.parseStoryboard(raw({ activeId: 2, workspaces: [
    { id: 2, windows: 3, title: "<Editor>", app: "Code" }, { id: 1, windows: -3, title: "Shell" }, { id: 2, title: "duplicate" }
  ], history: [{ id: 2, title: "<Editor>", app: "Code", at: 1_699_999_940 }, { id: 9999, title: "bad", at: 1 }] }), now)
  assert.equal(state.valid, true); assert.equal(state.workspaces.length, 2); assert.equal(state.current.id, 2)
  assert.deepEqual(state.workspaces[0], { id: 2, active: true, windows: 3, title: "Editor", app: "Code" })
  assert.deepEqual(state.history, [{ id: 2, title: "Editor", app: "Code", age: "1M" }])
})

test("storyboard rejects malformed envelopes and caps hostile arrays", () => {
  const invalid = { valid: false, current: null, workspaces: [], history: [] }
  assert.deepEqual(M.parseStoryboard("bad", now), invalid)
  assert.deepEqual(M.parseStoryboard(null, now), invalid)
  assert.deepEqual(M.parseStoryboard(raw({ workspaces: [] }), now), invalid)
  assert.deepEqual(M.parseStoryboard(raw({ workspaces: {}, history: [] }), now), invalid)
  assert.deepEqual(M.parseStoryboard(raw({ workspaces: [], history: {} }), now), invalid)
  const state = M.parseStoryboard(raw({ activeId: 1, workspaces: Array.from({ length: 50 }, (_, i) => ({ id: i + 1 })), history: Array.from({ length: 100 }, () => ({ id: 1, at: 0 })) }), now)
  assert.equal(state.workspaces.length, M.MAX_WORKSPACES); assert.equal(state.history.length, M.MAX_HISTORY)
  const secondActive = M.parseStoryboard(raw({ activeId: 2, workspaces: [{ id: 1 }, { id: 2 }], history: [] }), now)
  assert.equal(secondActive.workspaces[0].active, false)
  assert.equal(secondActive.current.id, 2)
  const noActive = M.parseStoryboard(raw({ activeId: 9, workspaces: [{ id: 1 }], history: [] }), now)
  assert.equal(noActive.current, null)
})

test("time and display labels cover state boundaries", () => {
  assert.equal(M.ageLabel("bad", now), "NOW"); assert.equal(M.ageLabel(0, now), "NOW"); assert.equal(M.ageLabel(1_699_999_990, now), "NOW")
  assert.equal(M.ageLabel(1_699_996_400, now), "1H"); assert.equal(M.ageLabel(1_699_913_600, now), "1D")
  assert.equal(M.ageLabel(1_699_992_800, now), "2H"); assert.equal(M.ageLabel(1_699_700_000, now), "3D")
  assert.equal(M.pillText(null), "SPACE"); assert.equal(M.pillText({ current: { id: 4 } }), "SPACE 4")
  assert.equal(M.tooltipText(null), "Workspace storyboard loading")
  assert.equal(M.tooltipText({ current: { id: 4, title: "Editor" } }), "Workspace 4: Editor")
  assert.equal(M.tooltipText({ current: { id: 4, title: "" } }), "Workspace 4: no active window")
})

test("selection survives refresh and wraps through available workspaces", () => {
  const rows = [{ id: 1 }, { id: 3 }, { id: 7 }]
  assert.equal(M.keepSelection(rows, 3, 1), 3)
  assert.equal(M.keepSelection(rows, 9, 7), 7)
  assert.equal(M.keepSelection(rows, 9, 9), 1)
  assert.equal(M.keepSelection([], 3, 1), 0)
  assert.equal(M.keepSelection(null, 3, 1), 0)
  assert.equal(M.stepSelection(rows, 3, 1), 7)
  assert.equal(M.stepSelection(rows, 1, -1), 7)
  assert.equal(M.stepSelection([], 1, 1), 0)
  assert.equal(M.stepSelection(null, 1, 1), 0)
})
