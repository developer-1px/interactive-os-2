/** @catalog 라디오 버튼 그룹 */
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { radiogroup } from '../pattern/roles/radiogroup'
import { RadioItem } from './items'

type RadioGroupProps = AriaComponentProps

export function RadioGroup({
  data,
  plugins = [],
  onChange,
  renderItem = RadioItem,
  'aria-label': ariaLabel,
}: RadioGroupProps) {
  return (
    <Aria pattern={radiogroup} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
