import { useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { EXPANDED_ID } from '../../axis/expand'
import { menubar } from '../../pattern/roles/menubar'
import { ChevronDown, ChevronRight } from 'lucide-react'
import styles from './menubar.module.css'

// APG #40: Navigation Menubar
// https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-navigation/

const data: NormalizedData = createStore({
  entities: {
    home: { id: 'home', data: { label: 'Home' } },

    about: { id: 'about', data: { label: 'About' } },
    overview: { id: 'overview', data: { label: 'Overview' } },
    admin: { id: 'admin', data: { label: 'Administration' } },
    facts: { id: 'facts', data: { label: 'Facts' } },
    history: { id: 'history', data: { label: 'History' } },
    stats: { id: 'stats', data: { label: 'Current Statistics' } },
    tours: { id: 'tours', data: { label: 'Campus Tours' } },

    admissions: { id: 'admissions', data: { label: 'Admissions' } },
    apply: { id: 'apply', data: { label: 'Apply' } },
    tuition: { id: 'tuition', data: { label: 'Tuition' } },
    signing: { id: 'signing', data: { label: 'Signing Day' } },
    visit: { id: 'visit', data: { label: 'Visit' } },

    academics: { id: 'academics', data: { label: 'Academics' } },
    courses: { id: 'courses', data: { label: 'Courses' } },
    honors: { id: 'honors', data: { label: 'Honors Program' } },
    calendar: { id: 'calendar', data: { label: 'Calendar' } },

    [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: [] },
  },
  relationships: {
    [ROOT_ID]: ['home', 'about', 'admissions', 'academics'],
    about: ['overview', 'admin', 'facts', 'tours'],
    facts: ['history', 'stats'],
    admissions: ['apply', 'tuition', 'signing', 'visit'],
    academics: ['courses', 'honors', 'calendar'],
  },
})

const renderItem = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  children?: ReactNode,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
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

export function MenubarNavigation() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <div className={styles.demo}>
      <header className={styles.header}>
        <div className={styles.title}>Mythical University</div>
        <div className={styles.tagline}>Using a Menubar for navigation links</div>
      </header>
      <nav className={styles.wrapper}>
        <Aria
          pattern={menubar}
          data={store}
          plugins={[]}
          onChange={onChange}
          aria-label="Mythical University"
        >
          <Aria.Item render={renderItem} />
        </Aria>
      </nav>
    </div>
  )
}
