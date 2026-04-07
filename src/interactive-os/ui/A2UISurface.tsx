// ② 2026-04-04-a2ui-surface-showcase-prd.md
import React, { useMemo, useState } from 'react'
import type { A2UIPayload } from './a2uiAdapter'
import { a2uiToNormalized, isSafeDepth } from './a2uiAdapter'
import type { A2UIComponentMap, A2UIRenderContext } from './a2uiComponentMap'
import { ROOT_ID } from '@os/store/types'
import { createStore, getChildren } from '@os/store/createStore'
import { ListBox } from './ListBox'
import { TabList } from './TabList'
import { RadioGroup } from './RadioGroup'
import { Checkbox } from './Checkbox'
import { Slider } from './Slider'
import { Button } from './Button'
import { TextInput } from './TextInput'
import { ax } from '@styles/ax'

// ── Shared helpers ──

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
  const d = entity.data as Record<string, unknown>
  const justify = d.justify as string | undefined
  const align = d.align as string | undefined
  const weight = d.weight as number | undefined

  const layoutMap: Record<string, 'row' | 'bar' | 'spread'> = {
    'space-between': 'spread',
    center: 'bar',
  }
  const layout = (justify ? layoutMap[justify] : undefined) ?? 'row'

  return (
    <div
      className={ax({ layout, gap: 'md' })}
      {...(weight != null ? { 'data-weight': weight } : {})}
      {...(align === 'center' ? { 'data-align': 'center' } : {})}
    >
      {renderChildren(entity.id, depth)}
    </div>
  )
}

function columnRenderer({ entity, renderChildren, depth }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const weight = d.weight as number | undefined

  return (
    <div
      className={ax({ layout: 'stack', gap: 'md' })}
      {...(weight != null ? { 'data-weight': weight } : {})}
    >
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

function buttonRenderer({ entity, renderNode, depth, onAction }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const label = (d.label as string) ?? (d.text as string) ?? 'Button'
  const variant = d.variant === 'primary' ? 'accent' : 'ghost'
  const child = d.child as string | undefined
  const action = d.action as { event?: { name: string; context?: Record<string, unknown> }; functionCall?: { call: string; args: Record<string, unknown> } } | undefined

  const handleClick = () => {
    if (!action) return
    if (action.event && onAction) {
      onAction(entity.id, action.event.name, action.event.context)
    }
    if (action.functionCall?.call === 'openUrl') {
      const url = action.functionCall.args?.url as string | undefined
      if (url) window.open(url, '_blank', 'noopener')
    }
  }

  return (
    <Button variant={variant} onClick={handleClick}>
      {child ? renderNode(child, depth + 1) : label}
    </Button>
  )
}

function textFieldRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const label = (d.label as string) ?? ''
  const value = (d.value as string) ?? ''
  const variant = d.variant as string | undefined

  return (
    <div className={ax({ layout: 'stack', gap: 'xs' })}>
      {label && <label className={ax({ textStyle: 'label', text: 'secondary' })}>{label}</label>}
      {variant === 'longText' ? (
        <textarea
          className={ax({ surface: 'input', padding: 'sm', shape: 'sm', textStyle: 'body' })}
          defaultValue={value}
          placeholder={label}
          aria-label={label}
          rows={4}
        />
      ) : (
        <TextInput defaultValue={value} placeholder={label} aria-label={label} />
      )}
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
    />
  )
}

function TabsRenderer({ entity, store, renderNode, depth }: A2UIRenderContext) {
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
      />
      <div className={ax({ padding: 'md' })}>
        {tabItems[activeIndex]?.child && store.entities[tabItems[activeIndex].child]
          ? renderNode(tabItems[activeIndex].child, depth + 1)
          : null}
      </div>
    </div>
  )
}

function choicePickerRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const options = (d.options as Array<{ id: string; label: string }>) ?? []
  const variant = d.variant as string | undefined

  const optionStore = createStore({
    entities: Object.fromEntries(
      options.map((opt) => [opt.id, { id: opt.id, data: { label: opt.label, checked: false } }]),
    ),
    relationships: { [ROOT_ID]: options.map((opt) => opt.id) },
  })

  if (variant === 'multiSelect') {
    return (
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        {options.map((opt) => {
          const checkStore = createStore({
            entities: { [opt.id]: { id: opt.id, data: { label: opt.label, checked: false } } },
            relationships: { [ROOT_ID]: [opt.id] },
          })
          return (
            <Checkbox
              key={opt.id}
              data={checkStore}
              plugins={[]}
              aria-label={opt.label}
            />
          )
        })}
      </div>
    )
  }

  return (
    <RadioGroup
      data={optionStore}
      plugins={[]}
      aria-label={(d.label as string) ?? 'Choice'}
    />
  )
}

function dividerRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const axis = d.axis as string | undefined

  if (axis === 'vertical') {
    return <div className={ax({ layout: 'column', border: 'end' })} role="separator" aria-orientation="vertical" />
  }
  return <hr className={ax({ width: 'full' })} />
}

function imageRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const url = (d.url as string) ?? ''
  const alt = (d.alt as string) ?? ''
  return <img src={url} alt={alt} className={ax({ width: 'full', shape: 'md' })} />
}

function modalRenderer({ entity, store, renderNode, depth }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const contentChildId = d.contentChild as string | undefined
  // Read-only: just render the content inline (no actual modal trigger)
  if (contentChildId && store.entities[contentChildId]) {
    return (
      <div className={ax({ surface: 'overlay', padding: 'md', shape: 'md' })}>
        {renderNode(contentChildId, depth + 1)}
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
      <div className={ax({ text: 'muted', textStyle: 'caption' })}>Unknown: {component}</div>
      <pre className={ax({ textStyle: 'code', text: 'secondary' })}>
        {JSON.stringify(d, null, 2)}
      </pre>
    </div>
  )
}

function iconRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const name = (d.name as string) ?? 'icon'
  return <span className={ax({ textStyle: 'label', text: 'secondary' })}>{name}</span>
}

function videoRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const url = (d.url as string) ?? ''
  return <video src={url} controls className={ax({ width: 'full', shape: 'md' })} />
}

function audioPlayerRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const url = (d.url as string) ?? ''
  return <audio src={url} controls className={ax({ width: 'full' })} />
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
  Icon: iconRenderer,
  Video: videoRenderer,
  AudioPlayer: audioPlayerRenderer,
}

// ── A2UISurface ──

interface A2UISurfaceProps {
  payload: A2UIPayload
  componentMap?: A2UIComponentMap
  surfaceId?: string
  onAction?: (componentId: string, actionName: string, context?: Record<string, unknown>) => void
  dataModel?: Record<string, unknown>
}

export function A2UISurface({ payload, componentMap, surfaceId, onAction, dataModel }: A2UISurfaceProps) {
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
      renderNode,
      renderChildren: (parentId, d) => {
        const childIds = getChildren(store, parentId)
        return childIds.map((cid) => (
          <React.Fragment key={cid}>{renderNode(cid, d + 1)}</React.Fragment>
        ))
      },
      depth,
      surfaceId,
      onAction,
      dataModel: dataModel ?? payload.dataModel,
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
