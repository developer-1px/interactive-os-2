import { useState } from 'react'
import './PageVisualCms.css'
import {
  Database, Cog, Keyboard, Shield,
  ChevronRight, ArrowRight,
  List, Grid3X3, ToggleLeft, MessageSquare,
  PanelTop, ChevronDown, MousePointerClick,
  Layers, Table, Radio, Menu,
} from 'lucide-react'
import { Aria } from '../interactive-os/components/aria'
import { listbox } from '../interactive-os/behaviors/listbox'
import { core } from '../interactive-os/plugins/core'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { NodeState } from '../interactive-os/behaviors/types'

// ── Unified CMS store ──

export const cmsStore = createStore({
  entities: {
    // Sections
    hero:     { id: 'hero',     data: { type: 'section', variant: 'hero' } },
    stats:    { id: 'stats',    data: { type: 'section', variant: 'stats' } },
    features: { id: 'features', data: { type: 'section', variant: 'features' } },
    workflow: { id: 'workflow', data: { type: 'section', variant: 'workflow' } },
    patterns: { id: 'patterns', data: { type: 'section', variant: 'patterns' } },
    footer:   { id: 'footer',   data: { type: 'section', variant: 'footer' } },

    // Hero children
    'hero-title':    { id: 'hero-title',    data: { type: 'text', value: 'Headless ARIA Engine' } },
    'hero-subtitle': { id: 'hero-subtitle', data: { type: 'text', value: 'Build fully accessible UI with a normalized store, command engine, and 14 APG-compliant behavior presets — keyboard-first by design.' } },
    'hero-cta':      { id: 'hero-cta',      data: { type: 'cta', primary: 'Get Started', secondary: 'View on GitHub' } },

    // Stats children
    'stat-patterns': { id: 'stat-patterns', data: { type: 'stat', value: '14',   label: 'APG Patterns' } },
    'stat-tests':    { id: 'stat-tests',    data: { type: 'stat', value: '365+', label: 'Tests' } },
    'stat-modules':  { id: 'stat-modules',  data: { type: 'stat', value: '42',   label: 'Modules' } },
    'stat-deps':     { id: 'stat-deps',     data: { type: 'stat', value: '0',    label: 'Runtime Deps' } },

    // Features cards
    'card-store':    { id: 'card-store',    data: { type: 'card' } },
    'card-engine':   { id: 'card-engine',   data: { type: 'card' } },
    'card-aria':     { id: 'card-aria',     data: { type: 'card' } },
    'card-keyboard': { id: 'card-keyboard', data: { type: 'card' } },

    // card-store children
    'card-store-icon':  { id: 'card-store-icon',  data: { type: 'icon',  value: 'database' } },
    'card-store-title': { id: 'card-store-title', data: { type: 'text',  value: 'Normalized Store' } },
    'card-store-desc':  { id: 'card-store-desc',  data: { type: 'text',  value: 'Tree data as flat entities + relationships. O(1) lookups, immutable updates, parent-child traversal built in.' } },

    // card-engine children
    'card-engine-icon':  { id: 'card-engine-icon',  data: { type: 'icon', value: 'cog' } },
    'card-engine-title': { id: 'card-engine-title', data: { type: 'text', value: 'Command Engine' } },
    'card-engine-desc':  { id: 'card-engine-desc',  data: { type: 'text', value: 'Every mutation is a command with undo/redo. Middleware pipeline for validation, logging, and side effects.' } },

    // card-aria children
    'card-aria-icon':  { id: 'card-aria-icon',  data: { type: 'icon', value: 'shield' } },
    'card-aria-title': { id: 'card-aria-title', data: { type: 'text', value: '14 ARIA Patterns' } },
    'card-aria-desc':  { id: 'card-aria-desc',  data: { type: 'text', value: 'Treegrid, listbox, tabs, combobox, dialog, menu, and more. Each preset wires up roles, states, and keyboard interaction.' } },

    // card-keyboard children
    'card-keyboard-icon':  { id: 'card-keyboard-icon',  data: { type: 'icon', value: 'keyboard' } },
    'card-keyboard-title': { id: 'card-keyboard-title', data: { type: 'text', value: 'Keyboard-First' } },
    'card-keyboard-desc':  { id: 'card-keyboard-desc',  data: { type: 'text', value: 'Every interaction works without a mouse. Roving tabindex, arrow key navigation, spatial nav, and platform-aware shortcuts.' } },

    // Workflow steps
    'step-1': { id: 'step-1', data: { type: 'step', num: '01', title: 'Define Store',       desc: 'Create entities and relationships in a normalized tree structure.' } },
    'step-2': { id: 'step-2', data: { type: 'step', num: '02', title: 'Dispatch Commands',  desc: 'Mutations flow through a middleware pipeline with auto undo/redo.' } },
    'step-3': { id: 'step-3', data: { type: 'step', num: '03', title: 'Apply Behavior',     desc: 'Pick an ARIA preset — it handles roles, states, and key bindings.' } },
    'step-4': { id: 'step-4', data: { type: 'step', num: '04', title: 'Render UI',          desc: 'Wire the headless state to your own components. Full control.' } },

    // Patterns
    'pat-treegrid':    { id: 'pat-treegrid',    data: { type: 'pattern', name: 'Treegrid',    icon: 'table' } },
    'pat-listbox':     { id: 'pat-listbox',     data: { type: 'pattern', name: 'Listbox',     icon: 'list' } },
    'pat-tabs':        { id: 'pat-tabs',        data: { type: 'pattern', name: 'Tabs',        icon: 'paneltop' } },
    'pat-combobox':    { id: 'pat-combobox',    data: { type: 'pattern', name: 'Combobox',    icon: 'message' } },
    'pat-grid':        { id: 'pat-grid',        data: { type: 'pattern', name: 'Grid',        icon: 'grid' } },
    'pat-menu':        { id: 'pat-menu',        data: { type: 'pattern', name: 'Menu',        icon: 'menu' } },
    'pat-dialog':      { id: 'pat-dialog',      data: { type: 'pattern', name: 'Dialog',      icon: 'layers' } },
    'pat-accordion':   { id: 'pat-accordion',   data: { type: 'pattern', name: 'Accordion',   icon: 'chevrondown' } },
    'pat-treeview':    { id: 'pat-treeview',    data: { type: 'pattern', name: 'Tree View',   icon: 'chevronright' } },
    'pat-toolbar':     { id: 'pat-toolbar',     data: { type: 'pattern', name: 'Toolbar',     icon: 'keyboard' } },
    'pat-disclosure':  { id: 'pat-disclosure',  data: { type: 'pattern', name: 'Disclosure',  icon: 'click' } },
    'pat-switch':      { id: 'pat-switch',      data: { type: 'pattern', name: 'Switch',      icon: 'toggle' } },
    'pat-radiogroup':  { id: 'pat-radiogroup',  data: { type: 'pattern', name: 'RadioGroup',  icon: 'radio' } },
    'pat-alertdialog': { id: 'pat-alertdialog', data: { type: 'pattern', name: 'AlertDialog', icon: 'shield' } },

    // Footer children
    'footer-brand': { id: 'footer-brand', data: { type: 'brand', name: 'interactive-os', license: 'MIT' } },
    'footer-links': { id: 'footer-links', data: { type: 'links' } },

    // footer-links children
    'footer-link-docs':   { id: 'footer-link-docs',   data: { type: 'link', label: 'Documentation', href: '#docs' } },
    'footer-link-github': { id: 'footer-link-github', data: { type: 'link', label: 'GitHub',        href: '#github' } },
    'footer-link-npm':    { id: 'footer-link-npm',    data: { type: 'link', label: 'npm',           href: '#npm' } },
  },
  relationships: {
    [ROOT_ID]: ['hero', 'stats', 'features', 'workflow', 'patterns', 'footer'],
    hero:     ['hero-title', 'hero-subtitle', 'hero-cta'],
    stats:    ['stat-patterns', 'stat-tests', 'stat-modules', 'stat-deps'],
    features: ['card-store', 'card-engine', 'card-aria', 'card-keyboard'],
    'card-store':    ['card-store-icon',    'card-store-title',    'card-store-desc'],
    'card-engine':   ['card-engine-icon',   'card-engine-title',   'card-engine-desc'],
    'card-aria':     ['card-aria-icon',     'card-aria-title',     'card-aria-desc'],
    'card-keyboard': ['card-keyboard-icon', 'card-keyboard-title', 'card-keyboard-desc'],
    workflow: ['step-1', 'step-2', 'step-3', 'step-4'],
    patterns: [
      'pat-treegrid', 'pat-listbox', 'pat-tabs', 'pat-combobox', 'pat-grid', 'pat-menu', 'pat-dialog',
      'pat-accordion', 'pat-treeview', 'pat-toolbar', 'pat-disclosure', 'pat-switch', 'pat-radiogroup', 'pat-alertdialog',
    ],
    footer: ['footer-brand', 'footer-links'],
    'footer-links': ['footer-link-docs', 'footer-link-github', 'footer-link-npm'],
  },
})

