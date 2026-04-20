// 부모 container가 holds를 선언하면 자식 widget renderer가 context로 pull하여
// slot wrapper에 shape/surface를 자동 적용. SSOT = defineLayout의 parent.holds.

import React from 'react'

export type HoldsField = 'island' | 'glass' | 'dense' | undefined

export const ContainerIntentContext = React.createContext<{ holds: HoldsField }>({ holds: undefined })

type HoldsAxSnippet =
  | { role: 'control-group'; surface: 'raised' }
  | { role: 'control-group'; surface: 'overlay' }
  | Record<string, never>

export function holdsToSlotAx(holds: HoldsField): HoldsAxSnippet {
  if (holds === 'island') return { role: 'control-group', surface: 'raised' }
  if (holds === 'glass')  return { role: 'control-group', surface: 'overlay' }
  return {}
}
