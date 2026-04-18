// Stage 5 — domain context for FlatLayout widgets
import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/store/types'
import type { CommandEngine } from '@os/engine/createCommandEngine'

export interface TodoContextValue {
  engine: CommandEngine
  store: NormalizedData
}

export const [TodoProvider, useTodo] =
  createDomainContext<TodoContextValue>('Todo')
