import { defineCommands } from '../engine/defineCommand'

export const activateCommands = defineCommands({
  activate: {
    type: 'core:activate' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store) => store,
  },
})
