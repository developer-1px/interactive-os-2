import React, { useState } from 'react'
import { Aria } from '../../interactive-os/primitives/aria'
import { composePattern } from '../../interactive-os/pattern/composePattern'
import { navigate } from '../../interactive-os/axis/navigate'
import { edit } from '../../interactive-os/pattern/edit'
import { replaceEditPlugin } from '../../interactive-os/pattern/edit'
import { core } from '../../interactive-os/plugins/core'
import { crud } from '../../interactive-os/plugins/crud'
import { history } from '../../interactive-os/plugins/history'
import { focusRecovery } from '../../interactive-os/plugins/focusRecovery'
import { rename } from '../../interactive-os/plugins/rename'
import type { NormalizedData } from '../../interactive-os/store/types'
import type { NodeState } from '../../interactive-os/pattern/types'
import { createStore } from '../../interactive-os/store/createStore'
import { ROOT_ID } from '../../interactive-os/store/types'

function makeData(): NormalizedData {
  return createStore({
    entities: {
      f1: { id: 'f1', data: { label: 'README.md' } },
      f2: { id: 'f2', data: { label: 'package.json' } },
      f3: { id: 'f3', data: { label: 'tsconfig.json' } },
      f4: { id: 'f4', data: { label: 'vite.config.ts' } },
      f5: { id: 'f5', data: { label: 'index.html' } },
    },
    relationships: {
      [ROOT_ID]: ['f1', 'f2', 'f3', 'f4', 'f5'],
    },
  })
}

const replacePlugin = replaceEditPlugin()

export default function EditDemo() {
  const [tree, setTree] = useState(false)
  const [replaceMode, setReplaceMode] = useState(true)
  const [data, setData] = useState<NormalizedData>(makeData)

  const behavior = React.useMemo(
    () => composePattern(
      {
        role: 'listbox',
        childRole: 'option',
        ariaAttributes: (_node, state: NodeState) => ({
          'aria-selected': String(state.selected),
        }),
      },
      edit({ tree }),
      navigate({ orientation: 'vertical' }),
    ),
    [tree],
  )

  const plugins = React.useMemo(
    () => replaceMode
      ? [core(), crud(), rename(), history(), focusRecovery(), replacePlugin]
      : [core(), crud(), rename(), history(), focusRecovery()],
    [replaceMode],
  )

  const handleReset = () => setData(makeData())

  return (
    <>
      <div className="page-keys">
        <label style={{ marginRight: 12 }}>
          <input type="checkbox" checked={tree} onChange={(e) => setTree(e.target.checked)} />
          {' '}tree (Alt+←→)
        </label>
        <label style={{ marginRight: 12 }}>
          <input type="checkbox" checked={replaceMode} onChange={(e) => setReplaceMode(e.target.checked)} />
          {' '}replaceEditPlugin
        </label>
        <button onClick={handleReset} style={{ fontSize: 'var(--text-sm)', padding: '2px var(--space-sm)' }}>Reset</button>
      </div>
      <div className="page-keys">
        <kbd>F2</kbd> <span className="key-hint">rename</span>{' '}
        <kbd>Enter</kbd> <span className="key-hint">rename</span>{' '}
        <kbd>Delete</kbd> <span className="key-hint">delete</span>{' '}
        <kbd>Alt+↑↓</kbd> <span className="key-hint">move</span>{' '}
        {tree && <><kbd>Alt+←→</kbd> <span className="key-hint">indent</span>{' '}</>}
        {replaceMode && <><kbd>a-z</kbd> <span className="key-hint">replace</span>{' '}</>}
        <kbd>⌘Z</kbd> <span className="key-hint">undo</span>
      </div>
      <div className="card">
        <Aria behavior={behavior} data={data} plugins={plugins} onChange={setData} aria-label="edit demo">
          <Aria.Item render={(props, node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const cls = ['list-item', state.focused && 'list-item--focused'].filter(Boolean).join(' ')
            return (
              <div {...props} className={cls}>
                <Aria.Editable field="label">
                  <span>{d?.label as string}</span>
                </Aria.Editable>
              </div>
            )
          }} />
        </Aria>
      </div>
    </>
  )
}
