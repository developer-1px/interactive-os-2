// ② flat-layout-engine-prd.md
import { definePlugin } from '../plugins/definePlugin'
import { workspace } from '../plugins/workspaceStore'
import { layoutCommands } from './layoutCommands'

export function layout() {
  return definePlugin({
    name: 'layout',
    requires: [workspace()],
    commands: {
      setVisibility: layoutCommands.setVisibility,
      setGap: layoutCommands.setGap,
    },
  })
}
