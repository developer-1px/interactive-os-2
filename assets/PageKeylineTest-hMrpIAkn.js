var e=`/** Key Line 테스트 — role별 실측 높이 비교 + level 자동 분류 */
// @useState-hatch — inspector/measurements는 뷰 상태, engine 축 해당 없음
import { useCallback, useMemo, useState } from 'react'
import { ax } from '@styles/ax'
import { Button } from '../../interactive-os/ui/Button'
import {
  buildDemoEntries,
  isKeylineTarget,
  LEVEL_ORDER,
  ROLE_EXPECTED,
  ROLE_ORDER,
  TOLERANCE,
  type DemoEntry,
} from './keylineClassify'
import { IndicatorSection, LevelSection, RoleSection } from './KeylineSections'
import { VerticalRoleSection } from './VerticalKeylineSections'
import css from './PageKeylineTest.module.css'

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
    <div className={\`\${ax({ layout: 'stack', gap: 'xl', padding: 'lg' })} \${wrapperClass ?? ''}\`}>
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
            key={\`v-\${role}\`}
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
`;export{e as default};