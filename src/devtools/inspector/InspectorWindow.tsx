// ② 2026-04-04-inspector-redesign-prd.md
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import type { InspectResult } from '@os/engine/types'
import type { AriaActions } from '@os/primitives/ariaRegistry'
import type { PaneSize } from '@os/store/types'
import type { Plugin } from '@os/plugins/types'
import { getAllAriaActions } from '@os/primitives/ariaRegistry'
import { TreeView } from '@os/ui/TreeView'
import { SplitPane } from '@os/ui/SplitPane'
import { AppInspector } from './AppInspector'
import { copyAriaTree } from './inspectToAscii'
import { registryToUnifiedTree, findInstanceId } from './inspectorStore'
import type { InstanceMeta } from './inspectorStore'
import { ax } from '@styles/ax'
import styles from './InspectorWindow.module.css'

const emptyPlugins: Plugin[] = []

function KeyCommandTable({ inspectResult }: { inspectResult: InspectResult }) {
  const keyEntries = Object.entries(inspectResult.keyMap)
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
        {keyEntries.map(([k, entry]) => (
          <tr key={k}>
            <td className={styles.tdKey}>{k}</td>
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

function CopyButton({ inspectResult }: { inspectResult: InspectResult }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    await copyAriaTree(inspectResult)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [inspectResult])

  return (
    <button
      className={`${ax({ textStyle: 'caption' })} ${styles.copyButton}`}
      onClick={handleCopy}
    >
      {copied ? '✓ Copied' : 'Copy ASCII'}
    </button>
  )
}

export function InspectorWindow() {
  const [actionsMap, setActionsMap] = useState<Map<string, AriaActions>>(new Map())
  const [selectedId, setSelectedId] = useState('')
  const [sizes, setSizes] = useState<PaneSize[]>([0.3, 'flex'])
  const prevSnapshotRef = useRef('')

  useEffect(() => {
    const update = () => {
      const all = getAllAriaActions()
      const snapshot = [...all.keys()].sort().join(',')
      if (snapshot === prevSnapshotRef.current) return
      prevSnapshotRef.current = snapshot

      setActionsMap(new Map(all))
      setSelectedId(prev => {
        if (prev && all.has(findInstanceId(prev).replace('__inst__', ''))) return prev
        if (all.size > 0) return `__inst__${all.keys().next().value!}`
        return ''
      })
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const { tree, metas } = useMemo(
    () => registryToUnifiedTree(actionsMap),
    [actionsMap],
  )

  const instanceId = findInstanceId(selectedId)
  const meta: InstanceMeta | undefined = metas.get(instanceId)
  const inspectResult = meta?.inspectResult

  const handleActivate = useCallback((nodeId: string) => {
    setSelectedId(nodeId)
  }, [])

  return (
    <div className={`${ax({ layout: 'column' })} ${styles.root}`}>
      <div className={ax({ layout: 'spread', padding: 'sm', textStyle: 'caption', surface: 'overlay' })}>
        <span className={ax({ text: 'bright' })}>Aria Inspector</span>
        <span className={ax({ text: 'muted' })}>{actionsMap.size} instances</span>
      </div>

      <div className={styles.content}>
        <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.15}>
          <div className={ax({ layout: 'column' })}>
            {actionsMap.size === 0 ? (
              <div className={ax({ padding: 'sm', text: 'muted', textStyle: 'caption' })}>등록된 인스턴스 없음</div>
            ) : (
              <TreeView
                data={tree}
                plugins={emptyPlugins}
                onActivate={handleActivate}
                selectionFollowsFocus
                activateOnClick
              />
            )}
          </div>

          <div className={styles.detail}>
            {inspectResult ? (
              <div className={ax({ layout: 'column', gap: 'md', padding: 'sm' })}>
                <section>
                  <div className={ax({ layout: 'spread', textStyle: 'caption', text: 'bright', padding: 'xs' })}>
                    <span>Command + Key ({Object.keys(inspectResult.keyMap).length})</span>
                    <CopyButton inspectResult={inspectResult} />
                  </div>
                  <KeyCommandTable inspectResult={inspectResult} />
                </section>

                <section>
                  <div className={ax({ textStyle: 'caption', text: 'bright', padding: 'xs' })}>
                    State ({Object.keys(inspectResult.state.entities).length} entities)
                  </div>
                  <AppInspector inspectResult={inspectResult} />
                </section>

                <section>
                  <div className={ax({ textStyle: 'caption', text: 'bright', padding: 'xs' })}>
                    Info
                  </div>
                  <div className={ax({ layout: 'column', textStyle: 'caption', padding: 'xs' })}>
                    <div><span className={ax({ text: 'muted' })}>Role: </span>{inspectResult.role ?? '—'}</div>
                    <div><span className={ax({ text: 'muted' })}>Child Role: </span>{inspectResult.childRole ?? '—'}</div>
                    <div><span className={ax({ text: 'muted' })}>Plugins: </span>{inspectResult.plugins.join(', ') || '—'}</div>
                    {Object.keys(inspectResult.extras).length > 0 && (
                      <div>
                        <span className={ax({ text: 'muted' })}>Extras: </span>
                        <pre className={styles.extras}>{JSON.stringify(inspectResult.extras, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <div className={ax({ padding: 'md', text: 'muted', textStyle: 'caption' })}>
                선택된 인스턴스 없음
              </div>
            )}
          </div>
        </SplitPane>
      </div>
    </div>
  )
}
