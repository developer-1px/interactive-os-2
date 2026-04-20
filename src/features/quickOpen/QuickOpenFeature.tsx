/* eslint-disable react-refresh/only-export-components */
// QuickOpenFeature — Meta+P overlay. defineFeature overlay 슬롯의 첫 소비자.
//
// host(BaselineFinderApp)는 overlay open 상태를 관리하고, 'quickOpen:open' command가
// 'overlay:open:quick-open' window event를 dispatch하면 host가 받아서 렌더한다.

import { defineFeature } from '@os/feature/defineFeature'
import { QuickOpen } from '@os/ui/QuickOpen'
import type { NormalizedData } from '@os/store/types'

function QuickOpenOverlay({ data, onClose }: { data: NormalizedData; onClose: () => void }) {
  const handleSelect = (filePath: string) => {
    // 선택된 파일 id로 focus 이동. host는 onChange 경로를 통해 store 갱신은 외부 관리.
    // 여기서는 직접 window event로 host에 "focus 이동" 요청을 전달한다.
    window.dispatchEvent(new CustomEvent('feature-finder:focus', { detail: { id: filePath } }))
    onClose()
  }
  return (
    <QuickOpen
      fileStore={data}
      root={''}
      persistKey="feature-finder-quickopen-query"
      onSelect={handleSelect}
      onClose={onClose}
    />
  )
}

export const QuickOpenFeature = defineFeature({
  id: 'quick-open',
  name: 'Quick Open',
  version: '0.1.0',
  description: 'Meta+P로 파일 전역 검색 오버레이',
  commands: {
    'quickOpen:open': () => {
      window.dispatchEvent(new Event('overlay:open:quick-open'))
    },
  },
  keymap: [
    {
      id: 'quick-open-trigger',
      bindings: { 'Meta+p': 'quickOpen:open' },
      priority: 100,
    },
  ],
  overlay: [
    {
      id: 'quick-open',
      render: QuickOpenOverlay,
    },
  ],
})
