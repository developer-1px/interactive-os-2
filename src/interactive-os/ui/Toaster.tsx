/** @catalog 토스트 알림 컨테이너 */
import { useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import type { Toaster as ToasterInstance, ToastData } from './createToaster'
import { CloseIndicator } from './indicators'
import { ax } from '@styles/ax'
import type { AxTone } from '@styles/ax'

const variantToneMap: Record<string, AxTone | undefined> = {
  default: undefined,
  success: 'success',
  error: 'danger',
}

const variantBorder: Record<string, React.CSSProperties | undefined> = {
  default: undefined,
  success: { borderColor: 'var(--tone-success-base)' },
  error: { borderColor: 'var(--tone-destructive-base)' },
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
    <div aria-live="polite" aria-atomic="false" className={`pointer-none ${ax({ layout: 'stack' })}`}>
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
  const tone = variantToneMap[variant]
  return (
    <div
      className={`pointer-auto ${ax({ role: 'cell', surface: 'display', tone, layout: 'row' })}`}
      style={variantBorder[variant]}
    >
      <div className={ax({ flex: '1', layout: 'self-start' })}>
        <div className={ax({ textStyle: 'body',  })}>{toast.title}</div>
        {toast.description && (
          <div className={ax({ textStyle: 'body',  })}>{toast.description}</div>
        )}
      </div>
      <button
        className={`${ax({ role: 'control', surface: 'ghost', content: 'icon', flex: 'none' })}`}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        <CloseIndicator />
      </button>
    </div>
  )
}
