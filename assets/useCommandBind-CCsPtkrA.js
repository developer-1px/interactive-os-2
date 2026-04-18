var e=`// ② 2026-04-08-useCommandBind-prd.md
import { useContext, useCallback, type MouseEvent } from 'react'
import { AriaInternalContext } from './AriaInternalContext'
import { AriaItemContext } from './AriaEditable'
import { expandCommands } from '../axis/expand'

type EventType = 'click'

const commandFactories = {
  'expand:toggle': (nodeId: string) => expandCommands.toggleExpand(nodeId),
} as const

const eventPropMap: Record<EventType, string> = {
  click: 'onClick',
}

/**
 * Bind a DOM event to a command declaratively.
 * Returns props to spread — the component never writes event handlers directly.
 *
 * Usage: \`<span {...useCommandBind('click', 'expand:toggle')} />\`
 */
export function useCommandBind(event: EventType, command: keyof typeof commandFactories): Record<string, unknown> {
  const aria = useContext(AriaInternalContext)
  const nodeCtx = useContext(AriaItemContext)

  const handler = useCallback((e: MouseEvent) => {
    if (!aria || !nodeCtx) return
    e.stopPropagation()
    aria.dispatch(commandFactories[command](nodeCtx.nodeId))
  }, [aria, nodeCtx, command])

  const propName = eventPropMap[event]
  if (!aria || !nodeCtx) return {}
  return { [propName]: handler }
}
`;export{e as default};