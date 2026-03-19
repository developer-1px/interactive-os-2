import { useState, useCallback } from 'react'
import './PageVisualCms.css'
import {
  Database, Cog, Keyboard, Shield,
  ChevronRight, ArrowRight,
  List, Grid3X3, ToggleLeft, MessageSquare,
  PanelTop, ChevronDown, MousePointerClick,
  Layers, Table, Radio, Menu,
} from 'lucide-react'
import { useAria } from '../interactive-os/hooks/useAria'
import { spatial } from '../interactive-os/behaviors/spatial'
import { useSpatialNav } from '../interactive-os/hooks/use-spatial-nav'
import { core } from '../interactive-os/plugins/core'
import { focusCommands } from '../interactive-os/plugins/core'
import { spatialCommands, getSpatialParentId } from '../interactive-os/plugins/spatial'
import { getChildren, getParent } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import { createBatchCommand } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'
import { cmsStore } from './cms-store'



// ── Icon lookup (since JSX can't live in store data) ──

const featureIcons: Record<string, React.ReactNode> = {
  database: <Database size={16} />,
  cog: <Cog size={16} />,
  shield: <Shield size={16} />,
  keyboard: <Keyboard size={16} />,
}

const patternIcons: Record<string, React.ReactNode> = {
  table: <Table size={12} />,
  list: <List size={12} />,
  paneltop: <PanelTop size={12} />,
  message: <MessageSquare size={12} />,
  grid: <Grid3X3 size={12} />,
  menu: <Menu size={12} />,
  layers: <Layers size={12} />,
  chevrondown: <ChevronDown size={12} />,
  chevronright: <ChevronRight size={12} />,
  keyboard: <Keyboard size={12} />,
  click: <MousePointerClick size={12} />,
  toggle: <ToggleLeft size={12} />,
  radio: <Radio size={12} />,
  shield: <Shield size={12} />,
}

const plugins = [core()]

// ── Node content renderers by type ──

function NodeContent({ data }: { data: Record<string, string> }) {
  switch (data.type) {
    case 'text':
      return <>{data.value}</>
    case 'cta':
      return (
        <div className="cms-hero__actions">
          <button type="button" className="cms-hero__cta">
            {data.primary} <ArrowRight size={14} />
          </button>
          <button type="button" className="cms-hero__cta-secondary">
            {data.secondary} <ChevronRight size={14} />
          </button>
        </div>
      )
    case 'stat':
      return (
        <>
          <span className="cms-stat__value">{data.value}</span>
          <span className="cms-stat__label">{data.label}</span>
        </>
      )
    case 'icon':
      return <>{featureIcons[data.value] ?? null}</>
    case 'step':
      return (
        <>
          <span className="cms-step__number">{data.num}</span>
          <h3 className="cms-step__title">{data.title}</h3>
          <p className="cms-step__desc">{data.desc}</p>
        </>
      )
    case 'pattern':
      return (
        <>
          <div className="cms-pattern__icon">{patternIcons[data.icon] ?? null}</div>
          <span className="cms-pattern__name">{data.name}</span>
        </>
      )
    case 'brand':
      return (
        <>
          <div className="cms-footer__logo" />
          <span className="cms-footer__name">{data.name}</span>
          <span className="cms-footer__copy">{data.license} License</span>
        </>
      )
    case 'badge':
      return <><span className="cms-hero__badge-dot" />{data.value}</>
    case 'section-label':
    case 'section-title':
    case 'section-desc':
      return <>{data.value}</>
    case 'links':
      return null
    case 'link':
      return <a className="cms-footer__link" href={data.href}>{data.label}</a>
    default:
      return null
  }
}


// ── CSS class mapping ──

function getSectionClassName(variant: string): string {
  switch (variant) {
    case 'hero': return 'cms-hero'
    case 'stats': return 'cms-stats'
    case 'features': return 'cms-features'
    case 'workflow': return 'cms-how'
    case 'patterns': return 'cms-patterns'
    case 'footer': return 'cms-footer'
    default: return ''
  }
}

function getNodeClassName(data: Record<string, string>, state: NodeState): string {
  const f = state.focused
  switch (data.type) {
    case 'section':
      return getSectionClassName(data.variant)
    case 'stat':
      return `cms-stat${f ? ' cms-stat--focused' : ''}`
    case 'card':
      return `cms-feature-card${f ? ' cms-feature-card--focused' : ''}`
    case 'step':
      return `cms-step${f ? ' cms-step--focused' : ''}`
    case 'pattern':
      return `cms-pattern${f ? ' cms-pattern--focused' : ''}`
    case 'text': {
      if (data.role === 'title') return 'cms-feature-card__title'
      if (data.role === 'desc') return 'cms-feature-card__desc'
      if (data.value === 'Headless ARIA Engine') return 'cms-hero__title'
      if (data.value?.startsWith('Build fully')) return 'cms-hero__subtitle'
      return ''
    }
    case 'section-label': return 'cms-section-label'
    case 'section-title': return 'cms-section-title'
    case 'section-desc': return 'cms-section-desc'
    case 'badge': return 'cms-hero__badge'
    case 'cta': return ''
    case 'icon': return 'cms-feature-card__icon'
    case 'brand': return 'cms-footer__brand'
    case 'links': return 'cms-footer__links'
    case 'link': return ''
    default: return ''
  }
}

function getChildrenContainerClassName(data: Record<string, string>): string | undefined {
  switch (data.variant) {
    case 'stats': return 'cms-stats__items'
    case 'features': return 'cms-features__grid'
    case 'workflow': return 'cms-how__steps'
    case 'patterns': return 'cms-patterns__grid'
    default: return undefined
  }
}

