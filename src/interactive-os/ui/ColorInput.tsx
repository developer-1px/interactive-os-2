import React from 'react'
import styles from './ColorInput.module.css'

type ColorInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>

export function ColorInput({ className, ...props }: ColorInputProps) {
  return (
    <input
      type="color"
      className={`${styles.swatch}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
