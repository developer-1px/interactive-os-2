/** @catalog 다중 행 텍스트 입력 */
import { type ChangeEvent, useCallback, useEffect, useRef } from 'react'
import { ax } from '@styles/ax'
import './Textarea.css'

interface TextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  autoResize?: boolean
  maxRows?: number
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  autoResize = false,
  maxRows,
  disabled,
  'aria-label': ariaLabel,
  className,
}: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = ref.current
    if (!el || !autoResize) return
    el.style.height = 'auto'
    const maxHeight = maxRows
      ? parseFloat(getComputedStyle(el).lineHeight) * maxRows +
        parseFloat(getComputedStyle(el).paddingTop) +
        parseFloat(getComputedStyle(el).paddingBottom)
      : Infinity
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [autoResize, maxRows])

  useEffect(() => {
    resize()
  }, [value, resize])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange],
  )

  return (
    <textarea
      ref={ref}
      className={`${ax({ role: 'control', surface: 'input', text: 'primary', content: 'text', ...(autoResize ? { scroll: 'hidden' } : {}) })} textarea${autoResize ? ' textarea--auto-resize' : ''}${className ? ` ${className}` : ''}`}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      aria-label={ariaLabel}
    />
  )
}
