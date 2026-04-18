var e=`/** @catalog aria-activedescendant 방식 라디오 그룹 */
import type { AriaComponentProps } from './types'
import { Aria } from '../primitives/aria'
import { radiogroupActivedescendant } from '../pattern/roles/radiogroupActivedescendant'
import { RadioItem } from './items'

type RadioGroupActivedescendantProps = AriaComponentProps

export function RadioGroupActivedescendant({
  data,
  plugins = [],
  onChange,
  renderItem = RadioItem,
  'aria-label': ariaLabel,
}: RadioGroupActivedescendantProps) {
  return (
    <Aria pattern={radiogroupActivedescendant} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
`;export{e as default};