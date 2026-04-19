import { type AxTone, type AxLayout, ax } from '@styles/ax'
import './PageThemeCreator.css'

/* ══ Section Card ══ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={ax({ role: 'cell', surface: 'display', layout: 'stack' })}>
      <h3 className={ax({ textStyle: 'overline' })}>{title}</h3>
      {children}
    </div>
  )
}

/* ══ Axis demo row ══ */

function AxisRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={ax({ layout: 'stack' })}>
      <span className={ax({ textStyle: 'code' })}>{label}</span>
      {children}
    </div>
  )
}

/* ══ Zone × Interactive Composition ══
 * surface zone이 interactive 법도를 결정 (feedback_contextual_zone_cascade · P-26).
 * ax 축만으로 구성. state는 실제 pseudo-class로 체험 (Tab/hover/click). */

const buttonTones = ['accent', 'danger', 'success', 'warning', 'neutral'] as const

function ZoneCompositionAxis() {
  const zones = ['sunken', 'base', 'raised', 'overlay'] as const
  return (
    <Section title="ZONE × INTERACTIVE">
      <div className={ax({ layout: 'grid-4' })}>
        {zones.map(z => (
          <div key={z} className={`${ax({ role: 'control-group', surface: z, layout: 'stack' })} ax-interactive`}>
            <span className={ax({ textStyle: 'code' })}>{z}</span>

            <div className={`${ax({ role: 'item', interactive: 'item', layout: 'row' })} ia-item`} tabIndex={0}>
              <span>item 1</span>
            </div>
            <div className={`${ax({ role: 'item', interactive: 'item', layout: 'row' })} ia-item`} tabIndex={0}>
              <span>item 2</span>
            </div>
            <div className={`${ax({ role: 'item', interactive: 'item', layout: 'row' })} ia-item`} tabIndex={0} aria-selected="true">
              <span>selected</span>
            </div>
            <div className={`${ax({ role: 'item', interactive: 'item', layout: 'row' })} ia-item`} tabIndex={-1} aria-disabled="true">
              <span>disabled</span>
            </div>

            <div className={ax({ layout: 'row' })}>
              {buttonTones.map(t => (
                <button
                  key={t}
                  className={ax({ role: 'control', surface: 'action', content: 'text', tone: t })}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className={ax({ layout: 'row' })}>
              {buttonTones.map(t => (
                <button
                  key={t}
                  className={ax({ role: 'control', surface: 'ghost', content: 'text', tone: t })}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ══ Visual Axes ══ */

function SurfaceAxis() {
  // role-별 subset으로 좁혀 순회 — 각 브랜치의 surface만 사용
  const controlSurfaces = ['action', 'input', 'ghost'] as const
  const cellSurfaces = ['display'] as const
  const panelSurfaces = ['sunken', 'base', 'overlay'] as const
  return (
    <Section title="SURFACE">
      <div className={ax({ layout: 'stack' })}>
        {controlSurfaces.map(v => (
          <div key={v} className={ax({ layout: 'bar' })}>
            <span className={`${ax({ textStyle: 'code' })} theme-btn-label`}>{v}</span>
            <div className={ax({ role: 'control', surface: v, content: 'text', flex: '1' })}>
              <span className={ax({ })}>surface: '{v}'</span>
            </div>
          </div>
        ))}
        {cellSurfaces.map(v => (
          <div key={v} className={ax({ layout: 'bar' })}>
            <span className={`${ax({ textStyle: 'code' })} theme-btn-label`}>{v}</span>
            <div className={ax({ role: 'cell', surface: v, content: 'text', flex: '1' })}>
              <span className={ax({ })}>surface: '{v}'</span>
            </div>
          </div>
        ))}
        {panelSurfaces.map(v => (
          <div key={v} className={ax({ layout: 'bar' })}>
            <span className={`${ax({ textStyle: 'code' })} theme-btn-label`}>{v}</span>
            <div className={ax({ role: 'control-group', surface: v, flex: '1' })}>
              <span className={ax({ })}>surface: '{v}'</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function RoleAxis() {
  // 각 role 브랜치의 대표 surface를 subset으로 사용
  return (
    <Section title="ROLE">
      <div className={ax({ layout: 'stack' })}>
        <div className={ax({ layout: 'bar' })}>
          <span className={`${ax({ textStyle: 'code' })} theme-btn-label`}>control</span>
          <button className={ax({ role: 'control', surface: 'action', content: 'text', tone: 'neutral' })}>
            role: &apos;control&apos;
          </button>
        </div>
        <div className={ax({ layout: 'bar' })}>
          <span className={`${ax({ textStyle: 'code' })} theme-btn-label`}>item</span>
          <button className={ax({ role: 'item', surface: 'display', content: 'text', tone: 'neutral' })}>
            role: &apos;item&apos;
          </button>
        </div>
        <div className={ax({ layout: 'bar' })}>
          <span className={`${ax({ textStyle: 'code' })} theme-btn-label`}>badge</span>
          <button className={ax({ role: 'badge', surface: 'display', content: 'text', tone: 'neutral' })}>
            role: &apos;badge&apos;
          </button>
        </div>
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
          <div key={v} className={ax({ layout: 'spread' })}>
            <span className={ax({ textStyle: v })}>{v}</span>
            <span className={ax({ textStyle: 'code' })}>textStyle: '{v}'</span>
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
      <div className={ax({ layout: 'stack' })}>
        <div className={ax({ layout: 'row' })}>
          {values.map(v => (
            <AxisRow key={v} label={v}>
              <button className={ax({ role: 'control', surface: 'action', content: 'text', tone: v })}>{v}</button>
            </AxisRow>
          ))}
        </div>
        <div className={ax({ layout: 'row' })}>
          {values.map(v => {
            const dim = `${v}-dim` as AxTone
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
      <div className={ax({ layout: 'row' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <span className={ax({ textStyle: 'section' })}>Ag</span>
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
      <div className={ax({ layout: 'row' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <span className={ax({ textStyle: 'body' })}>The quick brown fox</span>
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
      <div className={ax({ layout: 'row' })}>
        <AxisRow label="(none)">
          <div className={ax({ role: 'cell', surface: 'display' })}>
            <span className={ax({ textStyle: 'body' })}>default</span>
          </div>
        </AxisRow>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={ax({ role: 'cell', surface: 'display' })}>
              <span className={ax({ textStyle: 'body' })}>{v}</span>
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
      <div className={ax({ layout: 'row' })}>
        <AxisRow label="(none)">
          <div className={ax({ role: 'control', surface: 'action', content: 'text', tone: 'accent' })}>
            <span>default</span>
          </div>
        </AxisRow>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={ax({ role: 'control', surface: 'action', content: 'text', tone: 'accent' })}>
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
      <div className={ax({ layout: 'row' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={`${ax({ })} theme-shape-swatch`} />
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
      <div className={ax({ layout: 'row' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={ax({ role: 'cell', surface: 'display', layout: 'center' })}>
              <span className={ax({ textStyle: 'body' })}>A</span>
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
      <div className={ax({ layout: 'row' })}>
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
      <div className={ax({ layout: 'row' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={ax.raw((['bottom', 'top', 'start', 'end'].includes(v) ? { padding: 'sm', border: v as 'bottom' } : { padding: 'sm', shape: 'md', border: v as 'subtle' }))}>
              <span className={ax({ textStyle: 'code' })}>{v}</span>
            </div>
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

/* ══ Structural Axes ══ */

function LayoutAxis() {
  // 'column'은 AxLayout 공개 값이 아니지만 demo 전시용 — stack 치환
  const values = ['row', 'center', 'bar', 'spread', 'stack', 'scroll', 'fill'] as const satisfies readonly AxLayout[]
  return (
    <Section title="LAYOUT">
      <div className={ax({ layout: 'grid-4' })}>
        {values.map(l => (
          <AxisRow key={l} label={l}>
            <div className={`${ax({ layout: l })} theme-layout-box`}>
              <div className={`${ax({ flex: 'none' })} theme-layout-child`} />
              <div className={`${ax({ flex: 'none' })} theme-layout-child`} />
              <div className={`${ax({ flex: 'none' })} theme-layout-child`} />
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
      <div className={ax({ layout: 'stack' })}>
        {values.map(v => (
          <div key={v} className={ax({ layout: 'bar' })}>
            <span className={`${ax({ textStyle: 'code' })} theme-btn-label`}>{v}</span>
            <div className={ax({ layout: 'row' })}>
              <div className={`${ax({ })} theme-layout-child`} />
              <div className={`${ax({ })} theme-layout-child`} />
              <div className={`${ax({ })} theme-layout-child`} />
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
      <div className={ax({ layout: 'stack' })}>
        {values.map(v => (
          <div key={v} className={ax({ layout: 'bar' })}>
            <span className={`${ax({ textStyle: 'code' })} theme-btn-label`}>{v}</span>
            <div className={ax({ role: 'cell', surface: 'display' })}>
              <span className={ax({ textStyle: 'code' })}>content</span>
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
      <div className={ax({ layout: 'stack' })}>
        {values.map(v => (
          <div key={v} className={ax({ layout: 'bar' })}>
            <span className={`${ax({ textStyle: 'code' })} theme-btn-label`}>{v}</span>
            <div className={ax({ layout: 'row', width: 'full' })}>
              <div className={ax({ role: 'cell', surface: 'display', flex: v })}>
                <span className={ax({ textStyle: 'code' })}>flex: &apos;{v}&apos;</span>
              </div>
              <div className={ax({ role: 'cell', surface: 'display', flex: '1' })}>
                <span className={ax({ textStyle: 'code' })}>flex: &apos;1&apos;</span>
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
      <div className={ax({ layout: 'grid-4' })}>
        {values.map(v => (
          <AxisRow key={v} label={`${v} line${v === '1' ? '' : 's'}`}>
            <div className={ax({ role: 'cell', surface: 'display' })}>
              <span className={ax({ textStyle: 'body', clamp: v })}>{sampleText}</span>
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
      <div className={ax({ layout: 'row' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={`${ax({ })} theme-layout-child`} />
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
      <div className={ax({ layout: 'row' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <svg className={ax({ })} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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
      <div className={ax({ layout: 'grid-3' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <span className={ax({ textStyle: 'caption' })}>position bundle</span>
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
      <div className={ax({ layout: 'stack' })}>
        {values.map(v => (
          <div key={v} className={ax({ layout: 'bar' })}>
            <span className={`${ax({ textStyle: 'code' })} theme-btn-label`}>{v}</span>
            <div className={ax({ role: 'cell', surface: 'display', width: v })}>
              <span className={ax({ textStyle: 'code' })}>{v}</span>
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
      <div className={ax({ layout: 'row' })}>
        {values.map(v => (
          <AxisRow key={v} label={v}>
            <div className={ax({ role: 'control', surface: 'ghost', aspect: v })} />
          </AxisRow>
        ))}
      </div>
    </Section>
  )
}

/* ══ Axes Tab ══ */

export function ThemeAxes() {
  return (
    <div className={ax({ layout: 'stack' })}>
      {/* 조합 데모 (Zone cascade) */}
      <div>
        <ZoneCompositionAxis />
      </div>

      {/* 시각 축 */}
      <div>
        <h2 className={ax({ textStyle: 'section' })}>Visual Axes</h2>
        <div className="theme-composed-grid">
          <div className={ax({ layout: 'stack' })}>
            <SurfaceAxis />
            <RoleAxis />
            <ToneAxis />
            <TextAxis />
            <WeightAxis />
          </div>
          <div className={ax({ layout: 'stack' })}>
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
        <h2 className={ax({ textStyle: 'section' })}>Structural Axes</h2>
        <div className="theme-composed-grid">
          <div className={ax({ layout: 'stack' })}>
            <LayoutAxis />
            <GapAxis />
            <PaddingAxis />
            <FlexAxis />
            <WidthAxis />
          </div>
          <div className={ax({ layout: 'stack' })}>
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
