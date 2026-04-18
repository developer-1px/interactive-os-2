var e=`// ② flat-layout-engine-prd.md
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
    },
  })
}
`;export{e as default};