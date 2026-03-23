import { useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { components } from './showcaseRegistry'
import type { NormalizedData } from '../interactive-os/core/types'
import styles from './PageLanding.module.css'

function MiniDemo({ entry }: { entry: typeof components[number] }) {
  const [data, setData] = useState(() => entry.makeData())
  const onChange = useCallback((next: NormalizedData) => setData(next), [])
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => navigate(`/ui/${entry.slug}`)}
    >
      <div className={styles.cardDemo}>
        <div className={styles.cardDemoInner} onClick={(e) => e.stopPropagation()}>
          {entry.render(data, onChange)}
        </div>
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.cardName}>{entry.name}</span>
        {entry.testPath && <span className={styles.cardBadge}>tested</span>}
      </div>
    </button>
  )
}

const FEATURED_SLUGS = [
  'listbox', 'tree-grid', 'tab-list', 'combobox', 'grid', 'kanban',
  'accordion', 'dialog', 'slider', 'radio-group', 'toolbar', 'tree-view',
]

const featured = FEATURED_SLUGS
  .map((slug) => components.find((c) => c.slug === slug)!)
  .filter(Boolean)

export default function PageLanding() {
  const navigate = useNavigate()

  return (
    <main className={styles.landing}>
      <section className={styles.hero}>
        <div className={styles.heroMark} />
        <h1 className={styles.heroTitle}>interactive-os</h1>
        <p className={styles.heroSub}>
          Keyboard-first UI primitives.<br />
          One data model. Every ARIA pattern. Zero render lock-in.
        </p>
        <div className={styles.heroCta}>
          <button onClick={() => navigate('/docs')} className={styles.btnPrimary}>
            Get Started
          </button>
          <button onClick={() => navigate('/ui')} className={styles.btnGhost}>
            Browse Components
          </button>
        </div>
        <div className={styles.heroStats}>
          <span><strong>23</strong> components</span>
          <span className={styles.dot} />
          <span><strong>680+</strong> tests</span>
          <span className={styles.dot} />
          <span><strong>16/19</strong> APG patterns</span>
        </div>
      </section>

      <section className={styles.grid}>
        {featured.map((entry) => (
          <MiniDemo key={entry.slug} entry={entry} />
        ))}
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerText}>
          Built with NormalizedData + Engine + Behavior
        </span>
      </footer>
    </main>
  )
}
