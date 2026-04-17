/** @catalog 뷰포트 프리미티브 — 선언형 shot 시퀀스 + 명령형 focus + 사용자 팬/줌 */
// Zoom-to-cursor: translate(pt) → scale(factor) → translate(-pt)
// https://phrogz.net/tmp/canvas_zoom_to_cursor.html
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
} from 'react'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import { ax } from '@styles/ax'
import './Camera.css'

// ── Types ──────────────────────────────────────────────────────────────────

export interface CameraRect {
  top: number
  left: number
  width: number
  height: number
}

export type CameraTarget =
  | CameraRect
  | string
  | RefObject<HTMLElement | null>

export type ShotAdvance = 'time' | 'end' | 'signal'

export interface Shot {
  target: CameraTarget
  scale?: number
  duration?: number
  hold?: number
  advance: ShotAdvance
  /** Absolute timeline offset for advance:'time' (ms from sequence start) */
  at?: number
}

export type CameraMode = 'interact' | 'view'

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

// ── Reducer ────────────────────────────────────────────────────────────────

interface CameraState {
  x: number
  y: number
  scale: number
  mode: CameraMode
  paused: boolean
  shotIndex: number
  /** Incremented when a signal-advance cue fires */
  signalTick: number
}

type Action =
  | { type: 'USER_PAN'; dx: number; dy: number }
  | { type: 'USER_PAN_SET'; x: number; y: number }
  | { type: 'USER_ZOOM'; scale: number; x: number; y: number }
  | { type: 'PAUSE' }
  | { type: 'PLAY' }
  | { type: 'STOP' }
  | { type: 'SET_MODE'; mode: CameraMode }
  | { type: 'SHOT_END' }
  | { type: 'SIGNAL' }
  | { type: 'FOCUS_APPLY'; x: number; y: number; scale: number }
  | { type: 'RESET' }

const MIN_SCALE = 0.1
const MAX_SCALE = 10
const clamp = (n: number, lo = MIN_SCALE, hi = MAX_SCALE) => Math.min(Math.max(n, lo), hi)

function reducer(state: CameraState, action: Action): CameraState {
  switch (action.type) {
    case 'USER_PAN':
      return { ...state, paused: true, x: state.x + action.dx, y: state.y + action.dy }
    case 'USER_PAN_SET':
      return { ...state, paused: true, x: action.x, y: action.y }
    case 'USER_ZOOM':
      return { ...state, paused: true, x: action.x, y: action.y, scale: clamp(action.scale) }
    case 'PAUSE':
      return state.paused ? state : { ...state, paused: true }
    case 'PLAY':
      return { ...state, paused: false }
    case 'STOP':
      return { ...state, paused: true, shotIndex: 0 }
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    case 'SHOT_END':
      return { ...state, shotIndex: state.shotIndex + 1 }
    case 'SIGNAL':
      return { ...state, signalTick: state.signalTick + 1 }
    case 'FOCUS_APPLY':
      return { ...state, x: action.x, y: action.y, scale: clamp(action.scale) }
    case 'RESET':
      return { ...state, x: 0, y: 0, scale: 1, shotIndex: 0 }
  }
}

// ── Defaults: auto-derived (no constant tables) ────────────────────────────

function prefersReduceMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Derive duration from travel distance (viewport center → target center) when
 * the shot doesn't specify one. Linear in distance with a floor + ceiling so
 * small nudges feel snappy and large leaps don't drag on.
 */
function deriveDurationFromDistance(distancePx: number): number {
  // 200ms baseline + ~0.5ms per px of travel, capped at 600ms.
  return Math.min(600, Math.max(200, 200 + distancePx * 0.5))
}

function defaultDuration(
  shot: Pick<Shot, 'duration'>,
  reduce: boolean,
  distancePx: number,
): number {
  if (reduce) return 0
  if (shot.duration != null) return shot.duration
  return deriveDurationFromDistance(distancePx)
}

function defaultScale(shot: Pick<Shot, 'scale'>): number {
  return shot.scale ?? 1.5
}

// ── Target normalization ───────────────────────────────────────────────────

function isRectTarget(target: CameraTarget): target is CameraRect {
  return typeof target === 'object' && target !== null && 'top' in target && 'width' in target
}

function resolveElement(target: CameraTarget, container: HTMLElement): Element | null {
  if (typeof target === 'string') return container.querySelector(target)
  if (typeof target === 'object' && 'current' in target) return target.current
  return null
}

function resolveTarget(
  target: CameraTarget,
  container: HTMLElement,
): CameraRect | null {
  if (isRectTarget(target)) return target
  const el = resolveElement(target, container)
  if (!el) return null
  const cRect = container.getBoundingClientRect()
  const eRect = el.getBoundingClientRect()
  return {
    top: eRect.top - cRect.top + container.scrollTop,
    left: eRect.left - cRect.left + container.scrollLeft,
    width: eRect.width,
    height: eRect.height,
  }
}

/**
 * Scroll the container so that `el` is centered. Resolves when settled
 * (scrollend / rAF-idle fallback / 600ms safety).
 */
