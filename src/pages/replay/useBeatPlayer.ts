// ② replayV2BeatPrd
// @useState-hatch — 시간 기반 페이서, store에 둘 책임 아님
import { useEffect, useState } from 'react'
import type { Beat } from './beatTypes'

export interface BeatPlayerState {
  beatIdx: number
  progress: number  // 0..1 within current beat
  paused: boolean
  togglePause: () => void
  /** 외부에서 강제 점프 (segment 클릭 등) */
  jumpTo: (idx: number) => void
}

export interface UseBeatPlayerArgs {
  beats: Beat[]
  active: boolean
  autoplay: boolean
  onComplete?: () => void
}

/**
 * @invariant active=false 또는 paused=true면 progress 시간 정지
 * @invariant beatIdx >= beats.length 직전에 onComplete 호출 후 멈춤
 * @invariant 각 beat duration은 beat.duration ms
 */
export function useBeatPlayer({ beats, active, autoplay, onComplete }: UseBeatPlayerArgs): BeatPlayerState {
  const [beatIdx, setBeatIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (!active || !autoplay || paused) return
    const beat = beats[beatIdx]
    if (!beat) return
    let raf = 0
    const start = performance.now() - progress * beat.duration
    const tick = (now: number) => {
      const p = (now - start) / beat.duration
      if (p >= 1) {
        if (beatIdx + 1 < beats.length) {
          setBeatIdx(beatIdx + 1)
          setProgress(0)
        } else {
          setProgress(1)
          onComplete?.()
        }
        return
      }
      setProgress(p)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // progress is intentionally excluded from deps — including it would restart the loop every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, autoplay, paused, beatIdx, beats, onComplete])

  useEffect(() => {
    if (active) {
      setBeatIdx(0)
      setProgress(0)
      setPaused(false)
    }
  }, [active])

  return {
    beatIdx,
    progress,
    paused,
    togglePause: () => setPaused(p => !p),
    jumpTo: (i: number) => { setBeatIdx(i); setProgress(0) },
  }
}
