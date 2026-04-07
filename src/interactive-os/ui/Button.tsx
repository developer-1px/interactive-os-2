/** @catalog 범용 버튼 */
import React from 'react'
import { type Axes, ax } from '@styles/ax'
import '@styles/ax.css'

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

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  tone?: ButtonTone
  size?: ButtonSize
}

export function Button({ variant = 'ghost', tone, size = 'default', className, ...props }: ButtonProps) {
  const axes = { ...variantAxes[variant] }
  if (tone) axes.tone = tone
  return (
    <button
      className={`${ax({ ...axes, recipe: sizeRecipe[size] })}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
