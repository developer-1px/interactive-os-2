// ⑦ Pipeline Todo — domain context for FlatLayout widgets
import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/schema'
import type { CommandEngine } from '@os/engine/createCommandEngine'

export interface TodoContextValue {
  engine: CommandEngine
  store: NormalizedData
}

export const [TodoProvider, useTodo] =
  createDomainContext<TodoContextValue>('Todo')
