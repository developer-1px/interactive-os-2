// LayoutNode 타입별 정책(render/isAppRoot/fillsChildren/labelFrom/preset)을 소유하는 레지스트리.
// 새 노드 타입은 layout/nodes/<type>.tsx에서 defineLayoutNode() 호출 1개로 확장.
// 소비자(FlatLayout.tsx, defineLayout)는 타입별 분기 없이 registry 조회만 수행.

import type React from 'react'
import type { NormalizedData } from '../store/types'
import type { Command } from '../engine/types'
import type { WidgetRegistry } from './widgetRegistry'
import type { LayoutBase } from './flatLayout'
import type { ContainerPreset, ContainerHolds, ContainerVariant } from './containerPreset'

export interface LayoutRenderContext {
  nodeId: string
  store: NormalizedData
  registry: WidgetRegistry
  parentType?: string
  renderNode: (nodeId: string, parentType?: string) => React.ReactNode
  refCallback: (nodeId: string) => (el: HTMLElement | null) => void
  dispatch: (command: Command) => void
}

export interface LayoutNodePreset {
  base?: ContainerPreset
  byVariant?: Partial<Record<ContainerVariant, ContainerPreset>>
  byHolds?: Partial<Record<ContainerHolds, ContainerPreset>>
  byVariantHolds?: Partial<Record<`${ContainerVariant}.${ContainerHolds}`, ContainerPreset>>
}

export interface LayoutNodeDescriptor {
  /** 렌더링. 미지정 = 데이터 전용 노드(state 등). */
  render?: (ctx: LayoutRenderContext) => React.ReactNode
  /** root일 때 app-mode(fill) 여부. 미지정=false. */
  isAppRoot?: boolean
  /** 자식 widget을 fill 슬롯으로 렌더할지. 미지정=false. */
  fillsChildren?: boolean
  /** label 자동 생성. 미지정 = `${type}: ${id}`. */
  labelFrom?: (node: LayoutBase & Record<string, unknown>, id: string) => string
  /** 컨테이너로 쓰일 때 variant×holds 기본 preset. */
  preset?: LayoutNodePreset
}

const registry = new Map<string, LayoutNodeDescriptor>()

export function defineLayoutNode(type: string, desc: LayoutNodeDescriptor): void {
  registry.set(type, desc)
}

export function getLayoutNode(type: string | undefined): LayoutNodeDescriptor | undefined {
  return type ? registry.get(type) : undefined
}
