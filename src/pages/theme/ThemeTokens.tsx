import { type Axes, ax } from '@styles/ax'
import '@styles/ax.css'
import styles from './PageThemeCreator.module.css'

/* ══ Data ══ */

const stoneSteps = [0, 50, 100, 200, 300, 400, 500, 600, 700, 750, 800, 850, 875, 900, 950] as const
const surfaces = ['action', 'input', 'display', 'overlay', 'ghost', 'sunken', 'base'] as const
const tones = ['accent', 'danger', 'success', 'warning', 'neutral'] as const
const textColors = ['bright', 'primary', 'secondary', 'muted'] as const
const shadows = ['xs', 'sm', 'md', 'lg'] as const
const shapes = ['none', 'sm', 'md', 'lg', 'xl', 'pill'] as const
const spacingScale = [
  { name: 'xs', px: '4px' }, { name: 'sm', px: '8px' }, { name: 'md', px: '16px' },
  { name: 'lg', px: '24px' }, { name: 'xl', px: '32px' },
] as const
const textStyles = [
  { name: 'hero', desc: '40 · Serif · 330' },
  { name: 'display', desc: '32 · Serif · 400' },
  { name: 'page', desc: '24 · Serif · 500' },
  { name: 'section', desc: '16 · Sans · 600' },
  { name: 'label', desc: '16 · Sans · 430' },
  { name: 'body', desc: '14 · Sans · 430' },
  { name: 'caption', desc: '12 · Sans · 400' },
  { name: 'code', desc: '12 · Mono · 400' },
] as const
const layouts = ['row', 'column', 'center', 'bar', 'spread', 'stack', 'scroll'] as const

/* ══ Section Card ══ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={ax({ surface: 'display', layout: 'column', gap: 'sm', padding: 'md', shape: 'lg' })}>
      <h3 className={ax({ textStyle: 'overline', text: 'muted' })}>{title}</h3>
      {children}
    </div>
  )
}

/* ══ Tokens Tab ══ */

export function ThemeTokens() {
  return (
    <div className={ax({ layout: 'column', gap: 'xl' })}>
      {/* Palette full strip */}
      <Section title="STONE PALETTE">
        <div className={styles.paletteStrip}>
          {stoneSteps.map(step => (
            <div key={step} className={ax({ layout: 'column', gap: 'xs', flex: '1' })}>
              <div className={`${ax({ shape: 'sm' })} ${styles.paletteSwatch}`} data-stone={step} />
              <span className={ax({ textStyle: 'code', text: 'muted' })}>{step}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 2-column grid: color tokens + visual tokens */}
      <div className={styles.composedGrid}>
        <div className={ax({ layout: 'column', gap: 'md' })}>
          <Section title="SURFACE">
            <div className={styles.grid7}>
              {surfaces.map(s => (
                <div key={s} className={ax({ layout: 'column', gap: 'xs' })}>
                  <div className={`${ax({ shape: 'md' })} ${styles.swatch}`} data-surface={s} />
                  <span className={ax({ textStyle: 'code' })}>{s}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="TONE">
            <div className={styles.grid5}>
              {tones.map(t => (
                <div key={t} className={ax({ layout: 'column', gap: 'xs' })}>
                  <div className={`${ax({ shape: 'md' })} ${styles.toneSwatch}`} data-tone={t} />
                  <span className={ax({ textStyle: 'code' })}>{t}</span>
                </div>
              ))}
            </div>
            <div className={styles.grid5}>
              {tones.map(t => (
                <div key={t} className={ax({ layout: 'column', gap: 'xs' })}>
                  <div className={`${ax({ shape: 'md' })} ${styles.toneDimSwatch}`} data-tone={t} />
                  <span className={ax({ textStyle: 'code', text: 'muted' })}>{t}-dim</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="TEXT COLOR">
            <div className={styles.grid4}>
              {textColors.map(c => (
                <div key={c} className={ax({ layout: 'column', gap: 'xs' })}>
                  <span className={ax({ textStyle: 'page', text: c })}>Ag</span>
                  <span className={ax({ textStyle: 'code' })}>{c}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className={ax({ layout: 'column', gap: 'md' })}>
          <Section title="TYPOGRAPHY SCALE">
            <div className={ax({ layout: 'column' })}>
              {textStyles.map(t => (
                <div key={t.name} className={`${ax({ layout: 'spread', padding: 'sm' })} ${styles.typeRow}`}>
                  <span className={ax({ textStyle: t.name as Axes['textStyle'], text: 'primary' })}>{t.name}</span>
                  <span className={ax({ textStyle: 'code', text: 'muted' })}>{t.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="SPACING">
            <div className={ax({ layout: 'column', gap: 'xs' })}>
              {spacingScale.map(s => (
                <div key={s.name} className={ax({ layout: 'bar', gap: 'sm' })}>
                  <span className={`${ax({ textStyle: 'code', text: 'muted' })} ${styles.spacingLabel}`}>{s.px}</span>
                  <div className={`${ax({ shape: 'sm' })} ${styles.spacingBar}`} data-size={s.name} />
                  <span className={ax({ textStyle: 'code', text: 'secondary' })}>{s.name}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="SHADOW">
            <div className={ax({ layout: 'row', gap: 'sm' })}>
              {shadows.map(s => (
                <div key={s} className={ax({ layout: 'column', gap: 'xs', flex: '1' })}>
                  <div className={`${ax({ shape: 'md', padding: 'lg', layout: 'center' })} ${styles.shadowSwatch}`} data-shadow={s} />
                  <span className={ax({ textStyle: 'code', text: 'muted' })}>{s}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="SHAPE">
            <div className={ax({ layout: 'row', gap: 'sm' })}>
              {shapes.map(s => (
                <div key={s} className={ax({ layout: 'column', gap: 'xs' })}>
                  <div className={`${ax({ shape: s as Axes['shape'] })} ${styles.shapeSwatch}`} />
                  <span className={ax({ textStyle: 'code', text: 'muted' })}>{s}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="BORDER">
            <div className={ax({ layout: 'row', gap: 'sm' })}>
              {(['subtle', 'default', 'strong'] as const).map(b => (
                <div key={b} className={ax({ layout: 'column', gap: 'xs', flex: '1' })}>
                  <div className={`${ax({ shape: 'md', padding: 'lg' })} ${styles.borderSwatch}`} data-border={b} />
                  <span className={ax({ textStyle: 'code', text: 'muted' })}>{b}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="LAYOUT">
            <div className={styles.grid4}>
              {layouts.map(l => (
                <div key={l} className={ax({ layout: 'column', gap: 'xs' })}>
                  <div className={`${ax({ layout: l as Axes['layout'], gap: 'xs', padding: 'sm', shape: 'md' })} ${styles.layoutBox}`}>
                    <div className={`${ax({ shape: 'sm' })} ${styles.layoutChild}`} />
                    <div className={`${ax({ shape: 'sm' })} ${styles.layoutChild}`} />
                    <div className={`${ax({ shape: 'sm' })} ${styles.layoutChild}`} />
                  </div>
                  <span className={ax({ textStyle: 'code' })}>{l}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
