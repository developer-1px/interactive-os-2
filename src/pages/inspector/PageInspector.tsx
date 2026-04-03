import { useMemo } from 'react'
import type { InspectResult } from '@os/engine/types'
import { buildBook, buildTocStore } from '../book/bookContent'
import { AppInspector } from '../../devtools/inspector/AppInspector'
import { ax } from '@styles/ax'

function buildBookInspectResult(): InspectResult {
  const { chapters, pages } = buildBook()
  const tocStore = buildTocStore(chapters, pages[0]?.id ?? '')

  return {
    commands: ['book:next-page', 'book:prev-page'],
    keyMap: {
      'ArrowDown': 'book (page-level)',
      'ArrowUp': 'book (page-level)',
    },
    plugins: [],
    state: tocStore,
    extras: {
      book: {
        chapters: chapters.length,
        pages: pages.length,
        chapterLabels: chapters.map((c) => c.label),
      },
    },
  }
}

export default function PageInspector() {
  const inspectResult = useMemo(() => buildBookInspectResult(), [])

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">App Inspector</h2>
        <p className="page-desc">
          Book App의 전체 구성을 inspector로 탐색합니다.
          commands, keyMap, TOC store, 챕터/페이지 메타데이터를 한눈에 확인할 수 있습니다.
        </p>
      </div>

      <div className={ax({ layout: 'column', gap: 'md' })}>
        <div className="card overflow-hidden" style={{ minHeight: 500 }}>
          <AppInspector inspectResult={inspectResult} />
        </div>
      </div>
    </div>
  )
}
