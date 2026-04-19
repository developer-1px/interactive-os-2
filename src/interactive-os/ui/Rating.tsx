/** @catalog 별점 평가 입력 */
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { radiogroup } from '../pattern/roles/radiogroup'
import { RatingItem } from './items/RatingItem'
import { ax } from '@styles/ax'
import './Rating.css'

type RatingProps = AriaComponentProps

export function Rating({
  data,
  plugins = [],
  onChange,
  renderItem = RatingItem,
  'aria-label': ariaLabel,
}: RatingProps) {
  return (
    <Aria pattern={radiogroup} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <div className={ax({ layout: 'row' })}>
        <Aria.Item render={renderItem} />
      </div>
    </Aria>
  )
}
