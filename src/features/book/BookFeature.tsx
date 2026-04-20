// BookFeature — 2페이지 펼침 + 자체 페이지 view-state.

import { useEffect, useMemo, useState } from 'react'
import { BookOpen } from 'lucide-react'
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

  useEffect(() => {
    const onNext = () => setPage(p => Math.min(totalPages - 1, p + 1))
    const onPrev = () => setPage(p => Math.max(0, p - 1))
    window.addEventListener('book:turnPageNext', onNext)
    window.addEventListener('book:turnPagePrev', onPrev)
    return () => {
      window.removeEventListener('book:turnPageNext', onNext)
      window.removeEventListener('book:turnPagePrev', onPrev)
    }
  }, [totalPages])

  return (
    <div className={ax({ layout: 'row', flex: '1' })}>
      {slice.map(id => {
        const e = data.entities[id]
        const name = (e?.data as { name?: string } | undefined)?.name ?? id
        return (
          <div key={id} className={ax({ role: 'control-group', surface: 'raised', layout: 'stack', flex: '1' })}>
            <div className={ax({ textStyle: 'section' })}>{name}</div>
            <div className={ax({ textStyle: 'caption' })}>Page {page + 1} / {totalPages}</div>
          </div>
        )
      })}
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
    'book:turnPageNext': () => { window.dispatchEvent(new CustomEvent('book:turnPageNext')) },
    'book:turnPagePrev': () => { window.dispatchEvent(new CustomEvent('book:turnPagePrev')) },
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
