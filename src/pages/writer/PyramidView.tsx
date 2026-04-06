// @useState-hatch — transform is view-only pan/zoom state, useEffect for SVG resize
import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { ax } from '@styles/ax'
import { type NormalizedData, ROOT_ID } from '@os/store/types'
import { getChildren, getEntity } from '@os/store/createStore'
import { MermaidBlock } from '../../pages/showcase/MermaidBlock'
import type { SentenceData } from './writerSchema'
import styles from './PyramidView.module.css'

// ── helpers ──

function countLeaves(data: NormalizedData, id: string): number {
  let count = 0
  for (const childId of getChildren(data, id)) {
    const type = getEntity(data, childId)?.data?.type
    if (type === 'sentence' || type === 'listItem') count++
    count += countLeaves(data, childId)
  }
  return count
}

function countByRole(data: NormalizedData, id: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const walk = (nodeId: string) => {
    const entity = getEntity(data, nodeId)
    if (entity?.data?.type === 'sentence') {
      const role = (entity.data as SentenceData).role ?? 'none'
      counts[role] = (counts[role] ?? 0) + 1
    }
    for (const childId of getChildren(data, nodeId)) walk(childId)
  }
  walk(id)
  return counts
}

const ROLE_EMOJI: Record<string, string> = {
  claim: 'C', evidence: 'E', reasoning: 'R',
  context: 'X', counter: '!', transition: 'T', none: '-',
}

// ── storeToMermaid — full pyramid ──

const SKIP_TYPES = new Set(['document'])
const LEAF_TYPES = new Set(['sentence', 'listItem', 'hr'])
const SHAPE: Record<string, [string, string]> = {
  heading: ['["', '"]'],
  paragraph: ['("', '")'],
  sentence: ['("', '")'],
  listItem: ['("', '")'],
  list: ['[["', '"]]'],
  hr: ['{"', '"}'],
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s
}

export function storeToMermaid(data: NormalizedData): string {
  const lines: string[] = ['graph TD']
  const edges: string[] = []
  const styleLines: string[] = []

  const walk = (parentId: string, isRoot: boolean) => {
    for (const childId of getChildren(data, parentId)) {
      const entity = getEntity(data, childId)
      const type = entity?.data?.type as string | undefined
      if (!type || SKIP_TYPES.has(type)) {
        walk(childId, false)
        continue
      }
      // Skip individual sentences/listItems — too many nodes for mermaid
      if (LEAF_TYPES.has(type)) continue

      const d = entity!.data as Record<string, unknown>
      const content = (d.content as string) ?? ''
      const [open, close] = SHAPE[type] ?? ['["', '"]']
      let label: string

      if (type === 'heading') {
        const leafCount = countLeaves(data, childId)
        const roles = countByRole(data, childId)
        const roleStr = Object.entries(roles)
          .filter(([r]) => r !== 'none')
          .map(([r, c]) => `${ROLE_EMOJI[r] ?? r}${c}`)
          .join(' ')
        const safe = truncate(content, 30).replace(/"/g, '#quot;').replace(/\n/g, ' ')
        label = roleStr ? `${safe}<br/>${leafCount}s | ${roleStr}` : `${safe}<br/>${leafCount}s`
        if (leafCount === 0) {
          styleLines.push(`  style ${childId} stroke:#e55,stroke-width:2px`)
        }
      } else if (type === 'paragraph') {
        const childCount = getChildren(data, childId).length
        label = `¶ ${childCount}s`
      } else if (type === 'list') {
        const ordered = d.ordered as boolean
        label = ordered ? 'ol' : 'ul'
      } else {
        const safe = truncate(content, 25).replace(/"/g, '#quot;').replace(/\n/g, ' ')
        const role = d.role as string | undefined
        label = role ? `${safe}<br/>${ROLE_EMOJI[role] ?? role}` : safe
      }

      lines.push(`  ${childId}${open}${label}${close}`)
      if (!isRoot) {
        edges.push(`  ${parentId} --> ${childId}`)
      }

      walk(childId, false)
    }
  }

  const rootChildren = getChildren(data, ROOT_ID)
  for (const docId of rootChildren) {
    walk(docId, true)
  }

  return [...lines, ...edges, ...styleLines].join('\n')
}

// ── Pan/Zoom hook ──

interface Transform { x: number; y: number; scale: number }

// @useState-hatch — pan/zoom transform is view-only gesture state, no axis equivalent
function usePanZoom() {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      // Pinch zoom
      const delta = -e.deltaY * 0.005
      setTransform(t => {
        const newScale = Math.min(Math.max(t.scale + delta, 0.2), 5)
        return { ...t, scale: newScale }
      })
    } else {
      // Pan
      setTransform(t => ({ ...t, x: t.x - e.deltaX, y: t.y - e.deltaY }))
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setTransform(t => ({ ...t, x: t.x + dx, y: t.y + dy }))
  }, [])

  const onPointerUp = useCallback(() => { isDragging.current = false }, [])

  const reset = useCallback(() => setTransform({ x: 0, y: 0, scale: 1 }), [])

  return { transform, onWheel, onPointerDown, onPointerMove, onPointerUp, reset }
}

// ── PyramidView ──

export function PyramidView({ data, onExit }: { data: NormalizedData; onExit: () => void }) {
  const mermaidCode = useMemo(() => storeToMermaid(data), [data])
  const { transform, onWheel, onPointerDown, onPointerMove, onPointerUp, reset } = usePanZoom()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Make mermaid SVG responsive — remove fixed width/height, keep viewBox
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const observer = new MutationObserver(() => {
      const svg = el.querySelector('svg')
      if (!svg) return
      if (!svg.getAttribute('viewBox')) {
        const w = svg.getAttribute('width')?.replace('px', '')
        const h = svg.getAttribute('height')?.replace('px', '')
        if (w && h) svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      }
      svg.removeAttribute('width')
      svg.removeAttribute('height')
      svg.setAttribute('width', '90vw')
      svg.setAttribute('height', '80vh')
      svg.style.maxWidth = 'none'
    })
    observer.observe(el, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [mermaidCode])

  return (
    <div
      className={`${styles.viewport} ${ax({ placement: 'viewport', surface: 'base', scroll: 'hidden' })}`}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        ref={canvasRef}
        className={`${styles.canvas} ${ax({ layout: 'center' })}`}
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
      >
        <MermaidBlock code={mermaidCode} />
      </div>
      <div className={ax({ placement: 'bottom', layout: 'row', gap: 'sm' })}>
        <button
          type="button"
          className={ax({ surface: 'overlay', textStyle: 'caption', padding: 'sm', shape: 'sm' })}
          onClick={reset}
        >
          Reset
        </button>
        <button
          type="button"
          className={ax({ surface: 'overlay', textStyle: 'caption', padding: 'sm', shape: 'sm' })}
          onClick={onExit}
        >
          Close
        </button>
      </div>
    </div>
  )
}
