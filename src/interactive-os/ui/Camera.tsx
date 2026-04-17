/** @catalog 뷰포트 프리미티브 — 선언형 shot 시퀀스 + 명령형 focus + 사용자 팬/줌 */
// Zoom-to-cursor: translate(pt) → scale(factor) → translate(-pt)
// https://phrogz.net/tmp/canvas_zoom_to_cursor.html
// ② camera-primitive-prd.md
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
} from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { ax } from '@styles/ax'
import './Camera.css'
import {
  cameraReducer,
  createInitialCameraState,
  type CameraState,
  type Shot,
  type ShotAdvance,
  type CameraMode,
} from './cameraReducer'
import {
  isRectTarget,
  resolveElement,
  resolveTarget,
  computeTransformToCenter,
  type CameraRect,
  type CameraTarget,
} from './cameraTarget'
import {
  clampScale,
  defaultDuration,
  defaultScale,
  deriveDurationFromDistance,
  prefersReduceMotion,
} from './cameraDefaults'
import { scrollToElementAwait } from './scrollToElementAwait'

export type { CameraRect, CameraTarget } from './cameraTarget'
export type { Shot, ShotAdvance, CameraMode } from './cameraReducer'

export interface CameraFocusOptions {
  scale?: number
  duration?: number
}

export interface CameraHandle {
  focus: (target: CameraTarget, opts?: CameraFocusOptions) => void
  play: () => void
  stop: () => void
  /** Advance one shot (advance:'signal') */
  next: () => void
  setMode: (m: CameraMode) => void
  pause: () => void
  reset: () => void
}

export interface CameraProps {
  shots?: Shot[]
  mode?: CameraMode
  autoplay?: boolean
  children: ReactNode
  className?: string
}

