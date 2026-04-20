import type { Command } from '@os/engine/types'
import type { NormalizedData } from '@os/store/types'
import { createDomainContext } from '@os/layout/createDomainContext'

export interface JsonEditorContextValue {
  store: NormalizedData
  dispatch: (command: Command) => void
}

export const [JsonEditorProvider, useJsonEditor] =
  createDomainContext<JsonEditorContextValue>('JsonEditor')
