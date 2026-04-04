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

type DetailTab = 'interaction' | 'state'

function BoundKeyTable({ inspectResult }: { inspectResult: InspectResult }) {
  const keyEntries = Object.entries(inspectResult.keyMap)
  const clickEntries = Object.entries(inspectResult.clickMap ?? {})

  if (keyEntries.length === 0 && clickEntries.length === 0) {
    return <div className={ax({ padding: 'sm', text: 'muted', textStyle: 'caption' })}>No bindings</div>
  }
  return (
    <table className={`${ax({ textStyle: 'caption' })} ${styles.table}`}>
      <thead>
        <tr>
          <th className={styles.th}>Input</th>
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
        {clickEntries.map(([input, commands]) => (
          <tr key={`click:${input}`}>
            <td className={styles.tdKey}>{input}</td>
            <td className={styles.tdCommand}>{commands.join(', ')}</td>
            <td className={styles.tdOwner}>pattern</td>
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

function TabBar({ active, onChange }: { active: DetailTab; onChange: (tab: DetailTab) => void }) {
  return (
    <div className={`${ax({ layout: 'row', gap: 'sm', padding: 'sm', surface: 'overlay' })} ${styles.tabBar}`}>
      <button
        className={`${ax({ textStyle: 'caption', padding: 'xs', text: active === 'interaction' ? 'bright' : 'muted' })} ${styles.tab} ${active === 'interaction' ? styles.tabActive : ''}`}
        onClick={() => onChange('interaction')}
      >
        Interaction
      </button>
      <button
        className={`${ax({ textStyle: 'caption', padding: 'xs', text: active === 'state' ? 'bright' : 'muted' })} ${styles.tab} ${active === 'state' ? styles.tabActive : ''}`}
        onClick={() => onChange('state')}
      >
        State
      </button>
    </div>
  )
}

export function InspectorWindow() {
  const [actionsMap, setActionsMap] = useState<Map<string, AriaActions>>(new Map())
  const [selectedId, setSelectedId] = useState('')
  const [sizes, setSizes] = useState<PaneSize[]>([0.3, 'flex'])
  const [activeTab, setActiveTab] = useState<DetailTab>('interaction')
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
    // Highlight selected node's element in the main window
    const instId = findInstanceId(nodeId)
    const instMeta = metas.get(instId)
    if (instMeta) {
      const actions = actionsMap.get(instMeta.registryKey)
      const container = actions?.getElement() ?? null
      let element: HTMLElement | null = null

      // If selecting a child node (not the instance root), find its DOM element
      const sep = nodeId.indexOf('::')
      if (sep !== -1 && container) {
        const childNodeId = nodeId.slice(sep + 2)
        element = container.querySelector<HTMLElement>(`[data-node-id="${childNodeId}"]`)
      }
      // Fallback to instance container
      if (!element) element = container

      const mainWindow = window.opener ?? window
      mainWindow.dispatchEvent(
        new CustomEvent('inspector:highlight-element', { detail: { element } }),
      )
    }
  }, [metas, actionsMap])

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
              <div className={ax({ layout: 'column' })}>
                <TabBar active={activeTab} onChange={setActiveTab} />

                {activeTab === 'interaction' && (
                  <div className={ax({ layout: 'column', gap: 'md', padding: 'sm' })}>
                    <div className={ax({ layout: 'spread', textStyle: 'caption', text: 'bright' })}>
                      <span>Bindings ({Object.keys(inspectResult.keyMap).length + Object.keys(inspectResult.clickMap ?? {}).length})</span>
                      <CopyButton inspectResult={inspectResult} />
                    </div>
                    <BoundKeyTable inspectResult={inspectResult} />
                  </div>
                )}

                {activeTab === 'state' && (
                  <div className={ax({ layout: 'column', gap: 'md', padding: 'sm' })}>
                    <div className={ax({ textStyle: 'caption', text: 'bright' })}>
                      State ({Object.keys(inspectResult.state.entities).length} entities)
                    </div>
                    <AppInspector inspectResult={inspectResult} />
                  </div>
                )}
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
