/** @catalog 범용 버튼 */
import React from 'react'
import { ax, type AxPublic, type AxTone, type AxInteractive, type AxContent } from '@styles/ax'

type ButtonVariant = 'accent' | 'ghost' | 'overlay' | 'dialog' | 'destructive' | 'outline' | 'secondary' | 'link'

// role:'control' branch requires surface ∈ SurfaceActionable = 'action'|'ghost'|'input'|'placeholder'.
// `overlay`/`sunken`/`display` were pre-AxPublic values — remap to the nearest legal actionable surface.
const variantAxes = {
  accent:      { role: 'control', surface: 'action',  tone: 'accent' },
  ghost:       { role: 'control', surface: 'ghost' },
  overlay:     { role: 'control', surface: 'ghost',   width: 'fit' },
  dialog:      { role: 'control', surface: 'input',   interactive: 'button' },
  destructive: { role: 'control', surface: 'action',  tone: 'danger-dim' },
  outline:     { role: 'control', surface: 'ghost',   interactive: 'button' },
  secondary:   { role: 'control', surface: 'ghost',   interactive: 'button' },
  link:        { role: 'control', surface: 'ghost' },
} as const satisfies Record<ButtonVariant, AxPublic>

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  tone?: AxTone
  /** icon-only button (square, no text padding) */
  icon?: boolean
  /** Set when used inside a useAria container (e.g. toolbar) */
  interactive?: AxInteractive
}

export function Button({ variant = 'ghost', tone, icon, interactive, className, ...props }: ButtonProps) {
  const axes: AxPublic = {
    ...variantAxes[variant],
    content: (icon ? 'icon' : 'text') as AxContent,
    ...(tone ? { tone } : {}),
    ...(interactive ? { interactive } : {}),
  }
  return (
    <button
      className={`${ax(axes)}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
