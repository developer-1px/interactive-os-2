// playgroundWidgets — /playground 전용 위젯 레지스트리.
// PlaygroundSurface: 탭의 contentRef(demo 이름)를 읽어 ui/*.demo.tsx의 Demo를 lazy 렌더.
//   contentRef가 BUILTIN_WIDGETS 이름(e.g., 'PlaygroundChatLog')이면 해당 playground 전용 widget으로 렌더.
// PickerRoot: __picker.targetTabId를 구독해 PickerDialog를 전역 단일로 렌더.
// EmptySlot의 + 버튼과 ⌘P 단축키가 같은 __picker state를 set.
// @useState-hatch — PickerDialog의 query 필터는 순수 view preference.
import { useState, useRef, useEffect, useMemo, lazy, Suspense, type ComponentType, type ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { ax } from '@styles/ax'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { layoutCommands } from '@os/layout/layoutCommands'
import { getEntityData } from '@os/schema'
import { useFlatLayout } from '@os/ui/useFlatLayout'
import { useFlatLayoutSurface } from '@os/ui/useFlatLayoutSurface'
import { Button } from '@os/ui/Button'
import { Badge } from '@os/ui/Badge'
import { Kbd } from '@os/ui/Kbd'
import { TextInput } from '@os/ui/TextInput'
import { ScrollArea } from '@os/ui/ScrollArea'
import { PanelHeader } from '@os/ui/PanelHeader'
import { findDemo } from '../creator/demoRegistry'
import { PLAYGROUND_CATALOG, groupCatalog, type CatalogEntry } from './playgroundCatalog'
import { PICKER_STATE_ID, type PickerStateData } from './playgroundDefaults'
import { PlaygroundComposerWidget, PlaygroundSubtitleWidget, PlaygroundChatLogWidget } from './playgroundChatWidgets'

// ── Lazy demo loader ──────────────────────────────────

const demoComponentCache = new Map<string, ComponentType>()

function getDemoComponent(name: string): ComponentType | null {
  const cached = demoComponentCache.get(name)
  if (cached) return cached
  const entry = findDemo(name)
  if (!entry) return null
  const Component = lazy(async () => {
    const mod = await entry.loadDemo()
    return { default: mod.Demo }
  })
  demoComponentCache.set(name, Component)
  return Component
}

// ── Picker Dialog ─────────────────────────────────────

interface PickerDialogProps {
  onClose: () => void
  onPick: (entry: CatalogEntry) => void
}

function PickerDialog({ onClose, onPick }: PickerDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  // @useState-hatch — 필터 쿼리(순수 view)
  const [query, setQuery] = useState('')

  useEffect(() => {
    ref.current?.showModal?.()
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = () => onClose()
    el.addEventListener('close', handler)
    return () => el.removeEventListener('close', handler)
  }, [onClose])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? PLAYGROUND_CATALOG.filter((e) => e.label.toLowerCase().includes(q))
      : PLAYGROUND_CATALOG
    return groupCatalog(filtered)
  }, [query])

  return (
    <dialog
      ref={ref}
      className={ax({ role: 'control-group', surface: 'overlay', width: 'lg' })}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className={ax({ layout: 'stack', width: 'full' })}>
        <div className={ax({ layout: 'spread', width: 'full' })}>
          <span className={ax({ textStyle: 'section' })}>컴포넌트 선택</span>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <Kbd>ESC</Kbd>
          </Button>
        </div>
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${PLAYGROUND_CATALOG.length}개 컴포넌트 검색...`}
          autoFocus
          aria-label="Search components"
        />
        <ScrollArea>
          <div className={ax({ layout: 'stack', width: 'full' })}>
            {groups.map(([category, entries]) => (
              <section
                key={category}
                className={ax({ role: 'control-group', layout: 'stack', width: 'full' })}
              >
                <PanelHeader>{category} · {entries.length}</PanelHeader>
                <div className={ax({ layout: 'grid-4', width: 'full' })}>
                  {entries.map((entry) => (
                    <Button
                      key={entry.widget}
                      variant="outline"
                      onClick={() => onPick(entry)}
                    >
                      {entry.label}
                    </Button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </ScrollArea>
      </div>
    </dialog>
  )
}

// ── PickerRoot — 전역 picker 컨트롤러. __picker state 구독. ──

export function PickerRootWidget() {
  const { store, dispatch } = useFlatLayout()
  const picker = getEntityData<PickerStateData>(store, PICKER_STATE_ID)
  const targetTabId = picker?.targetTabId ?? null

  if (!targetTabId) return null

  const close = () => dispatch(layoutCommands.updateNode(PICKER_STATE_ID, { targetTabId: null }))
  const pick = (entry: CatalogEntry) => {
    dispatch(layoutCommands.updateNode(targetTabId, { contentRef: entry.widget, label: entry.label }))
    close()
  }

  return <PickerDialog onClose={close} onPick={pick} />
}

// ── EmptySlot ─────────────────────────────────────────

function EmptySlot() {
  const { dispatch } = useFlatLayout()
  const surface = useFlatLayoutSurface()
  const tabId = surface?.tabNodeId

  return (
    <div className={ax({ layout: 'center', flex: '1', width: 'full' })}>
      <Button
        variant="secondary"
        icon
        aria-label="컴포넌트 추가"
        onClick={() => {
          if (!tabId) return
          dispatch(layoutCommands.updateNode(PICKER_STATE_ID, { targetTabId: tabId }))
        }}
      >
        <Plus />
      </Button>
    </div>
  )
}

// ── Status slots ──────────────────────────────────────

function UnknownSlot({ name }: { name: string }) {
  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'center', flex: '1', width: 'full' })}>
      <span className={ax({ textStyle: 'caption' })}>Unknown demo: {name}</span>
    </div>
  )
}

function LoadingSlot() {
  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'center', flex: '1', width: 'full' })}>
      <span className={ax({ textStyle: 'caption' })}>Loading...</span>
    </div>
  )
}

// ── Built-in playground widgets — catalog 밖, 코드가 소유하는 특수 렌더러 ─

const BUILTIN_WIDGETS: Record<string, () => ReactElement> = {
  PlaygroundChatLog: () => <PlaygroundChatLogWidget />,
}

// ── PlaygroundSurface ─────────────────────────────────

function PlaygroundSurfaceWidget() {
  const surface = useFlatLayoutSurface()
  const { dispatch } = useFlatLayout()
  const name = surface?.tabData?.contentRef ?? ''
  const tabId = surface?.tabNodeId

  const Demo = useMemo(() => (name ? getDemoComponent(name) : null), [name])

  if (!name) return <EmptySlot />

  const builtin = BUILTIN_WIDGETS[name]
  if (builtin) return builtin()

  return (
    <div className={ax({ layout: 'stack', flex: '1', width: 'full' })}>
      <div className={ax({ layout: 'spread', width: 'full' })}>
        <Badge tone="accent">{name}</Badge>
        <Button
          variant="ghost"
          onClick={() => {
            if (!tabId) return
            dispatch(layoutCommands.updateNode(tabId, { contentRef: '', label: 'Untitled' }))
          }}
        >
          Clear
        </Button>
      </div>
      <ScrollArea>
        {Demo ? (
          <Suspense fallback={<LoadingSlot />}>
            {/* eslint-disable-next-line react-hooks/static-components -- Demo is lazy-loaded, cached by name outside render */}
            <Demo />
          </Suspense>
        ) : (
          <UnknownSlot name={name} />
        )}
      </ScrollArea>
    </div>
  )
}

// ── Registry ──────────────────────────────────────────

export const playgroundWidgets = createWidgetRegistry({
  PlaygroundSurface:  PlaygroundSurfaceWidget,
  PickerRoot:         PickerRootWidget,
  PlaygroundComposer: PlaygroundComposerWidget,
  PlaygroundSubtitle: PlaygroundSubtitleWidget,
  PlaygroundChatLog:  PlaygroundChatLogWidget,
})
