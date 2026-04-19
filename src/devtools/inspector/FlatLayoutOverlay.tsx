// ② Live Wireframe Overlay — inspector가 선택한 FlatLayout 인스턴스의
// 모든 노드 경계를 실제 DOM 위에 투명 테두리 + 라벨로 겹쳐 그린다.
// defineLayout raw JSON의 시각화 = 자기 자신의 rendered DOM.
//
// Inspector는 popup window에 렌더되지만 React runtime은 main window와 공유되므로
// flatLayoutRegistry를 직접 읽을 수 있다. Overlay는 main window의 DOM에 마운트되어
// 실제 요소 위에 그려진다.
//
// 동적 position/size 계산이 필수이므로 inline style 사용 — INSPECTOR_OVERLAY_FILES 면제.
import { useEffect, useState } from 'react'
import { getAllFlatLayouts, type FlatLayoutActions } from '@os/primitives/flatLayoutRegistry'
import { ROOT_ID } from '@os/store/types'

interface NodeBox {
  id: string
  label: string
  top: number
  left: number
  width: number
  height: number
  hasScroll: boolean
}

function collectBoxes(actions: FlatLayoutActions): NodeBox[] {
  const store = actions.getStore()
  const boxes: NodeBox[] = []
  for (const [id, entity] of Object.entries(store.entities)) {
    if (id === ROOT_ID || id.startsWith('__')) continue
    const data = entity?.data as Record<string, unknown> | undefined
    if (!data) continue
    const el = actions.getNodeElement(id)
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const type = data.type as string | undefined
    const widget = data.widget as string | undefined
    const scroll = data.scroll as string | undefined
    const label = widget ? `${id} · ${widget}` : `${id} · ${type ?? '?'}`
    const suffix = scroll ? ` · scroll:${scroll}` : ''
    boxes.push({
      id,
      label: label + suffix,
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      hasScroll: Boolean(scroll),
    })
  }
  return boxes
}

export function FlatLayoutOverlay() {
  // @useState-hatch — devtools overlay 활성 인스턴스
  const [instanceId, setInstanceId] = useState<string | null>(null)
  const [boxes, setBoxes] = useState<NodeBox[]>([])

  useEffect(() => {
    const onActivate = (e: Event) => {
      const detail = (e as CustomEvent).detail as { instanceId: string | null } | undefined
      setInstanceId(detail?.instanceId ?? null)
    }
    window.addEventListener('flatlayout:overlay-activate', onActivate)
    return () => window.removeEventListener('flatlayout:overlay-activate', onActivate)
  }, [])

  useEffect(() => {
    if (!instanceId) {
      setBoxes([])
      return
    }
    let raf = 0
    const recompute = () => {
      const actions = getAllFlatLayouts().get(instanceId)
      setBoxes(actions ? collectBoxes(actions) : [])
    }
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(recompute)
    }
    recompute()
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule, true)
    const interval = setInterval(recompute, 250)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule, true)
      clearInterval(interval)
    }
  }, [instanceId])

  if (!instanceId || boxes.length === 0) return null

  return (
    <div
      id="flatlayout-overlay-root"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99998 }}
    >
      {boxes.map((b) => (
        <div
          key={b.id}
          style={{
            position: 'fixed',
            top: b.top,
            left: b.left,
            width: b.width,
            height: b.height,
            border: b.hasScroll
              ? '1px dashed rgba(245, 158, 11, 0.9)'
              : '1px solid rgba(96, 165, 250, 0.6)',
            boxSizing: 'border-box',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              background: b.hasScroll ? 'rgba(245, 158, 11, 0.9)' : 'rgba(96, 165, 250, 0.9)',
              color: '#fff',
              fontSize: 10,
              lineHeight: '14px',
              padding: '0 4px',
              fontFamily: 'var(--mono, monospace)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {b.label}
          </span>
        </div>
      ))}
    </div>
  )
}
