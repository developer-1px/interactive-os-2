// ② cmux-layout-prd.md — tab 노드 아래 widget이 surrounding tab data를 pull.
// tab renderer가 Provider로 값을 내려주고, 하위 widget이 useFlatLayoutSurface로 pull.

import React from 'react'
import type { TabNode } from '@os/layout/flatLayout'

export interface FlatLayoutSurfaceCtx {
  tabNodeId: string
  tabData: TabNode
}

export const FlatLayoutSurfaceContext = React.createContext<FlatLayoutSurfaceCtx | null>(null)

export const useFlatLayoutSurface = (): FlatLayoutSurfaceCtx | null =>
  React.useContext(FlatLayoutSurfaceContext)
