import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { SELECTION_ID } from '../../axis/select'
import { FOCUS_ID } from '../../axis/navigate'
import { tabs } from '../../pattern/roles/tabs'
import { Pause, Play } from 'lucide-react'
import styles from './carousel.module.css'

// APG #8: Auto-Rotating Image Carousel with Tabs for Slide Control
// https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-2-tablist/

const slides = [
  { id: 'dynamic-weather', label: 'Dynamic Weather', desc: 'A whirlhat that changes your hat based on the weather.' },
  { id: 'travel-anywhere', label: 'Travel Anywhere', desc: 'Book a trip anywhere in the world with just one click.' },
  { id: 'focus-timer', label: 'Focus Timer', desc: 'Stay productive with smart break reminders.' },
  { id: 'night-reader', label: 'Night Reader', desc: 'Read comfortably in the dark with adaptive screen tones.' },
  { id: 'pet-translator', label: 'Pet Translator', desc: 'Finally understand what your pets are saying.' },
  { id: 'smart-garden', label: 'Smart Garden', desc: 'Automated watering and growth tracking for indoor plants.' },
]

function buildStore(selectedId: string): NormalizedData {
  return createStore({
    entities: {
      ...Object.fromEntries(
        slides.map(s => [s.id, { id: s.id, data: { label: s.label, desc: s.desc } }]),
      ),
      [SELECTION_ID]: { id: SELECTION_ID, selectedIds: [selectedId] },
      [FOCUS_ID]: { id: FOCUS_ID, focusedId: selectedId },
    },
    relationships: { [ROOT_ID]: slides.map(s => s.id) },
  })
}

const ROTATION_INTERVAL = 3000

const renderTab = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <button
      {...props}
      className={styles.tab}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      {label}
    </button>
  )
}

const renderPanel = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  _state: NodeState,
): React.ReactElement => {
  const data = node.data as Record<string, unknown>
  const label = data?.label as string
  const desc = data?.desc as string
  return (
    <div {...props} className={styles.slide} aria-roledescription="slide">
      <h3 className={styles.slideTitle}>{label}</h3>
      <p className={styles.slideDesc}>{desc}</p>
    </div>
  )
}

export function CarouselTabs() {
  const [selectedId, setSelectedId] = useState(slides[0]!.id)
  const [isRotating, setIsRotating] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const store = useMemo(() => buildStore(selectedId), [selectedId])

  const onChange = useCallback((nextStore: NormalizedData) => {
    const selectedIds = (nextStore.entities[SELECTION_ID]?.selectedIds as string[]) ?? []
    if (selectedIds.length > 0 && selectedIds[0] !== selectedId) {
      setSelectedId(selectedIds[0]!)
    }
  }, [selectedId])

  // Auto-rotation
  useEffect(() => {
    if (!isRotating || isPaused) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      return
    }
    timerRef.current = setInterval(() => {
      setSelectedId(prev => {
        const idx = slides.findIndex(s => s.id === prev)
        return slides[(idx + 1) % slides.length]!.id
      })
    }, ROTATION_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRotating, isPaused])

  // Pause on focus/hover
  const onFocusIn = useCallback(() => setIsPaused(true), [])
  const onFocusOut = useCallback((e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) setIsPaused(false)
  }, [])
  const onMouseEnter = useCallback(() => setIsPaused(true), [])
  const onMouseLeave = useCallback(() => setIsPaused(false), [])

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) setIsRotating(false)
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setIsRotating(false) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const slideIndex = slides.findIndex(s => s.id === selectedId) + 1

  return (
    <section
      ref={containerRef}
      aria-roledescription="carousel"
      aria-label="Highlighted features"
      className={styles.carousel}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.controls}>
        <button
          className={styles.rotationButton}
          aria-label={isRotating ? 'Stop automatic slide show' : 'Start automatic slide show'}
          onClick={() => setIsRotating(r => !r)}
        >
          {isRotating ? <Pause size="1em" /> : <Play size="1em" />}
        </button>
      </div>

      <div
        className={styles.liveRegion}
        aria-live={isRotating && !isPaused ? 'off' : 'polite'}
      >
        <Aria
          pattern={tabs}
          data={store}
          plugins={[]}
          onChange={onChange}
          aria-label="Slides"
        >
          <Aria.Item render={renderTab} />
          <Aria.Panel render={renderPanel} />
        </Aria>
      </div>

      <div className={styles.indicator} aria-hidden="true">
        {slideIndex} / {slides.length}
      </div>
    </section>
  )
}
