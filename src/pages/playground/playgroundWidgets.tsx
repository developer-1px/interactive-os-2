// definePage playground 스텁 위젯 레지스트리.
// 어떤 widget 이름이 오든 generic stub을 반환하는 Proxy. 레지스트리 누락으로 인한 렌더 실패 방지.
import type { WidgetRegistry } from '@os/layout/widgetRegistry'
import { ax } from '@styles/ax'

function makeStub(name: string) {
  return function StubWidget(props: Record<string, unknown>) {
    const keys = Object.keys(props).filter(k => k !== 'source' && k !== 'children')
    return (
      <div className={ax({ role: 'control-group', surface: 'raised', layout: 'stack', flex: '1' })}>
        <div className={ax({ role: 'badge', surface: 'display', tone: 'accent', textStyle: 'caption' })}>[{name}]</div>
        {keys.length > 0 && (
          <pre className={ax({ textStyle: 'caption' })}>
            {keys.map(k => `${k}: ${JSON.stringify(props[k])}`).join('\n')}
          </pre>
        )}
      </div>
    )
  }
}

/** 어떤 widget 이름이든 stub을 반환하는 Proxy 기반 레지스트리. */
export const playgroundWidgets: WidgetRegistry = new Proxy({} as WidgetRegistry, {
  get(_target, prop) {
    if (typeof prop !== 'string') return undefined
    return makeStub(prop)
  },
  has() { return true },
})
