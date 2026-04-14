import { useEffect, useRef, useState, useCallback } from 'react'
import type { AriaActions } from '@os/primitives/ariaRegistry'
import type { EngineEvent, DispatchEvent } from '@os/engine/types'
import type { StoreDiff } from '@os/store/computeStoreDiff'
import { ax } from '@styles/ax'

interface LogItem {
  seq: number
  timestamp: number
  instanceName: string
  commandType: string
  diff: StoreDiff[]
  error?: string
  payload?: unknown
}

const MAX_LOG_SIZE = 200

function formatDiffSummary(diff: StoreDiff[]): string {
  if (diff.length === 0) return '(no change)'
  const summary = diff
    .slice(0, 3)
    .map((d) => {
      if (d.kind === 'added') return `+${d.path}`
      if (d.kind === 'removed') return `-${d.path}`
      return `~${d.path}`
    })
    .join(' ')
  return diff.length > 3 ? `${summary} +${diff.length - 3} more` : summary
}

interface InspectorLogTabProps {
  actionsMap: Map<string, AriaActions>
}

export function InspectorLogTab({ actionsMap }: InspectorLogTabProps) {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [filter, setFilter] = useState('')
  const [instanceFilter, setInstanceFilter] = useState('')
  const [hideMeta, setHideMeta] = useState(false)
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set())
  const logRef = useRef<HTMLDivElement>(null)
  const subscribedRef = useRef(new Map<string, () => void>())

  const addLog = useCallback((instanceName: string, event: DispatchEvent) => {
    const item: LogItem = {
      seq: event.seq,
      timestamp: Date.now(),
      instanceName,
      commandType: event.command.type,
      diff: event.diff,
      error: event.error,
      payload: event.command.payload,
    }
    setLogs(prev => {
      const next = [...prev, item]
      return next.length > MAX_LOG_SIZE ? next.slice(next.length - MAX_LOG_SIZE) : next
    })
  }, [])

  // Subscribe to all instances
  useEffect(() => {
    const current = subscribedRef.current
    const activeKeys = new Set<string>()

    for (const [key, actions] of actionsMap) {
      activeKeys.add(key)
      if (!current.has(key)) {
        const unsub = actions.subscribe((event: EngineEvent) => {
          if (event.kind === 'dispatch') {
            addLog(key, event)
          }
        })
        current.set(key, unsub)
      }
    }

    // Unsubscribe removed instances
    for (const [key, unsub] of current) {
      if (!activeKeys.has(key)) {
        unsub()
        current.delete(key)
      }
    }

    return () => {
      for (const unsub of current.values()) unsub()
      current.clear()
    }
  }, [actionsMap, addLog])

  // Auto-scroll
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs])

  const toggleExpand = useCallback((seq: number) => {
    setExpandedSet(prev => {
      const next = new Set(prev)
      if (next.has(seq)) next.delete(seq)
      else next.add(seq)
      return next
    })
  }, [])

  const filteredLogs = logs.filter(log => {
    if (hideMeta && log.commandType.startsWith('core:')) return false
    if (filter && !log.commandType.toLowerCase().includes(filter.toLowerCase())) return false
    if (instanceFilter && !log.instanceName.toLowerCase().includes(instanceFilter.toLowerCase())) return false
    return true
  })

  const exportLogs = useCallback(() => {
    const data = filteredLogs.map(l => ({
      seq: l.seq,
      time: new Date(l.timestamp).toISOString(),
      instance: l.instanceName,
      command: l.commandType,
      payload: l.payload,
      diff: l.diff,
      error: l.error,
    }))
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
  }, [filteredLogs])

  return (
    <div className={ax({ layout: 'stack', flex: '1' })}>
      {/* Filter bar */}
      <div className={`${ax({ layout: 'row', gap: 'sm', padding: 'sm', surface: 'overlay' })} inspector-log-filter`}>
        <input
          className={`${ax({ textStyle: 'caption', padding: 'xs', border: 'default', shape: 'sm', flex: '1' })} inspector-log-input`}
          placeholder="command type..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <input
          className={`${ax({ textStyle: 'caption', padding: 'xs', border: 'default', shape: 'sm', flex: '1' })} inspector-log-input`}
          placeholder="instance..."
          value={instanceFilter}
          onChange={e => setInstanceFilter(e.target.value)}
        />
        <label className={ax({ textStyle: 'caption', text: 'muted', layout: 'row', gap: 'xs' })}>
          <input
            type="checkbox"
            checked={hideMeta}
            onChange={e => setHideMeta(e.target.checked)}
          />
          Hide meta
        </label>
        <button
          className={`border-none cursor-pointer ${ax({ textStyle: 'caption', padding: 'xs', text: 'muted' })}`}
          onClick={exportLogs}
        >
          Copy JSON
        </button>
        <button
          className={`border-none cursor-pointer ${ax({ textStyle: 'caption', padding: 'xs', text: 'muted' })}`}
          onClick={() => setLogs([])}
        >
          Clear
        </button>
      </div>

      {/* Log entries */}
      <div
        ref={logRef}
        className={`${ax({ textStyle: 'caption', flex: '1', scroll: 'y' })} inspector-log-scroll`}
      >
        {filteredLogs.length === 0 ? (
          <div className={ax({ padding: 'sm', text: 'muted' })}>No events captured yet.</div>
        ) : (
          filteredLogs.map(log => {
            const isExpanded = expandedSet.has(log.seq)
            return (
              <div key={`${log.instanceName}-${log.seq}`}>
                <div
                  className={`cursor-pointer ${ax({ padding: 'xs', clamp: '1', opacity: 'dim' })} inspector-log-entry ${log.error ? ax({ tone: 'danger' }) : ''}`}
                  onClick={() => toggleExpand(log.seq)}
                >
                  <span className={ax({ text: 'muted' })}>{new Date(log.timestamp).toLocaleTimeString('en', { hour12: false, fractionalSecondDigits: 3 })}</span>
                  {' '}
                  <span className={`${ax({ opacity: 'faint' })} inspector-log-seq`}>#{log.seq}</span>
                  {' '}
                  <span className={`${ax({ tone: 'success' })} inspector-log-instance`}>[{log.instanceName}]</span>
                  {' '}
                  <span className={ax({ text: 'bright' })}>{log.commandType}</span>
                  {' '}
                  <span className={ax({ text: 'muted' })}>| {formatDiffSummary(log.diff)}</span>
                </div>
                {isExpanded && (
                  <div className={`${ax({ textStyle: 'caption', text: 'muted', padding: 'sm', clamp: 'pre' })} inspector-log-detail`}>
                    <div>payload: {JSON.stringify(log.payload, null, 2)}</div>
                    {log.diff.length > 0 && (
                      <div>
                        diff:
                        {log.diff.map((d, i) => (
                          <div key={i} className="inspector-log-diff-line">
                            {d.kind === 'added' && `+ ${d.path}: ${JSON.stringify(d.after)}`}
                            {d.kind === 'removed' && `- ${d.path}: ${JSON.stringify(d.before)}`}
                            {d.kind === 'changed' && `~ ${d.path}: ${JSON.stringify(d.before)} -> ${JSON.stringify(d.after)}`}
                          </div>
                        ))}
                      </div>
                    )}
                    {log.error && <div className={`${ax({ tone: 'danger' })} inspector-log-error-text`}>Error: {log.error}</div>}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
