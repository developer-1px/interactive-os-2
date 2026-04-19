// /playground — 화면 작성 도구.
// cmux 컨셉(tabgroup + 분할 단축키)을 빌려 각 빈 공간에 컴포넌트를 꽂아 화면을 조립한다.
// 단축키: Mod+D 가로 분할 · Mod+Shift+D 세로 분할 · Mod+T 새 탭 · Mod+W 닫기 · Mod+Alt+Arrow focus 이동
// Layout persistence: 변경이 있을 때마다 debounced localStorage save.
//   mount 시 저장본이 있으면 그걸로 부팅하여 "마지막에 만든 모양"을 복원한다.
// @useState-hatch — 초기 데이터는 localStorage 로드 1회 — 이후 FlatLayout 내부 store가 SSOT.
import { useEffect, useState } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import type { NormalizedData } from '@os/schema'
import { getFlatLayoutActions, subscribeFlatLayoutRegistry } from '@os/primitives/flatLayoutRegistry'
import { PLAYGROUND_INITIAL, PLAYGROUND_CANVAS_ID } from './playgroundDefaults'
import { playgroundWidgets, PickerRootWidget } from './playgroundWidgets'
import { PlaygroundKeybindingsWidget } from './playgroundKeybindings'

const PLAYGROUND_LAYOUT_KEY = 'playground-layout'

function loadPersistedLayout(): NormalizedData {
  try {
    const raw = localStorage.getItem(PLAYGROUND_LAYOUT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as NormalizedData
      if (parsed?.entities && parsed?.relationships) return parsed
    }
  } catch { /* ignore corrupt */ }
  return PLAYGROUND_INITIAL
}

export default function PagePlayground() {
  // mount 1회 로드 — 이후 store가 SSOT, localStorage는 write-only.
  const [initialData] = useState(loadPersistedLayout)

  useEffect(() => {
    let innerUnsub: (() => void) | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    const persist = () => {
      const actions = getFlatLayoutActions(PLAYGROUND_CANVAS_ID)
      if (!actions) return
      try { localStorage.setItem(PLAYGROUND_LAYOUT_KEY, JSON.stringify(actions.getStore())) }
      catch { /* quota / JSON cycle — skip */ }
    }
    const attach = () => {
      if (innerUnsub) return
      const actions = getFlatLayoutActions(PLAYGROUND_CANVAS_ID)
      if (!actions) return
      innerUnsub = actions.subscribe(() => {
        if (timer) return
        timer = setTimeout(() => { timer = null; persist() }, 500)
      })
    }
    const unsubRegistry = subscribeFlatLayoutRegistry(attach)
    attach()
    return () => {
      unsubRegistry()
      innerUnsub?.()
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <FlatLayout
      id={PLAYGROUND_CANVAS_ID}
      data={initialData}
      registry={playgroundWidgets}
      aria-label="Playground"
    >
      <PlaygroundKeybindingsWidget />
      <PickerRootWidget />
    </FlatLayout>
  )
}
