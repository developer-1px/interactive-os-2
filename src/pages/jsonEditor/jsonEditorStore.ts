import { updateEntityData } from '@os/store/createStore'
import { defineCommands } from '@os/engine/defineCommand'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { JsonValue } from '@os/ui/JsonEditor/jsonToNormalized'

export const VALUE_ID = 'value'

export const seedJson: JsonValue = {
  app: 'aria',
  version: 3,
  enabled: true,
  tags: ['ui', 'treegrid', 'json'],
  nested: { deep: { value: null } },
}

export const jsonEditorStore: NormalizedData = {
  entities: {
    [ROOT_ID]: { id: ROOT_ID, data: { type: 'root' } },
    [VALUE_ID]: { id: VALUE_ID, data: { type: 'value', json: seedJson } },
  },
  relationships: { [ROOT_ID]: [VALUE_ID] },
}

export const jsonEditorCommands = defineCommands({
  setJson: {
    type: 'jsonEditor:setJson' as const,
    create: (json: JsonValue) => ({ json }),
    handler: (store, { json }) => updateEntityData(store, VALUE_ID, { json }),
  },
})
