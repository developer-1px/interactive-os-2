// ⑦ /do UI — ax Principles domain context for FlatLayout widgets
import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/store/types'
import type { CommandEngine } from '@os/engine/createCommandEngine'

export interface AxPrinciplesContextValue {
  engine: CommandEngine
  store: NormalizedData
}

export const [AxPrinciplesProvider, useAxPrinciples] =
  createDomainContext<AxPrinciplesContextValue>('AxPrinciples')
