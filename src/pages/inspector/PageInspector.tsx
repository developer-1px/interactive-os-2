import { useState, useEffect } from 'react'
import type { InspectResult } from '@os/engine/types'
import { getAllAriaActions } from '@os/primitives/ariaRegistry'
import { AppInspector } from '../../devtools/inspector/AppInspector'
import { ax } from '@styles/ax'

export default function PageInspector() {
  const [engines, setEngines] = useState<Map<string, { inspect: () => InspectResult }>>(new Map())
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    const update = () => {
      const all = getAllAriaActions()
      setEngines(new Map(all))
      if (!selectedId && all.size > 0) {
        setSelectedId(all.keys().next().value!)
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [selectedId])

  const selected = engines.get(selectedId)
  const inspectResult = selected?.inspect()
  const ids = [...engines.keys()]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">App Inspector</h2>
        <p className="page-desc">
          실행 중인 Aria 인스턴스의 engine.inspect() 실시간 데이터.
          콘솔: <code>__ARIA_ENGINES__.get('id').inspect()</code>
        </p>
      </div>

      {ids.length === 0 ? (
        <div className={ax({ padding: 'lg', text: 'muted' })}>
          등록된 Aria 인스턴스가 없습니다. Aria id prop이 설정된 컴포넌트를 포함하는 페이지를 열어주세요.
        </div>
      ) : (
        <div className={ax({ layout: 'column', gap: 'md' })}>
          {ids.length > 1 && (
            <div className={ax({ layout: 'bar', gap: 'sm' })}>
              {ids.map((id) => (
                <button
                  key={id}
                  className={ax({
                    controlSize: 'sm',
                    surface: id === selectedId ? 'action' : 'ghost',
                  })}
                  onClick={() => setSelectedId(id)}
                >
                  {id}
                </button>
              ))}
            </div>
          )}
          <div className="card overflow-hidden" style={{ minHeight: 500 }}>
            {inspectResult && <AppInspector inspectResult={inspectResult} />}
          </div>
        </div>
      )}
    </div>
  )
}
