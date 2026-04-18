var e=`/** @catalog 혼합(indeterminate) 상태를 지원하는 체크박스 */
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { checkboxMixed } from '../pattern/roles/checkboxMixed'
import { CheckItem } from './items'

type CheckboxMixedProps = AriaComponentProps

export function CheckboxMixed({
  data,
  plugins = [],
  onChange,
  renderItem = CheckItem,
  'aria-label': ariaLabel,
}: CheckboxMixedProps) {
  return (
    <Aria pattern={checkboxMixed} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
`;export{e as default};