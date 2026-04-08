/** @catalog 수평/수직 구분선 */
import { ax } from '@styles/ax'

export function Divider({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' }) {
  return direction === 'horizontal'
    ? <div className={ax({ border: 'bottom', width: 'full' })} role="separator" />
    : <div className={ax({ border: 'end' })} role="separator" style={{ alignSelf: 'stretch' }} />
}
