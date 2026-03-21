import { useEffect, useRef, useState } from 'react'
import { TEMPLATE_VARIANTS } from './cms-templates'
import type { TemplateType } from './cms-templates'

interface CmsTemplatePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (variant: TemplateType) => void
}

export default function CmsTemplatePicker({ open, onClose, onSelect }: CmsTemplatePickerProps) {
  if (!open) return null
  return <TemplatePickerInner onClose={onClose} onSelect={onSelect} />
}

function TemplatePickerInner({ onClose, onSelect }: Omit<CmsTemplatePickerProps, 'open'>) {
  const [focusIdx, setFocusIdx] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-focus the list when mounted
  useEffect(() => {
    listRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusIdx(i => Math.min(i + 1, TEMPLATE_VARIANTS.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusIdx(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        onSelect(TEMPLATE_VARIANTS[focusIdx].id)
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  return (
    <div
      className="cms-template-picker"
      role="listbox"
      aria-label="Section templates"
      ref={listRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onClose()
      }}
    >
      {TEMPLATE_VARIANTS.map((v, i) => (
        <div
          key={v.id}
          role="option"
          aria-selected={i === focusIdx}
          className={`cms-template-picker__item${i === focusIdx ? ' cms-template-picker__item--focused' : ''}`}
          onClick={() => onSelect(v.id)}
          onPointerEnter={() => setFocusIdx(i)}
        >
          {v.label}
        </div>
      ))}
    </div>
  )
}
