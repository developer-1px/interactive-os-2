import React from 'react'
import { ExpandIndicator } from './indicators'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import type { Plugin } from '../plugins/types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { tree } from '../pattern/roles/tree'
import { activateHandler } from '../axis/activate'
import { selectionFollowsFocusMiddleware } from '../axis/select'
import { typeahead } from '../plugins/typeahead'
import { ax } from '@styles/ax'
import '@styles/ax.css'

const defaultTypeahead = typeahead({ getLabel: (e) => getNodeLabel(e as Record<string, unknown>) })
const emptyPlugins: Plugin[] = []
const sfFollowsFocus = selectionFollowsFocusMiddleware()

interface TreeViewProps extends AriaComponentProps {
  selectionFollowsFocus?: boolean
  selectable?: boolean
  activateOnClick?: boolean
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(node)
  const hasChildren = state.expanded !== undefined
  const depth = (state.level ?? 1) - 1
  return (
    <div {...props} className={ax({ surface: 'ghost', controlSize: 'sm', padding: 'sm', content: 'text', layout: 'bar', gap: 'xs' })} style={{ paddingLeft: `calc(${depth} * var(--space-md) + var(--space-sm))` }}>
      <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} variant="tree" />
      <span className={ax({ text: state.focused ? 'primary' : 'secondary' })}>{label}</span>
    </div>
  )
}

export function TreeView({
  data,
  plugins = emptyPlugins,
  onChange,
  onActivate,
  onFocusChange,
  renderItem = defaultRenderItem,
  selectionFollowsFocus,
  selectable = false,
  activateOnClick = false,
  'aria-label': ariaLabel,
}: TreeViewProps) {
  const pattern = React.useMemo(() => {
    let p = tree
    if (!selectable) {
      const { Space: _space, ...restKeys } = p.keyMap
      const clickMap = activateOnClick
        ? { Click: activateHandler }
        : undefined
      p = { ...p, keyMap: restKeys, selectionMode: undefined, clickMap }
    }
    if (selectionFollowsFocus) {
      p = { ...p, selectionFollowsFocus: true, activationFollowsSelection: true, middleware: sfFollowsFocus }
    }
    return p
  }, [selectable, activateOnClick, selectionFollowsFocus])

  const mergedPlugins = React.useMemo(
    () => [defaultTypeahead, ...plugins],
    [plugins],
  )

  return (
    <Aria
      pattern={pattern}
      data={data}
      plugins={mergedPlugins}
      onChange={onChange}
      onActivate={onActivate}
      onFocusChange={onFocusChange}
      aria-label={ariaLabel}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
