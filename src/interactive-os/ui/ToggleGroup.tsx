/** @catalog 토글 버튼 그룹 */
import type { AriaComponentProps } from './types'
import { ax } from '@styles/ax'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/roles/toolbar'
import { ToggleItem } from './items'

const toggleGroupPattern = toolbar({ toggle: true })

interface ToggleGroupProps extends AriaComponentProps {
  orientation?: 'horizontal' | 'vertical'
}

export function ToggleGroup({
  data,
  plugins = [],
  onChange,
  renderItem = ToggleItem,
  orientation: _orientation = 'horizontal',
}: ToggleGroupProps) {
  return (
    <div className={ax({ layout: 'row' })}>
      <Aria
        pattern={toggleGroupPattern}
        data={data}
        plugins={plugins}
        onChange={onChange}
      >
        <Aria.Item render={renderItem} />
      </Aria>
    </div>
  )
}
