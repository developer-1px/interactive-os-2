/** @catalog 그룹화된 콘텐츠 표면 카드 */
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'

type CardVariant = 'outlined' | 'elevated' | 'filled'
type CardPadding = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface CardProps {
  variant?: CardVariant
  padding?: CardPadding
  clickable?: boolean
  onClick?: () => void
  className?: string
  children: ReactNode
}

function buildCardClass(variant: CardVariant, clickable: boolean | undefined): string {
  if (clickable) {
    // control 브랜치 — surface: 'action'|'ghost'|'input'|'placeholder' only
    const surface = variant === 'filled' ? 'ghost' : 'action'
    return ax({ role: 'control', surface, layout: 'stack' })
  }
  // control-group — surface: sunken|base|raised|overlay|ghost
  const panelSurface = variant === 'elevated'
    ? 'raised'
    : variant === 'filled'
    ? 'sunken'
    : 'base'
  return ax({ role: 'control-group', surface: panelSurface, layout: 'stack' })
}

export function Card({
  variant = 'outlined',
  padding: _padding = 'md',
  clickable,
  onClick,
  className,
  children,
}: CardProps) {
  const cls = `${buildCardClass(variant, clickable)}${className ? ` ${className}` : ''}`

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
    <div className={`${ax({ layout: 'bar' })}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${ax({ textStyle: 'body',  })}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${ax({ layout: 'bar', textStyle: 'caption' })}${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter
