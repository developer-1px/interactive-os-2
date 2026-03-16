import { useState } from 'react'
import { TreeGrid } from './interactive-os/ui/tree-grid'
import { ListBox } from './interactive-os/ui/list-box'
import { TabList } from './interactive-os/ui/tab-list'
import { createStore } from './interactive-os/core/normalized-store'
import { ROOT_ID } from './interactive-os/core/types'
import type { NormalizedData } from './interactive-os/core/types'
import type { NodeState } from './interactive-os/behaviors/types'
import { core } from './interactive-os/plugins/core'
import { history } from './interactive-os/plugins/history'
import { crud } from './interactive-os/plugins/crud'
import { clipboard } from './interactive-os/plugins/clipboard'
import { rename } from './interactive-os/plugins/rename'
import { dnd } from './interactive-os/plugins/dnd'
import './App.css'

// --- Demo data ---

const treeData = createStore({
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

const listData = createStore({
  entities: {
    ts: { id: 'ts', label: 'TypeScript', desc: 'Typed JavaScript' },
    react: { id: 'react', label: 'React', desc: 'UI library' },
    vite: { id: 'vite', label: 'Vite', desc: 'Build tool' },
    vitest: { id: 'vitest', label: 'Vitest', desc: 'Test runner' },
    pnpm: { id: 'pnpm', label: 'pnpm', desc: 'Package manager' },
    eslint: { id: 'eslint', label: 'ESLint', desc: 'Linter' },
  },
  relationships: {
    [ROOT_ID]: ['ts', 'react', 'vite', 'vitest', 'pnpm', 'eslint'],
  },
})

const tabData = createStore({
  entities: {
    overview: { id: 'overview', label: 'Overview' },
    api: { id: 'api', label: 'API' },
    examples: { id: 'examples', label: 'Examples' },
    changelog: { id: 'changelog', label: 'Changelog' },
  },
  relationships: {
    [ROOT_ID]: ['overview', 'api', 'examples', 'changelog'],
  },
})

// --- Styles ---

const card: React.CSSProperties = {
  border: '1px solid #333',
  borderRadius: 8,
  overflow: 'hidden',
  background: '#1a1a1a',
}

const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#999',
  textTransform: 'uppercase' as const,
  letterSpacing: 1,
  marginBottom: 8,
}

const kbd: React.CSSProperties = {
  display: 'inline-block',
  padding: '1px 6px',
  fontSize: 11,
  fontFamily: 'monospace',
  background: '#2a2a2a',
  border: '1px solid #444',
  borderRadius: 3,
  color: '#aaa',
}

// --- App ---

function App() {
  const [tree, setTree] = useState<NormalizedData>(treeData)

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ fontSize: 28, marginBottom: 4, color: '#fff' }}>interactive-os</h1>
      <p style={{ color: '#888', marginBottom: 32, fontSize: 15 }}>
        Keyboard-first ARIA framework with plugin architecture
      </p>

      {/* TreeGrid */}
      <section style={{ marginBottom: 40 }}>
        <div style={sectionTitle}>TreeGrid — File Explorer</div>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
          <span style={kbd}>↑↓</span> navigate{' '}
          <span style={kbd}>→←</span> expand/collapse{' '}
          <span style={kbd}>Space</span> select{' '}
          <span style={kbd}>⌘C</span> copy{' '}
          <span style={kbd}>⌘V</span> paste{' '}
          <span style={kbd}>Del</span> delete{' '}
          <span style={kbd}>⌘Z</span> undo{' '}
          <span style={kbd}>Alt+↑↓</span> reorder{' '}
          <span style={kbd}>Alt+←→</span> move in/out
        </p>
        <div style={card}>
          <TreeGrid
            data={tree}
            onChange={setTree}
            enableEditing
            plugins={[core(), crud(), clipboard(), rename(), dnd(), history()]}
            renderNode={(node, state: NodeState) => {
              const isFolder = node.type === 'folder'
              const indent = ((state.level ?? 1) - 1) * 20
              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '5px 12px',
                  paddingLeft: 12 + indent,
                  background: state.focused ? '#2a2d5e' : state.selected ? '#1e2a3a' : 'transparent',
                  color: state.focused ? '#fff' : '#ccc',
                  borderLeft: state.selected ? '2px solid #4d96ff' : '2px solid transparent',
                  fontSize: 14,
                  userSelect: 'none',
                }}>
                  <span style={{ width: 18, opacity: 0.5, flexShrink: 0, fontSize: 12 }}>
                    {isFolder ? (state.expanded ? '▼' : '▶') : ''}
                  </span>
                  <span style={{ marginRight: 8 }}>{isFolder ? '📁' : '📄'}</span>
                  <span>{node.name as string}</span>
                </div>
              )
            }}
          />
        </div>
      </section>

      {/* Tabs */}
      <section style={{ marginBottom: 40 }}>
        <div style={sectionTitle}>TabList — Documentation Tabs</div>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
          <span style={kbd}>←→</span> switch tabs{' '}
          <span style={kbd}>Home</span> first{' '}
          <span style={kbd}>End</span> last
        </p>
        <div style={{ ...card, padding: 0 }}>
          <div style={{ borderBottom: '1px solid #333' }}>
            <TabList
              data={tabData}
              renderTab={(tab, state: NodeState) => (
                <div style={{
                  display: 'inline-flex',
                  padding: '10px 20px',
                  borderBottom: state.focused ? '2px solid #6c8fff' : '2px solid transparent',
                  color: state.focused ? '#6c8fff' : '#888',
                  fontWeight: state.focused ? 600 : 400,
                  fontSize: 14,
                  cursor: 'default',
                  userSelect: 'none',
                  transition: 'color 0.15s',
                }}>
                  {tab.label as string}
                </div>
              )}
            />
          </div>
          <div style={{ padding: '20px', color: '#aaa', fontSize: 14, minHeight: 60 }}>
            Tab content area — controlled by keyboard navigation above
          </div>
        </div>
      </section>

      {/* Listbox */}
      <section style={{ marginBottom: 40 }}>
        <div style={sectionTitle}>ListBox — Tech Stack</div>
        <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>
          <span style={kbd}>↑↓</span> navigate{' '}
          <span style={kbd}>Space</span> select{' '}
          <span style={kbd}>Enter</span> activate
        </p>
        <div style={card}>
          <ListBox
            data={listData}
            renderItem={(item, state: NodeState) => (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                background: state.focused ? '#2a2d5e' : state.selected ? '#1e3a2a' : 'transparent',
                color: state.focused ? '#fff' : '#ccc',
                borderLeft: state.selected ? '3px solid #4caf50' : '3px solid transparent',
                fontSize: 14,
                userSelect: 'none',
              }}>
                <span style={{ fontWeight: state.selected ? 600 : 400 }}>
                  {item.label as string}
                </span>
                <span style={{ fontSize: 12, color: '#666' }}>
                  {item.desc as string}
                </span>
              </div>
            )}
          />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', color: '#555', fontSize: 12, paddingBottom: 40 }}>
        interactive-os — 157 tests, 6 behaviors, 5 plugins, 3 reference components
      </footer>
    </div>
  )
}

export default App
