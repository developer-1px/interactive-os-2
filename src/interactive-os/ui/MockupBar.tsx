/** @catalog 목업 플레이스홀더 바 — wireframe용 (ax 기반) */
import { ax } from '@styles/ax'
import type { AxWidth } from '@styles/ax'

interface MockupBarProps {
  width?: AxWidth
  shape?: 'bar' | 'dot'
}

/**
 * Mockup-only primitive. Solid placeholder using role:'item' + surface:'display'.
 * Width token sizes the horizontal extent; nbsp inside gives it text-line height.
 * Shape 'dot' renders a square (aspect:'1') for avatar/star placeholders.
 *
 * Use inside Phase 3 WireframeWidgets. role:'item' is intentional:
 * — it has both `width` and `surface` axes (placeholder role lacks surface strength in dark theme).
 */
export function MockupBar({ width = 'md', shape = 'bar' }: MockupBarProps) {
  if (shape === 'dot') {
    return (
      <span className={ax({ role: 'item', surface: 'display', content: 'text', textStyle: 'body' })}>
        {'\u00A0'}
      </span>
    )
  }
  return (
    <span className={ax({ role: 'item', surface: 'display', content: 'text', textStyle: 'body', width })}>
      {'\u00A0'}
    </span>
  )
}
