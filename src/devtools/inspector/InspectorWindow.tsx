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

const emptyPlugins: Plugin[] = []

function registryToTree(ids: string[]): NormalizedData {
  const entities: NormalizedData['entities'] = {}
  for (const id of ids) {
    entities[id] = { id, data: { label: id } }
  }
  return { entities, relationships: { [ROOT_ID]: ids } }
}

function KeyCommandTable({ inspectResult }: { inspectResult: InspectResult }) {
  const keyEntries = Object.entries(inspectResult.keyMap)
  // Commands not bound to any key
  const boundCommands = new Set(keyEntries.map(([, e]) => e.command).filter(Boolean))
  const unboundCommands = inspectResult.commands.filter(c => !boundCommands.has(c))

  if (keyEntries.length === 0 && unboundCommands.length === 0) {
    return <div className={ax({ padding: 'sm', text: 'muted', textStyle: 'caption' })}>No bindings</div>
  }
  return (
    <table className={`${ax({ textStyle: 'caption' })} ${styles.table}`}>
      <thead>
        <tr>
          <th className={styles.th}>Key</th>
          <th className={styles.th}>Command</th>
          <th className={styles.th}>Owner</th>
        </tr>
      </thead>
      <tbody>
        {keyEntries.map(([key, entry]) => (
          <tr key={key}>
            <td className={styles.tdKey}>{key}</td>
            <td className={styles.tdCommand}>{entry.command ?? '—'}</td>
            <td className={styles.tdOwner}>{entry.owner}</td>
          </tr>
        ))}
        {unboundCommands.map(cmd => (
          <tr key={cmd}>
            <td className={styles.td}>—</td>
            <td className={styles.tdCommand}>{cmd}</td>
            <td className={styles.tdOwner}>registry</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function InspectorWindow() {
  const [actionsMap, setActionsMap] = useState<Map<string, AriaActions>>(new Map())
  const [selectedId, setSelectedId] = useState('')
  const prevSnapshotRef = useRef('')

  useEffect(() => {
    const update = () => {
      const all = getAllAriaActions()
      const snapshot = [...all.keys()].sort().join(',')
      if (snapshot === prevSnapshotRef.current) return
      prevSnapshotRef.current = snapshot

      setActionsMap(new Map(all))
      setSelectedId(prev => {
        if (prev && all.has(prev)) return prev
        return all.size > 0 ? all.keys().next().value! : ''
      })
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const ids = useMemo(() => [...actionsMap.keys()], [actionsMap])
  const treeData = useMemo(() => registryToTree(ids), [ids])

  const selectedActions = actionsMap.get(selectedId)
  const inspectResult: InspectResult | undefined = useMemo(() => selectedActions?.inspect(), [selectedActions])

  return (
    <div className={`${ax({ layout: 'column' })} ${styles.root}`}>
      <div className={ax({ layout: 'spread', padding: 'sm', textStyle: 'caption', surface: 'overlay' })}>
        <span className={ax({ text: 'bright' })}>Aria Inspector</span>
        <span className={ax({ text: 'muted' })}>{ids.length} instances</span>
      </div>

      <div className={styles.splitLayout}>
        <div className={`${ax({ layout: 'column' })} ${styles.sidebar}`}>
          {ids.length === 0 ? (
            <div className={ax({ padding: 'sm', text: 'muted', textStyle: 'caption' })}>등록된 인스턴스 없음</div>
          ) : (
            <TreeView
              data={treeData}
              plugins={emptyPlugins}
              onActivate={setSelectedId}
              selectionFollowsFocus
              activateOnClick
              aria-label="Inspector instances"
            />
          )}
        </div>

        <div className={styles.detail}>
          {inspectResult ? (
            <div className={ax({ layout: 'column', gap: 'md', padding: 'sm' })}>
              <section>
                <div className={ax({ textStyle: 'caption', text: 'bright', padding: 'xs' })}>
                  Key → Command ({Object.keys(inspectResult.keyMap).length} bindings, {inspectResult.commands.length} commands)
                </div>
                <KeyCommandTable inspectResult={inspectResult} />
              </section>

              <section>
                <div className={ax({ textStyle: 'caption', text: 'bright', padding: 'xs' })}>
                  Plugins ({inspectResult.plugins.length})
                </div>
                <div className={ax({ layout: 'column', textStyle: 'caption' })}>
                  {inspectResult.plugins.map(p => (
                    <div key={p} className={styles.commandItem}>{p}</div>
                  ))}
                </div>
              </section>

              <section>
                <div className={ax({ textStyle: 'caption', text: 'bright', padding: 'xs' })}>Engine State</div>
                <AppInspector inspectResult={inspectResult} />
              </section>
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