// ── Per-section stores (derived from cmsStore for backward-compat with components) ──

const statsStore = createStore({
  entities: {
    'stat-patterns': cmsStore.entities['stat-patterns'],
    'stat-tests':    cmsStore.entities['stat-tests'],
    'stat-modules':  cmsStore.entities['stat-modules'],
    'stat-deps':     cmsStore.entities['stat-deps'],
  },
  relationships: { [ROOT_ID]: ['stat-patterns', 'stat-tests', 'stat-modules', 'stat-deps'] },
})

const featuresStore = createStore({
  entities: {
    'card-store':    cmsStore.entities['card-store'],
    'card-engine':   cmsStore.entities['card-engine'],
    'card-aria':     cmsStore.entities['card-aria'],
    'card-keyboard': cmsStore.entities['card-keyboard'],
  },
  relationships: { [ROOT_ID]: ['card-store', 'card-engine', 'card-aria', 'card-keyboard'] },
})

const stepsStore = createStore({
  entities: {
    'step-1': cmsStore.entities['step-1'],
    'step-2': cmsStore.entities['step-2'],
    'step-3': cmsStore.entities['step-3'],
    'step-4': cmsStore.entities['step-4'],
  },
  relationships: { [ROOT_ID]: ['step-1', 'step-2', 'step-3', 'step-4'] },
})

