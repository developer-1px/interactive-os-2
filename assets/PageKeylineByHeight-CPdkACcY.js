var e=`/** 컴포넌트를 실측 높이 순으로 정렬, 같은 높이끼리 가로 그룹 */
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { ax } from '@styles/ax'
import css from './PageKeylineTest.module.css'

type DemoModule = { Demo: ComponentType; meta: { slug: string; category: string; label: string } }

const demoModules = import.meta.glob<DemoModule>(
  '/src/interactive-os/ui/**/*.demo.tsx',
  { eager: true },
) as Record<string, DemoModule>

interface DemoEntry {
  path: string
  label: string
  Component: ComponentType
}

const ALL_ENTRIES: DemoEntry[] = Object.entries(demoModules).map(([path, mod]) => ({
  path,
  label: (path.split('/').pop() ?? '').replace('.demo.tsx', ''),
  Component: mod.Demo,
}))

function MeasuredSlot({ entry, onMeasure }: { entry: DemoEntry; onMeasure: (label: string, h: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (!ref.current) return
      const el = ref.current.querySelector('[class*="rl-"]') ?? ref.current.querySelector('[class*="ia-"]') ?? ref.current.firstElementChild
      if (el) onMeasure(entry.label, Math.round(el.getBoundingClientRect().height))
    })
    return () => cancelAnimationFrame(raf)
  }, [entry.label, onMeasure])

  return (
    <div ref={ref} data-component={entry.label} className={ax({ layout: 'stack', gap: 'xs' })}>
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>{entry.label}</span>
      <entry.Component />
    </div>
  )
}

export default function PageKeylineByHeight() {
  // @useState-hatch — 실측 높이 수집, engine 축 해당 없음
  const [heights, setHeights] = useState<Record<string, number>>({})

  const handleMeasure = useCallback((label: string, h: number) => {
    setHeights(prev => prev[label] === h ? prev : { ...prev, [label]: h })
  }, [])

  const groups = useMemo(() => {
    const byH = new Map<number, DemoEntry[]>()
    for (const e of ALL_ENTRIES) {
      const h = heights[e.label]
      if (h == null) continue
      if (!byH.has(h)) byH.set(h, [])
      byH.get(h)!.push(e)
    }
    return [...byH.entries()].sort((a, b) => a[0] - b[0])
  }, [heights])

  const measured = Object.keys(heights).length

  return (
    <div className={ax({ layout: 'stack', gap: 'xl', padding: 'lg' })}>
      <div className={ax({ layout: 'stack', gap: 'xs' })}>
        <h1 className={ax({ textStyle: 'page', text: 'bright' })}>Height Groups</h1>
        <p className={ax({ textStyle: 'caption', text: 'muted' })}>
          {measured}/{ALL_ENTRIES.length} measured · {groups.length} unique heights
        </p>
      </div>

      {groups.map(([h, items]) => (
        <section key={h} className={ax({ layout: 'stack', gap: 'sm' })}>
          <span className={ax({ textStyle: 'label', text: 'primary' })}>
            {h}px · {items.length} components
          </span>
          {/* backgroundImage: keyline guide — ax()에 없는 동적 값이므로 style 예외 */}
          <div
            className={\`\${ax({ layout: 'row', gap: 'md' })} \${css.rawRow}\`}
            style={{ backgroundImage: \`linear-gradient(to bottom, transparent \${h}px, rgba(100,200,100,0.4) \${h}px, rgba(100,200,100,0.4) \${h + 1}px, transparent \${h + 1}px)\` }}
          >
            {items.map(e => (
              <MeasuredSlot key={e.path} entry={e} onMeasure={handleMeasure} />
            ))}
          </div>
        </section>
      ))}

      {/* 미측정 — 제자리 렌더 */}
      {measured < ALL_ENTRIES.length && (
        <section className={ax({ layout: 'stack', gap: 'sm' })}>
          <span className={ax({ textStyle: 'label', text: 'muted' })}>
            measuring... · {ALL_ENTRIES.length - measured} remaining
          </span>
          <div className={\`\${ax({ layout: 'row', gap: 'md' })} \${css.rawRow}\`}>
            {ALL_ENTRIES.filter(e => heights[e.label] == null).map(e => (
              <MeasuredSlot key={e.path} entry={e} onMeasure={handleMeasure} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
`;export{e as default};