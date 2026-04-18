// ② flat-layout-engine-prd.md
// ② cmux-layout-prd.md
import { definePlugin } from '../plugins/definePlugin'
import { workspace } from '../plugins/workspaceStore'
import { layoutCommands } from './layoutCommands'

export function layout() {
  return definePlugin({
    name: 'layout',
    requires: [workspace()],
    commands: {
      setVisibility: layoutCommands.setVisibility,
      setHidden: layoutCommands.setHidden,
      setGap: layoutCommands.setGap,
      setFocus: layoutCommands.setFocus,
      splitHere: layoutCommands.splitHere,
      closeHere: layoutCommands.closeHere,
      focusDir: layoutCommands.focusDir,
      flashPane: layoutCommands.flashPane,
    },
  })
}
