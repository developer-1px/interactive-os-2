// ② 2026-04-04-inspector-zone-keymap-prd.md
import { useEffect, useRef, useState, useMemo } from 'react'
import type { InspectResult } from '@os/engine/types'
import type { AriaActions } from '@os/primitives/ariaRegistry'
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import type { Plugin } from '@os/plugins/types'
import { getAllAriaActions } from '@os/primitives/ariaRegistry'
import { TreeView } from '@os/ui/TreeView'
import { AppInspector } from './AppInspector'
import { ax } from '@styles/ax'
import styles from './InspectorWindow.module.css'

interface RegistryEntry {
  id: string
  actions: AriaActions
  parentId?: string
}

const emptyPlugins: Plugin[] = []

/** Convert registry entries to NormalizedData for TreeView */
function registryToTree(entries: RegistryEntry[]): NormalizedData {
  const idSet = new Set(entries.map(e => e.id))
  const entities: NormalizedData['entities'] = {}
  const relationships: NormalizedData['relationships'] = {}

  const rootIds: string[] = []
  const childrenMap = new Map<string, string[]>()

  for (const entry of entries) {
    entities[entry.id] = { id: entry.id, data: { label: entry.id } }
    if (entry.parentId && idSet.has(entry.parentId)) {
      const siblings = childrenMap.get(entry.parentId) ?? []
      siblings.push(entry.id)
      childrenMap.set(entry.parentId, siblings)
    } else {
      rootIds.push(entry.id)
    }
  }

  relationships[ROOT_ID] = rootIds
  for (const [parentId, childIds] of childrenMap) {
    relationships[parentId] = childIds
  }

  return { entities, relationships }
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

export function InspectorWindow() {
  const [entries, setEntries] = useState<RegistryEntry[]>([])
  const [selectedId, setSelectedId] = useState('')
  const prevSnapshotRef = useRef('')

  useEffect(() => {
    const update = () => {
      const all = getAllAriaActions()
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

  const treeData = useMemo(() => registryToTree(entries), [entries])
  const actionsMap = useMemo(() => {
    const map = new Map<string, AriaActions>()
    for (const e of entries) map.set(e.id, e.actions)
    return map
  }, [entries])

  const selectedActions = actionsMap.get(selectedId)
  const inspectResult: InspectResult | undefined = useMemo(() => selectedActions?.inspect(), [selectedActions])
  const viewKeyMap = useMemo(() => selectedActions?.getKeyMap?.(), [selectedActions])
  const effectiveKeyMap = viewKeyMap ?? inspectResult?.keyMap ?? {}

  return (
    <div className={`${ax({ layout: 'column' })} ${styles.root}`}>
      <div className={ax({ layout: 'spread', padding: 'sm', textStyle: 'caption', surface: 'overlay' })}>
        <span className={ax({ text: 'bright' })}>Aria Inspector</span>
        <span className={ax({ text: 'muted' })}>{entries.length} instances</span>
      </div>

      <div className={styles.splitLayout}>
        <div className={`${ax({ layout: 'column' })} ${styles.sidebar}`}>
          {entries.length === 0 ? (
            <div className={ax({ padding: 'sm', text: 'muted', textStyle: 'caption' })}>등록된 인스턴스 없음</div>
          ) : (
            <TreeView
              data={treeData}
              plugins={emptyPlugins}
              onActivate={setSelectedId}
              activateOnClick
              aria-label="Inspector hierarchy"
            />
          )}
        </div>

        <div className={styles.detail}>
          {selectedActions ? (
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
