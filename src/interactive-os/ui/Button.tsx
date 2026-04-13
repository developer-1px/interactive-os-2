/** @catalog 범용 버튼 */
import React from 'react'
import { type Axes, ax } from '@styles/ax'

type ButtonVariant = 'accent' | 'ghost' | 'overlay' | 'dialog' | 'destructive'
type ButtonTone = Axes['tone']
type ButtonSize = 'sm' | 'default' | 'lg'

const variantAxes: Record<ButtonVariant, Parameters<typeof ax>[0]> = {
  accent: { surface: 'action', tone: 'accent' },
  ghost: { surface: 'ghost' },
  overlay: { surface: 'overlay', width: 'fit' },
  dialog: { surface: 'action', tone: 'neutral', border: 'default' },
  destructive: { surface: 'action', tone: 'danger' },
}

const sizeRecipe: Record<ButtonSize, Axes['recipe']> = {
  sm: 'control-sm',
  default: 'control',
  lg: 'control-lg',
}

const sizePadding = { sm: 'xs', default: 'sm', lg: 'sm' } as const
const sizeGap = { sm: 'xs', default: 'sm', lg: 'sm' } as const

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  tone?: ButtonTone
  size?: ButtonSize
  /** Set when used inside a useAria container (e.g. toolbar) */
  interactive?: Axes['interactive']
}

export function Button({ variant = 'ghost', tone, size = 'default', interactive, className, ...props }: ButtonProps) {
  const axes = size === 'default'
    ? { ...variantAxes[variant], role: 'control' as const } as Axes
    : { ...variantAxes[variant], recipe: sizeRecipe[size], padding: sizePadding[size], gap: sizeGap[size], shape: 'xs' as const, layout: 'bar' as const, content: 'text' as const, clamp: '1' as const } as Axes
  if (tone) axes.tone = tone
  if (interactive) axes.interactive = interactive
  return (
    <button
      className={`${ax(axes)}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
