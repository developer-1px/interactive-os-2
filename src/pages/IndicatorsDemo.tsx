import { useState } from 'react'
import {
  ExpandIndicator, CheckIndicator, RadioIndicator, SwitchIndicator,
  SeparatorIndicator, IndeterminateIndicator, SortIndicator,
  SpinnerIndicator, ProgressIndicator, SkeletonIndicator, StatusIndicator,
  PageIndicator, DirectionIndicator, StepIndicator,
  BadgeIndicator, OverflowIndicator, GripIndicator, TreeConnector,
} from '../interactive-os/ui/indicators'
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
      <div data-aria-container="">
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
      </div>
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
          <div className={styles.ariaCheckedWrapper} aria-checked="true"><SwitchIndicator /></div>
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
        <div className={styles.verticalSeparatorDemo}>
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

function IndeterminateSection() {
  return (
    <Section title="Indeterminate">
      <div data-aria-container="">
        <Row label="default">
          <span aria-selected="true"><IndeterminateIndicator /></span>
        </Row>
        <Row label="vs check">
          <span aria-selected="true"><CheckIndicator checked={true} /></span>
          <span aria-selected="true"><IndeterminateIndicator /></span>
          <CheckIndicator checked={false} />
        </Row>
      </div>
    </Section>
  )
}

function SortSection() {
  const [dir, setDir] = useState<'ascending' | 'descending' | undefined>(undefined)
  return (
    <Section title="Sort">
      <div data-aria-container="">
        <Row label="none">
          <SortIndicator />
        </Row>
        <Row label="ascending">
          <span aria-sort="ascending"><SortIndicator direction="ascending" /></span>
        </Row>
        <Row label="descending">
          <span aria-sort="descending"><SortIndicator direction="descending" /></span>
        </Row>
        <Row label="interactive">
          <div
            className={styles.interactiveTarget}
            onClick={() => setDir(d => d === undefined ? 'ascending' : d === 'ascending' ? 'descending' : undefined)}
          >
            <SortIndicator direction={dir} />
            <span className={styles.stateLabel}>{dir ?? 'none'}</span>
          </div>
        </Row>
      </div>
    </Section>
  )
}

function SpinnerSection() {
  return (
    <Section title="Spinner">
      <Row label="sm"><SpinnerIndicator size="sm" /></Row>
      <Row label="md"><SpinnerIndicator /></Row>
      <Row label="lg"><SpinnerIndicator size="lg" /></Row>
    </Section>
  )
}

function ProgressSection() {
  const [value, setValue] = useState(60)
  return (
    <Section title="Progress">
      <Row label="0%"><ProgressIndicator value={0} /></Row>
      <Row label="60%"><ProgressIndicator value={60} /></Row>
      <Row label="100%"><ProgressIndicator value={100} /></Row>
      <Row label="interactive">
        <div className={styles.interactiveTarget} onClick={() => setValue(v => v >= 100 ? 0 : v + 20)}>
          <span className={styles.stateLabel}>{value}%</span>
        </div>
        <ProgressIndicator value={value} />
      </Row>
    </Section>
  )
}

function SkeletonSection() {
  return (
    <Section title="Skeleton">
      <Row label="text"><SkeletonIndicator width="60%" height="var(--space-md)" /></Row>
      <Row label="avatar"><SkeletonIndicator width="var(--space-2xl)" height="var(--space-2xl)" /></Row>
      <Row label="block"><SkeletonIndicator width="100%" height="var(--space-3xl)" /></Row>
    </Section>
  )
}

function StatusSection() {
  return (
    <Section title="Status">
      <Row label="success"><StatusIndicator tone="success" /></Row>
      <Row label="error"><StatusIndicator tone="error" /></Row>
      <Row label="warning"><StatusIndicator tone="warning" /></Row>
      <Row label="info"><StatusIndicator tone="info" /></Row>
    </Section>
  )
}

function PageSection() {
  const [current, setCurrent] = useState(0)
  return (
    <Section title="Page">
      <Row label="5 dots, #2"><PageIndicator total={5} current={2} /></Row>
      <Row label="3 dots, #0"><PageIndicator total={3} current={0} /></Row>
      <Row label="interactive">
        <div className={styles.interactiveTarget} onClick={() => setCurrent(c => (c + 1) % 5)}>
          <PageIndicator total={5} current={current} />
          <span className={styles.stateLabel}>page {current + 1}</span>
        </div>
      </Row>
    </Section>
  )
}

function DirectionSection() {
  return (
    <Section title="Direction">
      <Row label="prev"><DirectionIndicator direction="prev" /></Row>
      <Row label="next"><DirectionIndicator direction="next" /></Row>
    </Section>
  )
}

function StepSection() {
  return (
    <Section title="Step">
      <Row label="step 1"><StepIndicator step={1} /></Row>
      <Row label="step 2"><StepIndicator step={2} /></Row>
      <Row label="completed"><StepIndicator step={1} completed /></Row>
      <Row label="sequence">
        <StepIndicator step={1} completed />
        <StepIndicator step={2} completed />
        <StepIndicator step={3} />
      </Row>
    </Section>
  )
}

function BadgeSection() {
  return (
    <Section title="Badge">
      <Row label="count=3"><BadgeIndicator count={3} /></Row>
      <Row label="count=42"><BadgeIndicator count={42} /></Row>
      <Row label="count=100"><BadgeIndicator count={100} /></Row>
      <Row label="count=0"><BadgeIndicator count={0} /><span className={styles.stateLabel}>(hidden)</span></Row>
    </Section>
  )
}

function OverflowSection() {
  return (
    <Section title="Overflow">
      <Row label="count=3"><OverflowIndicator count={3} /></Row>
      <Row label="count=12"><OverflowIndicator count={12} /></Row>
      <Row label="count=0"><OverflowIndicator count={0} /><span className={styles.stateLabel}>(hidden)</span></Row>
    </Section>
  )
}

function GripSection() {
  return (
    <Section title="Grip">
      <Row label="vertical"><GripIndicator /></Row>
      <Row label="horizontal"><GripIndicator orientation="horizontal" /></Row>
    </Section>
  )
}

function TreeConnectorSection() {
  return (
    <Section title="Tree Connector">
      <Row label="level=1"><TreeConnector level={1} /></Row>
      <Row label="isLast"><TreeConnector level={1} isLast /></Row>
      <Row label="level=0"><TreeConnector level={0} /><span className={styles.stateLabel}>(hidden)</span></Row>
    </Section>
  )
}

export default function IndicatorsDemo() {
  return (
    <div className={styles.root}>
      <ExpandSection />
      <CheckSection />
      <IndeterminateSection />
      <RadioSection />
      <SwitchSection />
      <SortSection />
      <SpinnerSection />
      <ProgressSection />
      <SkeletonSection />
      <StatusSection />
      <PageSection />
      <DirectionSection />
      <StepSection />
      <BadgeSection />
      <OverflowSection />
      <GripSection />
      <TreeConnectorSection />
      <SeparatorSection />
    </div>
  )
}
