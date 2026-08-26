const test = require("node:test")
const assert = require("node:assert/strict")
const M = require("../Model.js")
const now = 1_700_000_000_000
const raw = (x) => JSON.stringify(x)

test("clean and workspace ids fail closed", () => {
  assert.equal(M.clean('<b>x</b>\x00'), "bx/b")
  assert.equal(M.clean("x".repeat(80), 8).length, 8)
  for (const value of [0, -1, 1.2, 1000, "1", NaN]) assert.equal(M.validId(value), false)
  assert.equal(M.validId(7), true)
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
  assert.equal(M.parseStoryboard("bad", now).valid, false)
  assert.equal(M.parseStoryboard(raw({ workspaces: [] }), now).valid, false)
  const state = M.parseStoryboard(raw({ activeId: 1, workspaces: Array.from({ length: 50 }, (_, i) => ({ id: i + 1 })), history: Array.from({ length: 100 }, () => ({ id: 1, at: 0 })) }), now)
  assert.equal(state.workspaces.length, M.MAX_WORKSPACES); assert.equal(state.history.length, M.MAX_HISTORY)
})

test("time and display labels cover state boundaries", () => {
  assert.equal(M.ageLabel("bad", now), "NOW"); assert.equal(M.ageLabel(1_699_999_990, now), "NOW")
  assert.equal(M.ageLabel(1_699_992_800, now), "2H"); assert.equal(M.ageLabel(1_699_700_000, now), "3D")
  assert.equal(M.pillText(null), "SPACE"); assert.equal(M.pillText({ current: { id: 4 } }), "SPACE 4")
  assert.match(M.tooltipText({ current: { id: 4, title: "" } }), /no active window/)
})
