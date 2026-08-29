import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Model.js" as Model

Panel {
  id: root
  moduleName: "io.github.jeremylongshore.workspace-storyboard"
  ipcTarget: "io.github.jeremylongshore.workspace-storyboard"
  manageIpc: false
  property var anchorItem: null
  property var hostWidget: null
  property bool openedFromHotkey: false
  readonly property var barIdentity: hostWidget || root
  readonly property string scannerPath: Qt.resolvedUrl("bin/workspace-storyboard-scan").toString().replace(/^file:\/\//, "")
  readonly property string historyPath: Qt.resolvedUrl("bin/workspace-storyboard-history").toString().replace(/^file:\/\//, "")
  property var state: ({ valid: false, current: null, workspaces: [], history: [] })
  property bool loaded: false
  property double nowMs: Date.now()
  property int selectedId: 0
  property string actionStatus: ""
  readonly property bool isAlert: false
  readonly property string label: loaded ? Model.pillText(state) : "SPACE"
  readonly property string tooltip: loaded ? Model.tooltipText(state) : "Reading local workspace state…"
  function open() { openedFromHotkey = false; root.controller.show(); root.refresh() }
  function openFromHotkey() { openedFromHotkey = true; root.controller.show(); root.refresh() }
  function close() { root.controller.hide() }
  function toggle() { if (root.opened) root.close(); else root.openFromHotkey() }
  function switchPanel(direction) { return root.bar && typeof root.bar.switchPanelFrom === "function" ? root.bar.switchPanelFrom(root.barIdentity, direction) : false }
  function refresh() { nowMs = Date.now(); if (!scanProc.running) scanProc.running = true }
  function go(id) { if (Model.validId(id) && !jumpProc.running) { root.selectedId = id; root.actionStatus = ""; jumpProc.command = ["hyprctl", "dispatch", "workspace", String(id)]; jumpProc.running = true } }
  function moveSelection(delta) { root.selectedId = Model.stepSelection(root.state.workspaces, root.selectedId, delta) }
  function clearHistory() { if (!historyProc.running) { root.actionStatus = ""; historyProc.command = [root.historyPath, "--clear"]; historyProc.running = true } }
  Process { id: scanProc; command: [root.scannerPath]; stdout: StdioCollector { waitForEnd: true; onStreamFinished: { var next = Model.parseStoryboard(text, root.nowMs); root.state = next.valid ? next : ({ valid: false, current: null, workspaces: [], history: [] }); root.selectedId = Model.keepSelection(root.state.workspaces, root.selectedId, root.state.current ? root.state.current.id : 0); root.loaded = true } } }
  Process { id: jumpProc; command: []; onExited: function(code) { root.actionStatus = code === 0 ? "" : "WORKSPACE SWITCH FAILED"; root.refresh() } }
  Process { id: historyProc; command: []; onExited: function(code) { root.actionStatus = code === 0 ? "HISTORY CLEARED" : "HISTORY CLEAR FAILED"; root.refresh() } }
  Timer { interval: 15000; running: true; repeat: true; triggeredOnStart: true; onTriggered: root.refresh() }
  Timer { interval: 30000; running: true; repeat: true; onTriggered: root.nowMs = Date.now() }
  IpcHandler {
    target: root.ipcTarget
    function open(): void { root.openFromHotkey() }
    function close(): void { root.close() }
    function show(): void { root.openFromHotkey() }
    function hide(): void { root.close() }
    function toggle(): void { root.toggle() }
    function jump(id: int): void { root.go(id) }
    function refresh(): void { if (root.hostWidget && typeof root.hostWidget.broadcast === "function") root.hostWidget.broadcast("refresh"); else root.refresh() }
  }
  KeyboardPanel {
    id: panel; anchorItem: root.anchorItem; owner: root.barIdentity; bar: root.bar; open: root.opened; centerOnBar: true; focusTarget: keys
    contentWidth: panel.fittedContentWidth(Style.space(450)); contentHeight: panel.fittedContentHeight(content.implicitHeight)
    PanelKeyCatcher { id: keys; anchors.fill: parent; onCloseRequested: root.close(); onTabRequested: function(direction) { root.switchPanel(direction) }
      Keys.onPressed: function(event) {
        if (event.key === Qt.Key_Up) root.moveSelection(-1)
        else if (event.key === Qt.Key_Down) root.moveSelection(1)
        else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter || event.key === Qt.Key_Space) root.go(root.selectedId)
        else if (event.key === Qt.Key_C) root.clearHistory()
        else if (event.key >= Qt.Key_1 && event.key <= Qt.Key_9) root.go(event.key - Qt.Key_0)
        else return
        event.accepted = true
      }
      Flickable { anchors.fill: parent; contentWidth: width; contentHeight: content.implicitHeight; clip: true; boundsBehavior: Flickable.StopAtBounds; interactive: contentHeight > height
        Column { id: content; width: parent.width; spacing: Style.space(8)
          PanelHero { title: !root.loaded ? "READING WORKSPACES" : (root.state.current ? "WORKSPACE " + root.state.current.id : "NO ACTIVE WORKSPACE"); meta: !root.loaded ? "Local Hyprland metadata only." : "Click a workspace to jump. Re-entry stays local."; foreground: root.bar ? root.bar.foreground : Color.foreground; fontFamily: root.bar ? root.bar.fontFamily : Style.font.family }
          Column { visible: root.loaded; width: parent.width; spacing: Style.space(2); PanelSeparator { foreground: root.bar ? root.bar.foreground : Color.foreground }
            Repeater { model: root.state.workspaces; Rectangle { required property var modelData; width: content.width; height: Style.space(34); color: "transparent"; readonly property real hue: (modelData.id * 0.137) % 1.0; readonly property color workspaceColor: Qt.hsla(hue, 0.52, 0.64, 1); readonly property bool selected: root.selectedId === modelData.id; readonly property color selectedFill: Qt.hsla(hue, 0.52, 0.50, selected ? 0.22 : (modelData.active ? 0.14 : 0.055)); Accessible.role: Accessible.Button; Accessible.name: "Switch to workspace " + modelData.id + ", " + modelData.windows + " windows, " + (modelData.title || "no active window")
              Rectangle { anchors.fill: parent; anchors.leftMargin: Style.space(8); anchors.rightMargin: Style.space(8); radius: Style.space(4); color: parent.selectedFill; border.color: Qt.hsla(parent.hue, 0.55, 0.65, parent.selected ? 0.82 : 0.18) }
              Rectangle { visible: parent.modelData.active; anchors.left: parent.left; anchors.leftMargin: Style.space(8); anchors.verticalCenter: parent.verticalCenter; width: Style.space(3); height: parent.height - Style.space(8); radius: width / 2; color: parent.workspaceColor }
              Text { anchors.left: parent.left; anchors.leftMargin: Style.space(16); anchors.verticalCenter: parent.verticalCenter; text: "SPACE " + modelData.id + "  " + modelData.title; textFormat: Text.PlainText; width: parent.width * .74; elide: Text.ElideRight; color: modelData.active ? parent.workspaceColor : (root.bar ? Qt.darker(root.bar.foreground, 1.18) : Color.muted); font.family: root.bar ? root.bar.fontFamily : Style.font.family; font.pixelSize: Style.font.body }
              Text { anchors.right: parent.right; anchors.rightMargin: Style.space(16); anchors.verticalCenter: parent.verticalCenter; text: modelData.windows + " W"; textFormat: Text.PlainText; width: parent.width * .16; horizontalAlignment: Text.AlignRight; elide: Text.ElideRight; color: modelData.active ? parent.workspaceColor : (root.bar ? Qt.darker(root.bar.foreground, 1.35) : Color.muted); font.family: root.bar ? root.bar.fontFamily : Style.font.family; font.pixelSize: Style.font.caption }
              MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: { root.selectedId = modelData.id; root.go(modelData.id) } }
            } }
          }
          Column { visible: root.loaded && root.state.history.length > 0; width: parent.width; spacing: Style.space(2)
            PanelSeparator { foreground: root.bar ? root.bar.foreground : Color.foreground }
            PanelSectionHeader { text: "RECENT RE-ENTRY"; leftPadding: Style.space(16); foreground: root.bar ? root.bar.foreground : Color.foreground; fontFamily: root.bar ? root.bar.fontFamily : Style.font.family }
            Repeater { model: root.state.history.slice(0, 8); Rectangle { required property var modelData; width: content.width; height: Style.space(25); color: "transparent"; readonly property real hue: (modelData.id * 0.137) % 1.0; readonly property color workspaceColor: Qt.hsla(hue, 0.44, 0.66, 1); Accessible.role: Accessible.Button; Accessible.name: "Return to recent workspace " + modelData.id + ", " + (modelData.title || "no active window")
              Rectangle { anchors.fill: parent; anchors.leftMargin: Style.space(8); anchors.rightMargin: Style.space(8); radius: Style.space(3); color: Qt.hsla(parent.hue, 0.40, 0.50, 0.04) }
              Text { anchors.left: parent.left; anchors.leftMargin: Style.space(16); anchors.verticalCenter: parent.verticalCenter; text: "SPACE " + modelData.id + "  " + modelData.title; textFormat: Text.PlainText; width: parent.width * .78; elide: Text.ElideRight; color: parent.workspaceColor; font.family: root.bar ? root.bar.fontFamily : Style.font.family; font.pixelSize: Style.font.caption }
              Text { anchors.right: parent.right; anchors.rightMargin: Style.space(16); anchors.verticalCenter: parent.verticalCenter; text: modelData.age; textFormat: Text.PlainText; width: parent.width * .12; elide: Text.ElideRight; horizontalAlignment: Text.AlignRight; color: root.bar ? Qt.darker(root.bar.foreground, 1.45) : Color.muted; font.family: root.bar ? root.bar.fontFamily : Style.font.family; font.pixelSize: Style.font.caption }
              MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: root.go(modelData.id) }
            } }
            Rectangle { width: parent.width - Style.space(32); x: Style.space(16); height: Style.space(32); radius: Style.space(4); color: "transparent"; border.color: root.bar ? Qt.darker(root.bar.foreground, 1.45) : Color.muted; Accessible.role: Accessible.Button; Accessible.name: "Clear local workspace history"
              Text { anchors.centerIn: parent; text: "CLEAR LOCAL HISTORY  [C]"; textFormat: Text.PlainText; color: root.bar ? Qt.darker(root.bar.foreground, 1.20) : Color.muted; font.family: root.bar ? root.bar.fontFamily : Style.font.family; font.pixelSize: Style.font.caption; font.bold: true }
              MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: root.clearHistory() }
            }
          }
          Text { visible: root.loaded && root.state.workspaces.length > 0; text: "UP/DOWN select  •  ENTER jump  •  1-9 direct  •  C clear history"; textFormat: Text.PlainText; width: parent.width - Style.space(32); x: Style.space(16); elide: Text.ElideRight; color: root.bar ? Qt.darker(root.bar.foreground, 1.35) : Color.muted; font.family: root.bar ? root.bar.fontFamily : Style.font.family; font.pixelSize: Style.font.caption }
          Text { visible: root.actionStatus !== ""; text: root.actionStatus; textFormat: Text.PlainText; width: parent.width - Style.space(32); x: Style.space(16); elide: Text.ElideRight; color: root.actionStatus === "HISTORY CLEARED" ? Qt.hsla(0.34, 0.55, 0.68, 1) : Qt.hsla(0.01, 0.62, 0.68, 1); font.family: root.bar ? root.bar.fontFamily : Style.font.family; font.pixelSize: Style.font.caption; font.bold: true }
          Item { width: 1; height: Style.space(4) }
        }
      }
    }
  }
}
