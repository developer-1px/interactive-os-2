import { useEffect, useMemo, useRef } from 'react'
import { TEMPLATE_VARIANTS } from './cms-templates'
import type { TemplateType } from './cms-templates'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { Command } from '../../interactive-os/engine/types'
import type { PatternContext } from '../../interactive-os/pattern/types'
import { listbox } from '../../interactive-os/pattern/roles/listbox'
import { useAria } from '../../interactive-os/primitives/useAria'
import { focusCommands } from '../../interactive-os/axis/navigate'

const pickerData: NormalizedData = {
  entities: Object.fromEntries(
    TEMPLATE_VARIANTS.map(v => [v.id, { id: v.id, data: { label: v.label } }])
  ),
  relationships: { __root__: TEMPLATE_VARIANTS.map(v => v.id) },
}

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
  const listRef = useRef<HTMLDivElement>(null)

  const keyMap = useMemo((): Record<string, (ctx: PatternContext) => Command | void> => ({
    Escape: () => { onClose() },
  }), [onClose])

  const behavior = useMemo(() => listbox(), [])

  const aria = useAria({
    behavior,
    data: pickerData,
    plugins: [],
    keyMap,
    onActivate: (nodeId) => {
      onSelect(nodeId as TemplateType)
    },
  })

  // Auto-focus the first item when mounted
  useEffect(() => {
    const first = listRef.current?.querySelector<HTMLElement>('[role="option"]')
    first?.focus()
  }, [])

  return (
    <div
      className="cms-template-picker"
      ref={listRef}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onClose()
      }}
    >
      <div role="listbox" aria-label="Section templates" {...aria.containerProps}>
        {TEMPLATE_VARIANTS.map(v => {
          const props = aria.getNodeProps(v.id)
          const state = aria.getNodeState(v.id)
          return (
            <div
              key={v.id}
              {...(props as React.HTMLAttributes<HTMLDivElement>)}
              className={`cms-template-picker__item${state.focused ? ' cms-template-picker__item--focused' : ''}`}
              onPointerEnter={() => aria.dispatch(focusCommands.setFocus(v.id))}
            >
              {v.label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
