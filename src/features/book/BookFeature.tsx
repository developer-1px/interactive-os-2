// BookFeature — 2페이지 펼침 + 자체 페이지 view-state.
//
// MVP: 페이지 넘김은 버튼으로. Feature.keymap 선언은 마켓플레이스 메타데이터로 보존
// (featureRegistryToPlugin 어댑터가 소비·테스트됨). ←/→ 키 동작은 engine 통합 단계에서
// BaselineFinderApp이 activeView keymap을 useEngine plugin으로 주입하면 자동 활성.

import { useMemo, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { defineFeature } from '@os/feature/defineFeature'
import { ax } from '@styles/ax'

const PAGE_SIZE = 2

function BookSpread({ data }: { data: NormalizedData; onChange: (next: NormalizedData) => void }) {
  // @useState-hatch — book 페이지 인덱스. view-state plugin 미구현 시점의 임시 보유.
  const [page, setPage] = useState(0)
  const topLevel = useMemo(() => data.relationships[ROOT_ID] ?? [], [data])
  const totalPages = Math.max(1, Math.ceil(topLevel.length / PAGE_SIZE))
  const slice = topLevel.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const prev = () => setPage(p => Math.max(0, p - 1))
  const next = () => setPage(p => Math.min(totalPages - 1, p + 1))

  return (
    <div className={ax({ layout: 'stack', flex: '1' })}>
      <div className={ax({ role: 'control-group', surface: 'base', layout: 'bar' })}>
        <button type="button" onClick={prev} className={ax({ role: 'control', surface: 'ghost' })} aria-label="Previous page">
          <ChevronLeft size={14} />
        </button>
        <div className={ax({ textStyle: 'caption' })}>Page {page + 1} / {totalPages}</div>
        <button type="button" onClick={next} className={ax({ role: 'control', surface: 'ghost' })} aria-label="Next page">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className={ax({ layout: 'row', flex: '1' })}>
        {slice.map(id => {
          const e = data.entities[id]
          const name = (e?.data as { name?: string } | undefined)?.name ?? id
          return (
            <div key={id} className={ax({ role: 'control-group', surface: 'raised', layout: 'stack', flex: '1' })}>
              <div className={ax({ textStyle: 'section' })}>{name}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const BookFeature = defineFeature({
  id: 'book',
  name: 'Book View',
  version: '0.1.0',
  viewMode: {
    id: 'book',
    label: 'Book',
    icon: <BookOpen size={14} />,
    render: BookSpread,
    layout: { hidePreview: true, hideSidebar: true },
  },
  commands: {
    'book:turnPageNext': () => {},
    'book:turnPagePrev': () => {},
  },
  keymap: [
    {
      id: 'book-navigation',
      bindings: { ArrowLeft: 'book:turnPagePrev', ArrowRight: 'book:turnPageNext' },
      scope: (ctx) => ctx.viewMode === 'book',
      priority: 10,
    },
  ],
})
