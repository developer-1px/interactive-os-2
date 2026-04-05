import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { EXPANDED_ID } from '../../axis/expand'
import { Menubar } from '../../ui/Menubar'
import { ax } from '../../../styles/ax'
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

export function MenubarNavigation() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <div className={ax({ shape: 'sm', border: 'default' })}>
      <header className={`${styles.header} text-center`}>
        <div className={`${styles.title} ${ax({ text: 'bright' })}`}>Mythical University</div>
        <div className={`${ax({ text: 'secondary', textStyle: 'body' })} ${styles.tagline}`}>Using a Menubar for navigation links</div>
      </header>
      <nav className={styles.wrapper}>
        <Menubar
          data={store}
          onChange={onChange}
          aria-label="Mythical University"
        />
      </nav>
    </div>
  )
}
