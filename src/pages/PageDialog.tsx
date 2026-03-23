import { useState } from 'react'
import buttonStyles from '../interactive-os/ui/Button.module.css'
import dialogStyles from '../interactive-os/ui/Dialog.module.css'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgDialog } from './apg-data'
import { Aria } from '../interactive-os/components/aria'
import { dialog } from '../interactive-os/behaviors/dialog'
import { core } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'

const dialogData = createStore({
  entities: {
    confirm: { id: 'confirm', data: { label: 'OK' } },
    cancel: { id: 'cancel', data: { label: 'Cancel' } },
  },
  relationships: {
    [ROOT_ID]: ['confirm', 'cancel'],
  },
})

const plugins = [core()]

export default function PageDialog() {
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
      <button className={buttonStyles.accent} onClick={() => setOpen(true)}>
        Open Dialog
      </button>
      {open && (
        <div className={dialogStyles.backdrop} onClick={() => setOpen(false)}>
          <div className={`card ${dialogStyles.box}`} onClick={(e) => e.stopPropagation()}>
            <div className={dialogStyles.header}>Confirm Action</div>
            <div className={dialogStyles.body}>
              Are you sure you want to proceed? This action cannot be undone.
            </div>
            <div className={dialogStyles.footer}>
              <Aria behavior={dialog} data={dialogData} plugins={plugins}>
                <Aria.Item render={(node, _state, props) => (
                  <button
                    {...props}
                    className={buttonStyles.dialog}
                    onClick={() => setOpen(false)}
                  >
                    {(node.data as Record<string, unknown>)?.label as string}
                  </button>
                )} />
              </Aria>
            </div>
          </div>
        </div>
      )}
      <ApgKeyboardTable {...apgDialog} />
    </div>
  )
}
