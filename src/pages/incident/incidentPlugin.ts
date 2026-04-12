import { definePlugin } from '@os/plugins/definePlugin'
import { incidentCommands } from './incidentCommands'

export function incidentPlugin() {
  return definePlugin({
    name: 'incident',
    commands: {
      selectEvent: incidentCommands.selectEvent,
      setChatProgress: incidentCommands.setChatProgress,
    },
  })
}
