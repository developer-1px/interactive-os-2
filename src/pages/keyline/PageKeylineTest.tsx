/** Key Line 테스트 — role별 실측 높이 비교 + level 자동 분류 */
// @useState-hatch — inspector/measurements는 뷰 상태, engine 축 해당 없음
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { ax } from '@styles/ax'
import { Button } from '../../interactive-os/ui/Button'
import keylineMap from './keylineMap.json'
import css from './PageKeylineTest.module.css'

// ── types ──

type KeylineEntry = { level: string; role?: string; content?: string | null }
type KMap = Record<string, KeylineEntry>

type DemoModule = { Demo: ComponentType; meta: { slug: string; category: string; label: string } }

const demoModules = import.meta.glob<DemoModule>(
  '/src/interactive-os/ui/**/*.demo.tsx',
  { eager: false },
)

interface DemoEntry {
  path: string
  label: string
  level: string
  role: string | null
  Component: ComponentType
}

// ── demo 수집 ──

function buildDemoEntries(): DemoEntry[] {
  const entries: DemoEntry[] = []
  const kmap = keylineMap as KMap
  for (const [path, loader] of Object.entries(demoModules)) {
    const label = (path.split('/').pop() ?? '').replace('.demo.tsx', '')
    const mapping = kmap[label]
    const LazyDemo = lazy(async () => {
      const mod = await loader()
      return { default: mod.Demo }
    })
    entries.push({
      path,
      label,
      level: mapping?.level ?? 'unknown',
      role: mapping?.role ?? null,
      Component: LazyDemo,
    })
  }
  return entries.sort((a, b) => a.label.localeCompare(b.label))
}

// ── 키라인 대상 판정: level이 atom/item이고 role이 있는 것 ──

const KEYLINE_LEVELS = new Set(['atom', 'item'])

function isKeylineTarget(entry: DemoEntry): boolean {
  return KEYLINE_LEVELS.has(entry.level) && entry.role != null
}

// ── 기대 높이 ──

const ROLE_EXPECTED: Record<string, number> = {
  control: 36,
  'control-group': 36,
  item: 28,
}

const ROLE_ORDER = ['control', 'control-group', 'item', 'badge'] as const
const LEVEL_ORDER = ['indicator', 'cell', 'orchestrator', 'composite', 'panel', 'standalone', 'unknown'] as const
const TOLERANCE = 1

// ── 실측 슬롯 ──

