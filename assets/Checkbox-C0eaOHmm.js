var e=`/** @catalog 체크박스 */
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { checkbox } from '../pattern/roles/checkbox'
import { CheckItem } from './items'

type CheckboxProps = AriaComponentProps

export function Checkbox({
  data,
  plugins = [],
  onChange,
  renderItem = CheckItem,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  return (
    <Aria pattern={checkbox} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
`;export{e as default};