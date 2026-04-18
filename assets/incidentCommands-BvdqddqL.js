var e=`import { defineCommands } from '@os/engine/defineCommand'
import { updateEntityData } from '@os/store/createStore'

export const incidentCommands = defineCommands({
  selectEvent: {
    type: 'incident:selectEvent' as const,
    create: (eventId: string) => ({ eventId }),
    handler: (store, { eventId }) =>
      updateEntityData(store, 'shared', { selectedEventId: eventId }),
  },
  setChatProgress: {
    type: 'incident:setChatProgress' as const,
    create: (count: number) => ({ count }),
    handler: (store, { count }) =>
      updateEntityData(store, 'shared', { chatItemCount: count }),
  },
})
`;export{e as default};