import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { switchBehavior } from '../behaviors/switch'
import { core } from '../plugins/core'
import styles from './Checkbox.module.css'

interface CheckboxProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

function CheckIcon() {
  return (
    <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
  const checked = state.expanded ?? false
  const cls = styles.item + (state.focused ? ' ' + styles.itemFocused : '')
  return (
    <div {...props} className={cls}>
      <span className={checked ? styles.boxChecked : styles.box}>
        {checked && <CheckIcon />}
      </span>
      <span>{label}</span>
    </div>
  )
}

export function Checkbox({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: CheckboxProps) {
  return (
    <Aria behavior={switchBehavior} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
