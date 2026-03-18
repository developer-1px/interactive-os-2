import { useState, useMemo } from 'react'
import { Aria } from '../interactive-os/components/aria'
import { spatial } from '../interactive-os/behaviors/spatial'
import { spatial as spatialPlugin, getSpatialParentId } from '../interactive-os/plugins/spatial'
import { useSpatialNav } from '../interactive-os/hooks/use-spatial-nav'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData, Command } from '../interactive-os/core/types'
import type { NodeState, BehaviorContext } from '../interactive-os/behaviors/types'
import { core } from '../interactive-os/plugins/core'
import { history, historyCommands } from '../interactive-os/plugins/history'
import { crud, crudCommands } from '../interactive-os/plugins/crud'
import { clipboard, clipboardCommands } from '../interactive-os/plugins/clipboard'
import { rename } from '../interactive-os/plugins/rename'
import { dnd, dndCommands } from '../interactive-os/plugins/dnd'
import { focusRecovery } from '../interactive-os/plugins/focus-recovery'
import { getParent } from '../interactive-os/core/createStore'
import { ChevronRight } from 'lucide-react'
import './PageVisualCms.css'

// --- CMS Content Types ---

interface SectionData { type: 'section'; variant: 'hero' | 'logos' | 'features' | 'stats' | 'testimonial' | 'cta' | 'footer' }
interface CardData { type: 'card' }
interface TextData { type: 'text'; value: string; role: 'hero-title' | 'hero-sub' | 'hero-cta' | 'heading' | 'subheading' | 'body' | 'stat-num' | 'stat-label' | 'quote' | 'cite' | 'cta-title' | 'cta-btn' | 'logo' | 'footer-heading' | 'footer-link' | 'footer-copy' }
interface ImageData { type: 'image'; src: string; alt: string }

type CmsNodeData = SectionData | CardData | TextData | ImageData

// --- Initial Store: Flux — design infrastructure brand ---

