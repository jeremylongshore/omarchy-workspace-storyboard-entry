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
  property var state: ({ valid: false, current: null, workspaces: [], history: [] })
  property bool loaded: false
  property double nowMs: Date.now()
  readonly property bool isAlert: false
  readonly property string label: loaded ? Model.pillText(state) : "SPACE"
  readonly property string tooltip: loaded ? Model.tooltipText(state) : "Reading local workspace state…"
  function open() { openedFromHotkey = false; root.controller.show(); root.refresh() }
  function openFromHotkey() { openedFromHotkey = true; root.controller.show(); root.refresh() }
  function close() { root.controller.hide() }
  function toggle() { if (root.opened) root.close(); else root.openFromHotkey() }
  function switchPanel(direction) { return root.bar && typeof root.bar.switchPanelFrom === "function" ? root.bar.switchPanelFrom(root.barIdentity, direction) : false }
  function refresh() { nowMs = Date.now(); if (!scanProc.running) scanProc.running = true }
  function go(id) { if (Model.validId(id) && !jumpProc.running) { jumpProc.command = ["hyprctl", "dispatch", "workspace", String(id)]; jumpProc.running = true } }
  Process { id: scanProc; command: [root.scannerPath]; stdout: StdioCollector { waitForEnd: true; onStreamFinished: { var next = Model.parseStoryboard(text, root.nowMs); root.state = next.valid ? next : ({ valid: false, current: null, workspaces: [], history: [] }); root.loaded = true } } }
  Process { id: jumpProc; command: []; onExited: root.refresh() }
  Timer { interval: 15000; running: true; repeat: true; triggeredOnStart: true; onTriggered: root.refresh() }
  Timer { interval: 30000; running: true; repeat: true; onTriggered: root.nowMs = Date.now() }
  IpcHandler {
    target: root.ipcTarget
    function open(): void { root.openFromHotkey() }
    function close(): void { root.close() }
    function show(): void { root.openFromHotkey() }
    function hide(): void { root.close() }
    function toggle(): void { root.toggle() }
    function refresh(): void { if (root.hostWidget && typeof root.hostWidget.broadcast === "function") root.hostWidget.broadcast("refresh"); else root.refresh() }
  }
  KeyboardPanel {
    id: panel; anchorItem: root.anchorItem; owner: root.barIdentity; bar: root.bar; open: root.opened; centerOnBar: true; focusTarget: keys
    contentWidth: panel.fittedContentWidth(Style.space(450)); contentHeight: panel.fittedContentHeight(content.implicitHeight)
    PanelKeyCatcher { id: keys; anchors.fill: parent; onCloseRequested: root.close(); onTabRequested: function(direction) { root.switchPanel(direction) }
      Flickable { anchors.fill: parent; contentWidth: width; contentHeight: content.implicitHeight; clip: true; boundsBehavior: Flickable.StopAtBounds; interactive: contentHeight > height
        Column { id: content; width: parent.width; spacing: Style.space(8)
          PanelHero { title: !root.loaded ? "READING WORKSPACES" : (root.state.current ? "WORKSPACE " + root.state.current.id : "NO ACTIVE WORKSPACE"); meta: !root.loaded ? "Local Hyprland metadata only." : "Click a workspace to jump. Re-entry stays local."; foreground: root.bar ? root.bar.foreground : Color.foreground; fontFamily: root.bar ? root.bar.fontFamily : Style.font.family }
          Column { visible: root.loaded; width: parent.width; spacing: Style.space(2); PanelSeparator { foreground: root.bar ? root.bar.foreground : Color.foreground }
            Repeater { model: root.state.workspaces; Item { required property var modelData; width: content.width; height: Style.space(30); readonly property real hue: (modelData.id * 0.137) % 1.0; readonly property color workspaceColor: Qt.hsla(hue, 0.52, 0.64, 1)
              Rectangle { anchors.fill: parent; anchors.leftMargin: Style.space(8); anchors.rightMargin: Style.space(8); radius: Style.space(4); color: Qt.hsla(parent.hue, 0.52, 0.50, parent.modelData.active ? 0.20 : 0.055) }
              Rectangle { visible: parent.modelData.active; anchors.left: parent.left; anchors.leftMargin: Style.space(8); anchors.verticalCenter: parent.verticalCenter; width: Style.space(3); height: parent.height - Style.space(8); radius: width / 2; color: parent.workspaceColor }
              Text { anchors.left: parent.left; anchors.leftMargin: Style.space(16); anchors.verticalCenter: parent.verticalCenter; text: "SPACE " + modelData.id + "  " + modelData.title; textFormat: Text.PlainText; width: parent.width * .74; elide: Text.ElideRight; color: modelData.active ? parent.workspaceColor : (root.bar ? Qt.darker(root.bar.foreground, 1.18) : Color.muted); font.family: root.bar ? root.bar.fontFamily : Style.font.family; font.pixelSize: Style.font.body }
              Text { anchors.right: parent.right; anchors.rightMargin: Style.space(16); anchors.verticalCenter: parent.verticalCenter; text: modelData.windows + " W"; textFormat: Text.PlainText; width: parent.width * .16; horizontalAlignment: Text.AlignRight; elide: Text.ElideRight; color: modelData.active ? parent.workspaceColor : (root.bar ? Qt.darker(root.bar.foreground, 1.35) : Color.muted); font.family: root.bar ? root.bar.fontFamily : Style.font.family; font.pixelSize: Style.font.caption }
              MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: root.go(modelData.id) }
            } }
          }
          Column { visible: root.loaded && root.state.history.length > 0; width: parent.width; spacing: Style.space(2)
            PanelSeparator { foreground: root.bar ? root.bar.foreground : Color.foreground }
            PanelSectionHeader { text: "RECENT RE-ENTRY"; leftPadding: Style.space(16); foreground: root.bar ? root.bar.foreground : Color.foreground; fontFamily: root.bar ? root.bar.fontFamily : Style.font.family }
            Repeater { model: root.state.history.slice(0, 8); Item { required property var modelData; width: content.width; height: Style.space(25); readonly property real hue: (modelData.id * 0.137) % 1.0; readonly property color workspaceColor: Qt.hsla(hue, 0.44, 0.66, 1)
              Rectangle { anchors.fill: parent; anchors.leftMargin: Style.space(8); anchors.rightMargin: Style.space(8); radius: Style.space(3); color: Qt.hsla(parent.hue, 0.40, 0.50, 0.04) }
              Text { anchors.left: parent.left; anchors.leftMargin: Style.space(16); anchors.verticalCenter: parent.verticalCenter; text: "SPACE " + modelData.id + "  " + modelData.title; textFormat: Text.PlainText; width: parent.width * .78; elide: Text.ElideRight; color: parent.workspaceColor; font.family: root.bar ? root.bar.fontFamily : Style.font.family; font.pixelSize: Style.font.caption }
              Text { anchors.right: parent.right; anchors.rightMargin: Style.space(16); anchors.verticalCenter: parent.verticalCenter; text: modelData.age; textFormat: Text.PlainText; width: parent.width * .12; elide: Text.ElideRight; horizontalAlignment: Text.AlignRight; color: root.bar ? Qt.darker(root.bar.foreground, 1.45) : Color.muted; font.family: root.bar ? root.bar.fontFamily : Style.font.family; font.pixelSize: Style.font.caption }
              MouseArea { anchors.fill: parent; cursorShape: Qt.PointingHandCursor; onClicked: root.go(modelData.id) }
            } }
          }
          Item { width: 1; height: Style.space(4) }
        }
      }
    }
  }
}
