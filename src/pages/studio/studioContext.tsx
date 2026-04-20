// studioContext — studio 페이지-로컬 공유 상태.
// ExampleSidebar의 selection을 StreamControl/A2UIStreamSurface가 읽어야 하므로 context로 묶는다.
// @useState-hatch — 페이지-로컬 view state (선택된 example + 스트리밍된 부분 payload).
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { StudioExample } from './studioExamples'
import type { A2UIPayload } from '@os/ui/a2uiAdapter'

interface StudioContextValue {
  selected: StudioExample | null
  streamPayload: A2UIPayload | null
  selectExample: (ex: StudioExample) => void
  setStreamPayload: (p: A2UIPayload | null) => void
}

const Ctx = createContext<StudioContextValue | null>(null)

export function StudioProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<StudioExample | null>(null)
  const [streamPayload, setStreamPayload] = useState<A2UIPayload | null>(null)

  const selectExample = useCallback((ex: StudioExample) => {
    setSelected(ex)
    setStreamPayload(null)
  }, [])

  return (
    <Ctx.Provider value={{ selected, streamPayload, selectExample, setStreamPayload }}>
      {children}
    </Ctx.Provider>
  )
}

export function useStudio(): StudioContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStudio must be used within StudioProvider')
  return v
}
