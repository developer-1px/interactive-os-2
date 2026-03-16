import { useState } from 'react'
import { Aria } from '../interactive-os/components/aria'
import { dialog } from '../interactive-os/behaviors/dialog'
import { core } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/normalized-store'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

const dialogData = createStore({
  entities: {
    confirm: { id: 'confirm', label: 'OK' },
    cancel: { id: 'cancel', label: 'Cancel' },
  },
  relationships: {
    [ROOT_ID]: ['confirm', 'cancel'],
  },
})

export default function DialogPage() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Dialog</h2>
        <p className="page-desc">Modal dialog with focus trap and Escape to close</p>
      </div>
      <div className="page-keys">
        <kbd>Escape</kbd> <span className="key-hint">close</span>{' '}
        <kbd>Tab</kbd> <span className="key-hint">cycle focus</span>
      </div>
      <button
        className="demo-button"
        onClick={() => setOpen(true)}
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 12,
          padding: '8px 16px',
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          border: '1px solid var(--accent-mid)',
          borderRadius: 'var(--radius)',
          cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        Open Dialog
      </button>
      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }} onClick={() => setOpen(false)}>
          <div className="card" style={{ width: 320, padding: 0 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-mid)', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-bright)' }}>
              Confirm Action
            </div>
            <div style={{ padding: '16px', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Are you sure you want to proceed? This action cannot be undone.
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-mid)' }}>
              <Aria behavior={dialog} data={dialogData} plugins={[core()]}>
                <Aria.Node render={(node, state: NodeState) => (
                  <button
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 12,
                      padding: '6px 14px',
                      marginRight: 8,
                      background: state.focused ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      color: state.focused ? 'var(--accent)' : 'var(--text-secondary)',
                      border: `1px solid ${state.focused ? 'var(--accent-mid)' : 'var(--border-mid)'}`,
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                    onClick={() => setOpen(false)}
                  >
                    {node.label as string}
                  </button>
                )} />
              </Aria>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