const initialStore = createStore({
  entities: {
    // Hero
    hero: { id: 'hero', data: { type: 'section', variant: 'hero' } },
    'hero-tag': { id: 'hero-tag', data: { type: 'text', value: 'Now in public beta', role: 'subheading' } },
    'hero-title': { id: 'hero-title', data: { type: 'text', value: 'Design infrastructure\nthat ships.', role: 'hero-title' } },
    'hero-sub': { id: 'hero-sub', data: { type: 'text', value: 'Flux gives your team a single source of truth for design tokens, components, and documentation — so you ship consistent UI, faster.', role: 'hero-sub' } },
    'hero-cta-1': { id: 'hero-cta-1', data: { type: 'text', value: 'Start free', role: 'hero-cta' } },
    'hero-cta-2': { id: 'hero-cta-2', data: { type: 'text', value: 'Book a demo', role: 'cta-btn' } },

    // Logo bar
    logos: { id: 'logos', data: { type: 'section', variant: 'logos' } },
    'logo-1': { id: 'logo-1', data: { type: 'text', value: 'Vercel', role: 'logo' } },
    'logo-2': { id: 'logo-2', data: { type: 'text', value: 'Linear', role: 'logo' } },
    'logo-3': { id: 'logo-3', data: { type: 'text', value: 'Raycast', role: 'logo' } },
    'logo-4': { id: 'logo-4', data: { type: 'text', value: 'Resend', role: 'logo' } },
    'logo-5': { id: 'logo-5', data: { type: 'text', value: 'Supabase', role: 'logo' } },

    // Features (3-col grid)
    features: { id: 'features', data: { type: 'section', variant: 'features' } },
    'feat-heading': { id: 'feat-heading', data: { type: 'text', value: 'Everything your design system needs', role: 'heading' } },
    'feat-sub': { id: 'feat-sub', data: { type: 'text', value: 'From tokens to production components, Flux handles the full lifecycle.', role: 'subheading' } },
    'card-1': { id: 'card-1', data: { type: 'card' } },
    'card-1-title': { id: 'card-1-title', data: { type: 'text', value: 'Token sync', role: 'heading' } },
    'card-1-desc': { id: 'card-1-desc', data: { type: 'text', value: 'Push design tokens from Figma to code in one click. Supports CSS, Tailwind, and Swift.', role: 'body' } },
    'card-2': { id: 'card-2', data: { type: 'card' } },
    'card-2-title': { id: 'card-2-title', data: { type: 'text', value: 'Component registry', role: 'heading' } },
    'card-2-desc': { id: 'card-2-desc', data: { type: 'text', value: 'Track every component across platforms. See usage, coverage gaps, and version drift at a glance.', role: 'body' } },
    'card-3': { id: 'card-3', data: { type: 'card' } },
    'card-3-title': { id: 'card-3-title', data: { type: 'text', value: 'Live documentation', role: 'heading' } },
    'card-3-desc': { id: 'card-3-desc', data: { type: 'text', value: 'Auto-generated docs from your source code. Always up to date, zero maintenance.', role: 'body' } },

    // Stats (horizontal row — good for ←→ spatial nav)
    stats: { id: 'stats', data: { type: 'section', variant: 'stats' } },
    'stat-1': { id: 'stat-1', data: { type: 'card' } },
    'stat-1-num': { id: 'stat-1-num', data: { type: 'text', value: '2,400+', role: 'stat-num' } },
    'stat-1-label': { id: 'stat-1-label', data: { type: 'text', value: 'Teams using Flux', role: 'stat-label' } },
    'stat-2': { id: 'stat-2', data: { type: 'card' } },
    'stat-2-num': { id: 'stat-2-num', data: { type: 'text', value: '12M', role: 'stat-num' } },
    'stat-2-label': { id: 'stat-2-label', data: { type: 'text', value: 'Tokens synced / month', role: 'stat-label' } },
    'stat-3': { id: 'stat-3', data: { type: 'card' } },
    'stat-3-num': { id: 'stat-3-num', data: { type: 'text', value: '99.99%', role: 'stat-num' } },
    'stat-3-label': { id: 'stat-3-label', data: { type: 'text', value: 'Uptime SLA', role: 'stat-label' } },
    'stat-4': { id: 'stat-4', data: { type: 'card' } },
    'stat-4-num': { id: 'stat-4-num', data: { type: 'text', value: '<50ms', role: 'stat-num' } },
    'stat-4-label': { id: 'stat-4-label', data: { type: 'text', value: 'Sync latency', role: 'stat-label' } },

    // Testimonial
    testimonial: { id: 'testimonial', data: { type: 'section', variant: 'testimonial' } },
    'quote-text': { id: 'quote-text', data: { type: 'text', value: '"Flux replaced our entire token pipeline. What used to take a full sprint now happens on every commit. Our designers and engineers finally speak the same language."', role: 'quote' } },
    'quote-cite': { id: 'quote-cite', data: { type: 'text', value: 'Seo-yeon Park, Head of Design Systems — Linear', role: 'cite' } },

    // CTA
    cta: { id: 'cta', data: { type: 'section', variant: 'cta' } },
    'cta-title': { id: 'cta-title', data: { type: 'text', value: 'Ready to unify your design infrastructure?', role: 'cta-title' } },
    'cta-sub': { id: 'cta-sub', data: { type: 'text', value: 'Free for teams up to 10. No credit card required.', role: 'subheading' } },
    'cta-btn': { id: 'cta-btn', data: { type: 'text', value: 'Get started for free', role: 'hero-cta' } },

    // Footer (horizontal links — good for ←→ spatial nav)
    footer: { id: 'footer', data: { type: 'section', variant: 'footer' } },
    'footer-brand': { id: 'footer-brand', data: { type: 'text', value: 'Flux', role: 'footer-heading' } },
    'footer-l1': { id: 'footer-l1', data: { type: 'text', value: 'Docs', role: 'footer-link' } },
    'footer-l2': { id: 'footer-l2', data: { type: 'text', value: 'Changelog', role: 'footer-link' } },
    'footer-l3': { id: 'footer-l3', data: { type: 'text', value: 'Pricing', role: 'footer-link' } },
    'footer-l4': { id: 'footer-l4', data: { type: 'text', value: 'Blog', role: 'footer-link' } },
    'footer-l5': { id: 'footer-l5', data: { type: 'text', value: 'GitHub', role: 'footer-link' } },
    'footer-copy': { id: 'footer-copy', data: { type: 'text', value: '\u00a9 2026 Flux Inc.', role: 'footer-copy' } },
  },
  relationships: {
    [ROOT_ID]: ['hero', 'logos', 'features', 'stats', 'testimonial', 'cta', 'footer'],
    hero: ['hero-tag', 'hero-title', 'hero-sub', 'hero-cta-1', 'hero-cta-2'],
    logos: ['logo-1', 'logo-2', 'logo-3', 'logo-4', 'logo-5'],
    features: ['feat-heading', 'feat-sub', 'card-1', 'card-2', 'card-3'],
    'card-1': ['card-1-title', 'card-1-desc'],
    'card-2': ['card-2-title', 'card-2-desc'],
    'card-3': ['card-3-title', 'card-3-desc'],
    stats: ['stat-1', 'stat-2', 'stat-3', 'stat-4'],
    'stat-1': ['stat-1-num', 'stat-1-label'],
    'stat-2': ['stat-2-num', 'stat-2-label'],
    'stat-3': ['stat-3-num', 'stat-3-label'],
    'stat-4': ['stat-4-num', 'stat-4-label'],
    testimonial: ['quote-text', 'quote-cite'],
    cta: ['cta-title', 'cta-sub', 'cta-btn'],
    footer: ['footer-brand', 'footer-l1', 'footer-l2', 'footer-l3', 'footer-l4', 'footer-l5', 'footer-copy'],
  },
})

