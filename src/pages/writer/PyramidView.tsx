// @useState-hatch — transform is view-only pan/zoom state
import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { ax } from '@styles/ax'
import { type NormalizedData, ROOT_ID } from '@os/store/types'
import { getChildren, getEntity } from '@os/store/createStore'

import styles from './PyramidView.module.css'

// ── Build hierarchy data ──

interface PyramidNode {
  id: string
  label: string
  type: 'root' | 'heading' | 'key' | 'support'
  children?: PyramidNode[]
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '…' : s
}

function countLeaves(data: NormalizedData, id: string): number {
  let count = 0
  for (const childId of getChildren(data, id)) {
    const type = getEntity(data, childId)?.data?.type
    if (type === 'sentence' || type === 'listItem') count++
    count += countLeaves(data, childId)
  }
  return count
}

function buildPyramidTree(data: NormalizedData): PyramidNode {
  const rootChildren = getChildren(data, ROOT_ID)
  const docId = rootChildren[0]
  const docEntity = docId ? getEntity(data, docId) : undefined
  const docPath = (docEntity?.data as Record<string, unknown>)?.path as string | undefined

  const root: PyramidNode = {
    id: 'root',
    label: docPath ?? 'Document',
    type: 'root',
    children: [],
  }

  if (!docId) return root

  const walkHeading = (parentId: string): PyramidNode[] => {
    const nodes: PyramidNode[] = []
    for (const childId of getChildren(data, parentId)) {
      const entity = getEntity(data, childId)
      const type = entity?.data?.type as string
      if (type === 'heading') {
        const content = (entity!.data as Record<string, unknown>).content as string
        const leafCount = countLeaves(data, childId)
        const node: PyramidNode = {
          id: childId,
          label: `${truncate(content, 30)} (${leafCount}s)`,
          type: 'heading',
          children: [],
        }
        // Add paragraph sentences under this heading
        for (const subId of getChildren(data, childId)) {
          const subEntity = getEntity(data, subId)
          const subType = subEntity?.data?.type as string
          if (subType === 'paragraph' || subType === 'list') {
            const sentences = getChildren(data, subId)
            if (sentences.length === 0) continue
            const firstEntity = getEntity(data, sentences[0]!)
            const firstContent = (firstEntity?.data as Record<string, unknown>)?.content as string ?? ''
            const keyNode: PyramidNode = {
              id: sentences[0]!,
              label: truncate(firstContent, 28),
              type: 'key',
              children: [],
            }
            for (let i = 1; i < sentences.length; i++) {
              const se = getEntity(data, sentences[i]!)
              const sc = (se?.data as Record<string, unknown>)?.content as string ?? ''
              keyNode.children!.push({
                id: sentences[i]!,
                label: truncate(sc, 24),
                type: 'support',
              })
            }
            node.children!.push(keyNode)
          } else if (subType === 'heading') {
            // nested heading — recurse
          }
        }
        // Add child headings
        node.children!.push(...walkHeading(childId))
        nodes.push(node)
      }
    }
    return nodes
  }

  root.children = walkHeading(docId)
  return root
}

// ── Colors ──

const NODE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  root: { bg: 'var(--tone-primary-bg)', border: 'var(--tone-primary-base)', text: 'var(--text-bright)' },
  heading: { bg: 'var(--surface-overlay)', border: 'var(--border-default)', text: 'var(--text-bright)' },
  key: { bg: 'var(--tone-success-bg)', border: 'var(--tone-success-base)', text: 'var(--text-primary)' },
  support: { bg: 'var(--surface-sunken)', border: 'var(--border-subtle)', text: 'var(--text-secondary)' },
}

// ── Pan/Zoom ──

interface Transform { x: number; y: number; scale: number }

// @useState-hatch — pan/zoom transform is view-only gesture state, no axis equivalent
function usePanZoom(initialScale = 0.7) {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: initialScale })
  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * 0.005
      setTransform(t => ({ ...t, scale: Math.min(Math.max(t.scale + delta, 0.1), 5) }))
    } else {
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
  const reset = useCallback(() => setTransform({ x: 0, y: 0, scale: initialScale }), [initialScale])

  return { transform, setTransform: setTransform, onWheel, onPointerDown, onPointerMove, onPointerUp, reset }
}

