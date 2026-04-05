import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { Toaster as ToasterInstance, ToastData } from './createToaster'
import { CloseIndicator } from './indicators'
import { ax } from '@styles/ax'
import type { Axes } from '@styles/ax'
import '@styles/ax.css'
import './Toaster.css'

const variantTone: Record<string, Axes> = {
  default: { surface: 'overlay' },
  success: { surface: 'overlay', tone: 'success' },
  error: { surface: 'overlay', tone: 'danger' },
}

interface ToasterProps {
  toaster: ToasterInstance
}

export function Toaster({ toaster }: ToasterProps): ReactNode {
  const toasts = useSyncExternalStore(
    toaster.subscribe,
    toaster.getToasts,
    toaster.getToasts,
  )

  return (
    <div aria-live="polite" aria-atomic="false" className={`pointer-none ${ax({ layout: 'column', gap: 'sm' })}`}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={toaster.dismiss} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData
  onDismiss: (id: string) => void
}): ReactNode {
  const variant = toast.variant ?? 'default'
  const axes = variantTone[variant] ?? variantTone.default
  return (
    <div className={`toast-item pointer-auto ${ax({ ...axes, layout: 'row', gap: 'sm', padding: 'sm', shape: 'xl', motion: 'slide-up' })}`} data-variant={variant}>
      <div className={ax({ flex: '1', layout: 'self-start' })}>
        <div className={ax({ textStyle: 'body', weight: 'medium' })}>{toast.title}</div>
        {toast.description && (
          <div className={ax({ textStyle: 'body', text: 'secondary' })}>{toast.description}</div>
        )}
      </div>
      <button
        className={`${ax({ surface: 'ghost', layout: 'center', controlSize: 'sm', flex: 'none' })}`}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        <CloseIndicator />
      </button>
    </div>
  )
}
