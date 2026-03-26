import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Up, Down, Left, Right } from './kbdIcons'
import { TreeGrid } from '../interactive-os/ui/TreeGrid'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID } from '../interactive-os/store/types'
import type { NormalizedData } from '../interactive-os/store/types'
import type { NodeState } from '../interactive-os/pattern/types'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard, getCutSourceIds } from '../interactive-os/plugins/clipboard'
import { focusRecovery } from '../interactive-os/plugins/focusRecovery'

const colorData = createStore({
  entities: {
    warm: { id: 'warm', data: { label: 'Warm', hex: '', type: 'group' } },
    red: { id: 'red', data: { label: 'Red', hex: '#ef4444', type: 'item' } },
    orange: { id: 'orange', data: { label: 'Orange', hex: '#f97316', type: 'item' } },
    amber: { id: 'amber', data: { label: 'Amber', hex: '#f59e0b', type: 'item' } },
    cool: { id: 'cool', data: { label: 'Cool', hex: '', type: 'group' } },
    green: { id: 'green', data: { label: 'Green', hex: '#22c55e', type: 'item' } },
    blue: { id: 'blue', data: { label: 'Blue', hex: '#3b82f6', type: 'item' } },
    violet: { id: 'violet', data: { label: 'Violet', hex: '#8b5cf6', type: 'item' } },
  },
  relationships: {
    [ROOT_ID]: ['warm', 'cool'],
    warm: ['red', 'orange', 'amber'],
    cool: ['green', 'blue', 'violet'],
  },
})

const plugins = [crud(), clipboard(), history(), focusRecovery()]

export default function ClipboardDemo() {
  const [data, setData] = useState<NormalizedData>(colorData)

  return (
    <>
      <div className="page-keys">
        <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>{' '}
        <kbd><Left /><Right /></kbd> <span className="key-hint">expand</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>⌘C</kbd> <span className="key-hint">copy</span>{' '}
        <kbd>⌘X</kbd> <span className="key-hint">cut</span>{' '}
        <kbd>⌘V</kbd> <span className="key-hint">paste</span>{' '}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>
      <div className="card">
        <TreeGrid
          data={data}
          onChange={setData}
          enableEditing
          plugins={plugins}
          renderItem={(props, node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const isGroup = d?.type === 'group'
            const isCut = getCutSourceIds().includes(node.id as string)
            const indent = ((state.level ?? 1) - 1) * 18

            const cls = [
              'tree-node',
              state.focused && 'tree-node--focused',
              state.selected && !state.focused && 'tree-node--selected',
            ].filter(Boolean).join(' ')

            return (
              <div {...props} className={cls} style={{ paddingLeft: 14 + indent, opacity: isCut ? 0.4 : 1 }}>
                <span className="tree-node__chevron">
                  {isGroup ? (state.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : ''}
                </span>
                {!isGroup && !!(d?.hex) && (
                  <span
                    className="list-item__dot"
                    style={{ background: d.hex as string }}
                  />
                )}
                <span className="tree-node__name" style={{ fontWeight: isGroup ? 600 : 400 }}>
                  {d?.label as string}
                </span>
                <span className="list-item__desc" style={{ marginLeft: 8, opacity: 0.5, fontSize: '0.85em' }}>
                  {d?.hex ? d.hex as string : ''}{' '}
                  <span style={{ opacity: 0.4 }}>{node.id as string}</span>
                </span>
              </div>
            )
          }}
        />
      </div>
    </>
  )
}
