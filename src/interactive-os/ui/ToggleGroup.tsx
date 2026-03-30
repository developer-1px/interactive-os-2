import React from 'react'
import { CircleDot, Circle } from 'lucide-react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/roles/toolbar'
import styles from './ToggleGroup.module.css'

const toggleGroupPattern = toolbar({ toggle: true })

interface ToggleGroupProps extends AriaComponentProps {
  orientation?: 'horizontal' | 'vertical'
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return (
    <div {...props} className={styles.item} data-focused={state.focused || undefined} data-selected={state.selected || undefined}>
      <span className={styles.indicator} data-selected={state.selected || undefined}>{state.selected ? <CircleDot size={18} /> : <Circle size={18} />}</span>
      <span className={styles.label}>{label}</span>
    </div>
  )
}

export function ToggleGroup({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  orientation: _orientation = 'horizontal',
}: ToggleGroupProps) {
  return (
    <Aria
      pattern={toggleGroupPattern}
      data={data}
      plugins={plugins}
      onChange={onChange}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
