// BookFeature — 2페이지 펼침 뷰. 신규 기능으로 defineFeature의 동적 능력을 검증한다.
//
// 검증 포인트:
//   1. view-state plugin (currentPage 인덱스)
//   2. 스코프된 keymap (←/→ = 페이지 넘김, book 모드일 때만)
//   3. commands (turnPage)
//   4. layout override (2컬럼 스프레드, sidebar 숨김)
//   5. (옵션) schema 확장 (bookmark 노드)

import { BookOpen } from 'lucide-react'
import { createElement } from 'react'
import type { ComponentType } from 'react'
import type { NormalizedData } from '@os/store/types'
import { defineFeature } from '@os/feature/defineFeature'

// ── view-state: 책의 현재 페이지 인덱스 ──
// NormalizedData 원본을 오염시키지 않도록 별도 namespace.
// 실제 구현은 engine plugin 형태가 될 것이나, 초안에서는 컴포넌트가 내부 useState로 보유.

const BookSpread: ComponentType<{ data: NormalizedData; onChange: (next: NormalizedData) => void }> =
  () => {
    // 실제 구현은 후속. 초안에서는 stub.
    return null
  }

export const BookFeature = defineFeature({
  id: 'book',
  name: 'Book View',
  version: '0.1.0',
  description: '2페이지 펼침으로 폴더를 책처럼 탐색',

  viewMode: {
    id: 'book',
    label: 'Book',
    icon: createElement(BookOpen, { size: 14 }),
    render: BookSpread,
    layout: {
      hidePreview: true,
      hideSidebar: true, // 몰입 읽기
    },
  },

  commands: {
    'book:turnPageNext': () => {
      // view-state에서 currentPage += 1
    },
    'book:turnPagePrev': () => {
      // view-state에서 currentPage -= 1
    },
  },

  keymap: [
    {
      id: 'book-navigation',
      bindings: {
        ArrowLeft: 'book:turnPagePrev',
        ArrowRight: 'book:turnPageNext',
      },
      // 핵심: book 모드일 때만 활성화. 다른 모드에서 ←/→는 기본 navigate 축 그대로.
      scope: (ctx) => ctx.viewMode === 'book',
      priority: 10, // 기본 navigate 축(0)을 덮어씀
    },
  ],
})
