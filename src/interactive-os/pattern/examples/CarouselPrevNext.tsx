import { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import styles from './carousel.module.css'

// APG #7: Auto-Rotating Image Carousel with Buttons for Slide Control
// https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-1-prev-next/
// No Aria pattern needed — plain buttons + live region

const slides = [
  { id: 'dynamic-weather', label: 'Dynamic Weather', desc: 'A whirlhat that changes your hat based on the weather.' },
  { id: 'travel-anywhere', label: 'Travel Anywhere', desc: 'Book a trip anywhere in the world with just one click.' },
  { id: 'focus-timer', label: 'Focus Timer', desc: 'Stay productive with smart break reminders.' },
  { id: 'night-reader', label: 'Night Reader', desc: 'Read comfortably in the dark with adaptive screen tones.' },
  { id: 'pet-translator', label: 'Pet Translator', desc: 'Finally understand what your pets are saying.' },
  { id: 'smart-garden', label: 'Smart Garden', desc: 'Automated watering and growth tracking for indoor plants.' },
]

const ROTATION_INTERVAL = 3000

export function CarouselPrevNext() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRotating, setIsRotating] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const prev = useCallback(() => setCurrentIndex(i => (i - 1 + slides.length) % slides.length), [])
  const next = useCallback(() => setCurrentIndex(i => (i + 1) % slides.length), [])

  // Auto-rotation
  useEffect(() => {
    if (!isRotating || isPaused) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      return
    }
    timerRef.current = setInterval(() => setCurrentIndex(i => (i + 1) % slides.length), ROTATION_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRotating, isPaused])

  // Pause on focus/hover
  const onFocusIn = useCallback(() => setIsPaused(true), [])
  const onFocusOut = useCallback((e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) setIsPaused(false)
  }, [])

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) setIsRotating(false)
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setIsRotating(false) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const slide = slides[currentIndex]!

  return (
    <section
      ref={containerRef}
      aria-roledescription="carousel"
      aria-label="Highlighted features"
      className={styles.carousel}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.controls}>
        <button
          className={styles.rotationButton}
          aria-label={isRotating ? 'Stop automatic slide show' : 'Start automatic slide show'}
          onClick={() => setIsRotating(r => !r)}
        >
          {isRotating ? <Pause size="1em" /> : <Play size="1em" />}
        </button>
        <button className={styles.rotationButton} aria-label="Previous Slide" onClick={prev}>
          <ChevronLeft size="1em" />
        </button>
        <button className={styles.rotationButton} aria-label="Next Slide" onClick={next}>
          <ChevronRight size="1em" />
        </button>
      </div>

      <div aria-live={isRotating && !isPaused ? 'off' : 'polite'}>
        <div
          role="group"
          aria-roledescription="slide"
          aria-label={`${currentIndex + 1} of ${slides.length}`}
          className={styles.slide}
        >
          <h3 className={styles.slideTitle}>{slide.label}</h3>
          <p className={styles.slideDesc}>{slide.desc}</p>
        </div>
      </div>

      <div className={styles.indicator} aria-hidden="true">
        {currentIndex + 1} / {slides.length}
      </div>
    </section>
  )
}
