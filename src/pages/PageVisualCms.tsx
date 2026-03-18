import { useState, useMemo } from 'react'
import { Aria } from '../interactive-os/components/aria'
import { spatial } from '../interactive-os/behaviors/spatial'
import { spatial as spatialPlugin } from '../interactive-os/plugins/spatial'
import { getSpatialParentId } from '../interactive-os/plugins/spatial'
import { useSpatialNav } from '../interactive-os/hooks/use-spatial-nav'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData, Command } from '../interactive-os/core/types'
import type { NodeState, BehaviorContext } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import { history, historyCommands } from '../interactive-os/plugins/history'
import { crud, crudCommands } from '../interactive-os/plugins/crud'
import { clipboard, clipboardCommands } from '../interactive-os/plugins/clipboard'
import { rename, renameCommands } from '../interactive-os/plugins/rename'
import { dnd, dndCommands } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focus-recovery'
import { getParent } from '../interactive-os/core/createStore'
import {
  Type, ImageIcon, Smile, LayoutTemplate,
  CreditCard, Columns3, PanelBottom,
  ChevronRight,
} from 'lucide-react'
import './PageVisualCms.css'

// --- CMS Content Types ---

interface SectionData { type: 'section'; variant: 'hero' | 'cards' | 'tabs' | 'footer' }
interface CardData { type: 'card' }
interface TabData { type: 'tab' }
interface TextData { type: 'text'; value: string; role: 'title' | 'subtitle' | 'heading' | 'body' | 'cta' | 'label' | 'copyright' }
interface IconData { type: 'icon'; value: string }
interface ImageData { type: 'image'; src: string; alt: string }

type CmsNodeData = SectionData | CardData | TabData | TextData | IconData | ImageData

// --- Initial Store ---

const initialStore = createStore({
  entities: {
    hero: { id: 'hero', data: { type: 'section', variant: 'hero' } },
    'hero-title': { id: 'hero-title', data: { type: 'text', value: 'Welcome to Our Platform', role: 'title' } },
    'hero-subtitle': { id: 'hero-subtitle', data: { type: 'text', value: 'Build something amazing with our tools', role: 'subtitle' } },
    'hero-cta': { id: 'hero-cta', data: { type: 'text', value: 'Get Started', role: 'cta' } },

    features: { id: 'features', data: { type: 'section', variant: 'cards' } },
    'features-heading': { id: 'features-heading', data: { type: 'text', value: 'Features', role: 'heading' } },
    'card-1': { id: 'card-1', data: { type: 'card' } },
    'card-1-icon': { id: 'card-1-icon', data: { type: 'icon', value: '⚡' } },
    'card-1-title': { id: 'card-1-title', data: { type: 'text', value: 'Fast', role: 'title' } },
    'card-1-desc': { id: 'card-1-desc', data: { type: 'text', value: 'Lightning-fast performance for all your needs', role: 'body' } },
    'card-2': { id: 'card-2', data: { type: 'card' } },
    'card-2-icon': { id: 'card-2-icon', data: { type: 'icon', value: '🔒' } },
    'card-2-title': { id: 'card-2-title', data: { type: 'text', value: 'Secure', role: 'title' } },
    'card-2-desc': { id: 'card-2-desc', data: { type: 'text', value: 'Enterprise-grade security built in', role: 'body' } },
    'card-3': { id: 'card-3', data: { type: 'card' } },
    'card-3-icon': { id: 'card-3-icon', data: { type: 'icon', value: '📈' } },
    'card-3-title': { id: 'card-3-title', data: { type: 'text', value: 'Scalable', role: 'title' } },
    'card-3-desc': { id: 'card-3-desc', data: { type: 'text', value: 'Grows with your business seamlessly', role: 'body' } },

    'tabs-section': { id: 'tabs-section', data: { type: 'section', variant: 'tabs' } },
    'tabs-heading': { id: 'tabs-heading', data: { type: 'text', value: 'Solutions', role: 'heading' } },
    'tab-dev': { id: 'tab-dev', data: { type: 'tab' } },
    'tab-dev-label': { id: 'tab-dev-label', data: { type: 'text', value: 'Developers', role: 'label' } },
    'tab-item-1': { id: 'tab-item-1', data: { type: 'card' } },
    'tab-item-1-icon': { id: 'tab-item-1-icon', data: { type: 'icon', value: '🔧' } },
    'tab-item-1-title': { id: 'tab-item-1-title', data: { type: 'text', value: 'API Access', role: 'title' } },
    'tab-item-1-desc': { id: 'tab-item-1-desc', data: { type: 'text', value: 'RESTful APIs with comprehensive documentation', role: 'body' } },
    'tab-item-2': { id: 'tab-item-2', data: { type: 'card' } },
    'tab-item-2-icon': { id: 'tab-item-2-icon', data: { type: 'icon', value: '📦' } },
    'tab-item-2-title': { id: 'tab-item-2-title', data: { type: 'text', value: 'SDKs', role: 'title' } },
    'tab-item-2-desc': { id: 'tab-item-2-desc', data: { type: 'text', value: 'Native SDKs for every major platform', role: 'body' } },
    'tab-biz': { id: 'tab-biz', data: { type: 'tab' } },
    'tab-biz-label': { id: 'tab-biz-label', data: { type: 'text', value: 'Business', role: 'label' } },
    'tab-item-3': { id: 'tab-item-3', data: { type: 'card' } },
    'tab-item-3-icon': { id: 'tab-item-3-icon', data: { type: 'icon', value: '📊' } },
    'tab-item-3-title': { id: 'tab-item-3-title', data: { type: 'text', value: 'Analytics', role: 'title' } },
    'tab-item-3-desc': { id: 'tab-item-3-desc', data: { type: 'text', value: 'Real-time insights and reporting dashboards', role: 'body' } },

    footer: { id: 'footer', data: { type: 'section', variant: 'footer' } },
    'footer-copy': { id: 'footer-copy', data: { type: 'text', value: '\u00a9 2026 Platform Inc. All rights reserved.', role: 'copyright' } },
    'footer-img': { id: 'footer-img', data: { type: 'image', src: 'https://placehold.co/120x30/1e293b/94a3b8?text=Platform', alt: 'Platform logo' } },
  },
  relationships: {
    [ROOT_ID]: ['hero', 'features', 'tabs-section', 'footer'],
    hero: ['hero-title', 'hero-subtitle', 'hero-cta'],
    features: ['features-heading', 'card-1', 'card-2', 'card-3'],
    'card-1': ['card-1-icon', 'card-1-title', 'card-1-desc'],
    'card-2': ['card-2-icon', 'card-2-title', 'card-2-desc'],
    'card-3': ['card-3-icon', 'card-3-title', 'card-3-desc'],
    'tabs-section': ['tabs-heading', 'tab-dev', 'tab-biz'],
    'tab-dev': ['tab-dev-label', 'tab-item-1', 'tab-item-2'],
    'tab-item-1': ['tab-item-1-icon', 'tab-item-1-title', 'tab-item-1-desc'],
    'tab-item-2': ['tab-item-2-icon', 'tab-item-2-title', 'tab-item-2-desc'],
    'tab-biz': ['tab-biz-label', 'tab-item-3'],
    'tab-item-3': ['tab-item-3-icon', 'tab-item-3-title', 'tab-item-3-desc'],
    footer: ['footer-img', 'footer-copy'],
  },
})

