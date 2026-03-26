import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Up, Down, Left, Right } from '../kbdIcons'
import { Aria } from '../../interactive-os/primitives/aria'
import { composePattern } from '../../interactive-os/pattern/composePattern'
import { navigate } from '../../interactive-os/axis/navigate'
import { expand } from '../../interactive-os/axis/expand'
import { spatial } from '../../interactive-os/plugins/spatial'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import type { Entity, NormalizedData } from '../../interactive-os/store/types'
import type { NodeState } from '../../interactive-os/pattern/types'
import { axisTreeData } from './axis-demo-data'

type ExpandMode = 'arrow' | 'enter-esc'

const pluginsArrow = [focusRecovery()]
const pluginsEnterEsc = [spatial(), focusRecovery()]

export default function ExpandDemo() {
  const [mode, setMode] = useState<ExpandMode>('arrow')
  const [data, setData] = useState<NormalizedData>(axisTreeData)

  const behavior = mode === 'arrow'
    ? composePattern(
        {
          role: 'tree',
          childRole: 'treeitem',
          ariaAttributes: (_node: Entity, state: NodeState) => {
            const attrs: Record<string, string> = {}
            if (state.expanded !== undefined) attrs['aria-expanded'] = String(state.expanded)
            if (state.level !== undefined) attrs['aria-level'] = String(state.level)
            return attrs
          },
        },
        expand({ mode: 'arrow' }),
        navigate({ orientation: 'vertical' }),
      )
    : composePattern(
        {
          role: 'group',
          childRole: 'group',
          ariaAttributes: (_node: Entity, state: NodeState) => {
            const attrs: Record<string, string> = {}
            if (state.expanded !== undefined) attrs['aria-expanded'] = String(state.expanded)
            return attrs
          },
        },
        expand({ mode: 'enter-esc' }),
      )

  return (
    <>
      <div className="page-keys">
        <label>
          <select value={mode} onChange={(e) => { setMode(e.target.value as ExpandMode); setData(axisTreeData) }} style={{ marginRight: 4 }}>
            <option value="arrow">arrow</option>
            <option value="enter-esc">enter-esc</option>
          </select>
          mode
        </label>
      </div>
      <div className="page-keys">
        {mode === 'arrow' ? (
          <>
            <kbd><Right /></kbd> <span className="key-hint">expand / enter child</span>{' '}
            <kbd><Left /></kbd> <span className="key-hint">collapse / exit to parent</span>{' '}
            <kbd><Up /><Down /></kbd> <span className="key-hint">navigate</span>
          </>
        ) : (
          <>
            <kbd>Enter</kbd> <span className="key-hint">enter child scope</span>{' '}
            <kbd>Esc</kbd> <span className="key-hint">exit to parent scope</span>
          </>
        )}
      </div>
      <div className="card">
        <Aria
          behavior={behavior}
          data={data}
          plugins={mode === 'arrow' ? pluginsArrow : pluginsEnterEsc}
          onChange={setData}
          aria-label="expand demo"
        >
          <Aria.Item render={(props, node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const indent = mode === 'arrow' ? ((state.level ?? 1) - 1) * 20 : 0
            const cls = ['list-item', state.focused && 'list-item--focused'].filter(Boolean).join(' ')
            return (
              <div {...props} className={cls} style={indent ? { paddingLeft: indent } : undefined}>
                {mode === 'arrow' && state.expanded !== undefined && (
                  <span style={{ display: 'inline-block', width: 16, opacity: 0.5 }}>
                    {state.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                )}
                {d?.label as string}
              </div>
            )
          }} />
        </Aria>
      </div>
    </>
  )
}
