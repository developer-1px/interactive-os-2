/** @catalog 온/오프 스위치 그룹 */
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { switchPattern } from '../pattern/roles/switch'
import { SwitchItem } from './items'

type SwitchGroupProps = AriaComponentProps

export function SwitchGroup({
  data,
  plugins = [],
  onChange,
  renderItem = SwitchItem,
  'aria-label': ariaLabel,
}: SwitchGroupProps) {
  return (
    <Aria pattern={switchPattern} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
