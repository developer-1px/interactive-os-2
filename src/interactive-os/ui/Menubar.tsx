import React from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { menubar } from '../pattern/roles/menubar'
import styles from './Menubar.module.css'

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
      <li role="none" className={styles.item}>
        <a
          {...props}
          href="#"
          className={styles.link}
          data-focused={state.focused || undefined}
          onClick={e => e.preventDefault()}
        >
          <span>{label}</span>
          <span className={styles.indicator} aria-hidden="true">
            {isRoot ? <ChevronDown size="1em" /> : <ChevronRight size="1em" />}
          </span>
        </a>
        <ul
          role="menu"
          aria-label={label}
          className={isRoot ? styles.submenuRoot : styles.submenuNested}
          style={{ display: state.expanded ? undefined : 'none' }}
        >
          {children}
        </ul>
      </li>
    )
  }

  return (
    <li role="none" className={styles.item}>
      <a
        {...props}
        href="#"
        className={styles.link}
        data-focused={state.focused || undefined}
        onClick={e => e.preventDefault()}
      >
        <span>{label}</span>
        {hasChildren && (
          <span className={styles.indicator} aria-hidden="true">
            {isRoot ? <ChevronDown size="1em" /> : <ChevronRight size="1em" />}
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
