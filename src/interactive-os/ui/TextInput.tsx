import React from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import styles from './TextInput.module.css'

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  align?: 'left' | 'right'
}

export function TextInput({ align = 'left', className, style, ...props }: TextInputProps) {
  return (
    <input
      type="text"
      data-surface="input"
      className={`${ax({ textStyle: 'caption' })} ${styles.input}${className ? ` ${className}` : ''}`}
      style={{ textAlign: align, ...style }}
      {...props}
    />
  )
}
