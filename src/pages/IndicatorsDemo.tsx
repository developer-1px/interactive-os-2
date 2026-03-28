import { useState } from 'react'
import { ExpandIndicator, CheckIndicator, RadioIndicator, SwitchIndicator, SeparatorIndicator } from '../interactive-os/ui/indicators'

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-md)',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-md)',
}

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--type-caption-size)',
  color: 'var(--text-muted)',
  width: '120px',
  flexShrink: 0,
}

const cellStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <h3 style={{ margin: 0, fontSize: 'var(--type-body-size)', fontWeight: 'var(--weight-semi)' }}>{title}</h3>
      {children}
    </div>
  )
}

function ExpandDemo() {
  const [expanded, setExpanded] = useState(false)
  return (
    <Section title="ExpandIndicator">
      <div style={rowStyle}>
        <span style={labelStyle}>expanded: false</span>
        <div style={cellStyle}><ExpandIndicator expanded={false} /></div>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>expanded: true</span>
        <div style={cellStyle}><ExpandIndicator expanded={true} /></div>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>hasChildren: false</span>
        <div style={cellStyle}><ExpandIndicator hasChildren={false} /></div>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>variant: tree</span>
        <div style={cellStyle}><ExpandIndicator expanded={false} variant="tree" /></div>
        <div style={cellStyle}><ExpandIndicator expanded={true} variant="tree" /></div>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>interactive</span>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <ExpandIndicator expanded={expanded} />
        </button>
        <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--text-secondary)' }}>
          {expanded ? 'expanded' : 'collapsed'} (click)
        </span>
      </div>
    </Section>
  )
}

function CheckDemo() {
  const [checked, setChecked] = useState(false)
  return (
    <Section title="CheckIndicator">
      <div data-aria-container="" style={rowStyle}>
        <span style={labelStyle}>checked: false</span>
        <div style={cellStyle}><CheckIndicator checked={false} /></div>
      </div>
      <div data-aria-container="" style={rowStyle}>
        <span style={labelStyle}>checked: true</span>
        <div style={cellStyle} aria-selected="true"><CheckIndicator checked={true} /></div>
      </div>
      <div data-aria-container="" style={rowStyle}>
        <span style={labelStyle}>interactive</span>
        <div
          style={{ ...cellStyle, cursor: 'pointer' }}
          aria-selected={checked ? 'true' : undefined}
          onClick={() => setChecked(!checked)}
        >
          <CheckIndicator checked={checked} />
        </div>
        <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--text-secondary)' }}>
          {checked ? 'checked' : 'unchecked'} (click)
        </span>
      </div>
    </Section>
  )
}

function RadioDemo() {
  const [selected, setSelected] = useState(0)
  return (
    <Section title="RadioIndicator">
      <div data-aria-container="" style={rowStyle}>
        <span style={labelStyle}>unselected</span>
        <div style={cellStyle}><RadioIndicator /></div>
      </div>
      <div data-aria-container="" style={rowStyle}>
        <span style={labelStyle}>selected</span>
        <div style={cellStyle} aria-checked="true"><RadioIndicator /></div>
      </div>
      <div data-aria-container="" style={{ ...rowStyle, gap: 'var(--space-sm)' }}>
        <span style={labelStyle}>interactive</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ ...cellStyle, cursor: 'pointer' }}
            aria-checked={selected === i ? 'true' : 'false'}
            onClick={() => setSelected(i)}
          >
            <RadioIndicator />
          </div>
        ))}
      </div>
    </Section>
  )
}

function SwitchDemo() {
  const [on, setOn] = useState(false)
  return (
    <Section title="SwitchIndicator">
      <div data-aria-container="" style={rowStyle}>
        <span style={labelStyle}>off</span>
        <div style={cellStyle}><SwitchIndicator /></div>
      </div>
      <div data-aria-container="" style={rowStyle}>
        <span style={labelStyle}>on</span>
        <div style={cellStyle} aria-checked="true"><SwitchIndicator /></div>
      </div>
      <div data-aria-container="" style={rowStyle}>
        <span style={labelStyle}>interactive</span>
        <div
          style={{ ...cellStyle, cursor: 'pointer' }}
          aria-checked={on ? 'true' : 'false'}
          onClick={() => setOn(!on)}
          data-aria-container=""
        >
          <SwitchIndicator />
        </div>
        <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--text-secondary)' }}>
          {on ? 'on' : 'off'} (click)
        </span>
      </div>
    </Section>
  )
}

function SeparatorDemo() {
  return (
    <Section title="SeparatorIndicator">
      <div style={rowStyle}>
        <span style={labelStyle}>horizontal</span>
        <div style={{ flex: 1 }}>
          <SeparatorIndicator orientation="horizontal" />
        </div>
      </div>
      <div style={{ ...rowStyle, height: '48px' }}>
        <span style={labelStyle}>vertical</span>
        <SeparatorIndicator orientation="vertical" />
        <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--text-secondary)' }}>left</span>
        <SeparatorIndicator orientation="vertical" />
        <span style={{ fontSize: 'var(--type-caption-size)', color: 'var(--text-secondary)' }}>right</span>
      </div>
    </Section>
  )
}

export default function IndicatorsDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', padding: 'var(--space-lg) 0' }}>
      <ExpandDemo />
      <SeparatorIndicator orientation="horizontal" />
      <CheckDemo />
      <SeparatorIndicator orientation="horizontal" />
      <RadioDemo />
      <SeparatorIndicator orientation="horizontal" />
      <SwitchDemo />
      <SeparatorIndicator orientation="horizontal" />
      <SeparatorDemo />
    </div>
  )
}
