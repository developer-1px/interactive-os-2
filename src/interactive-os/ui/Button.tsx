import React from 'react'
import styles from './Button.module.css'

type ButtonVariant = 'accent' | 'ghost' | 'dialog' | 'destructive'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'ghost', className, ...props }: ButtonProps) {
  return (
    <button
      data-surface="action"
      className={`${styles.root} ${styles[variant]}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
