// /studio — 선언적 FlatLayout 런타임의 조립/스트리밍 스튜디오.
// 사용자 조립: cmux 분할 단축키 (Mod+D, Mod+Shift+D, Mod+T, Mod+W, Mod+Alt+Arrow)
// AI 스트리밍: A2UI envelope example 선택 → useLayoutStream → canvas에 증분 주입
// @useState-hatch — 초기 데이터는 localStorage 1회 로드; 이후 FlatLayout store가 SSOT.
import { useEffect, useState } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import type { NormalizedData } from '@os/schema'
import { getFlatLayoutActions, subscribeFlatLayoutRegistry } from '@os/primitives/flatLayoutRegistry'
import { STUDIO_INITIAL, STUDIO_CANVAS_ID } from './studioLayout'
import { studioWidgets, StudioProvider } from './studioWidgets'
import { PlaygroundKeybindingsWidget } from './playgroundKeybindings'
import { PickerRootWidget } from './playgroundWidgets'

const STUDIO_LAYOUT_KEY = 'studio-layout'

function loadPersistedLayout(): NormalizedData {
  try {
    const raw = localStorage.getItem(STUDIO_LAYOUT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as NormalizedData
      if (parsed?.entities && parsed?.relationships) return parsed
    }
  } catch { /* ignore corrupt */ }
  return STUDIO_INITIAL
}

export default function PageStudio() {
  const [initialData] = useState(loadPersistedLayout)

  useEffect(() => {
    let innerUnsub: (() => void) | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    const persist = () => {
      const actions = getFlatLayoutActions(STUDIO_CANVAS_ID)
      if (!actions) return
      try { localStorage.setItem(STUDIO_LAYOUT_KEY, JSON.stringify(actions.getStore())) }
      catch { /* quota / JSON cycle — skip */ }
    }
    const attach = () => {
      if (innerUnsub) return
      const actions = getFlatLayoutActions(STUDIO_CANVAS_ID)
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
    <StudioProvider>
      <FlatLayout
        id={STUDIO_CANVAS_ID}
        data={initialData}
        registry={studioWidgets}
        aria-label="Studio"
      >
        <PlaygroundKeybindingsWidget />
        <PickerRootWidget />
      </FlatLayout>
    </StudioProvider>
  )
}
