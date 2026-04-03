import { defineCommands } from '../engine/defineCommand'

export const CALENDAR_ID = '__calendar__'

export const calendarCommands = defineCommands({
  open: {
    type: 'calendar:open' as const,
    create: (focusDayIndex: number) => ({ focusDayIndex }),
    handler: (store, { focusDayIndex }) => ({
      ...store,
      entities: {
        ...store.entities,
        [CALENDAR_ID]: { id: CALENDAR_ID, isOpen: true, focusDayIndex },
      },
    }),
  },
  close: {
    type: 'calendar:close' as const,
    handler: (store) => ({
      ...store,
      entities: {
        ...store.entities,
        [CALENDAR_ID]: { ...store.entities[CALENDAR_ID]!, id: CALENDAR_ID, isOpen: false },
      },
    }),
  },
  setFocusDay: {
    type: 'calendar:set-focus-day' as const,
    create: (focusDayIndex: number) => ({ focusDayIndex }),
    handler: (store, { focusDayIndex }) => ({
      ...store,
      entities: {
        ...store.entities,
        [CALENDAR_ID]: { ...store.entities[CALENDAR_ID]!, id: CALENDAR_ID, focusDayIndex },
      },
    }),
  },
})

// year/month changes are TransformAdapter-style: they rebuild NormalizedData.
// These Commands are for logging only — the actual state change drives data reconstruction.
export const calendarNavCommands = defineCommands({
  changeMonth: {
    type: 'calendar:change-month' as const,
    create: (delta: number, resultYear: number, resultMonth: number) => ({ delta, resultYear, resultMonth }),
    handler: (store) => store,
  },
  changeYear: {
    type: 'calendar:change-year' as const,
    create: (delta: number, resultYear: number) => ({ delta, resultYear }),
    handler: (store) => store,
  },
})