// Expand all containers so AriaNode renders the full page tree
const containerIds = Object.entries(initialStore.relationships)
  .filter(([key, children]) => key !== ROOT_ID && children.length > 0)
  .map(([key]) => key)
initialStore.entities['__expanded__'] = { id: '__expanded__', expandedIds: containerIds }

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

// --- Node Renderer ---

function getNodeLabel(d: CmsNodeData): string {
  if (d.type === 'section') return d.variant
  if (d.type === 'card') return 'card'
  if (d.type === 'text') return d.role
  return d.type
}

function renderContent(d: CmsNodeData) {
  if (d.type === 'text') {
    return <span className={`vc-text vc-text--${d.role}`}>{d.value}</span>
  }
  if (d.type === 'image') {
    return <img className="vc-image" src={d.src} alt={d.alt} />
  }
  // containers show a preview label at parent level
  if (d.type === 'section') {
    return <span className="vc-container-hint">{d.variant}</span>
  }
  if (d.type === 'card') {
    return <span className="vc-container-hint">card</span>
  }
  return null
}

function CmsNode({ node, state }: { node: Record<string, unknown>; state: NodeState }) {
  const d = node.data as CmsNodeData
  const isContainer = d.type === 'section' || d.type === 'card'

  const cls = [
    'vc-node',
    isContainer ? 'vc-node--container' : 'vc-node--field',
    state.focused && 'vc-node--focused',
    state.selected && !state.focused && 'vc-node--selected',
    d.type === 'section' && `vc-section--${d.variant}`,
    d.type === 'card' && 'vc-card',
  ].filter(Boolean).join(' ')

  return (
    <div className={cls}>
      {renderContent(d)}
      {state.focused && <div className="vc-focus-badge">{getNodeLabel(d)}</div>}
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
      crumbs.unshift({ id: current, label: getNodeLabel(entity.data as CmsNodeData) })
    }
    current = getParent(store, current) ?? ROOT_ID
  }
  crumbs.unshift({ id: ROOT_ID, label: 'Flux' })

  return (
    <nav className="vc-breadcrumb">
      {crumbs.map((c, i) => (
        <span key={c.id} className="vc-breadcrumb__item">
          {i > 0 && <ChevronRight size={10} strokeWidth={2} className="vc-breadcrumb__sep" />}
          <span className={i === crumbs.length - 1 ? 'vc-breadcrumb__current' : 'vc-breadcrumb__parent'}>
            {c.label}
          </span>
        </span>
      ))}
    </nav>
  )
}

// --- Page ---

export default function PageVisualCms() {
  const [data, setData] = useState<NormalizedData>(initialStore)
  const spatialKeyMap = useSpatialNav('[aria-label="Page content editor"]', data)

  const mergedKeyMap = useMemo(() => ({
    ...spatialKeyMap,
    ...editingKeyMap,
  }), [spatialKeyMap])

  const spatialParentId = getSpatialParentId(data)
  const parentEntity = spatialParentId !== ROOT_ID ? data.entities[spatialParentId] : null
  const parentData = parentEntity?.data as CmsNodeData | null

  const layoutClass =
    parentData?.type === 'section' ? `vc-layout--${parentData.variant}` :
    parentData?.type === 'card' ? 'vc-layout--card-fields' :
    'vc-layout--root'

  return (
    <div className="vc-page">
      <header className="vc-toolbar">
        <div className="vc-toolbar__left">
          <span className="vc-toolbar__title">Visual CMS</span>
          <Breadcrumb store={data} />
        </div>
        <div className="vc-toolbar__keys">
          <kbd>\u2190\u2191\u2192\u2193</kbd> navigate
          <kbd>Enter</kbd> into
          <kbd>Esc</kbd> back
          <kbd>F2</kbd> edit
        </div>
      </header>

      <div className="vc-canvas">
        <div className={`vc-viewport ${layoutClass}`}>
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
