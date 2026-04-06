// @useState-hatch — transform is view-only pan/zoom state, useEffect for SVG resize
import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { ax } from '@styles/ax'
import { type NormalizedData, ROOT_ID } from '@os/store/types'
import { getChildren, getEntity } from '@os/store/createStore'
import { MermaidBlock } from '../../pages/showcase/MermaidBlock'
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


// ── storeToMermaid — full pyramid ──

const SKIP_TYPES = new Set(['document', 'hr'])

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s
}

function sanitize(s: string): string {
  // Mermaid mindmap text: remove special chars that break parsing
  return s.replace(/[()[\]{}"<>]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function storeToMermaid(data: NormalizedData): string {
  const lines: string[] = ['mindmap']

  const indent = (depth: number) => '  '.repeat(depth)

  const walk = (parentId: string, depth: number) => {
    for (const childId of getChildren(data, parentId)) {
      const entity = getEntity(data, childId)
      const type = entity?.data?.type as string | undefined
      if (!type || SKIP_TYPES.has(type)) {
        walk(childId, depth)
        continue
      }

      const d = entity!.data as Record<string, unknown>
      const content = (d.content as string) ?? ''

      if (type === 'heading') {
        const leafCount = countLeaves(data, childId)
        const safe = sanitize(truncate(content, 40))
        lines.push(`${indent(depth)}${safe} ${leafCount}s`)
        walk(childId, depth + 1)
      } else if (type === 'paragraph' || type === 'list') {
        // Minto: first sentence = key point, rest = supporting
        const sentences = getChildren(data, childId)
        if (sentences.length === 0) continue
        const firstEntity = getEntity(data, sentences[0]!)
        if (!firstEntity) continue
        const firstContent = (firstEntity.data as Record<string, unknown>)?.content as string ?? ''
        lines.push(`${indent(depth)}${sanitize(truncate(firstContent, 35))}`)
        for (let i = 1; i < sentences.length; i++) {
          const subEntity = getEntity(data, sentences[i]!)
          if (!subEntity) continue
          const subContent = (subEntity.data as Record<string, unknown>)?.content as string ?? ''
          lines.push(`${indent(depth + 1)}${sanitize(truncate(subContent, 30))}`)
        }
      } else if (type === 'sentence' || type === 'listItem') {
        const safe = sanitize(truncate(content, 30))
        lines.push(`${indent(depth)}${safe}`)
      }
    }
  }

  const rootChildren = getChildren(data, ROOT_ID)
  for (const docId of rootChildren) {
    // Use document's first heading or path as root
    const docEntity = getEntity(data, docId)
    const path = (docEntity?.data as Record<string, unknown>)?.path as string | undefined
    lines.push(`  root(${sanitize(path ?? 'Document')})`)
    walk(docId, 2)
  }

  return lines.join('\n')
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
