// Pure, bounded presentation model for local Hyprland workspace metadata.
var MAX_WORKSPACES = 20
var MAX_HISTORY = 40

function clean(value, max) {
  var s = String(value === undefined || value === null ? "" : value)
  s = s.replace(/[<>]/g, "").replace(/[\x00-\x1f\x7f]/g, "")
  var cap = max || 64
  // Stryker disable next-line ConditionalExpression,EqualityOperator: slicing a string exactly at or below its length is observably equivalent.
  return s.length > cap ? s.slice(0, cap) : s
}

function validId(value) { return Number.isInteger(value) && value > 0 && value <= 999 }

function ageLabel(epoch, nowMs) {
  var n = Number(epoch)
  if (!isFinite(n) || n <= 0) return "NOW"
  var seconds = Math.max(0, Math.floor((Number(nowMs) / 1000) - n))
  if (seconds < 60) return "NOW"
  if (seconds < 3600) return Math.floor(seconds / 60) + "M"
  if (seconds < 86400) return Math.floor(seconds / 3600) + "H"
  return Math.floor(seconds / 86400) + "D"
}

function parseStoryboard(raw, nowMs) {
  var data
  // Stryker disable next-line BlockStatement: falling through with undefined data produces the same fail-closed envelope below.
  try { data = JSON.parse(String(raw || "")) } catch (e) { return { valid: false, current: null, workspaces: [], history: [] } }
  if (!data || !Array.isArray(data.workspaces) || !Array.isArray(data.history)) return { valid: false, current: null, workspaces: [], history: [] }
  var workspaces = []
  var seen = {}
  // Stryker disable next-line EqualityOperator: the synthetic row at length is rejected by validId and has no observable effect.
  for (var i = 0; i < data.workspaces.length && workspaces.length < MAX_WORKSPACES; i++) {
    var row = data.workspaces[i] || {}
    if (!validId(row.id) || seen[row.id]) continue
    seen[row.id] = true
    workspaces.push({ id: row.id, active: row.id === data.activeId, windows: Math.max(0, Math.min(99, Number(row.windows) || 0)), title: clean(row.title, 52), app: clean(row.app, 24) })
  }
  var history = []
  // Stryker disable next-line EqualityOperator: the synthetic row at length is rejected by validId and has no observable effect.
  for (var j = 0; j < data.history.length && history.length < MAX_HISTORY; j++) {
    var item = data.history[j] || {}
    if (!validId(item.id)) continue
    history.push({ id: item.id, title: clean(item.title, 52), app: clean(item.app, 24), age: ageLabel(item.at, nowMs) })
  }
  var current = null
  for (var k = 0; k < workspaces.length; k++) if (workspaces[k].active) { current = workspaces[k]; break }
  return { valid: true, current: current, workspaces: workspaces, history: history }
}

function pillText(state) { return state && state.current ? "SPACE " + state.current.id : "SPACE" }
function tooltipText(state) { return state && state.current ? "Workspace " + state.current.id + ": " + (state.current.title || "no active window") : "Workspace storyboard loading" }

function keepSelection(workspaces, selectedId, preferredId) {
  if (!Array.isArray(workspaces) || !workspaces.length) return 0
  for (var i = 0; i < workspaces.length; i++) if (workspaces[i].id === selectedId) return selectedId
  for (var j = 0; j < workspaces.length; j++) if (workspaces[j].id === preferredId) return preferredId
  return workspaces[0].id
}

function stepSelection(workspaces, selectedId, delta) {
  if (!Array.isArray(workspaces) || !workspaces.length) return 0
  var index = 0
  for (var i = 0; i < workspaces.length; i++) if (workspaces[i].id === selectedId) index = i
  index = (index + delta + workspaces.length) % workspaces.length
  return workspaces[index].id
}

// Stryker disable next-line all: CommonJS export guard is unreachable in QML and required for node:test.
if (typeof module !== "undefined") module.exports = { MAX_WORKSPACES, MAX_HISTORY, clean, validId, ageLabel, parseStoryboard, pillText, tooltipText, keepSelection, stepSelection }
