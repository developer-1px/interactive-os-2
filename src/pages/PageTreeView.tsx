import { useState } from 'react'
import { TreeView } from '../interactive-os/ui/TreeView'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import {
  Folder, FolderOpen, FileText, FileCode, FileJson, FileType,
  ChevronRight, ChevronDown,
} from 'lucide-react'

const treeData = createStore({
  entities: {
    docs: { id: 'docs', data: { name: 'docs', type: 'folder' } },
    guide: { id: 'guide', data: { name: 'guide', type: 'folder' } },
    intro: { id: 'intro', data: { name: 'intro.md', type: 'file' } },
    setup: { id: 'setup', data: { name: 'setup.md', type: 'file' } },
    api: { id: 'api', data: { name: 'api', type: 'folder' } },
    ref: { id: 'ref', data: { name: 'reference.md', type: 'file' } },
    changelog: { id: 'changelog', data: { name: 'CHANGELOG.md', type: 'file' } },
    license: { id: 'license', data: { name: 'LICENSE', type: 'file' } },
  },
  relationships: {
    [ROOT_ID]: ['docs', 'changelog', 'license'],
    docs: ['guide', 'api'],
    guide: ['intro', 'setup'],
    api: ['ref'],
  },
})

const plugins = [core()]

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

export default function PageTreeView() {
  const [data, setData] = useState<NormalizedData>(treeData)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Tree View</h2>
        <p className="page-desc">Read-only hierarchical navigation — no CRUD, pure focus + expand</p>
      </div>
      <div className="page-keys">
        <kbd>↑↓</kbd> <span className="key-hint">navigate</span>{' '}
        <kbd>→←</kbd> <span className="key-hint">expand / collapse</span>{' '}
        <kbd>Space</kbd> <span className="key-hint">select</span>{' '}
        <kbd>Home</kbd> <span className="key-hint">first</span>{' '}
        <kbd>End</kbd> <span className="key-hint">last</span>
      </div>
      <div className="card">
        <TreeView
          data={data}
          onChange={setData}
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
