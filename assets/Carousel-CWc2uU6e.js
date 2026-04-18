var e=`/** @catalog 슬라이드 형태 콘텐츠 회전 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import { key } from '../axis/types'
import type { KeyHandler } from '../axis/types'
import type { AriaComponentProps } from './types'
import { useTabList } from './useTabList'
import { ax } from '@styles/ax'
import { Button } from './Button'
import { DirectionIndicator } from './indicators'
import { CarouselItem } from './items/CarouselItem'
import './Carousel.css'

interface CarouselProps extends AriaComponentProps {
  /** Auto-play slides */
  autoPlay?: boolean
  /** Auto-play interval in ms (default: 5000) */
  interval?: number
  /** Loop back to first/last slide (default: true) */
  loop?: boolean
  /** Show dot indicators (default: true) */
  showDots?: boolean
  /** Render slide content */
  renderSlide?: (node: Record<string, unknown>, index: number) => React.ReactNode
}

export function Carousel({
  data,
  autoPlay = false,
  interval = 5000,
  loop = true,
  showDots = true,
  renderSlide,
  plugins = [],
  className,
  'aria-label': ariaLabel = 'Carousel',
}: CarouselProps) {
  const slideIds = getChildren(data, ROOT_ID)
  const total = slideIds.length
  const [activeIndex, setActiveIndex] = useState(0)
  const activeId = slideIds[activeIndex] ?? slideIds[0] ?? ''
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [paused, setPaused] = useState(!autoPlay)

  const goTo = useCallback((index: number) => {
    if (total === 0) return
    if (loop) {
      setActiveIndex(((index % total) + total) % total)
    } else {
      setActiveIndex(Math.max(0, Math.min(index, total - 1)))
    }
  }, [total, loop])

  // Auto-play
  useEffect(() => {
    if (paused || total <= 1) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => loop ? (prev + 1) % total : Math.min(prev + 1, total - 1))
    }, interval)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paused, interval, loop, total])

  // Wrap navigation with loop support via keyMap override
  const carouselKeyMap = useMemo((): Record<string, KeyHandler> | undefined => {
    if (!loop) return undefined
    return {
      ArrowRight: key(['core:focus:next'], (ctx) => {
        return ctx.focusNext({ wrap: true })
      }),
      ArrowLeft: key(['core:focus:prev'], (ctx) => {
        return ctx.focusPrev({ wrap: true })
      }),
    }
  }, [loop])

  const handleActivate = useCallback((nodeId: string) => {
    const idx = slideIds.indexOf(nodeId)
    if (idx >= 0) setActiveIndex(idx)
  }, [slideIds])

  const tl = useTabList({
    data,
    plugins,
    keyMap: carouselKeyMap,
    onActivate: handleActivate,
    initialFocus: activeId,
    'aria-label': 'Slide navigation',
  })

  // Sync focus → active slide
  useEffect(() => {
    const idx = slideIds.indexOf(tl.focused)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (idx >= 0) setActiveIndex(idx)
  }, [tl.focused, slideIds])

  const store = tl.getStore()
  const childIds = getChildren(store, ROOT_ID)

  const canPrev = loop || activeIndex > 0
  const canNext = loop || activeIndex < total - 1

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className={\`\${ax({ layout: 'stack', gap: 'sm' })}\${className ? \` \${className}\` : ''}\`}
      onMouseEnter={autoPlay ? () => setPaused(true) : undefined}
      onMouseLeave={autoPlay ? () => setPaused(false) : undefined}
      onFocus={autoPlay ? () => setPaused(true) : undefined}
      onBlur={autoPlay ? () => setPaused(false) : undefined}
    >
      {/* Slide viewport */}
      <div aria-live={autoPlay && !paused ? 'off' : 'polite'} aria-atomic="true" className={ax({ layout: 'fill', scroll: 'hidden' })}>
        <div className={\`carousel-track \${ax({ layout: 'row' })}\`}>
          {slideIds.map((id, i) => {
            const entity = data.entities[id]
            if (!entity) return null
            const node = entity as Record<string, unknown>
            const slideContent = renderSlide ? renderSlide(node, i) : ((node.data as Record<string, unknown>)?.label as string ?? id)
            const slideEl = CarouselItem(
              { 'aria-hidden': i !== activeIndex ? true : undefined },
              node,
              slideContent,
              { index: i, total },
            )
            return React.cloneElement(slideEl, { key: id })
          })}
        </div>
      </div>

      {/* Tab-based navigation */}
      <div className={ax({ layout: 'bar', gap: 'sm', padding: 'xs' })}>
        <Button
          icon
          aria-label="Previous slide"
          onClick={() => goTo(activeIndex - 1)}
          disabled={!canPrev}
          tabIndex={-1}
        >
          <DirectionIndicator direction="prev" />
        </Button>

        <div
          {...(tl.rootProps as React.HTMLAttributes<HTMLDivElement>)}
          className={ax({ layout: 'bar', gap: 'xs' })}
        >
          {showDots && total > 1 && childIds.map((id, i) => {
            const itemProps = tl.getItemProps(id) as React.HTMLAttributes<HTMLElement>
            return (
              <span
                key={id}
                {...itemProps}
                className={\`\${ax({ square: 'sm', shape: 'pill', role: 'control', interactive: 'tab' })} item-indicator--page-dot\${i === activeIndex ? ' item-indicator--page-dot-active' : ''}\`}
                aria-label={\`Slide \${i + 1}\`}
              />
            )
          })}
        </div>

        <Button
          icon
          aria-label="Next slide"
          onClick={() => goTo(activeIndex + 1)}
          disabled={!canNext}
          tabIndex={-1}
        >
          <DirectionIndicator direction="next" />
        </Button>
      </div>
    </section>
  )
}
`;export{e as default};