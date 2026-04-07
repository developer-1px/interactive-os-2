/** @catalog 범용 버튼 */
import React from 'react'
import { type Axes, ax } from '@styles/ax'
import '@styles/ax.css'

type ButtonVariant = 'accent' | 'ghost' | 'dialog' | 'destructive'
type ButtonTone = Axes['tone']
type ButtonSize = Axes['controlSize']

const variantAxes: Record<ButtonVariant, Parameters<typeof ax>[0]> = {
  accent: { surface: 'action', tone: 'accent', weight: 'semi' },
  ghost: { surface: 'ghost', tone: 'neutral', border: 'subtle' },
  dialog: { surface: 'action', tone: 'neutral', weight: 'medium', border: 'default' },
  destructive: { surface: 'action', tone: 'danger', weight: 'semi' },
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  tone?: ButtonTone
  size?: ButtonSize
}

export function Button({ variant = 'ghost', tone, size = 'md', className, ...props }: ButtonProps) {
  const axes = { ...variantAxes[variant] }
  if (tone) axes.tone = tone
  return (
    <button
      className={`${ax({ ...axes, controlSize: size, padding: 'sm', content: 'text', shape: 'xl' })}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
