/** @catalog 범용 버튼 */
import React from 'react'
import { type Axes, ax } from '@styles/ax'

type ButtonVariant = 'accent' | 'ghost' | 'dialog' | 'destructive'
type ButtonTone = Axes['tone']
type ButtonSize = 'sm' | 'default' | 'lg'

const variantAxes: Record<ButtonVariant, Parameters<typeof ax>[0]> = {
  accent: { surface: 'action', tone: 'accent' },
  ghost: { surface: 'ghost' },
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
  const axes = { ...variantAxes[variant], recipe: sizeRecipe[size], padding: sizePadding[size], gap: sizeGap[size], shape: 'xs', layout: 'row', content: 'text', clamp: '1' } as Axes
  if (tone) axes.tone = tone
  if (interactive) axes.interactive = interactive
  return (
    <button
      className={`${ax(axes)}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
