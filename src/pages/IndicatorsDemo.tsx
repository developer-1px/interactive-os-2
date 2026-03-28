import { useState } from 'react'
import { ExpandIndicator, CheckIndicator, RadioIndicator, SwitchIndicator, SeparatorIndicator } from '../interactive-os/ui/indicators'
import styles from './IndicatorsDemo.module.css'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <div className={styles.value}>{children}</div>
    </div>
  )
}

function ExpandSection() {
  const [expanded, setExpanded] = useState(false)
  return (
    <Section title="Expand">
      <Row label="expanded=false">
        <ExpandIndicator expanded={false} />
      </Row>
      <Row label="expanded=true">
        <ExpandIndicator expanded={true} />
      </Row>
      <Row label="hasChildren=false">
        <ExpandIndicator hasChildren={false} />
      </Row>
      <Row label="variant=tree">
        <ExpandIndicator expanded={false} variant="tree" />
        <ExpandIndicator expanded={true} variant="tree" />
      </Row>
      <Row label="interactive">
        <div className={styles.interactiveTarget} onClick={() => setExpanded(!expanded)}>
          <ExpandIndicator expanded={expanded} />
          <span className={styles.stateLabel}>{expanded ? 'expanded' : 'collapsed'}</span>
        </div>
      </Row>
    </Section>
  )
}

function CheckSection() {
  const [checked, setChecked] = useState(false)
  return (
    <Section title="Check">
      <div data-aria-container="">
        <Row label="checked=false">
          <CheckIndicator checked={false} />
        </Row>
        <Row label="checked=true">
          <span aria-selected="true"><CheckIndicator checked={true} /></span>
        </Row>
        <Row label="interactive">
          <div
            className={styles.interactiveTarget}
            aria-selected={checked ? 'true' : undefined}
            onClick={() => setChecked(!checked)}
          >
            <CheckIndicator checked={checked} />
            <span className={styles.stateLabel}>{checked ? 'checked' : 'unchecked'}</span>
          </div>
        </Row>
      </div>
    </Section>
  )
}

function RadioSection() {
  const [selected, setSelected] = useState(0)
  return (
    <Section title="Radio">
      <div data-aria-container="">
        <Row label="unchecked">
          <RadioIndicator />
        </Row>
        <Row label="checked">
          <span aria-checked="true"><RadioIndicator /></span>
        </Row>
        <Row label="interactive">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={styles.interactiveTarget}
              aria-checked={selected === i ? 'true' : 'false'}
              onClick={() => setSelected(i)}
            >
              <RadioIndicator />
            </div>
          ))}
        </Row>
      </div>
    </Section>
  )
}

function SwitchSection() {
  const [on, setOn] = useState(false)
  return (
    <Section title="Switch">
      <div data-aria-container="">
        <Row label="off">
          <SwitchIndicator />
        </Row>
        <Row label="on">
          <div aria-checked="true" style={{ display: 'inline-flex' }}><SwitchIndicator /></div>
        </Row>
        <Row label="interactive">
          <div
            className={styles.interactiveTarget}
            aria-checked={on ? 'true' : 'false'}
            onClick={() => setOn(!on)}
          >
            <SwitchIndicator />
            <span className={styles.stateLabel}>{on ? 'on' : 'off'}</span>
          </div>
        </Row>
      </div>
    </Section>
  )
}

function SeparatorSection() {
  return (
    <Section title="Separator">
      <Row label="horizontal">
        <div className={styles.separatorFill}>
          <SeparatorIndicator orientation="horizontal" />
        </div>
      </Row>
      <Row label="vertical">
        <div className={styles.value} style={{ height: 'var(--space-3xl)' }}>
          <span className={styles.stateLabel}>A</span>
          <SeparatorIndicator orientation="vertical" />
          <span className={styles.stateLabel}>B</span>
          <SeparatorIndicator orientation="vertical" />
          <span className={styles.stateLabel}>C</span>
        </div>
      </Row>
    </Section>
  )
}

export default function IndicatorsDemo() {
  return (
    <div className={styles.root}>
      <ExpandSection />
      <CheckSection />
      <RadioSection />
      <SwitchSection />
      <SeparatorSection />
    </div>
  )
}
