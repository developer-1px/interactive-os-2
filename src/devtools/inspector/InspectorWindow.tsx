// ② 2026-04-04-inspector-zone-keymap-prd.md
import { useEffect, useRef, useState, useMemo } from 'react'
import type { InspectResult } from '@os/engine/types'
import type { AriaActions } from '@os/primitives/ariaRegistry'
import { getAllAriaActions } from '@os/primitives/ariaRegistry'
import { AppInspector } from './AppInspector'
import { ax } from '@styles/ax'
import styles from './InspectorWindow.module.css'

interface RegistryEntry {
  id: string
  actions: AriaActions
  parentId?: string
}

function buildTree(entries: RegistryEntry[]): { roots: RegistryEntry[]; childrenMap: Map<string, RegistryEntry[]> } {
  const idSet = new Set(entries.map(e => e.id))
  const childrenMap = new Map<string, RegistryEntry[]>()
  const roots: RegistryEntry[] = []

  for (const entry of entries) {
    if (entry.parentId && idSet.has(entry.parentId)) {
      const siblings = childrenMap.get(entry.parentId) ?? []
      siblings.push(entry)
      childrenMap.set(entry.parentId, siblings)
    } else {
      roots.push(entry)
    }
  }

  return { roots, childrenMap }
}

function KeyMapTable({ keyMap }: { keyMap: Record<string, string> }) {
  const entries = Object.entries(keyMap)
  if (entries.length === 0) {
    return <div className={ax({ padding: 'sm', text: 'muted', textStyle: 'caption' })}>No keyMap</div>
  }
  return (
    <table className={`${ax({ textStyle: 'caption' })} ${styles.table}`}>
      <thead>
        <tr>
          <th className={styles.th}>Key</th>
          <th className={styles.th}>Owner</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([key, owner]) => (
          <tr key={key}>
            <td className={styles.tdKey}>{key}</td>
            <td className={styles.tdOwner}>{owner}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TreeNode({ entry, childrenMap, selectedId, onSelect, depth = 0 }: {
  entry: RegistryEntry
  childrenMap: Map<string, RegistryEntry[]>
  selectedId: string
  onSelect: (id: string) => void
  depth?: number
}) {
  const children = childrenMap.get(entry.id) ?? []
  const isSelected = entry.id === selectedId

  return (
    <>
      <button
        onClick={() => onSelect(entry.id)}
        className={`${ax({ controlSize: 'sm', surface: isSelected ? 'action' : 'ghost', textStyle: 'caption' })} ${styles.treeBtn} ${styles[`depth${Math.min(depth, 4)}` as keyof typeof styles] ?? ''}`}
      >
        {entry.id}
      </button>
      {children.map(child => (
        <TreeNode
          key={child.id}
          entry={child}
          childrenMap={childrenMap}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={depth + 1}
        />
      ))}
    </>
  )
}

export function InspectorWindow() {
  const [entries, setEntries] = useState<RegistryEntry[]>([])
  const [selectedId, setSelectedId] = useState('')
  const prevSnapshotRef = useRef('')

  useEffect(() => {
    const update = () => {
      const all = getAllAriaActions()
      // Change detection: registry keys + parentIds
      const parts: string[] = []
      for (const [id, actions] of all) {
        parts.push(`${id}:${actions.parentId ?? ''}`)
      }
      const snapshot = parts.sort().join(',')
      if (snapshot === prevSnapshotRef.current) return
      prevSnapshotRef.current = snapshot

      const list: RegistryEntry[] = []
      for (const [id, actions] of all) {
        list.push({ id, actions, parentId: actions.parentId })
      }
      setEntries(list)
      setSelectedId(prev => {
        if (prev && list.some(e => e.id === prev)) return prev
        return list[0]?.id ?? ''
      })
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const { roots, childrenMap } = useMemo(() => buildTree(entries), [entries])

  const selected = useMemo(() => entries.find(e => e.id === selectedId), [entries, selectedId])
  const inspectResult: InspectResult | undefined = useMemo(() => selected?.actions.inspect(), [selected])
  const viewKeyMap = useMemo(() => selected?.actions.getKeyMap?.(), [selected])

  // E4 fallback: prefer getKeyMap (view-level) over inspect().keyMap (engine-level)
  const effectiveKeyMap = viewKeyMap ?? inspectResult?.keyMap ?? {}

  return (
    <div className={`${ax({ layout: 'column' })} ${styles.root}`}>
      <div className={ax({ layout: 'spread', padding: 'sm', textStyle: 'caption', surface: 'overlay' })}>
        <span className={ax({ text: 'bright' })}>Aria Inspector</span>
        <span className={ax({ text: 'muted' })}>{entries.length} instances</span>
      </div>

      <div className={styles.splitLayout}>
        <div className={`${ax({ layout: 'column' })} ${styles.sidebar}`}>
          <div className={ax({ padding: 'xs', textStyle: 'caption', text: 'muted' })}>Hierarchy</div>
          {entries.length === 0 ? (
            <div className={ax({ padding: 'sm', text: 'muted', textStyle: 'caption' })}>등록된 인스턴스 없음</div>
          ) : (
            roots.map(entry => (
              <TreeNode
                key={entry.id}
                entry={entry}
                childrenMap={childrenMap}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ))
          )}
        </div>

        <div className={styles.detail}>
          {selected ? (
            <div className={ax({ layout: 'column', gap: 'sm', padding: 'sm' })}>
              <div className={ax({ textStyle: 'caption', text: 'bright' })}>KeyMap ({Object.keys(effectiveKeyMap).length})</div>
              <KeyMapTable keyMap={effectiveKeyMap} />

              <div className={ax({ textStyle: 'caption', text: 'bright' })}>Engine Inspect</div>
              {inspectResult && <AppInspector inspectResult={inspectResult} />}
            </div>
          ) : (
            <div className={ax({ padding: 'md', text: 'muted', textStyle: 'caption' })}>
              선택된 인스턴스 없음
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
