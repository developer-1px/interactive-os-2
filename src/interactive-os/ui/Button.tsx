import React from 'react'
import styles from './Button.module.css'

type ButtonVariant = 'accent' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'ghost', className, ...props }: ButtonProps) {
  return (
    <button
      className={`${styles[variant]}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