// --- Plugins + KeyMap ---

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery(), spatialPlugin()]

const editingKeyMap: Record<string, (ctx: BehaviorContext) => Command | void> = {
  'Mod+C': (ctx) => clipboardCommands.copy(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
  'Mod+X': (ctx) => clipboardCommands.cut(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
  'Mod+V': (ctx) => clipboardCommands.paste(ctx.focused),
  'Delete': (ctx) => crudCommands.remove(ctx.focused),
  'Mod+Z': () => historyCommands.undo(),
  'Mod+Shift+Z': () => historyCommands.redo(),
  'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
  'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
}

// --- Type indicator icons ---

const ICON_SIZE = 10
const ICON_STROKE = 1.5

function TypeIcon({ d }: { d: CmsNodeData }) {
  switch (d.type) {
    case 'section':
      switch (d.variant) {
        case 'hero': return <LayoutTemplate size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        case 'cards': return <Columns3 size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        case 'tabs': return <Columns3 size={ICON_SIZE} strokeWidth={ICON_STROKE} />
        case 'footer': return <PanelBottom size={ICON_SIZE} strokeWidth={ICON_STROKE} />
      }
      return null
    case 'card': return <CreditCard size={ICON_SIZE} strokeWidth={ICON_STROKE} />
    case 'tab': return <Columns3 size={ICON_SIZE} strokeWidth={ICON_STROKE} />
    case 'text': return <Type size={ICON_SIZE} strokeWidth={ICON_STROKE} />
    case 'icon': return <Smile size={ICON_SIZE} strokeWidth={ICON_STROKE} />
    case 'image': return <ImageIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
  }
}

function getNodeLabel(d: CmsNodeData): string {
  switch (d.type) {
    case 'section': return d.variant
    case 'card': return 'card'
    case 'tab': return 'tab'
    case 'text': return d.role
    case 'icon': return 'icon'
    case 'image': return 'image'
  }
}

// --- Node Renderers ---

function renderContent(d: CmsNodeData) {
  switch (d.type) {
    case 'text':
      return <span className={`vc-field vc-field--text vc-text--${d.role}`}>{d.value}</span>
    case 'icon':
      return <span className="vc-field vc-field--icon">{d.value}</span>
    case 'image':
      return <img className="vc-field vc-field--image" src={d.src} alt={d.alt} />
    case 'section':
      return (
        <div className={`vc-section-preview vc-section-preview--${d.variant}`}>
          <TypeIcon d={d} />
          <span className="vc-section-preview__label">{d.variant}</span>
          <span className="vc-section-preview__hint">Press Enter to edit</span>
        </div>
      )
    case 'card':
      return (
        <div className="vc-card-preview">
          <CreditCard size={14} strokeWidth={1.5} />
          <span className="vc-card-preview__label">Card</span>
          <span className="vc-card-preview__hint">Press Enter to edit</span>
        </div>
      )
    case 'tab':
      return (
        <div className="vc-tab-preview">
          <Columns3 size={14} strokeWidth={1.5} />
          <span className="vc-tab-preview__label">Tab</span>
          <span className="vc-tab-preview__hint">Press Enter to edit</span>
        </div>
      )
  }
}

function CmsNode({ node, state }: { node: Record<string, unknown>; state: NodeState }) {
  const d = node.data as CmsNodeData
  const isContainer = d.type === 'section' || d.type === 'card' || d.type === 'tab'

  const wrapperClass = [
    'vc-node',
    isContainer ? 'vc-node--container' : 'vc-node--field',
    state.focused && 'vc-node--focused',
    state.selected && !state.focused && 'vc-node--selected',
    d.type === 'section' && `vc-section--${d.variant}`,
    d.type === 'card' && 'vc-card',
    d.type === 'tab' && 'vc-tab',
  ].filter(Boolean).join(' ')

  return (
    <div className={wrapperClass} data-type={d.type === 'section' ? d.variant : d.type}>
      <div className="vc-node__indicator">
        <TypeIcon d={d} />
        <span className="vc-node__label">{getNodeLabel(d)}</span>
      </div>
      <div className="vc-node__content">
        {renderContent(d)}
      </div>
    </div>
  )
}

// --- Breadcrumb ---

function Breadcrumb({ store }: { store: NormalizedData }) {
  const spatialParentId = getSpatialParentId(store)
  const crumbs: { id: string; label: string }[] = []

  let current = spatialParentId
  while (current && current !== ROOT_ID) {
    const entity = store.entities[current]
    if (entity) {
      const d = entity.data as CmsNodeData
      crumbs.unshift({ id: current, label: getNodeLabel(d) })
    }
    current = getParent(store, current) ?? ROOT_ID
  }
  crumbs.unshift({ id: ROOT_ID, label: 'Page' })

  return (
    <div className="vc-breadcrumb">
      {crumbs.map((crumb, i) => (
        <span key={crumb.id} className="vc-breadcrumb__item">
          {i > 0 && <ChevronRight size={10} strokeWidth={2} className="vc-breadcrumb__sep" />}
          <span className={i === crumbs.length - 1 ? 'vc-breadcrumb__current' : 'vc-breadcrumb__parent'}>
            {crumb.label}
          </span>
        </span>
      ))}
    </div>
  )
}

// --- Page ---

export default function PageVisualCms() {
  const [data, setData] = useState<NormalizedData>(initialStore)
  const spatialKeyMap = useSpatialNav('[aria-label="Page content editor"]')

  const mergedKeyMap = useMemo(() => ({
    ...spatialKeyMap,
    ...editingKeyMap,
  }), [spatialKeyMap])

  const spatialParentId = getSpatialParentId(data)

  // Determine layout class based on current spatial parent
  const parentEntity = spatialParentId !== ROOT_ID ? data.entities[spatialParentId] : null
  const parentData = parentEntity?.data as CmsNodeData | null
  const layoutClass = parentData?.type === 'section'
    ? `vc-layout--${parentData.variant}`
    : parentData?.type === 'card' || parentData?.type === 'tab'
      ? 'vc-layout--fields'
      : 'vc-layout--root'

  return (
    <div className="vc-page">
      {/* Toolbar */}
      <div className="vc-toolbar">
        <div className="vc-toolbar__left">
          <span className="vc-toolbar__title">Visual CMS</span>
          <Breadcrumb store={data} />
        </div>
        <div className="vc-toolbar__shortcuts">
          <kbd>Arrow</kbd><span>nav</span>
          <kbd>Enter</kbd><span>into</span>
          <kbd>Esc</kbd><span>back</span>
          <kbd>F2</kbd><span>edit</span>
          <kbd>Del</kbd><span>del</span>
          <kbd>Cmd+Z</kbd><span>undo</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="vc-canvas">
        <div className={`vc-canvas__inner ${layoutClass}`}>
          <Aria
            behavior={spatial}
            data={data}
            plugins={plugins}
            onChange={setData}
            keyMap={mergedKeyMap}
            aria-label="Page content editor"
          >
            <Aria.Node render={(node, state) => <CmsNode node={node} state={state} />} />
          </Aria>
        </div>
      </div>
    </div>
  )
}