// ── Node dimensions ──

const NODE_W = 200
const NODE_H = 44
const GAP_X = 12
const GAP_Y = 56
const COLS = 5 // max children per row before zigzag wrap

// ── Zigzag layout ──

interface LayoutNode {
  id: string
  label: string
  type: string
  x: number
  y: number
  parentId?: string
  parentX?: number
  parentY?: number
}

function zigzagLayout(root: PyramidNode): LayoutNode[] {
  const nodes: LayoutNode[] = []

  function layoutChildren(
    parent: PyramidNode,
    parentX: number,
    parentY: number,
  ): number {
    // Place parent
    nodes.push({ id: parent.id, label: parent.label, type: parent.type, x: parentX, y: parentY })

    const children = parent.children ?? []
    if (children.length === 0) return parentY + NODE_H

    // Zigzag: arrange children in rows of COLS, alternating direction
    const childW = NODE_W + GAP_X
    const cols = Math.min(children.length, COLS)
    const totalW = cols * childW - GAP_X
    const startX = parentX + NODE_W / 2 - totalW / 2
    const startY = parentY + NODE_H + GAP_Y

    let maxBottomY = startY + NODE_H
    let childIdx = 0

    while (childIdx < children.length) {
      const rowStart = childIdx
      const rowEnd = Math.min(childIdx + cols, children.length)
      const rowY = startY + Math.floor(childIdx / cols) * (NODE_H + GAP_Y)
      const isEvenRow = Math.floor(childIdx / cols) % 2 === 0

      for (let i = rowStart; i < rowEnd; i++) {
        const col = isEvenRow ? (i - rowStart) : (rowEnd - 1 - i + rowStart)
        const cx = startX + col * childW
        const child = children[i]!

        nodes.push({
          id: child.id,
          label: child.label,
          type: child.type,
          x: cx,
          y: rowY,
          parentId: parent.id,
          parentX,
          parentY,
        })

        // Recurse for children of this child (heading nodes)
        if (child.children && child.children.length > 0) {
          const subY = rowY + NODE_H + GAP_Y
          const subParent = { ...child, children: child.children }
          // Remove already-placed node, re-layout subtree below
          const subNodes: LayoutNode[] = []
          const subBottom = layoutSubtree(subParent, cx, subY, subNodes)
          for (const sn of subNodes) {
            sn.parentId = sn.parentId ?? child.id
            sn.parentX = sn.parentX ?? cx
            sn.parentY = sn.parentY ?? rowY
            nodes.push(sn)
          }
          if (subBottom > maxBottomY) maxBottomY = subBottom
        }

        if (rowY + NODE_H > maxBottomY) maxBottomY = rowY + NODE_H
      }
      childIdx = rowEnd
    }

    return maxBottomY
  }

  function layoutSubtree(parent: PyramidNode, px: number, py: number, out: LayoutNode[]): number {
    const children = parent.children ?? []
    if (children.length === 0) return py

    const cols = Math.min(children.length, COLS)
    const childW = NODE_W + GAP_X
    const totalW = cols * childW - GAP_X
    const startX = px + NODE_W / 2 - totalW / 2

    let maxY = py
    let idx = 0
    while (idx < children.length) {
      const rowEnd = Math.min(idx + cols, children.length)
      const rowY = py + Math.floor(idx / cols) * (NODE_H + GAP_Y)
      const isEven = Math.floor(idx / cols) % 2 === 0

      for (let i = idx; i < rowEnd; i++) {
        const col = isEven ? (i - idx) : (rowEnd - 1 - i + idx)
        const cx = startX + col * childW
        out.push({
          id: children[i]!.id,
          label: children[i]!.label,
          type: children[i]!.type,
          x: cx,
          y: rowY,
          parentId: parent.id,
          parentX: px,
          parentY: py - NODE_H - GAP_Y,
        })
        if (rowY + NODE_H > maxY) maxY = rowY + NODE_H
      }
      idx = rowEnd
    }
    return maxY
  }

  layoutChildren(root, 0, 0)
  return nodes
}

// ── SVG Tree Renderer ──

