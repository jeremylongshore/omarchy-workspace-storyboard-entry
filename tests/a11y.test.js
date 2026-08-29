const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const panel = fs.readFileSync(path.join(__dirname, "..", "Panel.qml"), "utf8")

test("workspace actions expose accessible button names", () => {
  assert.match(panel, /Accessible\.name:\s*"Switch to workspace "/)
  assert.match(panel, /Accessible\.name:\s*"Return to recent workspace "/)
  assert.match(panel, /Accessible\.name:\s*"Clear local workspace history"/)
  assert.ok((panel.match(/Accessible\.role:\s*Accessible\.Button/g) || []).length >= 3)
})

test("keyboard users can select, jump, and clear private history", () => {
  for (const key of ["Qt.Key_Up", "Qt.Key_Down", "Qt.Key_Return", "Qt.Key_Enter", "Qt.Key_Space", "Qt.Key_C", "Qt.Key_1", "Qt.Key_9"]) {
    assert.match(panel, new RegExp(key.replace(".", "\\.")))
  }
  assert.match(panel, /root\.go\(root\.selectedId\)/)
  assert.match(panel, /root\.clearHistory\(\)/)
})

test("dynamic workspace fields are bounded plain text", () => {
  assert.ok((panel.match(/textFormat:\s*Text\.PlainText/g) || []).length >= 7)
  assert.match(panel, /text: "SPACE " \+ modelData\.id \+ "  " \+ modelData\.title; textFormat: Text\.PlainText; width:[^;]+; elide: Text\.ElideRight/)
})
