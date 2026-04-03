import { useEffect, useState } from 'react'
import type { InspectResult } from '@os/engine/types'
import { getAllAriaActions } from '@os/primitives/ariaRegistry'
import { AppInspector } from './AppInspector'
import { ax } from '@styles/ax'
import styles from './AppInspectorPanel.module.css'

interface AppInspectorPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AppInspectorPanel({ isOpen, onClose }: AppInspectorPanelProps) {
  const [engines, setEngines] = useState<Map<string, { inspect: () => InspectResult }>>(new Map())
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    if (!isOpen) return
    const update = () => {
      const all = getAllAriaActions()
      setEngines(new Map(all))
      setSelectedId((prev) => {
        if (prev && all.has(prev)) return prev
        return all.size > 0 ? all.keys().next().value! : ''
      })
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [isOpen])

  if (!isOpen) return null

  const selected = engines.get(selectedId)
  const inspectResult = selected?.inspect()
  const ids = [...engines.keys()]

  return (
    <div className={`${styles.panel} ${ax({ surface: 'overlay', layout: 'column', shape: 'md' })}`}>
      <div className={ax({ layout: 'spread', padding: 'sm', textStyle: 'caption' })}>
        <span className={ax({ text: 'bright' })}>App Inspector</span>
        <div className={ax({ layout: 'bar', gap: 'sm' })}>
          {ids.length > 1 && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={styles.select}
            >
              {ids.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          )}
          {ids.length === 1 && (
            <span className={ax({ text: 'muted' })}>{selectedId}</span>
          )}
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close inspector">
            ×
          </button>
        </div>
      </div>
      <div className={styles.body}>
        {inspectResult ? (
          <AppInspector inspectResult={inspectResult} />
        ) : (
          <div className={ax({ padding: 'md', text: 'muted', textStyle: 'caption' })}>
            {ids.length === 0
              ? '등록된 Aria 인스턴스 없음'
              : '선택된 인스턴스 없음'}
          </div>
        )}
      </div>
    </div>
  )
}