const patternsStore = createStore({
  entities: {
    'pat-treegrid':    cmsStore.entities['pat-treegrid'],
    'pat-listbox':     cmsStore.entities['pat-listbox'],
    'pat-tabs':        cmsStore.entities['pat-tabs'],
    'pat-combobox':    cmsStore.entities['pat-combobox'],
    'pat-grid':        cmsStore.entities['pat-grid'],
    'pat-menu':        cmsStore.entities['pat-menu'],
    'pat-dialog':      cmsStore.entities['pat-dialog'],
    'pat-accordion':   cmsStore.entities['pat-accordion'],
    'pat-treeview':    cmsStore.entities['pat-treeview'],
    'pat-toolbar':     cmsStore.entities['pat-toolbar'],
    'pat-disclosure':  cmsStore.entities['pat-disclosure'],
    'pat-switch':      cmsStore.entities['pat-switch'],
    'pat-radiogroup':  cmsStore.entities['pat-radiogroup'],
    'pat-alertdialog': cmsStore.entities['pat-alertdialog'],
  },
  relationships: {
    [ROOT_ID]: [
      'pat-treegrid', 'pat-listbox', 'pat-tabs', 'pat-combobox', 'pat-grid', 'pat-menu', 'pat-dialog',
      'pat-accordion', 'pat-treeview', 'pat-toolbar', 'pat-disclosure', 'pat-switch', 'pat-radiogroup', 'pat-alertdialog',
    ],
  },
})

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

// ── Section: Hero ──

function Hero() {
  return (
    <section className="cms-hero">
      <div className="cms-hero__badge">
        <span className="cms-hero__badge-dot" />
        Open Source
      </div>
      <h1 className="cms-hero__title">
        Headless ARIA Engine
      </h1>
      <p className="cms-hero__subtitle">
        Build fully accessible UI with a normalized store, command engine,
        and 14 APG-compliant behavior presets — keyboard-first by design.
      </p>
      <div className="cms-hero__actions">
        <button type="button" className="cms-hero__cta">
          Get Started <ArrowRight size={14} />
        </button>
        <button type="button" className="cms-hero__cta-secondary">
          View on GitHub <ChevronRight size={14} />
        </button>
      </div>
    </section>
  )
}

// ── Section: Stats ──

