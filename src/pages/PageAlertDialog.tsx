import { useState } from 'react'
import '../interactive-os/ui/Button.css'
import '../interactive-os/ui/Dialog.css'
import { ApgKeyboardTable } from './ApgKeyboardTable'
import { apgAlertDialog } from './apg-data'
import { Aria } from '../interactive-os/components/aria'
import { alertdialog } from '../interactive-os/behaviors/alertdialog'
import { core } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

const alertDialogData = createStore({
  entities: {
    confirm: { id: 'confirm', data: { label: 'Confirm' } },
    cancel: { id: 'cancel', data: { label: 'Cancel' } },
  },
  relationships: {
    [ROOT_ID]: ['confirm', 'cancel'],
  },
})

const plugins = [core()]

export default function PageAlertDialog() {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">AlertDialog</h2>
        <p className="page-desc">Modal alert dialog with aria-modal="true" and Escape to close</p>
      </div>
      <div className="page-keys">
        <kbd>Escape</kbd> <span className="key-hint">close</span>{' '}
        <kbd>Tab</kbd> <span className="key-hint">cycle focus</span>
      </div>
      <button className="btn-accent" onClick={() => setOpen(true)}>
        Open AlertDialog
      </button>
      {open && (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div
            className="card dialog-box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="alertdialog-title"
            aria-describedby="alertdialog-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div id="alertdialog-title" className="dialog-header">Delete Item</div>
            <div id="alertdialog-desc" className="dialog-body">
              This action is permanent and cannot be undone. Are you sure you want to delete this item?
            </div>
            <div className="dialog-footer">
              <Aria behavior={alertdialog} data={alertDialogData} plugins={plugins}>
                <Aria.Node render={(node, state: NodeState) => (
                  <button
                    className={`btn-dialog ${state.focused ? 'btn-dialog--focused' : ''}`}
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
      <ApgKeyboardTable {...apgAlertDialog} />
    </div>
  )
}
