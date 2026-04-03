import { type Axes, ax } from '@styles/ax'
import '@styles/ax.css'
import styles from './PageThemeCreator.module.css'

/* ══ Data ══ */

const tones = ['accent', 'danger', 'success', 'warning', 'neutral'] as const
const textColors = ['bright', 'primary', 'secondary', 'muted'] as const
const surfaces = ['action', 'input', 'display', 'overlay', 'ghost'] as const
const spacingScale = [
  { name: 'xs', px: '4px' }, { name: 'sm', px: '8px' }, { name: 'md', px: '12px' },
  { name: 'lg', px: '16px' }, { name: 'xl', px: '24px' },
] as const
const controlSizes = [
  { name: 'sm', h: '32px', r: '6px' },
  { name: 'md', h: '36px', r: '8px' },
  { name: 'lg', h: '44px', r: '10px' },
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

/*
 * 위계 spacing 규칙:
 *   L0  Page root        → gap: xl (24)   타이틀↔그리드
 *   L1  Column 섹션간     → gap: xl (24)   섹션↔섹션
 *   L2  Section 내부      → gap: sm (8)    라벨↔본문 (근접)
 *   L3  Content 아이템간  → gap: xs (4)    형제 아이템
 *   L4  Item 내부         → gap: xs (4)    swatch↔label
 */

/* ══ Section Header ══ */

function SectionTitle({ children }: { children: string }) {
  return <h3 className={`${ax({ textStyle: 'caption', text: 'muted', weight: 'semi' })} ${styles.sectionLabel}`}>{children}</h3>
}

/* ══ Surface ══ */

function SurfaceSection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>SURFACE</SectionTitle>
      <div className={styles.grid5}>
        {surfaces.map(s => (
          <div key={s} className={ax({ layout: 'column', gap: 'xs' })}>
            <div className={styles.swatch} data-surface={s} />
            <span className={`${ax({ textStyle: 'caption' })} ${styles.mono}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══ Typography ══ */

function TypographySection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>TYPOGRAPHY SCALE</SectionTitle>
      <div className={ax({ layout: 'column' })}>
        {textStyles.map(t => (
          <div key={t.name} className={`${ax({ layout: 'spread' })} ${styles.typeRow}`}>
            <span className={ax({ textStyle: t.name as Axes['textStyle'], text: 'primary' })}>{t.name}</span>
            <span className={`${ax({ textStyle: 'caption', text: 'muted' })} ${styles.mono}`}>{t.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══ Text Color ══ */

function TextColorSection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>TEXT COLOR</SectionTitle>
      <div className={styles.grid4}>
        {textColors.map(c => (
          <div key={c} className={ax({ layout: 'column', gap: 'xs' })}>
            <span className={ax({ textStyle: 'page', text: c })}>Ag</span>
            <span className={`${ax({ textStyle: 'caption' })} ${styles.mono}`}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══ Spacing ══ */

function SpacingSection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>SPACING</SectionTitle>
      <div className={ax({ layout: 'column', gap: 'xs' })}>
        {spacingScale.map(s => (
          <div key={s.name} className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'caption', text: 'muted' })} ${styles.mono} ${styles.spacingLabel}`}>{s.px}</span>
            <div className={styles.spacingBar} data-size={s.name} />
            <span className={`${ax({ textStyle: 'caption', text: 'secondary' })} ${styles.mono}`}>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══ Control Size ══ */

function ControlSizeSection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>CONTROL SIZE</SectionTitle>
      <div className={ax({ layout: 'column', gap: 'xs' })}>
        {controlSizes.map(s => (
          <div key={s.name} className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'caption', text: 'muted' })} ${styles.mono} ${styles.spacingLabel}`}>{s.name}</span>
            <button className={ax({ surface: 'action', controlSize: s.name as Axes['controlSize'], tone: 'neutral' })}>
              {s.h} / r{s.r}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══ Tone ══ */

function ToneSection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>TONE</SectionTitle>
      <div className={styles.grid5}>
        {tones.map(t => (
          <div key={t} className={ax({ layout: 'column', gap: 'xs' })}>
            <div className={styles.toneSwatch} data-tone={t} />
            <span className={`${ax({ textStyle: 'caption' })} ${styles.mono}`}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══ Buttons — tone × state ══ */

function ButtonsSection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>BUTTONS</SectionTitle>
      <div className={styles.grid4}>
        <span />
        <span className={`${ax({ textStyle: 'caption', text: 'muted' })} ${styles.mono}`}>Default</span>
        <span className={`${ax({ textStyle: 'caption', text: 'muted' })} ${styles.mono}`}>Hover</span>
        <span className={`${ax({ textStyle: 'caption', text: 'muted' })} ${styles.mono}`}>Disabled</span>
        {(['accent', 'danger', 'neutral'] as const).map(tone => (
          <div key={tone} className="contents">
            <span className={`${ax({ textStyle: 'caption', text: 'secondary' })} ${styles.mono}`}>{tone}</span>
            <button className={ax({ surface: 'action', controlSize: 'md', tone })}>{tone}</button>
            <button className={`${ax({ surface: 'action', controlSize: 'md', tone })} ${styles.hovered}`}>{tone}</button>
            <button className={ax({ surface: 'action', controlSize: 'md', tone })} disabled>{tone}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══ Inputs ══ */

function InputsSection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>INPUTS</SectionTitle>
      <div className={ax({ layout: 'column', gap: 'sm' })}>
        <input className={ax({ surface: 'input', controlSize: 'lg' })} placeholder="Search invoices..." />
        <div className={ax({ layout: 'column', gap: 'xs' })}>
          <span className={ax({ textStyle: 'caption', text: 'secondary' })}>Email Address</span>
          <input className={ax({ surface: 'input', controlSize: 'lg' })} placeholder="name@company.com" />
        </div>
      </div>
    </div>
  )
}

/* ══ Chips / Badges ══ */

function ChipsSection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>CHIPS</SectionTitle>
      <div className={ax({ layout: 'column', gap: 'xs' })}>
        <div className={ax({ layout: 'row', gap: 'xs' })}>
          <span className={ax({ surface: 'action', controlSize: 'sm', tone: 'accent', textStyle: 'caption' })}>Filter: Active</span>
          <span className={ax({ surface: 'action', controlSize: 'sm', tone: 'neutral', textStyle: 'caption' })}>Filtered</span>
        </div>
        <div className={ax({ layout: 'row', gap: 'xs' })}>
          <span className={ax({ surface: 'action', controlSize: 'sm', tone: 'warning', textStyle: 'caption' })}>Status: Pending</span>
          <span className={ax({ surface: 'action', controlSize: 'sm', tone: 'success', textStyle: 'caption' })}>Tag: New</span>
        </div>
      </div>
    </div>
  )
}

/* ══ Tabs ══ */

function TabsSection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>TABS</SectionTitle>
      <div className={ax({ layout: 'bar', gap: 'xs' })}>
        {['Overview', 'Billing', 'Team'].map((t, i) => (
          <div key={t} className={ax({ surface: 'ghost', controlSize: 'sm', text: i === 0 ? 'primary' : 'muted' })} role="tab" aria-selected={i === 0}>
            {t}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══ Alerts ══ */

function AlertsSection() {
  const alerts = [
    { tone: 'success', text: 'Changes saved.' },
    { tone: 'accent', text: 'New feature available.' },
    { tone: 'warning', text: 'Session expiring.' },
    { tone: 'danger', text: 'Failed to save.' },
  ] as const
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>ALERTS</SectionTitle>
      <div className={ax({ layout: 'column', gap: 'xs' })}>
        {alerts.map(a => (
          <div key={a.tone} className={`${ax({ surface: 'display', layout: 'bar', gap: 'sm', padding: 'md' })} ${styles.alert}`} data-tone={a.tone}>
            <span className={ax({ textStyle: 'body', text: 'primary' })}>{a.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══ Cards ══ */

function CardsSection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>CARDS</SectionTitle>
      <div className={ax({ layout: 'row', gap: 'sm' })}>
        <div className={ax({ surface: 'display', layout: 'column', gap: 'sm', padding: 'lg', width: 'sm' })}>
          <div className={styles.cardImage} />
          <span className={ax({ textStyle: 'section', text: 'primary' })}>Title card</span>
          <span className={ax({ textStyle: 'body', text: 'secondary' })}>Lorem ipsum dolor sit amet, consectetur adipisicing.</span>
          <div className={ax({ layout: 'bar', gap: 'xs' })}>
            <button className={ax({ surface: 'action', controlSize: 'sm', tone: 'neutral' })}>Title</button>
            <button className={ax({ surface: 'action', controlSize: 'sm', tone: 'accent' })}>Action</button>
          </div>
        </div>
        <div className={ax({ surface: 'overlay', layout: 'column', gap: 'sm', padding: 'lg', width: 'sm' })}>
          <span className={ax({ textStyle: 'section', text: 'primary' })}>Overlay card</span>
          <span className={ax({ textStyle: 'body', text: 'secondary' })}>Uses surface:overlay with shadow elevation.</span>
          <button className={ax({ surface: 'action', controlSize: 'sm', tone: 'accent' })}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

/* ══ Layout Showcase ══ */

function LayoutSection() {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <SectionTitle>LAYOUT</SectionTitle>
      <div className={styles.grid4}>
        {layouts.map(l => (
          <div key={l} className={ax({ layout: 'column', gap: 'xs' })}>
            <div className={`${styles.layoutBox} ${ax({ layout: l as Axes['layout'], gap: 'xs', padding: 'sm' })}`}>
              <div className={styles.layoutChild} />
              <div className={styles.layoutChild} />
              <div className={styles.layoutChild} />
            </div>
            <span className={`${ax({ textStyle: 'caption' })} ${styles.mono}`}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══ Main ══ */

export default function PageThemeCreator() {
  return (
    <div className={`${ax({ layout: 'column', gap: 'xl', padding: 'xl' })} ${styles.root}`}>
      <div className={ax({ layout: 'column', gap: 'xs' })}>
        <h1 className={ax({ textStyle: 'hero', text: 'primary' })}>Axis Styleguide</h1>
        <span className={ax({ textStyle: 'body', text: 'muted' })}>10-axis design system — claude.ai reference</span>
      </div>

      <div className={styles.pageGrid}>
        {/* Column 1: Tokens */}
        <div className={ax({ layout: 'column', gap: 'xl' })}>
          <SurfaceSection />
          <ToneSection />
          <TextColorSection />
          <SpacingSection />
          <ControlSizeSection />
        </div>

        {/* Column 2: Typography + Layout */}
        <div className={ax({ layout: 'column', gap: 'xl' })}>
          <TypographySection />
          <LayoutSection />
        </div>

        {/* Column 3: Components */}
        <div className={ax({ layout: 'column', gap: 'xl' })}>
          <ButtonsSection />
          <InputsSection />
          <ChipsSection />
          <TabsSection />
          <AlertsSection />
          <CardsSection />
        </div>
      </div>
    </div>
  )
}
