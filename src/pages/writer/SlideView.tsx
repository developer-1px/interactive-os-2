import { useMemo } from 'react'
import { ax } from '@styles/ax'
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { getChildren, getEntity } from '@os/store/createStore'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { showcaseMdConfig } from '../showcase/mdConfig'
import styles from './SlideView.module.css'

interface Slide {
  title: string
  level: number
  content: string[]
}

function buildSlides(data: NormalizedData): Slide[] {
  const slides: Slide[] = []
  const rootChildren = getChildren(data, ROOT_ID)
  const docId = rootChildren[0]
  if (!docId) return slides

  const walkForContent = (nodeId: string): string[] => {
    const result: string[] = []
    for (const childId of getChildren(data, nodeId)) {
      const entity = getEntity(data, childId)
      if (!entity) continue
      const type = entity.data?.type
      if (type === 'sentence' || type === 'listItem') {
        result.push((entity.data as { content?: string }).content ?? '')
      } else if (type === 'paragraph' || type === 'list') {
        result.push(...walkForContent(childId))
      }
    }
    return result
  }

  const walkHeadings = (parentId: string) => {
    for (const childId of getChildren(data, parentId)) {
      const entity = getEntity(data, childId)
      if (entity?.data?.type === 'heading') {
        const hd = entity.data as { content: string; level: number }
        const content = walkForContent(childId)
        slides.push({ title: hd.content, level: hd.level, content })
        walkHeadings(childId)
      }
    }
  }

  walkHeadings(docId)
  return slides
}

// eslint-disable-next-line react-refresh/only-export-components
export { buildSlides }

interface SlideViewProps {
  data: NormalizedData
  slideIndex: number
  slideCount: number
}

export function SlideView({ data, slideIndex, slideCount }: SlideViewProps) {
  const slides = useMemo(() => buildSlides(data), [data])

  if (slides.length === 0) {
    return (
      <div className={ax({ placement: 'viewport', surface: 'base', layout: 'center' })}>
        <p className={ax({ textStyle: 'section', text: 'muted' })}>No slides — add headings to your document</p>
      </div>
    )
  }

  const slide = slides[Math.min(slideIndex, slides.length - 1)]
  const headingStyle: 'display' | 'page' | 'section' = slide.level <= 1 ? 'display' : slide.level <= 2 ? 'page' : 'section'

  return (
    <div className={ax({ placement: 'viewport', surface: 'base' })}>
      <div className={ax({ layout: 'stack', gap: 'lg', padding: 'xl', width: 'prose' })}>
        <h1 className={ax({ textStyle: headingStyle, text: 'primary' })}>{slide.title}</h1>
        <MarkdownViewer content={slide.content.join('\n\n')} config={showcaseMdConfig} />
      </div>
      <div className={`${styles.counter} ${ax({ textStyle: 'caption', text: 'muted', placement: 'bottom' })}`}>
        {slideIndex + 1} / {slideCount}
      </div>
    </div>
  )
}
