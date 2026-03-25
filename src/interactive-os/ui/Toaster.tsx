import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Toaster as ToasterInstance, ToastData } from './createToaster'
import styles from './Toaster.module.css'

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
    <div aria-live="polite" aria-atomic="false" className={styles.container}>
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
  return (
    <div className={styles.toast} data-variant={toast.variant ?? 'default'}>
      <div className={styles.content}>
        <div className={styles.title}>{toast.title}</div>
        {toast.description && (
          <div className={styles.description}>{toast.description}</div>
        )}
      </div>
      <button
        className={styles.dismiss}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