// ── What HTML tag to use ──

function getNodeTag(data: Record<string, string>): keyof JSX.IntrinsicElements {
  if (data.type === 'section') {
    if (data.variant === 'footer') return 'footer'
    return 'section'
  }
  if (data.type === 'text') {
    if (data.role === 'title') return 'h3'
    if (data.role === 'desc') return 'p'
    if (data.value === 'Headless ARIA Engine') return 'h1'
    if (data.value?.startsWith('Build fully')) return 'p'
  }
  if (data.type === 'section-label') return 'p'
  if (data.type === 'section-title') return 'h2'
  if (data.type === 'section-desc') return 'p'
  if (data.type === 'links') return 'nav'
  return 'div'
}


// ── Page ──

export default function PageVisualCms() {
  const [data, setData] = useState<NormalizedData>(cmsStore)
  const spatialKeyMap = useSpatialNav('[data-cms-root]', data)
  const aria = useAria({
    behavior: spatial,
    data,
    plugins,
    keyMap: spatialKeyMap,
    onChange: setData,
  })

  // Click handler: jump to node's depth + focus
  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const store = aria.getStore()
    const parentId = getParent(store, nodeId) ?? ROOT_ID
    const currentSpatialParent = getSpatialParentId(store)

    if (parentId !== currentSpatialParent) {
      // Switch depth to the clicked node's parent
      if (parentId === ROOT_ID) {
        // Go to root — exit until at root
        const exitCmd = spatialCommands.exitToParent()
        // Keep exiting (simple: just set spatial parent to nothing for root)
        aria.dispatch(createBatchCommand([
          exitCmd,
          focusCommands.setFocus(nodeId),
        ]))
        return
      }
      aria.dispatch(createBatchCommand([
        spatialCommands.enterChild(parentId),
        focusCommands.setFocus(nodeId),
      ]))
      return
    }
    aria.dispatch(focusCommands.setFocus(nodeId))
  }, [aria])

  // Recursive renderer — ALL nodes always rendered
  function renderNode(nodeId: string): React.ReactNode {
    const store = aria.getStore()
    const entity = store.entities[nodeId]
    if (!entity) return null

    const state = aria.getNodeState(nodeId)
    const props = aria.getNodeProps(nodeId)
    const children = getChildren(store, nodeId)
    const d = (entity.data ?? {}) as Record<string, string>

    // Destructure props from aria to override onClick
    const {
      onClick: _,
      onKeyDown,
      onFocus,
      tabIndex,
      role: ariaRole,
      ...restProps
    } = props as Record<string, unknown>
    void _

    const className = getNodeClassName(d, state)
    const Tag = getNodeTag(d)

    // For section nodes, render section header + children container
    if (d.type === 'section') {
      const childrenContainerClass = getChildrenContainerClassName(d)

      return (
        <Tag
          key={nodeId}
          {...(restProps as React.HTMLAttributes<HTMLElement>)}
          role={ariaRole as string}
          tabIndex={tabIndex as number}
          onKeyDown={onKeyDown as React.KeyboardEventHandler}
          onFocus={onFocus as React.FocusEventHandler}
          onClick={(e: React.MouseEvent) => handleNodeClick(nodeId, e)}
          className={className}
        >
          {(() => {
            // Separate header nodes (label/title/desc) from content nodes
            const headerTypes = new Set(['section-label', 'section-title', 'section-desc', 'badge', 'text', 'cta'])
            const store = aria.getStore()
            const headerIds: string[] = []
            const contentIds: string[] = []
            for (const childId of children) {
              const childData = (store.entities[childId]?.data ?? {}) as Record<string, string>
              if (headerTypes.has(childData.type)) {
                headerIds.push(childId)
              } else {
                contentIds.push(childId)
              }
            }
            return (
              <>
                {headerIds.map(childId => renderNode(childId))}
                {childrenContainerClass && contentIds.length > 0 ? (
                  <div className={childrenContainerClass}>
                    {contentIds.map(childId => renderNode(childId))}
                  </div>
                ) : (
                  contentIds.map(childId => renderNode(childId))
                )}
              </>
            )
          })()}
        </Tag>
      )
    }

    // For card nodes, render all children via renderNode
    if (d.type === 'card') {
      return (
        <div
          key={nodeId}
          {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
          role={ariaRole as string}
          tabIndex={tabIndex as number}
          onKeyDown={onKeyDown as React.KeyboardEventHandler}
          onFocus={onFocus as React.FocusEventHandler}
          onClick={(e) => handleNodeClick(nodeId, e)}
          className={className}
        >
          {children.map(childId => renderNode(childId))}
        </div>
      )
    }

    // Leaf / generic nodes
    return (
      <Tag
        key={nodeId}
        {...(restProps as React.HTMLAttributes<HTMLElement>)}
        role={ariaRole as string}
        tabIndex={tabIndex as number}
        onKeyDown={onKeyDown as React.KeyboardEventHandler}
        onFocus={onFocus as React.FocusEventHandler}
        onClick={(e: React.MouseEvent) => handleNodeClick(nodeId, e)}
        className={className || undefined}
      >
        <NodeContent data={d} />
        {children.length > 0 && children.map(childId => renderNode(childId))}
      </Tag>
    )
  }

  return (
    <div className="cms-landing" data-cms-root data-aria-container="">
      {getChildren(aria.getStore(), ROOT_ID).map(id => renderNode(id))}
    </div>
  )
}
