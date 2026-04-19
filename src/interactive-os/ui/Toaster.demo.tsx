/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { Toaster } from './Toaster'
import { createToaster } from './createToaster'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'toaster',
  category: 'ui',
  label: 'Toaster',
}

const demoToaster = createToaster({ duration: 3000, maxToasts: 3 })
let toastCount = 0
const variants: Array<'default' | 'success' | 'error'> = ['default', 'success', 'error']

export function Demo() {
  return (
    <div className={ax({ layout: 'row' })}>
      <button
        className={ax({ role: 'control', surface: 'action', content: 'text', clamp: '1' })}
        onClick={() => {
          const variant = variants[toastCount % 3]
          toastCount++
          demoToaster.toast({
            title: `Toast #${toastCount}`,
            description: variant === 'error' ? 'Something went wrong' : variant === 'success' ? 'Operation complete' : 'Notification',
            variant,
          })
        }}
      >
        Add Toast
      </button>
      <Toaster toaster={demoToaster} />
    </div>
  )
}
