// useLayoutStream — NormalizedData를 node 단위로 증분 주입하는 스트리밍 시뮬레이터.
// PageA2UI의 useComponentStream을 primitives로 승격. A2UI 뿐 아니라 FlatLayout 스트리밍 전반에 재사용.
// @useState-hatch — 내부 ref로 tick 상태 관리.
import { useState, useRef, useCallback, useEffect } from 'react'
import type { NormalizedData } from '@os/store/types'

export interface LayoutStreamState {
  streaming: boolean
  /** 0..100 */
  progress: number
  /** 스트리밍 중 누적된 부분 상태. 완료/미시작 시 null. */
  partialData: NormalizedData | null
}

export interface LayoutStreamControls {
  start: (full: NormalizedData, order: string[]) => void
  stop: () => void
}

export interface LayoutStreamTick {
  base: number
  jitter: number
}

/**
 * NormalizedData를 node 단위로 증분 주입.
 *
 * @param onUpdate 매 tick마다 부분 상태 콜백 (store.applyPatch 연결 지점)
 * @param tickMs   기본 {base: 150, jitter: 200}
 * @invariant order의 모든 id는 full.entities에 존재해야 함
 * @invariant stop() 호출 후에는 timer 잔존 없음
 */
export function useLayoutStream(
  onUpdate: (partial: NormalizedData) => void,
  tickMs: LayoutStreamTick = { base: 150, jitter: 200 },
): LayoutStreamState & LayoutStreamControls {
  const [state, setState] = useState<LayoutStreamState>({ streaming: false, progress: 0, partialData: null })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fullRef = useRef<NormalizedData | null>(null)
  const orderRef = useRef<string[]>([])
  const idxRef = useRef(0)
  const accumRef = useRef<NormalizedData | null>(null)

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setState(s => ({ ...s, streaming: false }))
  }, [])

  const start = useCallback((full: NormalizedData, order: string[]) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    fullRef.current = full
    orderRef.current = order
    idxRef.current = 0
    const seed: NormalizedData = { entities: {}, relationships: {}, ...(full.slots ? { slots: {} } : {}) }
    accumRef.current = seed
    setState({ streaming: true, progress: 0, partialData: seed })
    onUpdate(seed)

    const tick = () => {
      const f = fullRef.current
      const ord = orderRef.current
      const acc = accumRef.current
      if (!f || !acc) return
      const i = idxRef.current++
      const id = ord[i]
      const next: NormalizedData = {
        entities: { ...acc.entities, [id]: f.entities[id] },
        relationships: f.relationships,
        ...(f.slots ? { slots: f.slots } : {}),
      }
      accumRef.current = next
      const progress = Math.round(((i + 1) / ord.length) * 100)
      onUpdate(next)

      if (i + 1 < ord.length) {
        setState({ streaming: true, progress, partialData: next })
        timerRef.current = setTimeout(tick, tickMs.base + Math.random() * tickMs.jitter)
      } else {
        setState({ streaming: false, progress: 100, partialData: next })
        timerRef.current = null
      }
    }

    timerRef.current = setTimeout(tick, tickMs.base + Math.random() * tickMs.jitter)
  }, [onUpdate, tickMs.base, tickMs.jitter])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = null }, [])

  return { ...state, start, stop }
}
