// ② flat-layout-engine-prd.md
import { defineCommands } from '../engine/defineCommand'
import { updateEntityData } from '../store/createStore'

export const layoutCommands = defineCommands({
  setVisibility: {
    type: 'layout:setVisibility' as const,
    create: (nodeId: string, visible: boolean) => ({ nodeId, visible }),
    handler: (store, { nodeId, visible }) => updateEntityData(store, nodeId, { visible }),
  },
  setHidden: {
    type: 'layout:setHidden' as const,
    create: (nodeId: string, hidden: boolean) => ({ nodeId, hidden }),
    handler: (store, { nodeId, hidden }) => updateEntityData(store, nodeId, { hidden }),
  },
  setGap: {
    type: 'layout:setGap' as const,
    create: (nodeId: string, gap: string) => ({ nodeId, gap }),
    handler: (store, { nodeId, gap }) => updateEntityData(store, nodeId, { gap }),
  },
})
