// ② defineLayout mini schematic — Inspector Page 탭의 raw 소스 상단에 보여주는
// 비율 기반 썸네일. Overlay(실제 DOM 덧대기)와 짝 — 여기선 inspector 내부에서
// 자체 드로잉으로 구조만 보여준다.
//
// 동적 비율 계산 필요 (sizes per split) — INSPECTOR_OVERLAY_FILES 면제.
import type { ReactElement, ReactNode } from 'react'
import type { NormalizedData, PaneSize } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { useInspectorPage } from './InspectorPageTab'
import { ax } from '@styles/ax'

function getChildIds(store: NormalizedData, id: string): string[] {
  return store.relationships[id]?.filter(c => !c.startsWith('__')) ?? []
}

function sizeToFlex(size: PaneSize | undefined): string {
  if (size === 'flex' || size === undefined) return '1 1 0'
  if (size === 'auto') return '0 1 auto'
  return `0 0 ${size * 100}%`
}

const BOX_BASE: React.CSSProperties = {
  position: 'relative',
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  gap: 3,
  padding: 3,
  boxSizing: 'border-box',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 9,
  lineHeight: '11px',
  fontFamily: 'var(--mono, monospace)',
  color: 'var(--text-secondary, rgba(255,255,255,0.6))',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  pointerEvents: 'none',
}

function boxStyle(direction: 'row' | 'column', hasScroll: boolean): React.CSSProperties {
  return {
    ...BOX_BASE,
    flexDirection: direction,
    border: hasScroll ? '1px dashed rgba(245,158,11,0.9)' : '1px solid rgba(96,165,250,0.6)',
    background: hasScroll ? 'rgba(245,158,11,0.06)' : 'rgba(96,165,250,0.03)',
  }
}

function childSlot(size: PaneSize | undefined): React.CSSProperties {
  return {
    flex: sizeToFlex(size),
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
  }
}

function nodeLabel(id: string, data: Record<string, unknown>): string {
  const type = data.type as string | undefined
  const widget = data.widget as string | undefined
  const direction = data.direction as string | undefined
  const scroll = data.scroll as string | undefined
  const dirArrow = direction === 'horizontal' ? ' →' : direction === 'vertical' ? ' ↓' : ''
  const scrollMark = scroll ? ` · /${scroll}/` : ''
  const label = widget ? `${id}·${widget}` : `${id}·${type ?? '?'}`
  return `${label}${dirArrow}${scrollMark}`
}

function renderNode(store: NormalizedData, id: string): ReactElement | null {
  const data = store.entities[id]?.data as Record<string, unknown> | undefined
  if (!data || data.hidden) return null
  const type = data.type as string | undefined
  const children = getChildIds(store, id)
  const scroll = Boolean(data.scroll)

  if (type === 'split') {
    const direction = (data.direction as string) === 'horizontal' ? 'row' : 'column'
    const sizes = (data.sizes as PaneSize[]) ?? []
    return (
      <div style={boxStyle(direction, scroll)}>
        <Label text={nodeLabel(id, data)} />
        {children.map((cid, i) => (
          <div key={cid} style={childSlot(sizes[i])}>{renderNode(store, cid)}</div>
        ))}
      </div>
    )
  }

  if (type === 'stack' || type === 'bar' || type === 'grid' || type === 'tabgroup') {
    const direction = type === 'bar' ? 'row' : 'column'
    return (
      <div style={boxStyle(direction, scroll)}>
        <Label text={nodeLabel(id, data)} />
        {children.map((cid) => (
          <div key={cid} style={childSlot(undefined)}>{renderNode(store, cid)}</div>
        ))}
      </div>
    )
  }

  // widget / tab / floating / overlay 등 leaf 취급
  return (
    <div style={boxStyle('column', scroll)}>
      <Label text={nodeLabel(id, data)} />
    </div>
  )
}

function Label({ text }: { text: string }): ReactElement {
  return <span style={LABEL_STYLE}>{text}</span>
}

const CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minHeight: 180,
  padding: 8,
  overflow: 'hidden',
}

export function DefineLayoutPreview(): ReactNode {
  const { store } = useInspectorPage()
  if (!store) return null
  const rootIds = getChildIds(store, ROOT_ID)
  return (
    <div className={ax({ role: 'control-group', surface: 'sunken' })} style={CONTAINER_STYLE}>
      {rootIds.map(id => (
        <div key={id} style={childSlot(undefined)}>{renderNode(store, id)}</div>
      ))}
    </div>
  )
}
