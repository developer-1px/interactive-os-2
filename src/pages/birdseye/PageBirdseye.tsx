// @useState-hatch
// ② 2026-04-04-birdseye-mermaid-prd.md
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import mermaid from 'mermaid'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { PanelHeader } from '@os/ui/PanelHeader'
import type { TreeNode } from '../viewer/fsClient'
import { fetchTree } from '../viewer/fsClient'
import { DEFAULT_ROOT } from '../viewer/types'
import { buildMermaidL1, buildMermaidL2 } from './birdseyeTransform'
import './PageBirdseye.css'

mermaid.initialize({ startOnLoad: false, theme: 'neutral' })

const KNOWN_LAYERS = ['store', 'engine', 'axis', 'pattern', 'plugins', 'primitives', 'ui']

let mermaidCounter = 0

export default function PageBirdseye() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawLayer = searchParams.get('layer')
  const layer = rawLayer && KNOWN_LAYERS.includes(rawLayer) ? rawLayer : null
  const [tree, setTree] = useState<TreeNode[] | null>(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 트리 로드 (1회)
  useEffect(() => {
    fetchTree(DEFAULT_ROOT).then(setTree).catch(() => setError('Failed to load tree'))
  }, [])

  // 트리 → Mermaid → SVG
  useEffect(() => {
    if (!tree) return
    setSvg('')
    setError(null)

    const code = layer
      ? buildMermaidL2(tree, layer, 'LR')
      : buildMermaidL1(tree, 'TB')

    if (!code) {
      setError(layer ? `${layer} layer not found` : 'No diagram data')
      return
    }

    const id = `birdseye-${++mermaidCounter}`
    mermaid.render(id, code)
      .then(({ svg: rendered }) => {
        // Mermaid SVG의 고정 크기를 제거하여 CSS로 제어
        const patched = rendered
          .replace(/(<svg[^>]*?)(?:\s+width="[^"]*")/, '$1')
          .replace(/(<svg[^>]*?)(?:\s+height="[^"]*")/, '$1')
          .replace(/(<svg[^>]*?)(?:\s+style="[^"]*")/, '$1')
        setSvg(patched)
      })
      .catch(() => setError('Mermaid render failed'))
  }, [tree, layer])

  // SVG cluster 클릭 → L2 전환
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (layer) return
    const svgEl = containerRef.current?.querySelector('svg')
    if (!svgEl) return
    const cx = e.clientX
    const cy = e.clientY
    let best: { id: string; area: number } | null = null
    for (const cluster of svgEl.querySelectorAll<SVGGElement>('.cluster')) {
      if (!KNOWN_LAYERS.includes(cluster.id)) continue
      const rect = cluster.getBoundingClientRect()
      if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
        const area = rect.width * rect.height
        if (!best || area < best.area) best = { id: cluster.id, area }
      }
    }
    if (best) setSearchParams({ layer: best.id })
  }, [layer, setSearchParams])

  const keyMap = useMemo(() => ({
    Escape: defineRouteKey('birdseye:back', () => {
      if (layer) setSearchParams({})
    }, 'Birdseye'),
  }), [layer, setSearchParams])

  const goToL1 = useCallback(() => setSearchParams({}), [setSearchParams])

  return (
    <AriaRoute keyMap={keyMap} label="Birdseye">
      <div className={`overflow-hidden h-full flex-col`}>
        <PanelHeader>
          <span className={`birdseye-breadcrumb flex-row items-center`}>
            {layer ? (
              <>
                <button className={`cursor-pointer ${ax({ text: 'muted' })} birdseye-breadcrumb-btn`} onClick={goToL1}>Overview</button>
                <span className={`${ax({ opacity: 'faint', text: 'muted' })} birdseye-breadcrumb-sep`}>/</span>
                <span>{layer}</span>
              </>
            ) : (
              <span>Overview</span>
            )}
          </span>
        </PanelHeader>

        <div className={`overflow-auto ${ax({ flex: '1' })} birdseye-diagram`} ref={containerRef} onClick={handleClick}>
          {error ? (
            <span className={`${ax({ text: 'muted', textStyle: 'body' })}`}>{error}</span>
          ) : svg ? (
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <span className={`${ax({ text: 'muted', textStyle: 'body' })}`}>Loading...</span>
          )}
        </div>
      </div>
    </AriaRoute>
  )
}
