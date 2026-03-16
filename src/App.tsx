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
import { focusRecovery } from './interactive-os/plugins/focus-recovery'
import './App.css'

// --- Data ---

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
    ts: { id: 'ts', label: 'TypeScript', desc: 'Typed superset of JavaScript' },
    react: { id: 'react', label: 'React 19', desc: 'UI component library' },
    vite: { id: 'vite', label: 'Vite 8', desc: 'Next-gen build tool' },
    vitest: { id: 'vitest', label: 'Vitest', desc: 'Unit test framework' },
    pnpm: { id: 'pnpm', label: 'pnpm', desc: 'Fast package manager' },
    axe: { id: 'axe', label: 'axe-core', desc: 'Accessibility engine' },
  },
  relationships: {
    [ROOT_ID]: ['ts', 'react', 'vite', 'vitest', 'pnpm', 'axe'],
  },
})

const tabData = createStore({
  entities: {
    overview: { id: 'overview', label: 'overview' },
    api: { id: 'api', label: 'api' },
    examples: { id: 'examples', label: 'examples' },
    changelog: { id: 'changelog', label: 'changelog' },
  },
  relationships: {
    [ROOT_ID]: ['overview', 'api', 'examples', 'changelog'],
  },
})

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

// --- Helpers ---

function getFileExt(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot) : ''
}

// --- App ---

function App() {
  const [tree, setTree] = useState<NormalizedData>(treeData)

  return (
    <div className="page">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-mark" />
            <h1>interactive-os</h1>
            <span className="version">v0.1.0</span>
          </div>
          <p>
            Keyboard-first ARIA framework. Plugin architecture
            for composable navigation, focus, and CRUD operations.
          </p>
          <div className="stats">
            <div className="stat"><strong>204</strong> tests</div>
            <div className="stat"><strong>6</strong> plugins</div>
            <div className="stat"><strong>6</strong> behaviors</div>
            <div className="stat"><strong>6</strong> components</div>
          </div>
        </div>
      </header>

      <div className="main">
        {/* TreeGrid */}
        <section className="section">
          <div className="section-header">
            <span className="section-num">01</span>
            <h2 className="section-title">TreeGrid</h2>
          </div>
          <div className="section-desc">
            <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
            <kbd>→←</kbd> <span className="key-hint">expand</span>{' '}
            <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
            <kbd>⌘C</kbd> <span className="key-hint">copy</span>{' '}
            <kbd>⌘V</kbd> <span className="key-hint">paste</span>{' '}
            <kbd>Del</kbd> <span className="key-hint">delete</span>{' '}
            <kbd>⌘Z</kbd> <span className="key-hint">undo</span>{' '}
            <kbd>Alt↑↓</kbd> <span className="key-hint">reorder</span>
          </div>
          <div className="card">
            <TreeGrid
              data={tree}
              onChange={setTree}
              enableEditing
              plugins={plugins}
              renderNode={(node, state: NodeState) => {
                const isFolder = node.type === 'folder'
                const indent = ((state.level ?? 1) - 1) * 18
                const name = node.name as string
                const ext = getFileExt(name)
                const baseName = ext ? name.slice(0, -ext.length) : name

                const cls = [
                  'tree-node',
                  state.focused && 'tree-node--focused',
                  state.selected && !state.focused && 'tree-node--selected',
                ].filter(Boolean).join(' ')

                return (
                  <div className={cls} style={{ paddingLeft: 14 + indent }}>
                    <span className="tree-node__chevron">
                      {isFolder ? (state.expanded ? '▾' : '▸') : ''}
                    </span>
                    <span className="tree-node__icon">
                      {isFolder ? '◇' : '·'}
                    </span>
                    <span className="tree-node__name">{baseName}</span>
                    {ext && <span className="tree-node__ext">{ext}</span>}
                  </div>
                )
              }}
            />
          </div>
        </section>

        {/* Tabs */}
        <section className="section">
          <div className="section-header">
            <span className="section-num">02</span>
            <h2 className="section-title">TabList</h2>
          </div>
          <div className="section-desc">
            <kbd>←→</kbd> <span className="key-hint">switch</span>{' '}
            <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
            <kbd>End</kbd> <span className="key-hint">last</span>
          </div>
          <div className="card">
            <div style={{ borderBottom: '1px solid var(--border-mid)' }}>
              <TabList
                data={tabData}
                renderTab={(tab, state: NodeState) => (
                  <div className={`tab ${state.focused ? 'tab--focused' : ''}`}>
                    {tab.label as string}
                  </div>
                )}
              />
            </div>
            <div className="tab-content">
              {'>'} Each tab is a focusable ARIA tab element.<br />
              {'>'} Navigation follows W3C APG tablist pattern.
            </div>
          </div>
        </section>

        {/* ListBox */}
        <section className="section">
          <div className="section-header">
            <span className="section-num">03</span>
            <h2 className="section-title">ListBox</h2>
          </div>
          <div className="section-desc">
            <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
            <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
            <kbd>Enter</kbd> <span className="key-hint">activate</span>
          </div>
          <div className="card">
            <ListBox
              data={listData}
              renderItem={(item, state: NodeState) => {
                const cls = [
                  'list-item',
                  state.focused && 'list-item--focused',
                  state.selected && !state.focused && 'list-item--selected',
                ].filter(Boolean).join(' ')

                return (
                  <div className={cls}>
                    <span className="list-item__label">{item.label as string}</span>
                    <span className="list-item__desc">{item.desc as string}</span>
                  </div>
                )
              }}
            />
          </div>
        </section>
      </div>

      <footer className="footer">
        <span>■</span> interactive-os — keyboard-first aria framework
      </footer>
    </div>
  )
}

export default App
