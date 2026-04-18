var e=`/** Key Line 수평 섹션 컴포넌트 — DemoSlot, RoleSection, IndicatorSection, LevelSection */
import { Suspense, useEffect, useRef } from 'react'
import { ax } from '@styles/ax'
import { mostCommon, ROLE_EXPECTED, TOLERANCE, type DemoEntry } from './keylineClassify'
import css from './PageKeylineTest.module.css'

// ── 실측 슬롯 ──

export function DemoSlot({
  entry,
  onMeasure,
  mismatch,
}: {
  entry: DemoEntry
  onMeasure: (label: string, height: number) => void
  mismatch: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const measure = () => {
      if (!ref.current) return
      const el = ref.current.querySelector('[class*="ia-"]') ?? ref.current.querySelector('[class*="rl-"]')
      if (el) onMeasure(entry.label, Math.round(el.getBoundingClientRect().height))
    }
    const observer = new MutationObserver(measure)
    observer.observe(ref.current, { childList: true, subtree: true })
    measure()
    return () => observer.disconnect()
  }, [entry.label, onMeasure])

  return (
    <div
      ref={ref}
      data-component={entry.label}
      className={\`\${ax({ layout: 'stack', gap: 'xs' })} \${mismatch ? css.mismatch : ''}\`}
    >
      <span className={ax({ textStyle: 'caption', text: mismatch ? 'bright' : 'muted' })}>
        {entry.label}
      </span>
      <Suspense fallback={<span className={ax({ textStyle: 'caption', text: 'muted' })}>...</span>}>
        <entry.Component />
      </Suspense>
    </div>
  )
}

// ── role 섹션 (키라인 대상) ──

export function RoleSection({
  role,
  entries,
  measurements,
  onMeasure,
}: {
  role: string
  entries: DemoEntry[]
  measurements: Record<string, number>
  onMeasure: (label: string, height: number) => void
}) {
  const expected = ROLE_EXPECTED[role]
  const heights = entries.map((e) => measurements[e.label]).filter((h): h is number => h != null)
  const mode = heights.length > 0 ? mostCommon(heights) : null
  const effectiveExpected = expected ?? mode

  const mismatchCount = effectiveExpected != null
    ? entries.filter((e) => measurements[e.label] != null && Math.abs(measurements[e.label] - effectiveExpected) > TOLERANCE).length
    : 0

  return (
    <section data-role={role} className={ax({ layout: 'stack', gap: 'sm' })}>
      <div className={ax({ layout: 'row', gap: 'sm', padding: 'xs' })}>
        <span className={ax({ textStyle: 'label', text: 'primary' })}>
          {role} — expected {effectiveExpected ?? '?'}px · {entries.length} components
          {mismatchCount > 0 && <span className={ax({ text: 'bright', tone: 'danger' })}> · {mismatchCount} mismatch</span>}
        </span>
      </div>
      <div className={\`\${ax({ layout: 'row', gap: 'md' })} \${css.rawRow}\`}>
        {entries.map((entry) => {
          const h = measurements[entry.label]
          const isMismatch = effectiveExpected != null && h != null && Math.abs(h - effectiveExpected) > TOLERANCE
          return <DemoSlot key={entry.path} entry={entry} onMeasure={onMeasure} mismatch={isMismatch} />
        })}
      </div>
    </section>
  )
}

// ── indicator 섹션 — control/item context 안에서 렌더링하여 부모 따라감 증명 ──

export function IndicatorSection({ entries }: { entries: DemoEntry[] }) {
  return (
    <section className={ax({ layout: 'stack', gap: 'sm' })}>
      <div className={ax({ layout: 'row', gap: 'sm', padding: 'xs' })}>
        <span className={ax({ textStyle: 'label', text: 'muted' })}>
          indicator · {entries.length} components
        </span>
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>
          — 1em indicators inherit parent font-size
        </span>
      </div>
      {/* control context: font-size 14px → 1em = 14px */}
      <div className={ax({ layout: 'stack', gap: 'xs' })}>
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>in control context</span>
        <div className={\`\${ax({ role: 'control', layout: 'row', gap: 'md', content: 'text' })} \${css.rawRow}\`}>
          {entries.map((e) => (
            <span key={e.path} className={ax({ layout: 'row', gap: 'xs' })}>
              <span className={ax({ text: 'muted', textStyle: 'caption' })}>{e.label}</span>
              <Suspense fallback={null}><e.Component /></Suspense>
            </span>
          ))}
        </div>
      </div>
      {/* item context: font-size 13px → 1em = 13px */}
      <div className={ax({ layout: 'stack', gap: 'xs' })}>
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>in item context</span>
        <div className={\`\${ax({ role: 'item', layout: 'row', gap: 'md', content: 'text' })} \${css.rawRow}\`}>
          {entries.map((e) => (
            <span key={e.path} className={ax({ layout: 'row', gap: 'xs' })}>
              <span className={ax({ text: 'muted', textStyle: 'caption' })}>{e.label}</span>
              <Suspense fallback={null}><e.Component /></Suspense>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── level 섹션 (비키라인 — cell/composite 등) ──

export function LevelSection({
  level,
  entries,
  onMeasure,
}: {
  level: string
  entries: DemoEntry[]
  onMeasure: (label: string, height: number) => void
}) {
  return (
    <section className={ax({ layout: 'stack', gap: 'sm' })}>
      <div className={ax({ layout: 'row', gap: 'sm', padding: 'xs' })}>
        <span className={ax({ textStyle: 'label', text: 'muted' })}>
          {level} · {entries.length} components
        </span>
      </div>
      <div className={\`\${ax({ layout: 'row', gap: 'md' })} \${css.rawRow}\`}>
        {entries.map((entry) => (
          <DemoSlot key={entry.path} entry={entry} onMeasure={onMeasure} mismatch={false} />
        ))}
      </div>
    </section>
  )
}
`;export{e as default};