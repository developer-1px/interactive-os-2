import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Toaster as ToasterInstance, ToastData } from './createToaster'
import { ax } from '@styles/ax'
import type { Axes } from '@styles/ax'
import '@styles/ax.css'
import styles from './Toaster.module.css'

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
    <div aria-live="polite" aria-atomic="false" className={`${ax({ layout: 'column', gap: 'sm' })} ${styles.container}`}>
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
    <div className={`${ax({ ...axes, layout: 'row', gap: 'sm', padding: 'sm' })} ${styles.toast}`} data-variant={variant}>
      <div className={ax({ flex: '1' })}>
        <div className={ax({ textStyle: 'body', weight: 'medium' })}>{toast.title}</div>
        {toast.description && (
          <div className={`${ax({ textStyle: 'body', text: 'secondary' })} ${styles.description}`}>{toast.description}</div>
        )}
      </div>
      <button
        className={`${ax({ surface: 'ghost', layout: 'center', controlSize: 'sm' })} ${styles.dismiss}`}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
