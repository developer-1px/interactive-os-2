// studioWidgets — studio 전용 위젯 확장 레지스트리.
// playgroundWidgets 위에 3가지 widget을 얹는다.
//   - ExampleSidebar: STUDIO_EXAMPLES 카탈로그 listing. 선택 시 studioContext에 전파.
//   - StreamControl: 현재 선택된 a2ui example을 useLayoutStream으로 틱 재생.
//   - A2UIStreamSurface: 스트리밍된 부분 payload를 A2UISurface로 렌더.
// studio 내부는 React context(studioContext)로 selection/stream state를 공유한다.
// @useState-hatch — studioContext 자체가 페이지-로컬 view state이므로 Provider만 관리.
import { useCallback, useMemo, useEffect, useState } from 'react'
import { ax } from '@styles/ax'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { layoutCommands } from '@os/layout/layoutCommands'
import { useFlatLayout } from '@os/ui/useFlatLayout'
import { A2UISurface } from '@os/ui/A2UISurface'
import type { A2UIPayload } from '@os/ui/a2uiAdapter'
import { Button } from '@os/ui/Button'
import { ScrollArea } from '@os/ui/ScrollArea'
import { useLayoutStream } from '@os/primitives/useLayoutStream'
import { a2uiToNormalized } from '@os/ui/a2uiAdapter'
import type { NormalizedData } from '@os/store/types'
import { playgroundWidgets } from './playgroundWidgets'
import { STUDIO_EXAMPLES, groupExamples, type StudioExample } from './studioExamples'
import type { A2UIv09Envelope } from './studioA2UIPresets'
import { StudioProvider, useStudio } from './studioContext'

function envelopeToPayload(env: A2UIv09Envelope): A2UIPayload {
  return {
    components: env.updateComponents.components,
    ...(env.dataModel ? { dataModel: env.dataModel } : {}),
  }
}

// ── ExampleSidebar ────────────────────────────────────

function ExampleSidebar() {
  const { selected, selectExample } = useStudio()
  const { dispatch } = useFlatLayout()
  const groups = useMemo(() => groupExamples(STUDIO_EXAMPLES), [])

  const activate = useCallback((ex: StudioExample) => {
    selectExample(ex)
    if (ex.kind === 'a2ui-stream') {
      dispatch(layoutCommands.updateNode('t1-body', { widget: 'A2UIStreamSurface' }))
    } else {
      dispatch(layoutCommands.updateNode('t1-body', { widget: 'PlaygroundSurface' }))
    }
  }, [selectExample, dispatch])

  return (
    <nav className={ax({ layout: 'stack', flex: '1' })} aria-label="Studio Examples">
      <div className={ax({ layout: 'bar' })}>
        <span className={ax({ textStyle: 'label' })}>Examples</span>
      </div>
      <ScrollArea>
        <div className={ax({ layout: 'stack' })}>
          {Object.entries(groups).map(([cat, items]) => (
            <section key={cat} className={ax({ layout: 'stack' })}>
              <h3 className={ax({ textStyle: 'caption' })}>{cat}</h3>
              <div className={ax({ layout: 'stack' })}>
                {items.map(it => (
                  <Button
                    key={it.id}
                    variant={selected?.id === it.id ? 'accent' : 'ghost'}
                    onClick={() => activate(it)}
                  >
                    {it.label}
                  </Button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </ScrollArea>
    </nav>
  )
}

// ── StreamControl ─────────────────────────────────────

function StreamControl() {
  const { selected, setStreamPayload } = useStudio()
  const handleUpdate = useCallback((partial: NormalizedData) => {
    const components = Object.values(partial.entities).map(e => ({
      id: e.id,
      ...(e.data as Record<string, unknown>),
    })) as A2UIPayload['components']
    setStreamPayload({ components })
  }, [setStreamPayload])

  const { streaming, progress, start, stop } = useLayoutStream(handleUpdate)

  const simulate = useCallback(() => {
    if (!selected || selected.kind !== 'a2ui-stream') return
    const env = selected.data as A2UIv09Envelope
    const full = a2uiToNormalized(envelopeToPayload(env))
    const order = Object.keys(full.entities)
    start(full, order)
  }, [selected, start])

  if (!selected || selected.kind !== 'a2ui-stream') return null

  return (
    <div className={ax({ role: 'control-group', layout: 'row', surface: 'overlay' })}>
      {streaming ? (
        <Button variant="destructive" onClick={stop}>Stop ({progress}%)</Button>
      ) : (
        <Button variant="accent" onClick={simulate}>Simulate Stream</Button>
      )}
    </div>
  )
}

// ── A2UIStreamSurface ─────────────────────────────────

function A2UIStreamSurface() {
  const { selected, streamPayload } = useStudio()
  const [fallbackPayload, setFallbackPayload] = useState<A2UIPayload | null>(null)

  useEffect(() => {
    if (selected && selected.kind === 'a2ui-stream') {
      setFallbackPayload(envelopeToPayload(selected.data as A2UIv09Envelope))
    } else {
      setFallbackPayload(null)
    }
  }, [selected])

  const payload = streamPayload ?? fallbackPayload
  if (!payload) {
    return (
      <div className={ax({ layout: 'center', flex: '1', textStyle: 'body' })}>
        Select an A2UI example from the sidebar
      </div>
    )
  }
  return (
    <div className={ax({ role: 'cell', surface: 'display', flex: '1' })}>
      <A2UISurface payload={payload} />
    </div>
  )
}

// ── Registry ──────────────────────────────────────────

export const studioWidgets = createWidgetRegistry({
  ...playgroundWidgets,
  ExampleSidebar,
  StreamControl,
  A2UIStreamSurface,
})

export { StudioProvider }
