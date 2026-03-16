import { useState, useCallback } from 'react'
import { Aria } from './interactive-os/components/aria'
import { treegrid } from './interactive-os/behaviors/treegrid'
import { core } from './interactive-os/plugins/core'
import { history, undoCommand, redoCommand } from './interactive-os/plugins/history'
import { crudCommands } from './interactive-os/plugins/crud'
import { clipboardCommands, resetClipboard } from './interactive-os/plugins/clipboard'
import { renameCommands } from './interactive-os/plugins/rename'
import { createStore } from './interactive-os/core/normalized-store'
import { ROOT_ID } from './interactive-os/core/types'
import type { NormalizedData } from './interactive-os/core/types'
import type { NodeState } from './interactive-os/behaviors/types'
import './App.css'

const initialData = createStore({
  entities: {
    src: { id: 'src', name: 'src', type: 'folder' },
    components: { id: 'components', name: 'components', type: 'folder' },
    app: { id: 'app', name: 'App.tsx', type: 'file' },
    main: { id: 'main', name: 'main.tsx', type: 'file' },
    button: { id: 'button', name: 'Button.tsx', type: 'file' },
    input: { id: 'input', name: 'Input.tsx', type: 'file' },
    lib: { id: 'lib', name: 'lib', type: 'folder' },
    utils: { id: 'utils', name: 'utils.ts', type: 'file' },
    readme: { id: 'readme', name: 'README.md', type: 'file' },
    pkg: { id: 'pkg', name: 'package.json', type: 'file' },
  },
  relationships: {
    [ROOT_ID]: ['src', 'lib', 'readme', 'pkg'],
    src: ['components', 'app', 'main'],
    components: ['button', 'input'],
    lib: ['utils'],
  },
})

const plugins = [core(), history()]

function App() {
  const [data, setData] = useState<NormalizedData>(initialData)

  const handleChange = useCallback((newData: NormalizedData) => {
    setData(newData)
  }, [])

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>interactive-os demo</h1>
      <p style={{ color: '#888', marginBottom: 24, fontSize: 14 }}>
        Keyboard: Arrow keys to navigate, Enter to expand/collapse, Space to select,
        Mod+C/V/X for clipboard, Delete to remove, Mod+Z/Shift+Z for undo/redo
      </p>

      <div style={{
        border: '1px solid #333',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#1a1a1a',
      }}>
        <Aria
          behavior={treegrid}
          data={data}
          plugins={plugins}
          onChange={handleChange}
          keyMap={{
            'Mod+C': (ctx) => clipboardCommands.copy(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
            'Mod+X': (ctx) => clipboardCommands.cut(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
            'Mod+V': (ctx) => clipboardCommands.paste(ctx.focused),
            'Delete': (ctx) => crudCommands.remove(ctx.focused),
            'Mod+Z': () => undoCommand(),
            'Mod+Shift+Z': () => redoCommand(),
          }}
        >
          <Aria.Node render={(node, state: NodeState) => {
            const isFolder = node.type === 'folder'
            const indent = ((state.level ?? 1) - 1) * 20

            return (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 12px',
                paddingLeft: 12 + indent,
                cursor: 'pointer',
                background: state.focused ? '#2a2d5e' : state.selected ? '#1e2a3a' : 'transparent',
                color: state.focused ? '#fff' : '#ccc',
                borderLeft: state.selected ? '2px solid #4d96ff' : '2px solid transparent',
                fontSize: 14,
                userSelect: 'none',
                outline: 'none',
              }}>
                <span style={{ width: 20, opacity: 0.5, flexShrink: 0 }}>
                  {isFolder
                    ? (state.expanded ? '▼' : '▶')
                    : '·'}
                </span>
                <span style={{ marginRight: 8, fontSize: 16 }}>
                  {isFolder ? '📁' : '📄'}
                </span>
                <span>{node.name as string}</span>
              </div>
            )
          }} />
        </Aria>
      </div>

      <p style={{ color: '#666', marginTop: 16, fontSize: 12 }}>
        {Object.keys(data.entities).filter(k => !k.startsWith('__')).length} items
      </p>
    </div>
  )
}

export default App
