import { useState, useCallback } from 'react'
import styles from './PageThemeCreator.module.css'

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

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <h3 className={styles.heading}>Surface</h3>
        {surfaceTokens.map(token => (
          <div key={token.variable} className={styles.row}>
            <span className={styles.label}>{token.label}</span>
            <input
              type="color"
              className={styles.swatch}
              value={values[token.variable]}
              onChange={e => handleChange(token.variable, e.target.value)}
            />
          </div>
        ))}

        <h3 className={styles.heading}>Semantic</h3>
        {semanticTokens.map(token => (
          <div key={token.variable} className={styles.row}>
            <span className={styles.label}>{token.label}</span>
            <input
              type="color"
              className={styles.swatch}
              value={values[token.variable]}
              onChange={e => handleChange(token.variable, e.target.value)}
            />
          </div>
        ))}

        <h3 className={styles.heading}>Layout</h3>
        {layoutTokens.map(token => (
          <div key={token.variable} className={styles.row}>
            <span className={styles.label}>{token.label}</span>
            <input
              type="text"
              className={styles.radiusInput}
              value={values[token.variable]}
              onChange={e => handleChange(token.variable, e.target.value)}
            />
          </div>
        ))}

        <button className={styles.reset} onClick={handleReset}>
          Reset All
        </button>
      </div>

      <div className={styles.preview}>
        <h2 className={styles.previewHeading}>Surface Levels</h2>
        <div className={styles.surfaceGrid}>
          <div className={styles.surfaceCard} data-surface="base">
            <span className={styles.surfaceLabel}>base</span>
          </div>
          <div className={styles.surfaceCard} data-surface="sunken">
            <span className={styles.surfaceLabel}>sunken</span>
          </div>
          <div className={styles.surfaceCard} data-surface="default">
            <span className={styles.surfaceLabel}>default</span>
          </div>
          <div className={styles.surfaceCard} data-surface="raised">
            <span className={styles.surfaceLabel}>raised</span>
          </div>
          <div className={styles.surfaceCard} data-surface="overlay">
            <span className={styles.surfaceLabel}>overlay</span>
          </div>
          <div className={styles.surfaceCard} data-surface="outlined">
            <span className={styles.surfaceLabel}>outlined</span>
          </div>
        </div>

        <h2 className={styles.previewHeading}>Semantic Colors</h2>
        <div className={styles.colorRow}>
          <div className={styles.colorSample} style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            primary
          </div>
          <div className={styles.colorSample} style={{ background: 'var(--selection)', color: 'var(--text-bright)' }}>
            selection
          </div>
          <div className={styles.colorSample} style={{ background: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>
            destructive
          </div>
        </div>

        <h2 className={styles.previewHeading}>Focus Ring</h2>
        <div>
          <button className={styles.focusDemo} tabIndex={0}>Tab here</button>
          <button className={styles.focusDemo} tabIndex={0}>And here</button>
          <button className={styles.focusDemo} tabIndex={0}>And here</button>
        </div>
      </div>
    </div>
  )
}