function DemoSlot({
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
      className={`${ax({ layout: 'stack', gap: 'xs' })} ${mismatch ? css.mismatch : ''}`}
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

function RoleSection({
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
      <div className={`${ax({ layout: 'row', gap: 'md' })} ${css.rawRow}`}>
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

function IndicatorSection({ entries }: { entries: DemoEntry[] }) {
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
        <div className={`${ax({ role: 'control', layout: 'row', gap: 'md', content: 'text' })} ${css.rawRow}`}>
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
        <div className={`${ax({ role: 'item', layout: 'row', gap: 'md', content: 'text' })} ${css.rawRow}`}>
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

function LevelSection({
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
      <div className={`${ax({ layout: 'row', gap: 'md' })} ${css.rawRow}`}>
        {entries.map((entry) => (
          <DemoSlot key={entry.path} entry={entry} onMeasure={onMeasure} mismatch={false} />
        ))}
      </div>
    </section>
  )
}

function mostCommon(nums: number[]): number {
  const freq = new Map<number, number>()
  for (const n of nums) freq.set(n, (freq.get(n) ?? 0) + 1)
  let best = nums[0]
  let bestCount = 0
  for (const [n, c] of freq) {
    if (c > bestCount) { best = n; bestCount = c }
  }
  return best
}

// ── vertical keyline: leading x좌표 측정 ──

function measureLeadingX(container: HTMLElement): number | null {
  const el = container.querySelector('[class*="ia-"]') ?? container.querySelector('[class*="rl-"]')
  if (!el) return null
  const children = el.children
  if (children.length === 0) return Math.round(el.getBoundingClientRect().left)
  return Math.round(children[0].getBoundingClientRect().left)
}

function VerticalDemoSlot({
  entry,
  onMeasure,
  mismatch,
}: {
  entry: DemoEntry
  onMeasure: (label: string, x: number) => void
  mismatch: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const measure = () => {
      if (!ref.current) return
      const x = measureLeadingX(ref.current)
      if (x != null) onMeasure(entry.label, x)
    }
    const observer = new MutationObserver(measure)
    observer.observe(ref.current, { childList: true, subtree: true })
    measure()
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [entry.label, onMeasure])

  return (
    <div ref={ref} data-component={entry.label} className={mismatch ? css.vMismatch : ''}>
      <Suspense fallback={<span className={ax({ textStyle: 'caption', text: 'muted' })}>...</span>}>
        <entry.Component />
      </Suspense>
    </div>
  )
}

// ── vertical role section ──

function VerticalRoleSection({
  role,
  entries,
  xMeasurements,
  onMeasure,
}: {
  role: string
  entries: DemoEntry[]
  xMeasurements: Record<string, number>
  onMeasure: (label: string, x: number) => void
}) {
  const sectionRef = useRef<HTMLDivElement>(null)

  const leadingValues = entries.map((e) => xMeasurements[e.label]).filter((v): v is number => v != null)
  const leadingMode = leadingValues.length > 0 ? mostCommon(leadingValues) : null

  const leadingMismatchCount = leadingMode != null
    ? entries.filter((e) => xMeasurements[e.label] != null && Math.abs(xMeasurements[e.label] - leadingMode) > TOLERANCE).length
    : 0

  // @useState-hatch — section 기준 상대 좌표 계산용 뷰 상태, engine 축 해당 없음
  const [sectionLeft, setSectionLeft] = useState(0)
  useEffect(() => {
    if (!sectionRef.current) return
    const update = () => {
      if (sectionRef.current) setSectionLeft(sectionRef.current.getBoundingClientRect().left)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const guideLeadingX = leadingMode != null ? leadingMode - sectionLeft : null

  const guideImage = guideLeadingX != null
    ? `linear-gradient(to right, transparent ${guideLeadingX}px, rgba(100,200,100,0.6) ${guideLeadingX}px, rgba(100,200,100,0.6) ${guideLeadingX + 1}px, transparent ${guideLeadingX + 1}px)`
    : undefined

  return (
    <section ref={sectionRef} data-role={role} className={ax({ layout: 'stack', gap: 'sm' })}>
      <div className={ax({ layout: 'row', gap: 'sm', padding: 'xs' })}>
        <span className={ax({ textStyle: 'label', text: 'primary' })}>
          vertical {role} — leading {leadingMode ?? '?'}px · {entries.length} components
          {leadingMismatchCount > 0 && <span className={ax({ text: 'bright', tone: 'danger' })}> · {leadingMismatchCount} off</span>}
          {leadingMismatchCount === 0 && leadingValues.length > 0 &&
            <span className={ax({ text: 'muted' })}> · aligned</span>}
        </span>
      </div>
      <div
        className={ax({ layout: 'stack' })}
        style={{ backgroundImage: guideImage }}
      >
        {entries.map((entry) => {
          const x = xMeasurements[entry.label]
          const isMismatch = leadingMode != null && x != null && Math.abs(x - leadingMode) > TOLERANCE
          return (
            <VerticalDemoSlot
              key={entry.path}
              entry={entry}
              onMeasure={onMeasure}
              mismatch={isMismatch}
            />
          )
        })}
      </div>
    </section>
  )
}

// ── 메인 ──

export default function PageKeylineTest() {
  const [inspector, setInspector] = useState(true)
  const [measurements, setMeasurements] = useState<Record<string, number>>({})
  // @useState-hatch — vertical keyline leading x좌표 실측값, engine 축 해당 없음
  const [xMeasurements, setXMeasurements] = useState<Record<string, number>>({})
  const allEntries = useMemo(() => buildDemoEntries(), [])

  const handleMeasure = useCallback((label: string, height: number) => {
    setMeasurements((prev) => {
      if (prev[label] === height) return prev
      return { ...prev, [label]: height }
    })
  }, [])

  const handleXMeasure = useCallback((label: string, x: number) => {
    setXMeasurements((prev) => {
      if (prev[label] === x) return prev
      return { ...prev, [label]: x }
    })
  }, [])

  // 키라인 대상: role별 그룹
  const keylineGrouped = useMemo(() => {
    const byRole: Record<string, DemoEntry[]> = {}
    for (const r of ROLE_ORDER) byRole[r] = []
    for (const entry of allEntries) {
      if (isKeylineTarget(entry) && entry.role) {
        if (!byRole[entry.role]) byRole[entry.role] = []
        byRole[entry.role].push(entry)
      }
    }
    return byRole
  }, [allEntries])

  // 비키라인: level별 그룹
  const otherGrouped = useMemo(() => {
    const byLevel: Record<string, DemoEntry[]> = {}
    for (const entry of allEntries) {
      if (!isKeylineTarget(entry)) {
        if (!byLevel[entry.level]) byLevel[entry.level] = []
        byLevel[entry.level].push(entry)
      }
    }
    return byLevel
  }, [allEntries])

  const wrapperClass = inspector ? css.inspector : undefined

  // 전체 mismatch 수
  const keylineEntries = allEntries.filter(isKeylineTarget)
  const totalMismatch = ROLE_ORDER.reduce((sum, role) => {
    const entries = keylineGrouped[role] ?? []
    const expected = ROLE_EXPECTED[role]
    if (expected == null) return sum
    return sum + entries.filter((e) => measurements[e.label] != null && Math.abs(measurements[e.label] - expected) > TOLERANCE).length
  }, 0)

  return (
    <div className={`${ax({ layout: 'stack', gap: 'xl', padding: 'lg' })} ${wrapperClass ?? ''}`}>
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        <h1 className={ax({ textStyle: 'page', text: 'bright' })}>Key Line Test</h1>
        <p className={ax({ textStyle: 'caption', text: 'muted' })}>
          {allEntries.length} demos · {keylineEntries.length} keyline targets · {Object.keys(measurements).length} measured
          {totalMismatch > 0
            ? <span className={ax({ tone: 'danger', text: 'bright' })}> · {totalMismatch} height mismatch</span>
            : ' · all matched'}
        </p>
        <div className={ax({ layout: 'row', gap: 'sm' })}>
          <Button
            variant={inspector ? 'accent' : 'ghost'}
            onClick={() => setInspector((v) => !v)}
          >
            Inspector {inspector ? 'ON' : 'OFF'}
          </Button>
        </div>
        {inspector && (
          <div className={ax({ layout: 'row', gap: 'md', textStyle: 'caption', text: 'muted' })}>
            <span>red bg = height mismatch within role</span>
            <span>green outline = role assigned</span>
          </div>
        )}
      </div>

      {/* ── 키라인 대상: role별 ── */}
      {ROLE_ORDER.map((role) => (
        (keylineGrouped[role]?.length ?? 0) > 0 && (
          <RoleSection
            key={role}
            role={role}
            entries={keylineGrouped[role]}
            measurements={measurements}
            onMeasure={handleMeasure}
          />
        )
      ))}

      {/* ── vertical keyline: role별 stack 배치 ── */}
      {ROLE_ORDER.map((role) => (
        (keylineGrouped[role]?.length ?? 0) > 0 && (
          <VerticalRoleSection
            key={`v-${role}`}
            role={role}
            entries={keylineGrouped[role]}
            xMeasurements={xMeasurements}
            onMeasure={handleXMeasure}
          />
        )
      ))}

      {/* ── indicator: control/item context 안에서 렌더링 ── */}
      {(otherGrouped.indicator?.length ?? 0) > 0 && (
        <IndicatorSection entries={otherGrouped.indicator} />
      )}

      {/* ── 비키라인: level별 ── */}
      {LEVEL_ORDER.filter((l) => l !== 'indicator').map((level) => (
        (otherGrouped[level]?.length ?? 0) > 0 && (
          <LevelSection
            key={level}
            level={level}
            entries={otherGrouped[level]}
            onMeasure={handleMeasure}
          />
        )
      ))}
    </div>
  )
}
