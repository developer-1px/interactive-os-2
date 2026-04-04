import React from 'react'
import type { ReactNode } from 'react'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { menubar } from '../pattern/roles/menubar'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import styles from './Menubar.module.css'
import { ExpandIndicator, DirectionIndicator } from './indicators'

type MenubarRenderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  item: Record<string, unknown>,
  state: NodeState,
  children?: ReactNode,
) => React.ReactElement

interface MenubarProps extends Omit<AriaComponentProps, 'renderItem'> {
  renderItem?: MenubarRenderItem
}

const defaultRenderItem: MenubarRenderItem = (props, item, state, children) => {
  const label = getNodeLabel(item)
  const isRoot = state.level === 1
  const hasChildren = state.expanded !== undefined

  if (children) {
    return (
      <li role="none" className={"relative"}>
        <a
          {...props}
          href="#"
          className={`${ax({ surface: 'ghost', controlSize: 'md', padding: 'sm', content: 'text', gap: 'xs', clamp: '1', text: state.focused ? 'bright' : 'primary' })} ${styles.link}`}
          data-focused={state.focused || undefined}
          onClick={e => e.preventDefault()}
        >
          <span>{label}</span>
          <span className={ax({ layout: 'row', text: 'muted' })} aria-hidden="true">
            {isRoot ? <ExpandIndicator expanded={state.expanded} /> : <DirectionIndicator direction="next" />}
          </span>
        </a>
        <ul
          role="menu"
          aria-label={label}
          className={`absolute list-none ${ax({ surface: 'overlay', padding: 'xs', shape: 'sm' })} ${isRoot ? styles.submenuRoot : styles.submenuNested}`}
          data-hidden={!state.expanded || undefined}
        >
          {children}
        </ul>
      </li>
    )
  }

  return (
    <li role="none" className={"relative"}>
      <a
        {...props}
        href="#"
        className={`${ax({ surface: 'ghost', controlSize: 'md', padding: 'sm', content: 'text', gap: 'xs', clamp: '1', text: state.focused ? 'bright' : 'primary' })} ${styles.link}`}
        data-focused={state.focused || undefined}
        onClick={e => e.preventDefault()}
      >
        <span>{label}</span>
        {hasChildren && (
          <span className={ax({ layout: 'row', text: 'muted' })} aria-hidden="true">
            {isRoot ? <ExpandIndicator expanded={state.expanded} /> : <DirectionIndicator direction="next" />}
          </span>
        )}
      </a>
    </li>
  )
}

export function Menubar({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  onActivate,
  'aria-label': ariaLabel,
}: MenubarProps) {
  return (
    <Aria
      pattern={menubar}
      data={data}
      plugins={plugins}
      onChange={onChange}
      onActivate={onActivate}
      aria-label={ariaLabel}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
