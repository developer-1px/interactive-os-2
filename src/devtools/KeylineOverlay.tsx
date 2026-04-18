/**
 * KeylineOverlay — 각 role 요소(rl-*)의 4변을 투영하는 SVG 오버레이.
 *
 * 원리: 정렬된 요소들의 edge는 같은 좌표 → 선이 겹쳐서 적다.
 *       어긋난 요소들의 edge는 다른 좌표 → 선이 많다.
 *       시각적 엔트로피 = 디자인 품질의 역수.
 *
 * 2가지 모드:
 *   KeylineOverlay  — 전체 viewport 투영 (?inspect-keyline)
 *   ScopedKeylineOverlay — 컨테이너 내부만 투영 (PageKeylineTest RoleSection용)
 */

// @useState-hatch — inspect 도구 전용 뷰 상태, engine 축 해당 없음
import { useEffect, useRef, useState, type RefObject } from 'react'

interface EdgeLines {
  horizontals: number[]
  verticals: number[]
}

export interface KeylineStats {
  totalLines: number
  uniqueH: number
  uniqueV: number
  hLoners: number
  vLoners: number
}

const SELECTOR = '[class*="rl-"]'
const H_COLOR = 'rgba(255, 0, 0, 0.14)'
const V_COLOR = 'rgba(0, 100, 255, 0.14)'

function collectEdges(root?: HTMLElement | null): EdgeLines {
  const horizontals: number[] = []
  const verticals: number[] = []

  const container = root ?? document
  const elements = container.querySelectorAll(SELECTOR)
  for (const el of elements) {
    const rect = el.getBoundingClientRect()
    horizontals.push(Math.round(rect.top), Math.round(rect.bottom))
    verticals.push(Math.round(rect.left), Math.round(rect.right))
  }

  return { horizontals, verticals }
}

export function computeStats(edges: EdgeLines): KeylineStats {
  const hFreq = new Map<number, number>()
  const vFreq = new Map<number, number>()
  for (const y of edges.horizontals) hFreq.set(y, (hFreq.get(y) ?? 0) + 1)
  for (const x of edges.verticals) vFreq.set(x, (vFreq.get(x) ?? 0) + 1)

  return {
    totalLines: edges.horizontals.length + edges.verticals.length,
    uniqueH: hFreq.size,
    uniqueV: vFreq.size,
    hLoners: [...hFreq.values()].filter(c => c === 1).length,
    vLoners: [...vFreq.values()].filter(c => c === 1).length,
  }
}

// ── Global overlay (viewport 전체) ──

export function KeylineOverlay() {
  const [edges, setEdges] = useState<EdgeLines>({ horizontals: [], verticals: [] })
  const [active, setActive] = useState(false)
  const rafRef = useRef(0)

  useEffect(() => {
    const check = () => setActive(document.body.classList.contains('inspect-keyline'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!active) return

    const update = () => {
      setEdges(collectEdges())
      rafRef.current = requestAnimationFrame(() => {
        setTimeout(() => setEdges(collectEdges()), 500)
      })
    }

    update()

    const handleChange = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => setEdges(collectEdges()))
    }

    window.addEventListener('scroll', handleChange, true)
    window.addEventListener('resize', handleChange)
    const observer = new MutationObserver(handleChange)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('scroll', handleChange, true)
      window.removeEventListener('resize', handleChange)
      observer.disconnect()
    }
  }, [active])

  if (!active || (edges.horizontals.length === 0 && edges.verticals.length === 0)) return null

  const vw = window.innerWidth
  const vh = window.innerHeight

  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: vw,
        height: vh,
        pointerEvents: 'none',
        zIndex: 99999,
      }}
      viewBox={`0 0 ${vw} ${vh}`}
    >
      {edges.horizontals.map((y, i) => (
        <line key={`h${i}`} x1={0} y1={y} x2={vw} y2={y} stroke={H_COLOR} strokeWidth={1} />
      ))}
      {edges.verticals.map((x, i) => (
        <line key={`v${i}`} x1={x} y1={0} x2={x} y2={vh} stroke={V_COLOR} strokeWidth={1} />
      ))}
    </svg>
  )
}

// ── Scoped overlay (컨테이너 내부) ──

export function ScopedKeylineOverlay({
  containerRef,
  onStats,
}: {
  containerRef: RefObject<HTMLElement | null>
  onStats?: (stats: KeylineStats) => void
}) {
  const [edges, setEdges] = useState<EdgeLines>({ horizontals: [], verticals: [] })
  const [bounds, setBounds] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const rafRef = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      const rect = container.getBoundingClientRect()
      setBounds({ x: rect.left, y: rect.top, w: rect.width, h: rect.height })
      const e = collectEdges(container)
      setEdges(e)
      onStats?.(computeStats(e))
    }

    update()
    rafRef.current = requestAnimationFrame(() => {
      setTimeout(update, 500)
    })

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    })
    observer.observe(container, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(rafRef.current)
      observer.disconnect()
    }
  }, [containerRef, onStats])

  if (edges.horizontals.length === 0 && edges.verticals.length === 0) return null

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`}
    >
      {/* 가로선: 섹션 전체 너비로 확장 */}
      {edges.horizontals.map((y, i) => (
        <line key={`h${i}`} x1={bounds.x} y1={y} x2={bounds.x + bounds.w} y2={y} stroke={H_COLOR} strokeWidth={1} />
      ))}
      {/* 세로선: 섹션 전체 높이로 확장 */}
      {edges.verticals.map((x, i) => (
        <line key={`v${i}`} x1={x} y1={bounds.y} x2={x} y2={bounds.y + bounds.h} stroke={V_COLOR} strokeWidth={1} />
      ))}
    </svg>
  )
}
