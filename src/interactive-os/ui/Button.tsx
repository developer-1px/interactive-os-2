/** @catalog 범용 버튼 */
import React from 'react'
import { type Axes, ax } from '@styles/ax'

type ButtonVariant = 'accent' | 'ghost' | 'overlay' | 'dialog' | 'destructive'
type ButtonTone = Axes['tone']
const variantAxes: Record<ButtonVariant, Parameters<typeof ax>[0]> = {
  accent: { surface: 'action', tone: 'accent' },
  ghost: { surface: 'ghost' },
  overlay: { surface: 'overlay', width: 'fit' },
  dialog: { surface: 'action', tone: 'neutral', border: 'default' },
  destructive: { surface: 'action', tone: 'danger' },
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  tone?: ButtonTone
  /** icon-only button (square, no text padding) */
  icon?: boolean
  /** Set when used inside a useAria container (e.g. toolbar) */
  interactive?: Axes['interactive']
}

export function Button({ variant = 'ghost', tone, icon, interactive, className, ...props }: ButtonProps) {
  const axes = { ...variantAxes[variant], role: 'control' as const } as Axes
  if (tone) axes.tone = tone
  if (icon) axes.content = 'icon'
  if (interactive) axes.interactive = interactive
  return (
    <button
      className={`${ax(axes)}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
