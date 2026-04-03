// ② 2026-04-04-a2ui-surface-showcase-prd.md
import React, { useMemo, useState } from 'react'
import type { A2UIPayload } from './a2uiAdapter'
import { a2uiToNormalized, isSafeDepth } from './a2uiAdapter'
import type { A2UIComponentMap, A2UIRenderContext } from './a2uiComponentMap'
import { ROOT_ID } from '@os/store/types'
import { createStore, getChildren } from '@os/store/createStore'
import type { NodeState } from '@os/pattern/types'
import { ListBox } from './ListBox'
import { TabList } from './TabList'
import { RadioGroup } from './RadioGroup'
import { Checkbox } from './Checkbox'
import { Slider } from './Slider'
import { Button } from './Button'
import { TextInput } from './TextInput'
import { ax } from '@styles/ax'

// ── Shared helpers ──

function listItemCls(state: NodeState) {
  return [
    'list-item',
    state.focused && 'list-item--focused',
    state.selected && !state.focused && 'list-item--selected',
  ].filter(Boolean).join(' ')
}

// ── Default component map: A2UI type → our UI component ──

function textRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const text = (d.text as string) ?? ''
  const variant = d.variant as string | undefined

  // Map A2UI variant to ax textStyle
  const textStyleMap: Record<string, string> = {
    h1: 'hero', h2: 'display', h3: 'page', h4: 'section', h5: 'label',
    caption: 'caption', body: 'body',
  }
  const textStyle = textStyleMap[variant ?? 'body'] ?? 'body'

  return <div className={ax({ textStyle: textStyle as 'body' })}>{text}</div>
}

function rowRenderer({ entity, renderChildren, depth }: A2UIRenderContext) {
  return (
    <div className={ax({ layout: 'row', gap: 'md' })}>
      {renderChildren(entity.id, depth)}
    </div>
  )
}

function columnRenderer({ entity, renderChildren, depth }: A2UIRenderContext) {
  return (
    <div className={ax({ layout: 'stack', gap: 'md' })}>
      {renderChildren(entity.id, depth)}
    </div>
  )
}

function cardRenderer({ entity, renderChildren, depth }: A2UIRenderContext) {
  return (
    <div className={ax({ surface: 'display', padding: 'md', shape: 'md' })}>
      {renderChildren(entity.id, depth)}
    </div>
  )
}

function buttonRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const label = (d.label as string) ?? (d.text as string) ?? 'Button'
  const variant = d.variant === 'primary' ? 'accent' : 'ghost'
  return <Button variant={variant}>{label}</Button>
}

function textFieldRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const label = (d.label as string) ?? ''
  const value = (d.value as string) ?? ''
  return (
    <div className={ax({ layout: 'stack', gap: 'xs' })}>
      {label && <label className={ax({ textStyle: 'label', text: 'secondary' })}>{label}</label>}
      <TextInput defaultValue={value} placeholder={label} aria-label={label} />
    </div>
  )
}

function checkboxRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const label = (d.label as string) ?? 'Checkbox'
  const checked = Boolean(d.value)

  const store = createStore({
    entities: { [entity.id]: { id: entity.id, data: { label, checked } } },
    relationships: { [ROOT_ID]: [entity.id] },
  })

  return (
    <Checkbox
      data={store}
      plugins={[]}
      aria-label={label}
      renderItem={(props, node, state: NodeState) => {
        const nd = node.data as Record<string, unknown>
        return (
          <div {...props} className={ax({ layout: 'row', gap: 'sm' })}>
            <span>{state.selected || nd?.checked ? '☑' : '☐'}</span>
            <span>{nd?.label as string}</span>
          </div>
        )
      }}
    />
  )
}

function sliderRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const min = (d.minValue as number) ?? 0
  const max = (d.maxValue as number) ?? 100
  const step = (d.step as number) ?? 1
  const value = (d.value as number) ?? min

  const store = createStore({
    entities: { [entity.id]: { id: entity.id, data: { value } } },
    relationships: { [ROOT_ID]: [entity.id] },
  })

  return (
    <Slider
      data={store}
      min={min}
      max={max}
      step={step}
      plugins={[]}
      aria-label={(d.label as string) ?? 'Slider'}
    />
  )
}

function listRenderer({ entity, store }: A2UIRenderContext) {
  const childIds = getChildren(store, entity.id)
  if (childIds.length === 0) return null

  const listStore = createStore({
    entities: Object.fromEntries(
      childIds.map((cid) => {
        const childEntity = store.entities[cid]
        const cd = childEntity?.data as Record<string, unknown> | undefined
        const label = (cd?.text as string) ?? (cd?.label as string) ?? cid
        return [cid, { id: cid, data: { label, ...cd } }]
      }),
    ),
    relationships: { [ROOT_ID]: childIds },
  })

  return (
    <ListBox
      data={listStore}
      plugins={[]}
      aria-label={(entity.data as Record<string, unknown>)?.['aria-label'] as string ?? 'List'}
      renderItem={(props, node, state: NodeState) => {
        const nd = node.data as Record<string, unknown>
        return <div {...props} className={listItemCls(state)}>{nd?.label as string}</div>
      }}
    />
  )
}

