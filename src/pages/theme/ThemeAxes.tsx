import { type Axes, ax } from '@styles/ax'
import './PageThemeCreator.css'

/* ══ Section Card ══ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={ax({ surface: 'display', layout: 'stack', gap: 'sm', padding: 'md', shape: 'lg' })}>
      <h3 className={ax({ textStyle: 'overline', text: 'muted' })}>{title}</h3>
      {children}
    </div>
  )
}

/* ══ Axis demo row ══ */

function AxisRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={ax({ layout: 'stack', gap: 'xs' })}>
      <span className={ax({ textStyle: 'code', text: 'muted' })}>{label}</span>
      {children}
    </div>
  )
}

/* ══ Zone × Interactive Composition ══
 * 용도에 맞는 조합 데모 — surface zone이 interactive 법도를 결정.
 * 같은 `aria-selected="true"` 아이템이 4 zone에서 각자 다른 배경을 받음.
 * (feedback_contextual_zone_cascade · P-26) */

type ItemStateAttrs = {
  'aria-selected'?: 'true'
  'aria-disabled'?: 'true'
  'aria-checked'?: 'true'
  'data-focused'?: boolean
  'data-hover'?: boolean
  'data-active'?: boolean
  'data-focus-ring'?: boolean
}

const itemStates: Array<{ label: string; attrs: ItemStateAttrs }> = [
  { label: 'default', attrs: {} },
  { label: 'hover', attrs: { 'data-hover': true } },
  { label: 'active', attrs: { 'data-active': true } },
  { label: 'focus ring', attrs: { 'data-focus-ring': true } },
  { label: 'selected', attrs: { 'aria-selected': 'true' } },
  { label: 'sel + focus', attrs: { 'aria-selected': 'true', 'data-focused': true } },
  { label: 'checked', attrs: { 'aria-checked': 'true' } },
  { label: 'disabled', attrs: { 'aria-disabled': 'true' } },
]

const buttonStates: Array<{ label: string; attrs: Record<string, boolean | string> }> = [
  { label: 'default', attrs: {} },
  { label: 'hover', attrs: { 'data-hover': true } },
  { label: 'focus', attrs: { 'data-focus-ring': true } },
  { label: 'off', attrs: { 'data-disabled': true } },
]

