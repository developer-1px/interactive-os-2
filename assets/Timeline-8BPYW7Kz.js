var e=`/** @catalog 시간순 이벤트 목록 */
import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps, ItemSlots } from './types'
import { Aria } from '../primitives/aria'
import { listbox } from '../pattern/roles/listbox'
import { history } from '../plugins/history'
import { TimelineItem } from './items'
import './Timeline.css'

const timelinePattern = listbox()

type TimelineMode = 'left' | 'right' | 'alternate'

interface TimelineProps extends AriaComponentProps {
  mode?: TimelineMode
}

function makeRenderItem(_mode: TimelineMode, slots?: ItemSlots) {
  return (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement =>
    TimelineItem(props, item, state, {
      icon: slots?.icon?.(item, state),
    })
}

export function Timeline({
  data,
  plugins = [history()],
  onChange,
  renderItem,
  itemSlots,
  mode = 'left',
  onActivate,
  onFocusChange,
  className: _className,
  'aria-label': ariaLabel,
}: TimelineProps) {
  const defaultRenderer = React.useMemo(() => makeRenderItem(mode, itemSlots), [mode, itemSlots])
  const resolvedRenderItem = renderItem ?? defaultRenderer

  return (
    <Aria
      pattern={timelinePattern}
      data={data}
      plugins={plugins}
      onChange={onChange}
      onActivate={onActivate}
      onFocusChange={onFocusChange}
      aria-label={ariaLabel}
    >
      <Aria.Item render={resolvedRenderItem} />
    </Aria>
  )
}
`;export{e as default};