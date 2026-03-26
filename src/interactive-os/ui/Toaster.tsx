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
    <div aria-live="polite" aria-atomic="false" className={`flex-col-reverse ${styles.container}`}>
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
    <div className={`flex-row items-start gap-sm ${styles.toast}`} data-variant={toast.variant ?? 'default'}>
      <div className="flex-1 min-w-0">
        <div className={styles.title}>{toast.title}</div>
        {toast.description && (
          <div className={styles.description}>{toast.description}</div>
        )}
      </div>
      <button
        className={`flex-row items-center justify-center shrink-0 ${styles.dismiss}`}
        data-surface="action"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
