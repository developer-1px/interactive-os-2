// Widget wrapper — 부모의 holds context를 읽어 shape/surface를 자동 주입.
// widget 컴포넌트는 재질을 모르고, slot wrapper가 parent intent 기반으로 장식한다.

import React from 'react'
import { ax } from '@styles/ax'
import type { AxPadding } from '@styles/axPrivate'
import { resolveContainerPreset } from '../../containerPreset'
import { ContainerIntentContext, holdsToSlotAx } from './containerIntent'
import styles from '../../../ui/FlatLayout.module.css'

interface WidgetSlotProps {
  nodeId: string
  refCallback: (id: string) => (el: HTMLElement | null) => void
  layout: 'scroll' | 'scroll-x' | 'fill' | 'clip'
  nodePadding: AxPadding | undefined
  isSplitChild: boolean
  Component: React.ComponentType<Record<string, unknown>>
  componentProps: Record<string, unknown>
  source: string | undefined
  children?: React.ReactNode
}

export function WidgetSlot({ nodeId, refCallback, layout, nodePadding, isSplitChild, Component, componentProps, source, children }: WidgetSlotProps) {
  const { holds } = React.useContext(ContainerIntentContext)
  const slotAx = holdsToSlotAx(holds)
  // widget.{holds} preset에서 기본 padding 해석. node.padding override 우선.
  const widgetPreset = resolveContainerPreset('widget', undefined, holds)
  const padding = nodePadding ?? widgetPreset.padding
  return (
    <div
      ref={refCallback(nodeId)}
      className={`${ax({ width: 'full', layout, ...(padding ? { padding } : {}), ...slotAx })} ${isSplitChild ? styles.splitChild : ''}`}
    >
      <Component {...componentProps} source={source}>{children}</Component>
    </div>
  )
}
