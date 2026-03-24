import { useState, useCallback } from 'react'
import styles from './PageThemeCreator.module.css'
import type { NormalizedData } from '../interactive-os/core/types'
import { components } from './showcaseRegistry'

/* ── Token definitions ── */

interface TokenControl {
  variable: string
  label: string
  defaultValue: string
  type: 'color' | 'text'
}

const surfaceTokens: TokenControl[] = [
  { variable: '--surface-base', label: 'base', defaultValue: '#09090B', type: 'color' },
  { variable: '--surface-sunken', label: 'sunken', defaultValue: '#18181B', type: 'color' },
  { variable: '--surface-default', label: 'default', defaultValue: '#1F1F23', type: 'color' },
  { variable: '--surface-raised', label: 'raised', defaultValue: '#27272A', type: 'color' },
  { variable: '--surface-overlay', label: 'overlay', defaultValue: '#3F3F46', type: 'color' },
]

const semanticTokens: TokenControl[] = [
  { variable: '--primary', label: 'primary', defaultValue: '#5B5BD6', type: 'color' },
  { variable: '--focus', label: 'focus', defaultValue: '#5B5BD6', type: 'color' },
  { variable: '--selection', label: 'selection', defaultValue: '#1A3A2A', type: 'color' },
  { variable: '--destructive', label: 'destructive', defaultValue: '#E5484D', type: 'color' },
]

const layoutTokens: TokenControl[] = [
  { variable: '--radius', label: 'radius', defaultValue: '6px', type: 'text' },
]

const allTokens = [...surfaceTokens, ...semanticTokens, ...layoutTokens]

function getComputedToken(variable: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
}

/* ── MiniDemo from showcaseRegistry ── */

const FEATURED_SLUGS = [
  'listbox', 'tree-grid', 'tab-list', 'combobox', 'grid', 'kanban',
  'accordion', 'dialog', 'slider', 'radio-group', 'toolbar', 'tree-view',
]

const featured = FEATURED_SLUGS
  .map((slug) => components.find((c) => c.slug === slug)!)
  .filter(Boolean)

function MiniDemo({ entry }: { entry: typeof components[number] }) {
  const [data, setData] = useState(() => entry.makeData())
  const onChange = useCallback((next: NormalizedData) => setData(next), [])
  return (
    <div className={styles.card} data-surface="raised">
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{entry.name}</span>
        {entry.testPath && <span className={styles.cardBadge}>tested</span>}
      </div>
      <div className={styles.cardBody}>
        {entry.render(data, onChange)}
      </div>
    </div>
  )
}

/* ── Main ── */

export default function PageThemeCreator() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const token of allTokens) {
      const computed = getComputedToken(token.variable)
      initial[token.variable] = computed || token.defaultValue
    }
    return initial
  })

  const handleChange = useCallback((variable: string, value: string) => {
    document.documentElement.style.setProperty(variable, value)
    setValues(prev => ({ ...prev, [variable]: value }))
  }, [])

  const handleReset = useCallback(() => {
    for (const token of allTokens) {
      document.documentElement.style.removeProperty(token.variable)
    }
    const fresh: Record<string, string> = {}
    for (const token of allTokens) {
      const computed = getComputedToken(token.variable)
      fresh[token.variable] = computed || token.defaultValue
    }
    setValues(fresh)
  }, [])

  const renderTokenRow = (token: TokenControl) => (
    <div key={token.variable} className={styles.row}>
      {token.type === 'color' ? (
        <>
          <input
            type="color"
            className={styles.swatch}
            value={values[token.variable]}
            onChange={e => handleChange(token.variable, e.target.value)}
          />
          <span className={styles.label}>{token.label}</span>
          <input
            type="text"
            className={styles.hex}
            value={values[token.variable]}
            onChange={e => handleChange(token.variable, e.target.value)}
          />
        </>
      ) : (
        <>
          <span className={styles.label}>{token.label}</span>
          <input
            type="text"
            className={styles.radiusInput}
            value={values[token.variable]}
            onChange={e => handleChange(token.variable, e.target.value)}
          />
        </>
      )}
    </div>
  )

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <h3 className={styles.heading}>Surface</h3>
        {surfaceTokens.map(renderTokenRow)}

        <h3 className={styles.heading}>Color</h3>
        {semanticTokens.map(renderTokenRow)}

        <h3 className={styles.heading}>Layout</h3>
        {layoutTokens.map(renderTokenRow)}

        <button className={styles.reset} onClick={handleReset}>Reset</button>
      </div>

      <div className={styles.preview}>
        <div className={styles.grid}>
          {featured.map((entry) => (
            <MiniDemo key={entry.slug} entry={entry} />
          ))}
        </div>
      </div>
    </div>
  )
}