function TreeSvg({ data }: { data: NormalizedData }) {
  const pyramidData = useMemo(() => buildPyramidTree(data), [data])
  const layoutNodes = useMemo(() => zigzagLayout(pyramidData), [pyramidData])

  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const n of layoutNodes) {
      if (n.x < minX) minX = n.x
      if (n.x + NODE_W > maxX) maxX = n.x + NODE_W
      if (n.y < minY) minY = n.y
      if (n.y + NODE_H > maxY) maxY = n.y + NODE_H
    }
    return { minX: minX - 24, maxX: maxX + 24, minY: minY - 24, maxY: maxY + 24 }
  }, [layoutNodes])

  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY

  // Build parent lookup for edges
  const nodeMap = useMemo(() => {
    const m = new Map<string, LayoutNode>()
    for (const n of layoutNodes) m.set(n.id, n)
    return m
  }, [layoutNodes])

  return (
    <svg
      viewBox={`${bounds.minX} ${bounds.minY} ${width} ${height}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Edges */}
      {layoutNodes.filter(n => n.parentId).map(n => {
        const parent = nodeMap.get(n.parentId!)
        if (!parent) return null
        const sx = parent.x + NODE_W / 2
        const sy = parent.y + NODE_H
        const tx = n.x + NODE_W / 2
        const ty = n.y
        const my = sy + (ty - sy) / 2
        return (
          <path
            key={`e-${n.id}`}
            d={`M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`}
            fill="none"
            stroke="var(--border-default)"
            strokeWidth="1"
            opacity="0.5"
          />
        )
      })}
      {/* Nodes */}
      {layoutNodes.map(n => {
        const colors = NODE_COLORS[n.type] ?? NODE_COLORS.support
        return (
          <g key={n.id}>
            <rect
              x={n.x}
              y={n.y}
              width={NODE_W}
              height={NODE_H}
              rx={6}
              fill={colors.bg}
              stroke={colors.border}
              strokeWidth="1.5"
            />
            <text
              x={n.x + NODE_W / 2}
              y={n.y + NODE_H / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={colors.text}
              fontSize="10"
              fontFamily="var(--sans)"
            >
              {truncate(n.label, 26)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── PyramidView ──

export function PyramidView({ data, onExit }: { data: NormalizedData; onExit: () => void }) {
  const { transform, setTransform: setTransformDirect, onWheel, onPointerDown, onPointerMove, onPointerUp, reset } = usePanZoom()
  const containerRef = useRef<HTMLDivElement>(null)

  // Fit tree to viewport on mount/data change
  useEffect(() => {
    if (!containerRef.current) return
    const svg = containerRef.current.querySelector('svg')
    if (!svg) return
    const { width: vw, height: vh } = containerRef.current.getBoundingClientRect()
    const svgW = svg.clientWidth || parseFloat(svg.getAttribute('width') ?? '1')
    const svgH = svg.clientHeight || parseFloat(svg.getAttribute('height') ?? '1')
    const fitScale = Math.min(vw / svgW, vh / svgH, 1) * 0.9
    const offsetX = (vw - svgW * fitScale) / 2
    const offsetY = (vh - svgH * fitScale) / 2
    setTransformDirect({ x: offsetX, y: offsetY, scale: fitScale })
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={`${styles.viewport} ${ax({ placement: 'viewport', surface: 'base', scroll: 'hidden' })}`}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className={`${styles.canvas} ${ax({ layout: 'center' })}`}
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
      >
        <TreeSvg data={data} />
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
      {/* Legend */}
      <div className={ax({ placement: 'above', layout: 'row', gap: 'sm', padding: 'sm' })}>
        <span className={ax({ textStyle: 'caption' })}>
          <span style={{ color: 'var(--tone-primary-base)' }}>■</span> Root
        </span>
        <span className={ax({ textStyle: 'caption' })}>
          <span style={{ color: 'var(--border-default)' }}>■</span> Heading
        </span>
        <span className={ax({ textStyle: 'caption' })}>
          <span style={{ color: 'var(--tone-success-base)' }}>■</span> Key sentence
        </span>
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>
          ■ Support
        </span>
      </div>
    </div>
  )
}
