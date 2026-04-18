var e=`/** Key Line 수직 섹션 컴포넌트 — VerticalDemoSlot, VerticalRoleSection */
import { Suspense, useEffect, useRef, useState } from 'react'
import { ax } from '@styles/ax'
import { measureLeadingX, mostCommon, TOLERANCE, type DemoEntry } from './keylineClassify'
import css from './PageKeylineTest.module.css'

// ── vertical 실측 슬롯 ──

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

export function VerticalRoleSection({
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
    ? \`linear-gradient(to right, transparent \${guideLeadingX}px, rgba(100,200,100,0.6) \${guideLeadingX}px, rgba(100,200,100,0.6) \${guideLeadingX + 1}px, transparent \${guideLeadingX + 1}px)\`
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
`;export{e as default};