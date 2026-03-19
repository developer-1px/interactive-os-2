import type { NodeState } from '../interactive-os/behaviors/types'
import {
  Folder, FolderOpen, FileText, FileCode, FileJson, FileType,
  ChevronRight, ChevronDown,
} from 'lucide-react'
import { getFileExt } from './shared-tree-data'

const iconSize = 14
const iconStroke = 1.5

export function FileIcon({ name }: { name: string }) {
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

export function RenderTreeItem(props: { node: Record<string, unknown>; state: NodeState }) {
  const { node, state } = props
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
}
