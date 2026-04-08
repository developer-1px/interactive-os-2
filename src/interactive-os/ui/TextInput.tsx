/** @catalog 텍스트 입력 필드 */
import React from 'react'
import { ax } from '@styles/ax'

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  align?: 'left' | 'right'
}

export function TextInput({ align = 'left', className, ...props }: TextInputProps) {
  return (
    <input
      type="text"
      className={`${ax({ recipe: 'control', surface: 'input', text: 'primary' })}${align === 'right' ? ' text-right' : ''}${className ? ` ${className}` : ''}`}
      style={{ width: '100%' }}
      {...props}
    />
  )
}
