import { useState, useCallback } from 'react'
import {
  Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight,
  Copy, ClipboardPaste, Scissors,
} from 'lucide-react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { Toolbar as ToolbarUI } from '../../ui/Toolbar'
import styles from './toolbar.module.css'

// APG #61: Toolbar
// https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/

const iconMap: Record<string, React.ReactNode> = {
  bold: <Bold size={16} />,
  italic: <Italic size={16} />,
  underline: <Underline size={16} />,
  'align-left': <AlignLeft size={16} />,
  'align-center': <AlignCenter size={16} />,
  'align-right': <AlignRight size={16} />,
  copy: <Copy size={16} />,
  paste: <ClipboardPaste size={16} />,
  cut: <Scissors size={16} />,
}

const items = [
  { id: 'bold', label: 'Bold' },
  { id: 'italic', label: 'Italic' },
  { id: 'underline', label: 'Underline' },
  { id: 'align-left', label: 'Align Left' },
  { id: 'align-center', label: 'Align Center' },
  { id: 'align-right', label: 'Align Right' },
  { id: 'copy', label: 'Copy' },
  { id: 'paste', label: 'Paste' },
  { id: 'cut', label: 'Cut' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    items.map(item => [item.id, { id: item.id, data: { label: item.label } }]),
  ),
  relationships: { [ROOT_ID]: items.map(item => item.id) },
})

const renderButton = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const id = node.id as string
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={`${styles.button} inline-flex items-center justify-center`}
      data-focused={state.focused || undefined}
      aria-label={label}
    >
      {iconMap[id]}
    </div>
  )
}

export function Toolbar() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <ToolbarUI
      data={store}
      onChange={onChange}
      renderItem={renderButton}
      aria-label="Text Formatting"
    />
  )
}
