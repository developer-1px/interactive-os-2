// ② flat-layout-engine-prd.md
// ② cmux-layout-prd.md
import { definePlugin } from '../plugins/definePlugin'
import { workspace, workspaceCommands } from '../plugins/workspaceStore'
import { layoutCommands } from './layoutCommands'

export function layout() {
  return definePlugin({
    name: 'layout',
    requires: [workspace()],
    commands: {
      // layout 자체 커맨드
      setVisibility: layoutCommands.setVisibility,
      setHidden: layoutCommands.setHidden,
      setGap: layoutCommands.setGap,
      updateNode: layoutCommands.updateNode,
      setFocus: layoutCommands.setFocus,
      splitHere: layoutCommands.splitHere,
      closeHere: layoutCommands.closeHere,
      focusDir: layoutCommands.focusDir,
      flashPane: layoutCommands.flashPane,
      replaceStore: layoutCommands.replaceStore,
      // cmux-layout-prd — workspace 커맨드 re-export.
      // definePlugin의 `requires`는 middleware만 병합하고 commands는 병합하지 않으므로
      // chatKeybindings가 dispatch하는 addTab/nextTab/prevTab/gotoTab/removeTab/setActiveTab가
      // 엔진 레지스트리에 등록되지 않는 버그가 있었다. layoutPlugin이 최상위 컨테이너이므로
      // 여기서 flatten 한다.
      workspaceSetActiveTab: workspaceCommands.setActiveTab,
      workspaceCreateTab: workspaceCommands.createTab,
      workspaceAddTab: workspaceCommands.addTab,
      workspaceRemoveTab: workspaceCommands.removeTab,
      workspaceSplitPane: workspaceCommands.splitPane,
      workspaceClosePane: workspaceCommands.closePane,
      workspaceNextTab: workspaceCommands.nextTab,
      workspacePrevTab: workspaceCommands.prevTab,
      workspaceGotoTab: workspaceCommands.gotoTab,
      workspaceResize: workspaceCommands.resize,
    },
  })
}
