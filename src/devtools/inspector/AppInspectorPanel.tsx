import { useEffect, useState, useCallback } from 'react'
import type { InspectResult } from '@os/engine/types'
import { getAllAriaActions } from '@os/primitives/ariaRegistry'
import { AppInspector } from './AppInspector'

const PANEL_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 48,
  right: 8,
  bottom: 8,
  width: 360,
  background: 'var(--surface-default)',
  border: '1px solid var(--border-default)',
  borderRadius: 8,
  zIndex: 99999,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
}

const HEADER_STYLE: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--border-default)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontFamily: 'var(--mono)',
  fontSize: 'var(--type-caption-size)',
}

const BODY_STYLE: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
}

export function AppInspectorPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [engines, setEngines] = useState<Map<string, { inspect: () => InspectResult }>>(new Map())
  const [selectedId, setSelectedId] = useState('')

  // Shift+Cmd+I toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'e') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Poll registry when open
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

  const handleClose = useCallback(() => setIsOpen(false), [])

  if (!isOpen) return null

  const selected = engines.get(selectedId)
  const inspectResult = selected?.inspect()
  const ids = [...engines.keys()]

  return (
    <div style={PANEL_STYLE}>
      <div style={HEADER_STYLE}>
        <span style={{ fontWeight: 600 }}>App Inspector</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {ids.length > 1 && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 'var(--type-caption-size)',
                background: 'var(--surface-sunken)',
                border: '1px solid var(--border-default)',
                borderRadius: 4,
                padding: '2px 4px',
                color: 'inherit',
              }}
            >
              {ids.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          )}
          {ids.length === 1 && (
            <span style={{ opacity: 0.6 }}>{selectedId}</span>
          )}
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '2px 6px',
              fontSize: 14,
              opacity: 0.6,
            }}
            aria-label="Close inspector"
          >
            ×
          </button>
        </div>
      </div>
      <div style={BODY_STYLE}>
        {inspectResult ? (
          <AppInspector inspectResult={inspectResult} />
        ) : (
          <div style={{ padding: 16, opacity: 0.5, fontFamily: 'var(--mono)', fontSize: 'var(--type-caption-size)' }}>
            {ids.length === 0
              ? '등록된 Aria 인스턴스 없음'
              : '선택된 인스턴스 없음'}
          </div>
        )}
      </div>
    </div>
  )
}
