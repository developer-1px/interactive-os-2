import React from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import styles from './Button.module.css'

type ButtonVariant = 'accent' | 'ghost' | 'dialog' | 'destructive'

const variantAxes: Record<ButtonVariant, Parameters<typeof ax>[0]> = {
  accent: { surface: 'action', tone: 'accent', weight: 'semi' },
  ghost: { surface: 'ghost', tone: 'neutral', width: 'full' },
  dialog: { surface: 'action', tone: 'neutral', weight: 'medium' },
  destructive: { surface: 'action', tone: 'danger', weight: 'semi' },
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'ghost', className, ...props }: ButtonProps) {
  const axes = variantAxes[variant]
  return (
    <button
      className={`${ax({ ...axes, controlSize: 'md', shape: 'xl' })} ${styles[variant]}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
