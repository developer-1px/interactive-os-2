/** @catalog 그룹화된 콘텐츠 표면 카드 */
import type { ReactNode } from 'react'
import { ax, type Axes } from '@styles/ax'

type CardVariant = 'outlined' | 'elevated' | 'filled'

interface CardProps {
  variant?: CardVariant
  padding?: Axes['padding']
  clickable?: boolean
  onClick?: () => void
  className?: string
  children: ReactNode
}

const variantAxes: Record<CardVariant, Partial<Axes>> = {
  outlined: { surface: 'display', border: 'default', shape: 'lg' },
  elevated: { surface: 'raised', border: 'ring', shape: 'lg' },
  filled: { surface: 'sunken', shape: 'lg' },
}

export function Card({
  variant = 'outlined',
  padding = 'md',
  clickable,
  onClick,
  className,
  children,
}: CardProps) {
  const axes = { ...variantAxes[variant], padding, layout: 'stack' as const, gap: 'sm' as const }
  const cls = `${ax(clickable ? { ...axes, interactive: 'button' } : axes)}${className ? ` ${className}` : ''}`

  if (clickable) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {children}
      </button>
    )
  }

  return <div className={cls}>{children}</div>
}

// ── Compound sub-components ──

function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${ax({ layout: 'bar', gap: 'sm' })}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${ax({ textStyle: 'body', text: 'primary' })}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${ax({ layout: 'bar', gap: 'sm', text: 'secondary', textStyle: 'caption' })}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter
