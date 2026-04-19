// @useState-hatch — svg: mermaid 렌더 결과 캐시, view-only
import { useEffect, useMemo, useRef, useState } from 'react'
import { ax } from '@styles/ax'
import { type NormalizedData, ROOT_ID } from '@os/store/types'
import { getChildren, getEntity } from '@os/store/createStore'
import mermaid from 'mermaid'
import styles from './PyramidView.module.css'

// ── Helpers ──

function escapeMermaid(s: string): string {
  return s.replace(/"/g, '#quot;').replace(/[[\](){}]/g, ' ')
}

function getContent(data: NormalizedData, id: string): string {
  const entity = getEntity(data, id)
  return (entity?.data as Record<string, unknown>)?.content as string ?? ''
}

function getType(data: NormalizedData, id: string): string {
  return getEntity(data, id)?.data?.type as string ?? ''
}

// ── Build flat pyramid list (each = apex + direct children only) ──

interface Pyramid {
  label: string
  code: string
}

function buildOnePyramid(apex: string, children: string[]): string {
  if (children.length === 0) return ''
  const lines: string[] = ['graph TD']
  lines.push(`  a["${escapeMermaid(apex)}"]`)
  for (let i = 0; i < children.length; i++) {
    lines.push(`  c${i}["${escapeMermaid(children[i]!)}"]`)
    lines.push(`  a --> c${i}`)
  }
  return lines.join('\n')
}

function buildPyramids(data: NormalizedData): Pyramid[] {
  const pyramids: Pyramid[] = []
  const rootChildren = getChildren(data, ROOT_ID)
  const docId = rootChildren[0]
  if (!docId) return pyramids

  const walk = (parentId: string) => {
    const childIds = getChildren(data, parentId)

    const headingChildren: string[] = []
    for (const childId of childIds) {
      if (getType(data, childId) === 'heading') {
        headingChildren.push(getContent(data, childId))
      }
    }

    if (headingChildren.length > 0 && getType(data, parentId) === 'heading') {
      const apex = getContent(data, parentId)
      const code = buildOnePyramid(apex, headingChildren)
      if (code) pyramids.push({ label: apex, code })
    }

    for (const childId of childIds) {
      const type = getType(data, childId)

      if (type === 'heading') {
        const sentences: string[] = []
        for (const subId of getChildren(data, childId)) {
          const subType = getType(data, subId)
          if (subType === 'paragraph' || subType === 'list') {
            const sentenceIds = getChildren(data, subId)
            if (sentenceIds.length > 0) {
              sentences.push(getContent(data, sentenceIds[0]!))

              if (sentenceIds.length > 1) {
                const keyContent = getContent(data, sentenceIds[0]!)
                const supports = sentenceIds.slice(1).map(sid => getContent(data, sid))
                const code = buildOnePyramid(keyContent, supports)
                if (code) pyramids.push({ label: keyContent, code })
              }
            }
          }
        }

        if (sentences.length > 0) {
          const hasSubHeadings = getChildren(data, childId).some(id => getType(data, id) === 'heading')
          if (!hasSubHeadings) {
            const heading = getContent(data, childId)
            const code = buildOnePyramid(heading, sentences)
            if (code) pyramids.push({ label: heading, code })
          }
        }

        walk(childId)
      }
    }
  }

  // Document → top-level headings
  const topHeadings = getChildren(data, docId)
    .filter(id => getType(data, id) === 'heading')
    .map(id => getContent(data, id))

  if (topHeadings.length > 0) {
    const docEntity = getEntity(data, docId)
    const docPath = (docEntity?.data as Record<string, unknown>)?.path as string | undefined
    const label = docPath ?? 'Document'
    const code = buildOnePyramid(label, topHeadings)
    if (code) pyramids.push({ label, code })
  }

  walk(docId)
  return pyramids
}

// eslint-disable-next-line react-refresh/only-export-components
export { buildPyramids }

// ── PyramidView (slideshow) ──

interface PyramidViewProps {
  data: NormalizedData
  slideIndex: number
}

let pyramidCounter = 0

// @useState-hatch — svg: mermaid 렌더 결과 캐시, view-only
function FullMermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState('')

  useEffect(() => {
    const id = `pyramid-${++pyramidCounter}`
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      flowchart: { nodeSpacing: 80, rankSpacing: 100, padding: 30 },
      themeVariables: { fontSize: '24px' },
    })
    mermaid.render(id, code).then(({ svg }) => setSvg(svg)).catch(() => setSvg(''))
  }, [code])

  if (!svg) return null
  return <div ref={ref} className={`${ax({ layout: 'center', flex: '1' })} ${styles.fullMermaid}`} dangerouslySetInnerHTML={{ __html: svg }} />
}

export function PyramidView({ data, slideIndex }: PyramidViewProps) {
  const pyramids = useMemo(() => buildPyramids(data), [data])

  if (pyramids.length === 0) {
    return (
      <div className={ax({
          role: 'control-group',
        placement: 'viewport', surface: 'base', layout: 'center' })}>
        <p className={ax({ textStyle: 'section' })}>No pyramids — add headings to your document</p>
      </div>
    )
  }

  const current = pyramids[Math.min(slideIndex, pyramids.length - 1)]!

  return (
    <div className={ax({
        role: 'control-group',
        placement: 'viewport', surface: 'base', layout: 'center' })}>
      <FullMermaid code={current.code} />
    </div>
  )
}