function scrollToElementAwait(container: HTMLElement, el: Element): Promise<void> {
  const containerRect = container.getBoundingClientRect()
  const lineRect = el.getBoundingClientRect()
  const lineCenter = lineRect.top - containerRect.top + container.scrollTop + lineRect.height / 2
  const targetScroll = Math.max(0, lineCenter - containerRect.height / 2)
  if (Math.abs(container.scrollTop - targetScroll) < 1) return Promise.resolve()

  return new Promise<void>((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      container.removeEventListener('scrollend', onScrollEnd)
      clearTimeout(safety)
      resolve()
    }
    const onScrollEnd = () => finish()
    container.addEventListener('scrollend', onScrollEnd, { once: true })

    let lastTop = container.scrollTop
    let still = 0
    const poll = () => {
      if (settled) return
      const now = container.scrollTop
      if (Math.abs(now - lastTop) < 0.5) {
        still++
        if (still >= 3 && Math.abs(now - targetScroll) < 1) { finish(); return }
      } else {
        still = 0
        lastTop = now
      }
      requestAnimationFrame(poll)
    }
    requestAnimationFrame(poll)

    const safety = setTimeout(finish, 600)
    container.scrollTo({ top: targetScroll, behavior: 'smooth' })
  })
}

/**
 * Compute translate that centers the given rect in container, then applies scale
 * around the rect's center. Uses translate+scale (NOT transform-origin).
 */
function computeTransformToCenter(
  container: HTMLElement,
  rect: CameraRect,
  scale: number,
): { x: number; y: number } {
  const cr = container.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  // We want: post-transform, rect center is at container center.
  // Transform: (px, py) → (x + px*scale, y + py*scale)
  // Solve: x + cx*scale = cr.width/2 → x = cr.width/2 - cx*scale
  return {
    x: cr.width / 2 - cx * scale,
    y: cr.height / 2 - cy * scale,
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export const Camera = forwardRef<CameraHandle, CameraProps>(function Camera(
  { shots, mode = 'interact', autoplay = true, children, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const runningAnimRef = useRef<Animation | null>(null)

  // mode prop is used as INITIAL value only — after mount, handle.setMode is the
  // sole path to change mode (per PRD ③ imperative handle is SSOT). This avoids
  // the effect overriding imperative setMode calls.
  const [state, dispatch] = useReducer(
    reducer,
    { mode },
    (init): CameraState => ({
      x: 0,
      y: 0,
      scale: 1,
      mode: init.mode,
      paused: !autoplay,
      shotIndex: 0,
      signalTick: 0,
    }),
  )

  const stateRef = useRef(state)
  stateRef.current = state

  // Apply transform imperatively (not via style={}, but via ref.style — the sole
  // allowed exception per PRD for transform property specifically).
  const applyTransformImmediate = useCallback((x: number, y: number, scale: number) => {
    const el = innerRef.current
    if (!el) return
    el.style.transition = ''
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${scale})`
  }, [])

  // WAAPI animate with safety timeout. Returns a Promise that resolves on end or timeout.
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
        // 600ms safety over duration
        const safety = setTimeout(done, duration + 600)
      })
    },
    [],
  )

  // Apply state.x/y/scale (for user-driven updates — no animation)
  useEffect(() => {
    if (state.paused) {
      applyTransformImmediate(state.x, state.y, state.scale)
    }
  }, [state.x, state.y, state.scale, state.paused, applyTransformImmediate])

  // Target resolution with one rAF retry
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

  /** Perform a FOCUS: scroll into view → re-measure → animate translate+scale. */
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
      // Re-measure after scroll
      const c = containerRef.current
      if (!c) return
      const rect = typeof target === 'object' && 'top' in target
        ? target
        : resolveTarget(target, c)
      if (!rect) return
      const reduce = prefersReduceMotion()
      const scale = clamp(opts?.scale ?? 1.5)
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

  // ── Shot scheduler ───────────────────────────────────────────────────────
  // Per PRD ⑦#1: NO switch on advance. Use handler map.

  // Advance handler map (runs shot at shotIndex, returns cleanup)
  type AdvanceHandler = (
    shot: Shot,
    runShot: (s: Shot) => Promise<void>,
    advanceShot: () => void,
  ) => () => void

  const advanceHandlers: Record<ShotAdvance, AdvanceHandler> = {
    time: (shot, runShot, advanceShot) => {
      const at = shot.at ?? 0
      const timer = setTimeout(async () => {
        await runShot(shot)
        advanceShot()
      }, at)
      return () => clearTimeout(timer)
    },
    end: (shot, runShot, advanceShot) => {
      let cancelled = false
      const run = async () => {
        await runShot(shot)
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
    signal: (shot, runShot, advanceShot) => {
      let cancelled = false
      const startTick = stateRef.current.signalTick
      const run = async () => { await runShot(shot) }
      run()
      // Poll for signal tick change — cheap, low-frequency
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

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    const rect = typeof shot.target === 'object' && 'top' in shot.target
      ? shot.target
      : resolveTarget(shot.target, c)
    if (!rect) return
    const reduce = prefersReduceMotion()
    const scale = clamp(defaultScale(shot))
    const { x, y } = computeTransformToCenter(c, rect, scale)
    const s = stateRef.current
    const distance = Math.hypot(x - s.x, y - s.y)
    const duration = defaultDuration(shot, reduce, distance)
    await animateTo(x, y, scale, duration)
    dispatch({ type: 'FOCUS_APPLY', x, y, scale })
  }, [animateTo, resolveTargetWithRetry])

  // Sequence runner — only when mode='view', not paused, shots available
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
        const newScale = clamp(s.scale * factor)
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

  // Keyboard +/- and arrows (PAUSE + step)
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

  // ── Imperative handle ────────────────────────────────────────────────────

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
  const innerStyle: CSSProperties = {
    willChange: 'transform',
  }

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
