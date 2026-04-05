import React from 'react'
import { type Axes, ax } from '@styles/ax'
import '@styles/ax.css'
import styles from './TextInput.module.css'

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  align?: 'left' | 'right'
  size?: Axes['controlSize']
}

export function TextInput({ align = 'left', size, className, ...props }: TextInputProps) {
  return (
    <input
      type="text"
      data-align={align}
      className={`${ax({ surface: 'input', textStyle: 'caption', text: 'primary', controlSize: size, padding: 'sm', content: 'text' })} ${styles.input}${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}