function Stats() {
  const [data, setData] = useState<NormalizedData>(statsStore)

  return (
    <section className="cms-stats">
      <Aria
        behavior={listbox}
        data={data}
        plugins={plugins}
        onChange={setData}
        aria-label="Project stats"
      >
        <Aria.Node render={(node: Record<string, unknown>, state: NodeState) => {
          const d = node.data as { value: string; label: string }
          return (
            <div className={`cms-stat${state.focused ? ' cms-stat--focused' : ''}`}>
              <span className="cms-stat__value">{d.value}</span>
              <span className="cms-stat__label">{d.label}</span>
            </div>
          )
        }} />
      </Aria>
    </section>
  )
}

// ── Section: Features ──

function Features() {
  const [data, setData] = useState<NormalizedData>(featuresStore)

  return (
    <section className="cms-features">
      <p className="cms-section-label">Core</p>
      <h2 className="cms-section-title">Everything you need</h2>
      <p className="cms-section-desc">
        A complete headless engine for building accessible, keyboard-driven interfaces
        on any component library.
      </p>
      <Aria
        behavior={listbox}
        data={data}
        plugins={plugins}
        onChange={setData}
        aria-label="Core features"
      >
        <div className="cms-features__grid">
          <Aria.Node render={(node: Record<string, unknown>, state: NodeState) => {
            const d = node.data as { title: string; desc: string; icon: string }
            return (
              <div className={`cms-feature-card${state.focused ? ' cms-feature-card--focused' : ''}`}>
                <div className="cms-feature-card__icon">{featureIcons[d.icon]}</div>
                <h3 className="cms-feature-card__title">{d.title}</h3>
                <p className="cms-feature-card__desc">{d.desc}</p>
              </div>
            )
          }} />
        </div>
      </Aria>
    </section>
  )
}

// ── Section: How it works ──

function HowItWorks() {
  const [data, setData] = useState<NormalizedData>(stepsStore)

  return (
    <section className="cms-how">
      <p className="cms-section-label">Workflow</p>
      <h2 className="cms-section-title">How it works</h2>
      <p className="cms-section-desc">
        Four layers, each independently testable. Compose them for any UI pattern.
      </p>
      <Aria
        behavior={listbox}
        data={data}
        plugins={plugins}
        onChange={setData}
        aria-label="Workflow steps"
      >
        <div className="cms-how__steps">
          <Aria.Node render={(node: Record<string, unknown>, state: NodeState) => {
            const d = node.data as { num: string; title: string; desc: string }
            return (
              <div className={`cms-step${state.focused ? ' cms-step--focused' : ''}`}>
                <span className="cms-step__number">{d.num}</span>
                <h3 className="cms-step__title">{d.title}</h3>
                <p className="cms-step__desc">{d.desc}</p>
              </div>
            )
          }} />
        </div>
      </Aria>
    </section>
  )
}

// ── Section: Patterns ──

function Patterns() {
  const [data, setData] = useState<NormalizedData>(patternsStore)

  return (
    <section className="cms-patterns">
      <p className="cms-section-label">Coverage</p>
      <h2 className="cms-section-title">14 APG patterns</h2>
      <p className="cms-section-desc">
        Every composite widget from the W3C ARIA Authoring Practices Guide,
        fully implemented with keyboard interaction tables.
      </p>
      <Aria
        behavior={listbox}
        data={data}
        plugins={plugins}
        onChange={setData}
        aria-label="APG patterns"
      >
        <div className="cms-patterns__grid">
          <Aria.Node render={(node: Record<string, unknown>, state: NodeState) => {
            const d = node.data as { name: string; icon: string }
            return (
              <div className={`cms-pattern${state.focused ? ' cms-pattern--focused' : ''}`}>
                <div className="cms-pattern__icon">{patternIcons[d.icon]}</div>
                <span className="cms-pattern__name">{d.name}</span>
              </div>
            )
          }} />
        </div>
      </Aria>
    </section>
  )
}

// ── Section: Footer ──

function Footer() {
  return (
    <footer className="cms-footer">
      <div className="cms-footer__brand">
        <div className="cms-footer__logo" />
        <span className="cms-footer__name">interactive-os</span>
        <span className="cms-footer__copy">MIT License</span>
      </div>
      <nav className="cms-footer__links">
        <a className="cms-footer__link" href="#docs">Documentation</a>
        <a className="cms-footer__link" href="#github">GitHub</a>
        <a className="cms-footer__link" href="#npm">npm</a>
      </nav>
    </footer>
  )
}

// ── Page ──

export default function PageVisualCms() {
  return (
    <div className="cms-landing">
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Patterns />
      <Footer />
    </div>
  )
}
