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

// ── Data → NormalizedData stores ──

const statsStore = createStore({
  entities: {
    patterns: { id: 'patterns', data: { value: '14', label: 'APG Patterns' } },
    tests: { id: 'tests', data: { value: '365+', label: 'Tests' } },
    modules: { id: 'modules', data: { value: '42', label: 'Modules' } },
    deps: { id: 'deps', data: { value: '0', label: 'Runtime Deps' } },
  },
  relationships: { [ROOT_ID]: ['patterns', 'tests', 'modules', 'deps'] },
})

const featuresStore = createStore({
  entities: {
    store: { id: 'store', data: { title: 'Normalized Store', desc: 'Tree data as flat entities + relationships. O(1) lookups, immutable updates, parent-child traversal built in.', icon: 'database' } },
    engine: { id: 'engine', data: { title: 'Command Engine', desc: 'Every mutation is a command with undo/redo. Middleware pipeline for validation, logging, and side effects.', icon: 'cog' } },
    aria: { id: 'aria', data: { title: '14 ARIA Patterns', desc: 'Treegrid, listbox, tabs, combobox, dialog, menu, and more. Each preset wires up roles, states, and keyboard interaction.', icon: 'shield' } },
    keyboard: { id: 'keyboard', data: { title: 'Keyboard-First', desc: 'Every interaction works without a mouse. Roving tabindex, arrow key navigation, spatial nav, and platform-aware shortcuts.', icon: 'keyboard' } },
  },
  relationships: { [ROOT_ID]: ['store', 'engine', 'aria', 'keyboard'] },
})

const stepsStore = createStore({
  entities: {
    s1: { id: 's1', data: { num: '01', title: 'Define Store', desc: 'Create entities and relationships in a normalized tree structure.' } },
    s2: { id: 's2', data: { num: '02', title: 'Dispatch Commands', desc: 'Mutations flow through a middleware pipeline with auto undo/redo.' } },
    s3: { id: 's3', data: { num: '03', title: 'Apply Behavior', desc: 'Pick an ARIA preset — it handles roles, states, and key bindings.' } },
    s4: { id: 's4', data: { num: '04', title: 'Render UI', desc: 'Wire the headless state to your own components. Full control.' } },
  },
  relationships: { [ROOT_ID]: ['s1', 's2', 's3', 's4'] },
})

const patternsStore = createStore({
  entities: {
    treegrid: { id: 'treegrid', data: { name: 'Treegrid', icon: 'table' } },
    listbox: { id: 'listbox', data: { name: 'Listbox', icon: 'list' } },
    tabs: { id: 'tabs', data: { name: 'Tabs', icon: 'paneltop' } },
    combobox: { id: 'combobox', data: { name: 'Combobox', icon: 'message' } },
    grid: { id: 'grid', data: { name: 'Grid', icon: 'grid' } },
    menu: { id: 'menu', data: { name: 'Menu', icon: 'menu' } },
    dialog: { id: 'dialog', data: { name: 'Dialog', icon: 'layers' } },
    accordion: { id: 'accordion', data: { name: 'Accordion', icon: 'chevrondown' } },
    treeview: { id: 'treeview', data: { name: 'Tree View', icon: 'chevronright' } },
    toolbar: { id: 'toolbar', data: { name: 'Toolbar', icon: 'keyboard' } },
    disclosure: { id: 'disclosure', data: { name: 'Disclosure', icon: 'click' } },
    switch: { id: 'switch', data: { name: 'Switch', icon: 'toggle' } },
    radiogroup: { id: 'radiogroup', data: { name: 'RadioGroup', icon: 'radio' } },
    alertdialog: { id: 'alertdialog', data: { name: 'AlertDialog', icon: 'shield' } },
  },
  relationships: {
    [ROOT_ID]: [
      'treegrid', 'listbox', 'tabs', 'combobox', 'grid', 'menu', 'dialog',
      'accordion', 'treeview', 'toolbar', 'disclosure', 'switch', 'radiogroup', 'alertdialog',
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
