/** Key Line 전방위 테스트 페이지 — 모든 demo를 role별 배치 + inspector overlay */
// @useState-hatch — inspector/layout 토글은 뷰 상태, engine 축 해당 없음
import { Suspense, lazy, useMemo, useState, type ComponentType } from 'react'
import { ax } from '@styles/ax'
import { Button } from '../../interactive-os/ui/Button'
import keylineMap from './keylineMap.json'
import css from './PageKeylineTest.module.css'

// ── demo 모듈 자동 수집 (Vite glob) ──

type DemoModule = { Demo: ComponentType; meta: { slug: string; category: string; label: string } }

const demoModules = import.meta.glob<DemoModule>(
  '/src/interactive-os/ui/**/*.demo.tsx',
  { eager: false },
)

interface DemoEntry {
  path: string
  label: string
  role: string | null
  Component: ComponentType
}

function extractComponentName(path: string): string {
  const file = path.split('/').pop() ?? ''
  return file.replace('.demo.tsx', '')
}

function buildDemoEntries(): DemoEntry[] {
  const entries: DemoEntry[] = []
  for (const [path, loader] of Object.entries(demoModules)) {
    const compName = extractComponentName(path)
    const mapping = (keylineMap as Record<string, { role: string; content: string | null }>)[compName]
    const LazyDemo = lazy(async () => {
      const mod = await loader()
      return { default: mod.Demo }
    })
    entries.push({
      path,
      label: compName,
      role: mapping?.role ?? null,
      Component: LazyDemo,
    })
  }
  return entries.sort((a, b) => a.label.localeCompare(b.label))
}

// ── 상수 ──

const ROLE_ORDER = ['control', 'control-group', 'item', 'badge'] as const
const ROLE_META: Record<string, { height: string; font: string; legend: string }> = {
  control: { height: '36px', font: '14px/500', legend: 'red outline' },
  'control-group': { height: '36px', font: '14px/500', legend: 'red dashed' },
  item: { height: '28px', font: '13px/450', legend: 'blue outline' },
  badge: { height: 'auto', font: '12px/500', legend: 'green outline' },
}

type LayoutMode = 'inline' | 'block'

// ── 컴포넌트 ──

function RoleSection({ role, entries, mode }: { role: string; entries: DemoEntry[]; mode: LayoutMode }) {
  const meta = ROLE_META[role]
  return (
    <section className={ax({ layout: 'stack', gap: 'sm' })}>
      <div className={ax({ layout: 'row', gap: 'sm', padding: 'xs' })}>
        <span className={ax({ textStyle: 'label', text: 'primary' })}>{role}</span>
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>
          {meta?.height} / {meta?.font} / {meta?.legend} / {entries.length}
        </span>
      </div>
      <div className={`${ax({ layout: mode === 'inline' ? 'row' : 'stack', gap: 'md' })} ${css.rawRow}`}>
        {entries.map((entry) => (
          <div key={entry.path} className={ax({ layout: 'stack', gap: 'xs' })}>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>{entry.label}</span>
            <Suspense fallback={<span className={ax({ textStyle: 'caption', text: 'muted' })}>...</span>}>
              <entry.Component />
            </Suspense>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── 메인 ──

export default function PageKeylineTest() {
  const [inspector, setInspector] = useState(true)
  const [mode, setMode] = useState<LayoutMode>('inline')
  const allEntries = useMemo(buildDemoEntries, [])

  const grouped = useMemo(() => {
    const byRole: Record<string, DemoEntry[]> = {}
    for (const r of ROLE_ORDER) byRole[r] = []
    byRole.unmapped = []
    for (const entry of allEntries) {
      const key = entry.role ?? 'unmapped'
      if (!byRole[key]) byRole[key] = []
      byRole[key].push(entry)
    }
    return byRole
  }, [allEntries])

  const wrapperClass = inspector ? css.inspector : undefined

  return (
    <div className={`${ax({ layout: 'stack', gap: 'xl', padding: 'lg' })} ${wrapperClass ?? ''}`}>
      {/* 헤더 + 컨트롤 */}
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        <h1 className={ax({ textStyle: 'page', text: 'bright' })}>Key Line Test</h1>
        <p className={ax({ textStyle: 'caption', text: 'muted' })}>
          {allEntries.length} demos / inspector: {inspector ? 'ON' : 'OFF'} / {mode}
        </p>
        <div className={ax({ layout: 'row', gap: 'sm' })}>
          <Button
            variant={inspector ? 'accent' : 'ghost'}
            onClick={() => setInspector((v) => !v)}
          >
            Inspector {inspector ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant={mode === 'inline' ? 'accent' : 'ghost'}
            onClick={() => setMode('inline')}
          >
            Inline
          </Button>
          <Button
            variant={mode === 'block' ? 'accent' : 'ghost'}
            onClick={() => setMode('block')}
          >
            Block
          </Button>
        </div>
        {/* 범례 */}
        {inspector && (
          <div className={ax({ layout: 'row', gap: 'md', textStyle: 'caption', text: 'muted' })}>
            <span>control = red solid (36px)</span>
            <span>control-group = red dashed (36px)</span>
            <span>item = blue solid (28px)</span>
            <span>badge = green solid (auto)</span>
          </div>
        )}
      </div>

      {/* Role 섹션들 */}
      {ROLE_ORDER.map((role) => (
        grouped[role].length > 0 && (
          <RoleSection key={role} role={role} entries={grouped[role]} mode={mode} />
        )
      ))}

      {/* Unmapped */}
      {grouped.unmapped.length > 0 && (
        <RoleSection role="unmapped" entries={grouped.unmapped} mode={mode} />
      )}
    </div>
  )
}
