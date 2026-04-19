/** Key Line — role별 가로 나열 (ax rl-* 클래스 SSOT 분류) */
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ax } from '@styles/ax'
import { buildDemoEntries, extractRole, ROLE_ORDER, type DemoEntry, type RoleKey } from './keylineClassify'
import css from './PageKeylineTest.module.css'

function DemoProbe({ entry, onRole }: { entry: DemoEntry; onRole: (label: string, role: RoleKey) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const reportedRef = useRef(false)

  useEffect(() => {
    if (!ref.current || reportedRef.current) return
    const root = ref.current
    const report = () => {
      if (reportedRef.current) return
      reportedRef.current = true
      onRole(entry.label, extractRole(root))
    }
    const observer = new MutationObserver(() => {
      if (root.querySelector('[class*="rl-"]')) report()
    })
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    if (root.querySelector('[class*="rl-"]')) report()
    const timeout = setTimeout(report, 4000)
    return () => {
      observer.disconnect()
      clearTimeout(timeout)
    }
  }, [entry.label, onRole])

  return (
    <div ref={ref} className={css.probeSlot}>
      <Suspense fallback={null}>
        <entry.Component />
      </Suspense>
    </div>
  )
}

export default function PageKeylineTest() {
  const entries = useMemo(() => buildDemoEntries(), [])
  // @useState-hatch — rl-* DOM 측정 결과 캐시, engine 축 해당 없음 (뷰 분류 버퍼)
  const [roleByLabel, setRoleByLabel] = useState<Record<string, RoleKey>>({})

  const setRole = useCallback((label: string, role: RoleKey) => {
    setRoleByLabel((prev) => (label in prev ? prev : { ...prev, [label]: role }))
  }, [])

  const probedCount = Object.keys(roleByLabel).length
  const allProbed = entries.length > 0 && probedCount >= entries.length

  if (!allProbed) {
    return (
      <div className={`${ax({ layout: 'stack' })} ${css.page}`}>
        <h1 className={ax({ textStyle: 'page' })}>
          Key Line Test · probing {probedCount}/{entries.length}
        </h1>
        <div className={`${ax({ layout: 'row' })} ${css.probeGrid}`}>
          {entries.map((e) => (
            <DemoProbe key={e.path} entry={e} onRole={setRole} />
          ))}
        </div>
      </div>
    )
  }

  const byRole: Record<RoleKey, DemoEntry[]> = { control: [], 'control-group': [], item: [], badge: [], utility: [] }
  for (const e of entries) {
    const role = roleByLabel[e.label]
    if (role) byRole[role].push(e)
  }

  return (
    <div className={`${ax({ layout: 'stack' })} ${css.page}`}>
      <h1 className={ax({ textStyle: 'page' })}>Key Line Test</h1>
      {ROLE_ORDER.map((role) =>
        byRole[role].length > 0 ? (
          <section key={role} className={ax({ layout: 'stack' })}>
            <span className={ax({ textStyle: 'label' })}>
              {role} · {byRole[role].length}
            </span>
            <div className={`${ax({ layout: 'row' })} ${css.roleRow}`} data-role={role}>
              {byRole[role].map((entry) => (
                <div key={entry.path} className={`${ax({ layout: 'stack', flex: 'none' })} ${css.slot}`}>
                  <span className={ax({ textStyle: 'caption' })}>{entry.label}</span>
                  <div className={`${ax({ placement: 'relative' })} ${css.keylineBox}`}>
                    <Suspense fallback={<span className={ax({ textStyle: 'caption' })}>...</span>}>
                      <entry.Component />
                    </Suspense>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null,
      )}
    </div>
  )
}
