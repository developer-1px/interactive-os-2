var e=`/** @catalog 토글 버튼 — 도구/액션의 on/off 상태 (Bold, Bookmark 등) */
import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { switchPattern } from '../pattern/roles/switch'
import { ax } from '@styles/ax'

type ToggleProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const pressed = state.expanded ?? false
  return (
    <button
      type="button"
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      className={ax({
        role: 'control',
        interactive: 'check',
        surface: pressed ? 'action' : 'ghost',
        tone: pressed ? 'accent-dim' : undefined,
        content: 'text',
        text: pressed ? 'bright' : state.focused ? 'primary' : 'secondary',
        border: pressed ? undefined : 'default',
      })}
      data-focused={state.focused || undefined}
    >
      {label}
    </button>
  )
}

export function Toggle({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
}: ToggleProps) {
  return (
    <Aria pattern={switchPattern} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
`;export{e as default};