import { useState } from 'react'
import { TreeGrid } from '../interactive-os/ui/TreeGrid'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import { history } from '../interactive-os/plugins/history'
import { crud } from '../interactive-os/plugins/crud'
import { clipboard } from '../interactive-os/plugins/clipboard'
import { rename } from '../interactive-os/plugins/rename'
import { dnd } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focus-recovery'
import {
  Folder, FolderOpen, FileText, FileCode, FileJson, FileType,
  ChevronRight, ChevronDown,
} from 'lucide-react'

const treeData = createStore({
  entities: {
    src: { id: 'src', data: { name: 'src', type: 'folder' } },
    components: { id: 'components', data: { name: 'components', type: 'folder' } },
    app: { id: 'app', data: { name: 'App.tsx', type: 'file' } },
    main: { id: 'main', data: { name: 'main.tsx', type: 'file' } },
    button: { id: 'button', data: { name: 'Button.tsx', type: 'file' } },
    input: { id: 'input', data: { name: 'Input.tsx', type: 'file' } },
    lib: { id: 'lib', data: { name: 'lib', type: 'folder' } },
    utils: { id: 'utils', data: { name: 'utils.ts', type: 'file' } },
    readme: { id: 'readme', data: { name: 'README.md', type: 'file' } },
    pkg: { id: 'pkg', data: { name: 'package.json', type: 'file' } },
  },
  relationships: {
    [ROOT_ID]: ['src', 'lib', 'readme', 'pkg'],
    src: ['components', 'app', 'main'],
    components: ['button', 'input'],
    lib: ['utils'],
  },
})

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

function getFileExt(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot) : ''
}

const iconSize = 14
const iconStroke = 1.5

function FileIcon({ name }: { name: string }) {
  const ext = getFileExt(name)
  switch (ext) {
    case '.tsx':
    case '.ts':
    case '.js':
    case '.jsx':
      return <FileCode size={iconSize} strokeWidth={iconStroke} />
    case '.json':
      return <FileJson size={iconSize} strokeWidth={iconStroke} />
    case '.md':
      return <FileType size={iconSize} strokeWidth={iconStroke} />
    default:
      return <FileText size={iconSize} strokeWidth={iconStroke} />
  }
}

export default function PageTreeGrid() {
  const [tree, setTree] = useState<NormalizedData>(treeData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">TreeGrid</h2>
        <p className="page-desc">File explorer with keyboard navigation, copy/paste, undo/redo</p>
      </div>
      <div className="page-keys">
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
          renderItem={(node, state: NodeState) => {
            const d = node.data as Record<string, unknown>
            const isFolder = d?.type === 'folder'
            const indent = ((state.level ?? 1) - 1) * 18
            const name = d?.name as string
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
                  {isFolder
                    ? (state.expanded
                      ? <ChevronDown size={12} strokeWidth={2} />
                      : <ChevronRight size={12} strokeWidth={2} />)
                    : ''}
                </span>
                <span className="tree-node__icon">
                  {isFolder
                    ? (state.expanded
                      ? <FolderOpen size={iconSize} strokeWidth={iconStroke} />
                      : <Folder size={iconSize} strokeWidth={iconStroke} />)
                    : <FileIcon name={name} />
                  }
                </span>
                <span className="tree-node__name">{baseName}</span>
                {ext && <span className="tree-node__ext">{ext}</span>}
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}