export const Camera = forwardRef<CameraHandle, CameraProps>(function Camera(
  { shots, mode = 'interact', autoplay = true, children, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const runningAnimRef = useRef<Animation | null>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // mode prop is used as INITIAL value only — after mount, handle.setMode is
  // the sole path to change mode (per PRD ③ imperative handle is SSOT).
  const [state, dispatch] = useReducer(
    cameraReducer,
    undefined,
    (): CameraState => createInitialCameraState(mode, !autoplay),
  )

  const stateRef = useRef(state)
  stateRef.current = state

  const applyTransformImmediate = useCallback((x: number, y: number, scale: number) => {
    const el = innerRef.current
    if (!el) return
    el.style.transition = ''
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${scale})`
  }, [])

  const animateTo = useCallback(
    (x: number, y: number, scale: number, duration: number): Promise<void> => {
      const el = innerRef.current
      if (!el) return Promise.resolve()
      runningAnimRef.current?.cancel()
      const from = el.style.transform || 'translate(0px, 0px) scale(1)'
      const to = `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${scale})`
      if (duration <= 0) {
        el.style.transform = to
        return Promise.resolve()
      }
      const anim = el.animate(
        [{ transform: from }, { transform: to }],
        { duration, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
      )
      runningAnimRef.current = anim
      return new Promise<void>((resolve) => {
        let settled = false
        const done = () => {
          if (settled) return
          settled = true
          el.style.transform = to
          try { anim.cancel() } catch { /* noop */ }
          clearTimeout(safety)
          resolve()
        }
        anim.finished.then(done).catch(done)
        const safety = setTimeout(done, duration + 600)
      })
    },
    [],
  )

  useEffect(() => {
    if (state.paused) {
      applyTransformImmediate(state.x, state.y, state.scale)
    }
  }, [state.x, state.y, state.scale, state.paused, applyTransformImmediate])

  const resolveTargetWithRetry = useCallback(
    (target: CameraTarget): Promise<{ rect: CameraRect; el: Element | null } | null> => {
      const tryResolve = (): { rect: CameraRect; el: Element | null } | null => {
        const c = containerRef.current
        if (!c) return null
        const rect = resolveTarget(target, c)
        if (!rect) return null
        return { rect, el: isRectTarget(target) ? null : resolveElement(target, c) }
      }
      const first = tryResolve()
      if (first) return Promise.resolve(first)
      return new Promise((resolve) => {
        requestAnimationFrame(() => resolve(tryResolve()))
      })
    },
    [],
  )

  const performFocus = useCallback(
    async (target: CameraTarget, opts?: CameraFocusOptions): Promise<void> => {
      const container = containerRef.current
      if (!container) return
      const resolved = await resolveTargetWithRetry(target)
      if (!resolved) {
        console.warn('[Camera] target not found, skipping focus', target)
        return
      }
      if (resolved.el) {
        await scrollToElementAwait(container, resolved.el)
      }
      const c = containerRef.current
      if (!c) return
      const rect = isRectTarget(target) ? target : resolveTarget(target, c)
      if (!rect) return
      const reduce = prefersReduceMotion()
      const scale = clampScale(opts?.scale ?? 1.5)
      const { x, y } = computeTransformToCenter(c, rect, scale)
      const s = stateRef.current
      const distance = Math.hypot(x - s.x, y - s.y)
      const duration = opts?.duration != null
        ? (reduce ? 0 : opts.duration)
        : defaultDuration({ duration: undefined }, reduce, distance)
      await animateTo(x, y, scale, duration)
      dispatch({ type: 'FOCUS_APPLY', x, y, scale })
    },
    [animateTo, resolveTargetWithRetry],
  )

  const performReset = useCallback(async (): Promise<void> => {
    const reduce = prefersReduceMotion()
    const s = stateRef.current
    const distance = Math.hypot(s.x, s.y)
    const duration = reduce ? 0 : deriveDurationFromDistance(distance)
    await animateTo(0, 0, 1, duration)
    dispatch({ type: 'RESET' })
  }, [animateTo])

  const runShot = useCallback(async (shot: Shot): Promise<void> => {
    const container = containerRef.current
    if (!container) return
    const resolved = await resolveTargetWithRetry(shot.target)
    if (!resolved) {
      console.warn('[Camera] shot target not found, skipping', shot.target)
      return
    }
    if (resolved.el) {
      await scrollToElementAwait(container, resolved.el)
    }
    const c = containerRef.current
    if (!c) return
    const rect = isRectTarget(shot.target) ? shot.target : resolveTarget(shot.target, c)
    if (!rect) return
    const reduce = prefersReduceMotion()
    const scale = clampScale(defaultScale(shot))
    const { x, y } = computeTransformToCenter(c, rect, scale)
    const s = stateRef.current
    const distance = Math.hypot(x - s.x, y - s.y)
    const duration = defaultDuration(shot, reduce, distance)
    await animateTo(x, y, scale, duration)
    dispatch({ type: 'FOCUS_APPLY', x, y, scale })
  }, [animateTo, resolveTargetWithRetry])

  // ── Shot scheduler ───────────────────────────────────────────────────────
  // Per PRD ⑦#1: NO switch on advance. Use handler map.

  type AdvanceHandler = (
    shot: Shot,
    runShotFn: (s: Shot) => Promise<void>,
    advanceShot: () => void,
  ) => () => void

  const advanceHandlers: Record<ShotAdvance, AdvanceHandler> = {
    time: (shot, runShotFn, advanceShot) => {
      const at = shot.at ?? 0
      const timer = setTimeout(async () => {
        await runShotFn(shot)
        advanceShot()
      }, at)
      return () => clearTimeout(timer)
    },
    end: (shot, runShotFn, advanceShot) => {
      let cancelled = false
      const run = async () => {
        await runShotFn(shot)
        if (cancelled) return
        const hold = shot.hold ?? 0
        const timer = setTimeout(() => { if (!cancelled) advanceShot() }, hold)
        holdTimerRef.current = timer
      }
      run()
      return () => {
        cancelled = true
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      }
    },
    signal: (shot, runShotFn, advanceShot) => {
      let cancelled = false
      const startTick = stateRef.current.signalTick
      const run = async () => { await runShotFn(shot) }
      run()
      const check = () => {
        if (cancelled) return
        if (stateRef.current.signalTick > startTick) {
          advanceShot()
          return
        }
        raf = requestAnimationFrame(check)
      }
      let raf = requestAnimationFrame(check)
      return () => {
        cancelled = true
        cancelAnimationFrame(raf)
      }
    },
  }

  useEffect(() => {
    if (state.mode !== 'view') return
    if (state.paused) return
    if (!shots || shots.length === 0) return
    if (state.shotIndex >= shots.length) return

    const shot = shots[state.shotIndex]
    const handler = advanceHandlers[shot.advance]
    const advanceShot = () => dispatch({ type: 'SHOT_END' })
    const cleanup = handler(shot, runShot, advanceShot)
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.mode, state.paused, state.shotIndex, shots, runShot])

  // ── User interaction: wheel + pointer drag ──────────────────────────────

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const s = stateRef.current
      if (e.ctrlKey) {
        const rect = el.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const factor = e.deltaY > 0 ? 0.95 : 1.05
        const newScale = clampScale(s.scale * factor)
        const nx = mx - (mx - s.x) * (newScale / s.scale)
        const ny = my - (my - s.y) * (newScale / s.scale)
        dispatch({ type: 'USER_ZOOM', scale: newScale, x: nx, y: ny })
      } else {
        dispatch({ type: 'USER_PAN', dx: -e.deltaX, dy: -e.deltaY })
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const dragRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    const s = stateRef.current
    dragRef.current = { startX: e.clientX, startY: e.clientY, tx: s.x, ty: s.y }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    dispatch({
      type: 'USER_PAN_SET',
      x: d.tx + (e.clientX - d.startX),
      y: d.ty + (e.clientY - d.startY),
    })
  }, [])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const s = stateRef.current
    const step = 30
    const zoomStep = 1.1
    const keyHandlers: Record<string, () => void> = {
      '+': () => dispatch({ type: 'USER_ZOOM', scale: s.scale * zoomStep, x: s.x, y: s.y }),
      '=': () => dispatch({ type: 'USER_ZOOM', scale: s.scale * zoomStep, x: s.x, y: s.y }),
      '-': () => dispatch({ type: 'USER_ZOOM', scale: s.scale / zoomStep, x: s.x, y: s.y }),
      ArrowUp: () => dispatch({ type: 'USER_PAN', dx: 0, dy: step }),
      ArrowDown: () => dispatch({ type: 'USER_PAN', dx: 0, dy: -step }),
      ArrowLeft: () => dispatch({ type: 'USER_PAN', dx: step, dy: 0 }),
      ArrowRight: () => dispatch({ type: 'USER_PAN', dx: -step, dy: 0 }),
    }
    const fn = keyHandlers[e.key]
    if (fn) {
      e.preventDefault()
      fn()
    }
  }, [])

  useImperativeHandle(ref, () => ({
    focus: (target, opts) => { void performFocus(target, opts) },
    play: () => dispatch({ type: 'PLAY' }),
    stop: () => dispatch({ type: 'STOP' }),
    next: () => dispatch({ type: 'SIGNAL' }),
    setMode: (m) => dispatch({ type: 'SET_MODE', mode: m }),
    pause: () => dispatch({ type: 'PAUSE' }),
    reset: () => { void performReset() },
  }), [performFocus, performReset])

  const containerStyle: CSSProperties = { touchAction: 'none', position: 'relative' }
  const innerStyle: CSSProperties = { willChange: 'transform' }

  return (
    <div
      ref={containerRef}
      className={className ?? ax({ flex: '1', layout: 'scroll', placement: 'relative' })}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={containerStyle}
    >
      <div ref={innerRef} className="camera-inner" style={innerStyle}>
        {children}
      </div>
    </div>
  )
})
