// ② Carousel slide item
import type React from 'react'
import { ax } from '@styles/ax'

export interface CarouselItemOptions {
  index: number
  total: number
}

export function CarouselItem(
  props: React.HTMLAttributes<HTMLElement>,
  _node: Record<string, unknown>,
  children: React.ReactNode,
  options: CarouselItemOptions,
): React.ReactElement {
  const { index, total } = options
  return (
    <div
      {...props}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
      className={`carousel-slide ${ax({ layout: 'fill' })}${props.className ? ` ${props.className}` : ''}`}
    >
      {children}
    </div>
  )
}
