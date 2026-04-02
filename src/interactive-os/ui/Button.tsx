import React from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import styles from './Button.module.css'

type ButtonVariant = 'accent' | 'ghost' | 'dialog' | 'destructive'

const variantTone: Record<ButtonVariant, Parameters<typeof ax>[0]> = {
  accent: { surface: 'action', tone: 'accent' },
  ghost: { surface: 'ghost', tone: 'neutral' },
  dialog: { surface: 'action', tone: 'neutral' },
  destructive: { surface: 'action', tone: 'danger' },
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'ghost', className, ...props }: ButtonProps) {
  const axes = variantTone[variant]
  return (
    <button
      className={`${ax({ ...axes, controlSize: 'md' })} ${styles.root} ${styles[variant]}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
