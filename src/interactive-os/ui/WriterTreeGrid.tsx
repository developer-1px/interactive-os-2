/** @catalog 글쓰기용 편집 가능 트리그리드 */
// ② pages/writer 소급 마이그레이션 — WriterItem을 bake-in한 TreeGrid
import React from 'react'
import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import type { EditKeyContext } from '../primitives/AriaEditable'
import { Aria } from '../primitives/aria'
import { treegrid } from '../pattern/roles/treegrid'
import { history } from '../plugins/history'
import { WriterItem } from './items'

interface WriterTreeGridProps extends AriaComponentProps {
  id?: string
  editKeyDown?: (e: React.KeyboardEvent, ctx: EditKeyContext) => void
}

export function WriterTreeGrid({
  id,
  data,
  plugins = [history()],
  onChange,
  editKeyDown,
  onActivate,
  'aria-label': ariaLabel,
}: WriterTreeGridProps) {
  const pattern = React.useMemo(() => treegrid(1), [])
  const options = React.useMemo(() => ({ editKeyDown }), [editKeyDown])
  const render = React.useCallback(
    (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState) =>
      WriterItem(props, node, state, options),
    [options],
  )

  return (
    <Aria
      id={id}
      pattern={pattern}
      data={data}
      plugins={plugins}
      onChange={onChange}
      onActivate={onActivate}
      aria-label={ariaLabel}
    >
      <Aria.Item render={render} />
    </Aria>
  )
}