function TabsRenderer({ entity, store, renderChildren, depth }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const tabItems = (d.tabItems as Array<{ title: string; child: string }>) ?? []
  const [activeIndex, setActiveIndex] = useState(0)

  if (tabItems.length === 0) return null

  const tabStore = createStore({
    entities: Object.fromEntries(
      tabItems.map((item, i) => {
        const id = `tab-${i}`
        return [id, { id, data: { label: item.title } }]
      }),
    ),
    relationships: { [ROOT_ID]: tabItems.map((_, i) => `tab-${i}`) },
  })

  return (
    <div className={ax({ layout: 'stack', gap: 'md' })}>
      <TabList
        data={tabStore}
        plugins={[]}
        aria-label={(d['aria-label'] as string) ?? 'Tabs'}
        onActivate={(nodeId) => {
          const idx = parseInt(nodeId.replace('tab-', ''), 10)
          if (!isNaN(idx)) setActiveIndex(idx)
        }}
        renderItem={(props, node, state: NodeState) => {
          const nd = node.data as Record<string, unknown>
          return <div {...props} className={listItemCls(state)}>{nd?.label as string}</div>
        }}
      />
      <div className={ax({ padding: 'md' })}>
        {tabItems[activeIndex]?.child && store.entities[tabItems[activeIndex].child]
          ? renderChildren(tabItems[activeIndex].child, depth)
          : null}
      </div>
    </div>
  )
}

function choicePickerRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const options = (d.options as Array<{ id: string; label: string }>) ?? []

  const store = createStore({
    entities: Object.fromEntries(
      options.map((opt) => [opt.id, { id: opt.id, data: { label: opt.label } }]),
    ),
    relationships: { [ROOT_ID]: options.map((opt) => opt.id) },
  })

  return (
    <RadioGroup
      data={store}
      plugins={[]}
      aria-label={(d.label as string) ?? 'Choice'}
      renderItem={(props, node, state: NodeState) => {
        const nd = node.data as Record<string, unknown>
        return (
          <div {...props} className={listItemCls(state)}>
            <span>{state.selected ? '◉' : '○'}</span>
            <span>{nd?.label as string}</span>
          </div>
        )
      }}
    />
  )
}

function dividerRenderer() {
  return <hr className={ax({ width: 'full' })} />
}

function imageRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const url = (d.url as string) ?? ''
  const alt = (d.alt as string) ?? ''
  return <img src={url} alt={alt} className={ax({ width: 'full', shape: 'md' })} />
}

function modalRenderer({ entity, store, renderChildren, depth }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const contentChildId = d.contentChild as string | undefined
  // Read-only: just render the content inline (no actual modal trigger)
  if (contentChildId && store.entities[contentChildId]) {
    return (
      <div className={ax({ surface: 'overlay', padding: 'md', shape: 'md' })}>
        {renderChildren(contentChildId, depth)}
      </div>
    )
  }
  return null
}

function dateTimeInputRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const label = (d.label as string) ?? 'Date'
  return (
    <div className={ax({ layout: 'stack', gap: 'xs' })}>
      {label && <label className={ax({ textStyle: 'label', text: 'secondary' })}>{label}</label>}
      <TextInput aria-label={label} placeholder="YYYY-MM-DD" />
    </div>
  )
}

function fallbackRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const component = (d.component as string) ?? 'Unknown'
  return (
    <div className={ax({ surface: 'sunken', padding: 'sm', shape: 'sm', textStyle: 'code' })}>
      <div className={ax({ text: 'muted', textStyle: 'caption' })}>⚠ {component}</div>
      <pre className={ax({ textStyle: 'code', text: 'secondary' })}>
        {JSON.stringify(d, null, 2)}
      </pre>
    </div>
  )
}

const defaultComponentMap: A2UIComponentMap = {
  Text: textRenderer,
  Row: rowRenderer,
  Column: columnRenderer,
  Card: cardRenderer,
  Button: buttonRenderer,
  TextField: textFieldRenderer,
  CheckBox: checkboxRenderer,
  Slider: sliderRenderer,
  List: listRenderer,
  Tabs: (ctx) => <TabsRenderer {...ctx} />,
  ChoicePicker: choicePickerRenderer,
  Divider: dividerRenderer,
  Image: imageRenderer,
  Modal: modalRenderer,
  DateTimeInput: dateTimeInputRenderer,
  // Icon, Video, AudioPlayer — not mapped, will use fallback
}

// ── A2UISurface ──

interface A2UISurfaceProps {
  payload: A2UIPayload
  componentMap?: A2UIComponentMap
}

export function A2UISurface({ payload, componentMap }: A2UISurfaceProps) {
  const mergedMap = useMemo(
    () => ({ ...defaultComponentMap, ...componentMap }),
    [componentMap],
  )

  const store = useMemo(() => a2uiToNormalized(payload), [payload])

  const renderNode = (nodeId: string, depth: number): React.ReactNode => {
    if (!isSafeDepth(depth)) return null
    const entity = store.entities[nodeId]
    if (!entity) return null

    const d = entity.data as Record<string, unknown>
    const componentType = (d?.component as string) ?? ''
    const renderer = mergedMap[componentType] ?? fallbackRenderer

    const ctx: A2UIRenderContext = {
      entity,
      store,
      renderChildren: (parentId, d) => {
        const childIds = getChildren(store, parentId)
        return childIds.map((cid) => (
          <React.Fragment key={cid}>{renderNode(cid, d + 1)}</React.Fragment>
        ))
      },
      depth,
    }

    return renderer(ctx)
  }

  const rootIds = getChildren(store, ROOT_ID)

  return (
    <div className={ax({ layout: 'stack', gap: 'md' })}>
      {rootIds.map((id) => (
        <React.Fragment key={id}>{renderNode(id, 0)}</React.Fragment>
      ))}
    </div>
  )
}