function ZoneCompositionAxis() {
  const zones = ['sunken', 'base', 'raised', 'overlay'] as const
  return (
    <Section title="ZONE × INTERACTIVE — 모든 state">
      <div className="theme-zone-grid">
        {zones.map(z => (
          <div key={z} className={ax({ layout: 'stack' })}>
            <span className={`${ax({ textStyle: 'code' })} theme-zone-label`}>{z}</span>
            <div
              className={`${ax({ role: 'control-group', surface: z, layout: 'stack' })} ax-interactive theme-zone-card`}
            >
              {itemStates.map(s => (
                <div
                  key={s.label}
                  className={`${ax({ role: 'item', interactive: 'item', layout: 'row' })} ia-item`}
                  tabIndex={s.attrs['aria-disabled'] ? -1 : 0}
                  {...s.attrs}
                >
                  <span>{s.label}</span>
                </div>
              ))}

              <div className={ax({ layout: 'row' })}>
                {buttonStates.map(b => (
                  <button
                    key={b.label}
                    className={ax({ role: 'control', surface: 'action', content: 'text', tone: 'accent' })}
                    {...b.attrs}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        <span className={`${ax({ textStyle: 'caption' })} theme-zone-caption`}>
          모든 state(default / hover / active / focus ring / selected / sel+focus / checked / disabled)가
          sunken/base/raised/overlay 각 zone에서 어떻게 다르게 렌더되는지 동시 비교.
          `.sf-{'{'}z{'}'}` 클래스가 --bg-hover · --bg-active · --selection · --selection-cursor 전부 zone별로 재바인딩 (Zone cascade).
        </span>
      </div>
    </Section>
  )
}

/* ══ Visual Axes ══ */

function SurfaceAxis() {
  const values = ['action', 'input', 'display', 'overlay', 'ghost', 'sunken', 'base'] as const
  return (
    <Section title="SURFACE">
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        {values.map(v => (
          <div key={v} className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>{v}</span>
            <div className={ax({ surface: v, role: 'control', content: 'text', flex: '1' })}>
              <span className={ax({ text: 'primary' })}>surface: '{v}'</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function RoleAxis() {
  const values = ['control', 'item', 'badge'] as const
  return (
    <Section title="ROLE">
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        {values.map(v => (
          <div key={v} className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>{v}</span>
            <button className={ax({ role: v, surface: 'action', content: 'text', tone: 'neutral' })}>
              role: '{v}'
            </button>
          </div>
        ))}
      </div>
    </Section>
  )
}

function TextStyleAxis() {
  const values = ['hero', 'display', 'page', 'section', 'label', 'body', 'caption', 'code', 'overline'] as const
  return (
    <Section title="TEXT STYLE">
      <div className={ax({ layout: 'stack' })}>
        {values.map(v => (
          <div key={v} className={ax({ layout: 'spread', padding: 'xs', border: 'bottom' })}>
            <span className={ax({ textStyle: v, text: 'primary' })}>{v}</span>
            <span className={ax({ textStyle: 'code', text: 'muted' })}>textStyle: '{v}'</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

function ToneAxis() {
  const values = ['accent', 'danger', 'success', 'warning', 'neutral'] as const
  return (
    <Section title="TONE">
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        <div className={ax({ layout: 'row', gap: 'sm' })}>
          {values.map(v => (
            <AxisRow key={v} label={v}>
              <button className={ax({ role: 'control', surface: 'action', content: 'text', tone: v })}>{v}</button>
            </AxisRow>
          ))}
        </div>
        <div className={ax({ layout: 'row', gap: 'sm' })}>
          {values.map(v => {
            const dim = `${v}-dim` as Axes['tone']
            return (
              <AxisRow key={v} label={`${v}-dim`}>
                <button className={ax({ role: 'control', surface: 'action', content: 'text', tone: dim })}>{v}</button>
              </AxisRow>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

function TextAxis() {
  const values = ['bright', 'primary', 'secondary', 'muted'] as const
  const toneValues = ['accent', 'danger', 'success', 'warning'] as const
  return (
    <Section title="TEXT">
      <div className={ax({ layout: 'row', gap: 'lg' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <span className={ax({ textStyle: 'section', text: v })}>Ag</span>
          </AxisRow>
        ))}
        {toneValues.map(v => (
          <AxisRow key={v} label={`tone:${v}`}>
            <span className={ax({ textStyle: 'section', tone: v })}>Ag</span>
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

function WeightAxis() {
  const values = ['medium', 'semi', 'bold'] as const
  return (
    <Section title="WEIGHT">
      <div className={ax({ layout: 'row', gap: 'lg' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <span className={ax({ textStyle: 'body', text: 'primary', weight: v })}>The quick brown fox</span>
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

function StateAxis() {
  const values = ['focused', 'selected'] as const
  return (
    <Section title="STATE">
      <div className={ax({ layout: 'row', gap: 'sm' })}>
        <AxisRow label="(none)">
          <div className={ax({ surface: 'display', padding: 'sm', shape: 'md' })}>
            <span className={ax({ textStyle: 'body', text: 'primary' })}>default</span>
          </div>
        </AxisRow>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={ax({ surface: 'display', padding: 'sm', shape: 'md', state: v })}>
              <span className={ax({ textStyle: 'body', text: 'primary' })}>{v}</span>
            </div>
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

function OpacityAxis() {
  const values = ['dim', 'faint', 'hidden'] as const
  return (
    <Section title="OPACITY">
      <div className={ax({ layout: 'row', gap: 'sm' })}>
        <AxisRow label="(none)">
          <div className={ax({ role: 'control', surface: 'action', content: 'text', tone: 'accent' })}>
            <span>default</span>
          </div>
        </AxisRow>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={ax({ role: 'control', surface: 'action', content: 'text', tone: 'accent', opacity: v })}>
              <span>{v}</span>
            </div>
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

function ShapeAxis() {
  const values = ['none', 'sm', 'md', 'lg', 'xl', 'pill'] as const
  return (
    <Section title="SHAPE">
      <div className={ax({ layout: 'row', gap: 'sm' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={`${ax({ shape: v, square: '2xl' })} theme-shape-swatch`} />
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

function MotionAxis() {
  const values = ['pulse', 'spin', 'fade-in', 'slide-up'] as const
  return (
    <Section title="MOTION">
      <div className={ax({ layout: 'row', gap: 'sm' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={ax({ surface: 'display', padding: 'sm', shape: 'md', square: 'xl', layout: 'center', motion: v })}>
              <span className={ax({ textStyle: 'body', text: 'primary' })}>A</span>
            </div>
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

function ContentAxis() {
  return (
    <Section title="CONTENT">
      <div className={ax({ layout: 'row', gap: 'sm' })}>
        <AxisRow label="(none)">
          <button className={ax({ role: 'control', surface: 'action', tone: 'neutral' })}>1:1 ratio</button>
        </AxisRow>
        <AxisRow label="text">
          <button className={ax({ role: 'control', surface: 'action', content: 'text', tone: 'neutral' })}>2:1 ratio</button>
        </AxisRow>
      </div>
    </Section>
  )
}

function BorderAxis() {
  const values = ['subtle', 'default', 'strong', 'bottom', 'top', 'start', 'end'] as const
  return (
    <Section title="BORDER">
      <div className={ax({ layout: 'row', gap: 'sm' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={ax((['bottom', 'top', 'start', 'end'].includes(v) ? { padding: 'sm', border: v as 'bottom' } : { padding: 'sm', shape: 'md', border: v as 'subtle' }))}>
              <span className={ax({ textStyle: 'code', text: 'secondary' })}>{v}</span>
            </div>
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

/* ══ Structural Axes ══ */

function LayoutAxis() {
  const values = ['row', 'column', 'center', 'bar', 'spread', 'stack', 'scroll', 'fill'] as const
  return (
    <Section title="LAYOUT">
      <div className={ax({ layout: 'grid-4', gap: 'sm' })}>
        {values.map(l => (
          <AxisRow key={l} label={l}>
            <div className={`${ax({ layout: l as Axes['layout'], gap: 'xs', padding: 'sm', shape: 'md' })} theme-layout-box`}>
              <div className={`${ax({ shape: 'sm', square: 'lg', flex: 'none' })} theme-layout-child`} />
              <div className={`${ax({ shape: 'sm', square: 'lg', flex: 'none' })} theme-layout-child`} />
              <div className={`${ax({ shape: 'sm', square: 'lg', flex: 'none' })} theme-layout-child`} />
            </div>
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

function GapAxis() {
  const values = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const
  return (
    <Section title="GAP">
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        {values.map(v => (
          <div key={v} className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>{v}</span>
            <div className={ax({ layout: 'row', gap: v })}>
              <div className={`${ax({ shape: 'sm', square: 'lg' })} theme-layout-child`} />
              <div className={`${ax({ shape: 'sm', square: 'lg' })} theme-layout-child`} />
              <div className={`${ax({ shape: 'sm', square: 'lg' })} theme-layout-child`} />
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function PaddingAxis() {
  const values = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const
  return (
    <Section title="PADDING">
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        {values.map(v => (
          <div key={v} className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>{v}</span>
            <div className={ax({ surface: 'display', padding: v, shape: 'md', border: 'default' })}>
              <span className={ax({ textStyle: 'code', text: 'secondary' })}>content</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function FlexAxis() {
  const values = ['none', 'auto', '1'] as const
  return (
    <Section title="FLEX">
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        {values.map(v => (
          <div key={v} className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>{v}</span>
            <div className={ax({ layout: 'row', gap: 'sm', width: 'full' })}>
              <div className={ax({ surface: 'display', padding: 'sm', shape: 'sm', flex: v, border: 'default' })}>
                <span className={ax({ textStyle: 'code', text: 'secondary' })}>flex: '{v}'</span>
              </div>
              <div className={ax({ surface: 'display', padding: 'sm', shape: 'sm', flex: '1', border: 'subtle' })}>
                <span className={ax({ textStyle: 'code', text: 'muted' })}>flex: '1'</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function ClampAxis() {
  const values = ['1', '2', '3', '4'] as const
  const sampleText = 'The quick brown fox jumps over the lazy dog. This is a long text to demonstrate line clamping behavior across multiple lines of content.'
  return (
    <Section title="CLAMP">
      <div className={ax({ layout: 'grid-4', gap: 'sm' })}>
        {values.map(v => (
          <AxisRow key={v} label={`${v} line${v === '1' ? '' : 's'}`}>
            <div className={ax({ surface: 'display', padding: 'sm', shape: 'md', border: 'subtle' })}>
              <span className={ax({ textStyle: 'body', text: 'secondary', clamp: v })}>{sampleText}</span>
            </div>
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

function SizeAxis() {
  const values = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const
  return (
    <Section title="SIZE">
      <div className={ax({ layout: 'row', gap: 'sm' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={`${ax({ shape: 'sm', square: v })} theme-layout-child`} />
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

function IconAxis() {
  const values = ['xs', 'sm', 'md', 'lg'] as const
  return (
    <Section title="ICON">
      <div className={ax({ layout: 'row', gap: 'sm' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <svg className={ax({ icon: v })} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

function PlacementAxis() {
  const values = ['above', 'below', 'bottom', 'center', 'top-start', 'sticky'] as const
  return (
    <Section title="PLACEMENT">
      <div className={ax({ layout: 'grid-3', gap: 'sm' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <span className={ax({ textStyle: 'caption', text: 'secondary' })}>position bundle</span>
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

function WidthAxis() {
  const values = ['full', 'auto', 'fit', 'sm', 'md', 'lg', 'xl', 'prose'] as const
  return (
    <Section title="WIDTH">
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        {values.map(v => (
          <div key={v} className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>{v}</span>
            <div className={ax({ surface: 'display', padding: 'xs', shape: 'sm', width: v, border: 'default' })}>
              <span className={ax({ textStyle: 'code', text: 'secondary' })}>{v}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function AspectAxis() {
  const values = ['1', 'video', 'card'] as const
  return (
    <Section title="ASPECT">
      <div className={ax({ layout: 'row', gap: 'sm' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={ax({ surface: 'display', shape: 'md', aspect: v, square: 'xl', border: 'default' })} />
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

/* ══ Axes Tab ══ */

export function ThemeAxes() {
  return (
    <div className={ax({ layout: 'stack', gap: 'xl' })}>
      {/* 조합 데모 (Zone cascade) */}
      <div>
        <ZoneCompositionAxis />
      </div>

      {/* 시각 축 */}
      <div>
        <h2 className={ax({ textStyle: 'section', text: 'primary', padding: 'sm' })}>Visual Axes</h2>
        <div className="theme-composed-grid">
          <div className={ax({ layout: 'stack', gap: 'md' })}>
            <SurfaceAxis />
            <RoleAxis />
            <ToneAxis />
            <TextAxis />
            <WeightAxis />
          </div>
          <div className={ax({ layout: 'stack', gap: 'md' })}>
            <TextStyleAxis />
            <ShapeAxis />
            <StateAxis />
            <OpacityAxis />
            <MotionAxis />
            <ContentAxis />
            <BorderAxis />
          </div>
        </div>
      </div>

      {/* 구조 축 */}
      <div>
        <h2 className={ax({ textStyle: 'section', text: 'primary', padding: 'sm' })}>Structural Axes</h2>
        <div className="theme-composed-grid">
          <div className={ax({ layout: 'stack', gap: 'md' })}>
            <LayoutAxis />
            <GapAxis />
            <PaddingAxis />
            <FlexAxis />
            <WidthAxis />
          </div>
          <div className={ax({ layout: 'stack', gap: 'md' })}>
            <SizeAxis />
            <IconAxis />
            <ClampAxis />
            <AspectAxis />
            <PlacementAxis />
          </div>
        </div>
      </div>
    </div>
  )
}
