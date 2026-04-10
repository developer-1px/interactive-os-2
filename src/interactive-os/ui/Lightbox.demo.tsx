/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { LightboxProvider, useLightbox } from './Lightbox'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'lightbox',
  category: 'ui',
  label: 'Lightbox',
}

function Trigger() {
  const { open } = useLightbox()
  return (
    <button
      className={ax({ interactive: 'button', surface: 'ghost', padding: 'sm', shape: 'sm' })}
      onClick={() => open({ type: 'svg', html: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="oklch(0.7 0.15 250)"/></svg>', alt: 'Blue circle' })}
    >
      Open Lightbox
    </button>
  )
}

export function Demo() {
  return (
    <LightboxProvider>
      <Trigger />
    </LightboxProvider>
  )
}
