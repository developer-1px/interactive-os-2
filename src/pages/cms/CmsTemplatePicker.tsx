import { useMemo } from 'react'
import { TEMPLATE_VARIANTS } from './cmsTemplates'
import type { TemplateType } from './cmsTemplates'
import type { NormalizedData } from '@os/store/types'
import type { NodeState } from '@os/pattern/types'
import { key } from '@os/axis/types'
import { ListBox } from '@os/ui/ListBox'
import { ax } from '@styles/ax'

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

const renderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => (
  <div
    {...props}
    className={`cms-template-picker__item flex-row items-center cursor-pointer${state.focused ? ' cms-template-picker__item--focused' : ''}`}
  >
    {(item.data as Record<string, unknown>)?.label as string}
  </div>
)

export default function CmsTemplatePicker({ open, onClose, onSelect }: CmsTemplatePickerProps) {
  if (!open) return null
  return <TemplatePickerInner onClose={onClose} onSelect={onSelect} />
}

function TemplatePickerInner({ onClose, onSelect }: Omit<CmsTemplatePickerProps, 'open'>) {
  const keyMap = useMemo(() => ({
    Escape: key(['dismiss'], () => { onClose() }),
  }), [onClose])

  return (
    <div
      className={`cms-template-picker ${ax({ surface: 'overlay' })} absolute`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onClose()
      }}
    >
      <ListBox
        data={pickerData}
        plugins={[]}
        renderItem={renderItem}
        keyMap={keyMap}
        autoFocus
        aria-label="Section templates"
        onActivate={(nodeId) => onSelect(nodeId as TemplateType)}
      />
    </div>
  )
}
