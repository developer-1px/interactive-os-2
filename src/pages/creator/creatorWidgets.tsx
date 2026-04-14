import { Suspense, lazy, useMemo, useState, useCallback } from 'react' // @useState-hatch: filter는 로컬 검색 입력
import { useParams, useNavigate } from 'react-router-dom'

import { demoRegistry, demoSources, findDemo } from './demoRegistry'
import { NavList } from '@os/ui/NavList'
import { TextInput } from '@os/ui/TextInput'
import { CodeBlock } from '@os/ui/CodeBlock'
import { PanelHeader } from '@os/ui/PanelHeader'
import { createStore, addEntity } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { ax } from '@styles/ax'

// ── Shared state ──

function useSelectedName() {
  const params = useParams()
  const segment = (params['*'] ?? '').split('/')[0]
  return demoRegistry.find((e) => e.name === segment)?.name ?? demoRegistry[0]?.name ?? ''
}

// Lazy demo cache
const lazyCache = new Map<string, React.LazyExoticComponent<React.ComponentType>>()

function getLazyDemo(name: string) {
  if (lazyCache.has(name)) return lazyCache.get(name)!
  const entry = findDemo(name)
  if (!entry) return null
  const LazyDemo = lazy(async () => {
    const mod = await entry.loadDemo()
    return { default: mod.Demo }
  })
  lazyCache.set(name, LazyDemo)
  return LazyDemo
}

// ── Sidebar widget ──

function CreatorSidebar() {
  const [filter, setFilter] = useState('') // @useState-hatch: filter
  const navigate = useNavigate()
  const selectedName = useSelectedName()

  const navData = useMemo(() => {
    let s = createStore()
    const lower = filter.toLowerCase()
    for (const entry of demoRegistry) {
      if (lower && !entry.name.toLowerCase().includes(lower)) continue
      s = addEntity(s, { id: entry.name, data: { label: entry.name } }, ROOT_ID)
    }
    return s
  }, [filter])

  const handleSelect = useCallback(
    (name: string) => navigate(`/creator/${name}`),
    [navigate],
  )

  return (
    <div className={ax({ layout: 'stack', scroll: 'hidden' })}>
      <PanelHeader axes={{ textStyle: 'caption' }}>
        <span className={ax({ weight: 'semi' })}>Components</span>
        <span className={ax({ text: 'muted' })}>{demoRegistry.length}</span>
      </PanelHeader>
      <div className={ax({ padding: 'sm' })}>
        <TextInput
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter components"
        />
      </div>
      <div className={ax({ flex: '1', scroll: 'y' })}>
        <NavList
          data={navData}
          plugins={[]}
          onActivate={handleSelect}
          initialFocus={selectedName}
          aria-label="Component list"
        />
      </div>
    </div>
  )
}

// ── Preview widget ──

function CreatorPreview() {
  const selectedName = useSelectedName()
  const LazyDemo = selectedName ? getLazyDemo(selectedName) : null

  return (
    <div className={ax({ scroll: 'y', padding: 'lg' })}>
      <PanelHeader axes={{ textStyle: 'caption' }}>
        <span className={ax({ weight: 'semi' })}>{selectedName || 'Select a component'}</span>
      </PanelHeader>
      {LazyDemo ? (
        <Suspense fallback={<div className={ax({ padding: 'md', text: 'muted' })}>Loading...</div>}>
          <LazyDemo />
        </Suspense>
      ) : (
        <div className={ax({ layout: 'center', padding: 'xl', text: 'muted' })}>
          컴포넌트를 선택하세요
        </div>
      )}
    </div>
  )
}

// ── Source widget ──

function CreatorSource() {
  const selectedName = useSelectedName()
  const demoSource = selectedName ? (demoSources[selectedName] ?? '') : ''

  return (
    <div className={ax({ scroll: 'y' })}>
      <PanelHeader axes={{ textStyle: 'caption' }}>
        <span className={ax({ weight: 'semi' })}>Source</span>
        <span className={ax({ text: 'muted' })}>{selectedName}.demo.tsx</span>
      </PanelHeader>
      {demoSource ? (
        <CodeBlock code={demoSource} filename={`${selectedName}.demo.tsx`} variant="flush" />
      ) : (
        <div className={ax({ layout: 'center', padding: 'xl', text: 'muted' })}>No source</div>
      )}
    </div>
  )
}

// ── Registry ──

export const creatorWidgets = createWidgetRegistry({
  CreatorSidebar,
  CreatorPreview,
  CreatorSource,
})
