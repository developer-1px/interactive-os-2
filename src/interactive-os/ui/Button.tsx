/** @catalog 범용 버튼 */
import React from 'react'
import { type Axes, ax } from '@styles/ax'

type ButtonVariant = 'accent' | 'ghost' | 'overlay' | 'dialog' | 'destructive'
type ButtonTone = Axes['tone']
const variantAxes: Record<ButtonVariant, Parameters<typeof ax>[0]> = {
  accent: { surface: 'action', tone: 'accent', text: 'bright' },
  ghost: { surface: 'ghost' },
  overlay: { surface: 'overlay', width: 'fit' },
  dialog: { surface: 'input', interactive: 'button' },
  destructive: { surface: 'action', tone: 'danger-dim' },
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
  const axes = { ...variantAxes[variant], role: 'control' as const, content: icon ? 'icon' as const : 'text' as const } as Axes
  if (tone) axes.tone = tone
  if (interactive) axes.interactive = interactive
  return (
    <button
      className={`${ax(axes)}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
