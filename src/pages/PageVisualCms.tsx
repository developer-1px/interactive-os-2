import './PageVisualCms.css'
import {
  Database, Cog, Keyboard, Shield,
  ChevronRight, ArrowRight,
  List, Grid3X3, ToggleLeft, MessageSquare,
  PanelTop, ChevronDown, MousePointerClick,
  Layers, Table, Radio, Menu,
} from 'lucide-react'

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

const stats = [
  { value: '14', label: 'APG Patterns' },
  { value: '365+', label: 'Tests' },
  { value: '42', label: 'Modules' },
  { value: '0', label: 'Runtime Deps' },
]

function Stats() {
  return (
    <section className="cms-stats">
      {stats.map((s) => (
        <div key={s.label} className="cms-stat">
          <span className="cms-stat__value">{s.value}</span>
          <span className="cms-stat__label">{s.label}</span>
        </div>
      ))}
    </section>
  )
}

// ── Section: Features ──

const features = [
  {
    icon: <Database size={16} />,
    title: 'Normalized Store',
    desc: 'Tree data as flat entities + relationships. O(1) lookups, immutable updates, parent-child traversal built in.',
  },
  {
    icon: <Cog size={16} />,
    title: 'Command Engine',
    desc: 'Every mutation is a command with undo/redo. Middleware pipeline for validation, logging, and side effects.',
  },
  {
    icon: <Shield size={16} />,
    title: '14 ARIA Patterns',
    desc: 'Treegrid, listbox, tabs, combobox, dialog, menu, and more. Each preset wires up roles, states, and keyboard interaction.',
  },
  {
    icon: <Keyboard size={16} />,
    title: 'Keyboard-First',
    desc: 'Every interaction works without a mouse. Roving tabindex, arrow key navigation, spatial nav, and platform-aware shortcuts.',
  },
]

function Features() {
  return (
    <section className="cms-features">
      <p className="cms-section-label">Core</p>
      <h2 className="cms-section-title">Everything you need</h2>
      <p className="cms-section-desc">
        A complete headless engine for building accessible, keyboard-driven interfaces
        on any component library.
      </p>
      <div className="cms-features__grid">
        {features.map((f) => (
          <div key={f.title} className="cms-feature-card">
            <div className="cms-feature-card__icon">{f.icon}</div>
            <h3 className="cms-feature-card__title">{f.title}</h3>
            <p className="cms-feature-card__desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Section: How it works ──

const steps = [
  {
    num: '01',
    title: 'Define Store',
    desc: 'Create entities and relationships in a normalized tree structure.',
  },
  {
    num: '02',
    title: 'Dispatch Commands',
    desc: 'Mutations flow through a middleware pipeline with auto undo/redo.',
  },
  {
    num: '03',
    title: 'Apply Behavior',
    desc: 'Pick an ARIA preset — it handles roles, states, and key bindings.',
  },
  {
    num: '04',
    title: 'Render UI',
    desc: 'Wire the headless state to your own components. Full control.',
  },
]

function HowItWorks() {
  return (
    <section className="cms-how">
      <p className="cms-section-label">Workflow</p>
      <h2 className="cms-section-title">How it works</h2>
      <p className="cms-section-desc">
        Four layers, each independently testable. Compose them for any UI pattern.
      </p>
      <div className="cms-how__steps">
        {steps.map((s) => (
          <div key={s.num} className="cms-step">
            <span className="cms-step__number">{s.num}</span>
            <h3 className="cms-step__title">{s.title}</h3>
            <p className="cms-step__desc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Section: Patterns ──

const patterns = [
  { name: 'Treegrid', icon: <Table size={12} /> },
  { name: 'Listbox', icon: <List size={12} /> },
  { name: 'Tabs', icon: <PanelTop size={12} /> },
  { name: 'Combobox', icon: <MessageSquare size={12} /> },
  { name: 'Grid', icon: <Grid3X3 size={12} /> },
  { name: 'Menu', icon: <Menu size={12} /> },
  { name: 'Dialog', icon: <Layers size={12} /> },
  { name: 'Accordion', icon: <ChevronDown size={12} /> },
  { name: 'Tree View', icon: <ChevronRight size={12} /> },
  { name: 'Toolbar', icon: <Keyboard size={12} /> },
  { name: 'Disclosure', icon: <MousePointerClick size={12} /> },
  { name: 'Switch', icon: <ToggleLeft size={12} /> },
  { name: 'RadioGroup', icon: <Radio size={12} /> },
  { name: 'AlertDialog', icon: <Shield size={12} /> },
]

function Patterns() {
  return (
    <section className="cms-patterns">
      <p className="cms-section-label">Coverage</p>
      <h2 className="cms-section-title">14 APG patterns</h2>
      <p className="cms-section-desc">
        Every composite widget from the W3C ARIA Authoring Practices Guide,
        fully implemented with keyboard interaction tables.
      </p>
      <div className="cms-patterns__grid">
        {patterns.map((p) => (
          <div key={p.name} className="cms-pattern">
            <div className="cms-pattern__icon">{p.icon}</div>
            <span className="cms-pattern__name">{p.name}</span>
          </div>
        ))}
      </div>
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
