import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { tree } from '../../pattern/roles/tree'
import { EXPANDED_ID } from '../../axis/expand'
import styles from './tree.module.css'

// APG #63: File Directory Treeview
// https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-1a/

const folders = [
  {
    id: 'projects',
    label: 'Projects',
    children: [
      { id: 'project-1', label: 'project-1.docx' },
      { id: 'project-2', label: 'project-2.docx' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    children: [
      { id: 'report-1', label: 'report-1.docx' },
      { id: 'report-2', label: 'report-2.docx' },
      { id: 'report-3', label: 'report-3.docx' },
    ],
  },
  {
    id: 'letters',
    label: 'Letters',
    children: [
      { id: 'letter-1', label: 'letter-1.docx' },
      { id: 'letter-2', label: 'letter-2.docx' },
    ],
  },
]

const data: NormalizedData = createStore({
  entities: {
    ...Object.fromEntries(
      folders.map(f => [f.id, { id: f.id, data: { label: f.label } }]),
    ),
    ...Object.fromEntries(
      folders.flatMap(f =>
        f.children.map(c => [c.id, { id: c.id, data: { label: c.label } }]),
      ),
    ),
    [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['projects'] },
  },
  relationships: {
    [ROOT_ID]: folders.map(f => f.id),
    ...Object.fromEntries(
      folders.map(f => [f.id, f.children.map(c => c.id)]),
    ),
  },
})

const renderTreeitem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  const isFolder = state.expanded !== undefined

  return (
    <div
      {...props}
      className={styles.treeitem}
      data-focused={state.focused || undefined}
      style={{ paddingLeft: `calc(var(--space-md) * ${(state.level ?? 1) - 1})` }}
    >
      <span className={styles.indicator} aria-hidden="true">
        {isFolder ? (state.expanded ? '\u25BE' : '\u25B8') : '\u00A0'}
      </span>
      <span>{label}</span>
    </div>
  )
}

export function TreeFile() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => tree, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="File Directory"
    >
      <Aria.Item render={renderTreeitem} />
    </Aria>
  )
}
