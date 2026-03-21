import { createStore } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'
import { localeMap } from './cms-types'

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
    'hero-badge':    { id: 'hero-badge',    data: { type: 'badge', value: localeMap('Open Source') } },
    'hero-title':    { id: 'hero-title',    data: { type: 'text', role: 'hero-title', value: localeMap('Headless ARIA Engine') } },
    'hero-subtitle': { id: 'hero-subtitle', data: { type: 'text', role: 'hero-subtitle', value: localeMap('Build fully accessible UI with a normalized store, command engine, and 14 APG-compliant behavior presets — keyboard-first by design.') } },
    'hero-cta':      { id: 'hero-cta',      data: { type: 'cta', primary: localeMap('Get Started'), secondary: localeMap('View on GitHub') } },

    // Section headers (label + title + desc for features/workflow/patterns)
    'features-label': { id: 'features-label', data: { type: 'section-label', value: localeMap('Core') } },
    'features-title': { id: 'features-title', data: { type: 'section-title', value: localeMap('Everything you need') } },
    'features-desc':  { id: 'features-desc',  data: { type: 'section-desc', value: localeMap('A complete headless engine for building accessible, keyboard-driven interfaces on any component library.') } },
    'workflow-label': { id: 'workflow-label', data: { type: 'section-label', value: localeMap('Workflow') } },
    'workflow-title': { id: 'workflow-title', data: { type: 'section-title', value: localeMap('How it works') } },
    'workflow-desc':  { id: 'workflow-desc',  data: { type: 'section-desc', value: localeMap('Four layers, each independently testable. Compose them for any UI pattern.') } },
    'patterns-label': { id: 'patterns-label', data: { type: 'section-label', value: localeMap('Coverage') } },
    'patterns-title': { id: 'patterns-title', data: { type: 'section-title', value: localeMap('14 APG patterns') } },
    'patterns-desc':  { id: 'patterns-desc',  data: { type: 'section-desc', value: localeMap('Every composite widget from the W3C ARIA Authoring Practices Guide, fully implemented with keyboard interaction tables.') } },

    // Stats children (container → [stat-value, text(label)])
    'stat-patterns':       { id: 'stat-patterns',       data: { type: 'stat' } },
    'stat-patterns-value': { id: 'stat-patterns-value', data: { type: 'stat-value', value: '14' } },
    'stat-patterns-label': { id: 'stat-patterns-label', data: { type: 'text', role: 'stat-label', value: localeMap('APG Patterns') } },
    'stat-tests':          { id: 'stat-tests',          data: { type: 'stat' } },
    'stat-tests-value':    { id: 'stat-tests-value',    data: { type: 'stat-value', value: '365+' } },
    'stat-tests-label':    { id: 'stat-tests-label',    data: { type: 'text', role: 'stat-label', value: localeMap('Tests') } },
    'stat-modules':        { id: 'stat-modules',        data: { type: 'stat' } },
    'stat-modules-value':  { id: 'stat-modules-value',  data: { type: 'stat-value', value: '42' } },
    'stat-modules-label':  { id: 'stat-modules-label',  data: { type: 'text', role: 'stat-label', value: localeMap('Modules') } },
    'stat-deps':           { id: 'stat-deps',           data: { type: 'stat' } },
    'stat-deps-value':     { id: 'stat-deps-value',     data: { type: 'stat-value', value: '0' } },
    'stat-deps-label':     { id: 'stat-deps-label',     data: { type: 'text', role: 'stat-label', value: localeMap('Runtime Deps') } },

    // Features cards
    'card-store':    { id: 'card-store',    data: { type: 'card' } },
    'card-engine':   { id: 'card-engine',   data: { type: 'card' } },
    'card-aria':     { id: 'card-aria',     data: { type: 'card' } },
    'card-keyboard': { id: 'card-keyboard', data: { type: 'card' } },

    // card-store children
    'card-store-icon':  { id: 'card-store-icon',  data: { type: 'icon',  value: 'database' } },
    'card-store-title': { id: 'card-store-title', data: { type: 'text', role: 'title', value: localeMap('Normalized Store') } },
    'card-store-desc':  { id: 'card-store-desc',  data: { type: 'text', role: 'desc',  value: localeMap('Tree data as flat entities + relationships. O(1) lookups, immutable updates, parent-child traversal built in.') } },

    // card-engine children
    'card-engine-icon':  { id: 'card-engine-icon',  data: { type: 'icon', value: 'cog' } },
    'card-engine-title': { id: 'card-engine-title', data: { type: 'text', role: 'title', value: localeMap('Command Engine') } },
    'card-engine-desc':  { id: 'card-engine-desc',  data: { type: 'text', role: 'desc', value: localeMap('Every mutation is a command with undo/redo. Middleware pipeline for validation, logging, and side effects.') } },

    // card-aria children
    'card-aria-icon':  { id: 'card-aria-icon',  data: { type: 'icon', value: 'shield' } },
    'card-aria-title': { id: 'card-aria-title', data: { type: 'text', role: 'title', value: localeMap('14 ARIA Patterns') } },
    'card-aria-desc':  { id: 'card-aria-desc',  data: { type: 'text', role: 'desc', value: localeMap('Treegrid, listbox, tabs, combobox, dialog, menu, and more. Each preset wires up roles, states, and keyboard interaction.') } },

    // card-keyboard children
    'card-keyboard-icon':  { id: 'card-keyboard-icon',  data: { type: 'icon', value: 'keyboard' } },
    'card-keyboard-title': { id: 'card-keyboard-title', data: { type: 'text', role: 'title', value: localeMap('Keyboard-First') } },
    'card-keyboard-desc':  { id: 'card-keyboard-desc',  data: { type: 'text', role: 'desc', value: localeMap('Every interaction works without a mouse. Roving tabindex, arrow key navigation, spatial nav, and platform-aware shortcuts.') } },

    // Workflow steps (container → [step-num, text(title), text(desc)])
    'step-1':       { id: 'step-1',       data: { type: 'step' } },
    'step-1-num':   { id: 'step-1-num',   data: { type: 'step-num', value: '01' } },
    'step-1-title': { id: 'step-1-title', data: { type: 'text', role: 'step-title', value: localeMap('Define Store') } },
    'step-1-desc':  { id: 'step-1-desc',  data: { type: 'text', role: 'step-desc',  value: localeMap('Create entities and relationships in a normalized tree structure.') } },
    'step-2':       { id: 'step-2',       data: { type: 'step' } },
    'step-2-num':   { id: 'step-2-num',   data: { type: 'step-num', value: '02' } },
    'step-2-title': { id: 'step-2-title', data: { type: 'text', role: 'step-title', value: localeMap('Dispatch Commands') } },
    'step-2-desc':  { id: 'step-2-desc',  data: { type: 'text', role: 'step-desc',  value: localeMap('Mutations flow through a middleware pipeline with auto undo/redo.') } },
    'step-3':       { id: 'step-3',       data: { type: 'step' } },
    'step-3-num':   { id: 'step-3-num',   data: { type: 'step-num', value: '03' } },
    'step-3-title': { id: 'step-3-title', data: { type: 'text', role: 'step-title', value: localeMap('Apply Behavior') } },
    'step-3-desc':  { id: 'step-3-desc',  data: { type: 'text', role: 'step-desc',  value: localeMap('Pick an ARIA preset — it handles roles, states, and key bindings.') } },
    'step-4':       { id: 'step-4',       data: { type: 'step' } },
    'step-4-num':   { id: 'step-4-num',   data: { type: 'step-num', value: '04' } },
    'step-4-title': { id: 'step-4-title', data: { type: 'text', role: 'step-title', value: localeMap('Render UI') } },
    'step-4-desc':  { id: 'step-4-desc',  data: { type: 'text', role: 'step-desc',  value: localeMap('Wire the headless state to your own components. Full control.') } },

    // Patterns
    'pat-treegrid':    { id: 'pat-treegrid',    data: { type: 'pattern', name: localeMap('Treegrid'),    icon: 'table' } },
    'pat-listbox':     { id: 'pat-listbox',     data: { type: 'pattern', name: localeMap('Listbox'),     icon: 'list' } },
    'pat-tabs':        { id: 'pat-tabs',        data: { type: 'pattern', name: localeMap('Tabs'),        icon: 'paneltop' } },
    'pat-combobox':    { id: 'pat-combobox',    data: { type: 'pattern', name: localeMap('Combobox'),    icon: 'message' } },
    'pat-grid':        { id: 'pat-grid',        data: { type: 'pattern', name: localeMap('Grid'),        icon: 'grid' } },
    'pat-menu':        { id: 'pat-menu',        data: { type: 'pattern', name: localeMap('Menu'),        icon: 'menu' } },
    'pat-dialog':      { id: 'pat-dialog',      data: { type: 'pattern', name: localeMap('Dialog'),      icon: 'layers' } },
    'pat-accordion':   { id: 'pat-accordion',   data: { type: 'pattern', name: localeMap('Accordion'),   icon: 'chevrondown' } },
    'pat-treeview':    { id: 'pat-treeview',    data: { type: 'pattern', name: localeMap('Tree View'),   icon: 'chevronright' } },
    'pat-toolbar':     { id: 'pat-toolbar',     data: { type: 'pattern', name: localeMap('Toolbar'),     icon: 'keyboard' } },
    'pat-disclosure':  { id: 'pat-disclosure',  data: { type: 'pattern', name: localeMap('Disclosure'),  icon: 'click' } },
    'pat-switch':      { id: 'pat-switch',      data: { type: 'pattern', name: localeMap('Switch'),      icon: 'toggle' } },
    'pat-radiogroup':  { id: 'pat-radiogroup',  data: { type: 'pattern', name: localeMap('RadioGroup'),  icon: 'radio' } },
    'pat-alertdialog': { id: 'pat-alertdialog', data: { type: 'pattern', name: localeMap('AlertDialog'), icon: 'shield' } },

    // Footer children
    'footer-brand': { id: 'footer-brand', data: { type: 'brand', name: 'interactive-os', license: 'MIT' } },
    'footer-links': { id: 'footer-links', data: { type: 'links' } },

    // footer-links children
    'footer-link-docs':   { id: 'footer-link-docs',   data: { type: 'link', label: localeMap('Documentation'), href: '#docs' } },
    'footer-link-github': { id: 'footer-link-github', data: { type: 'link', label: localeMap('GitHub'),        href: '#github' } },
    'footer-link-npm':    { id: 'footer-link-npm',    data: { type: 'link', label: localeMap('npm'),           href: '#npm' } },
  },
  relationships: {
    [ROOT_ID]: ['hero', 'stats', 'features', 'workflow', 'patterns', 'footer'],
    hero:     ['hero-badge', 'hero-title', 'hero-subtitle', 'hero-cta'],
    stats:    ['stat-patterns', 'stat-tests', 'stat-modules', 'stat-deps'],
    'stat-patterns': ['stat-patterns-value', 'stat-patterns-label'],
    'stat-tests':    ['stat-tests-value',    'stat-tests-label'],
    'stat-modules':  ['stat-modules-value',  'stat-modules-label'],
    'stat-deps':     ['stat-deps-value',     'stat-deps-label'],
    features: ['features-label', 'features-title', 'features-desc', 'card-store', 'card-engine', 'card-aria', 'card-keyboard'],
    'card-store':    ['card-store-icon',    'card-store-title',    'card-store-desc'],
    'card-engine':   ['card-engine-icon',   'card-engine-title',   'card-engine-desc'],
    'card-aria':     ['card-aria-icon',     'card-aria-title',     'card-aria-desc'],
    'card-keyboard': ['card-keyboard-icon', 'card-keyboard-title', 'card-keyboard-desc'],
    workflow: ['workflow-label', 'workflow-title', 'workflow-desc', 'step-1', 'step-2', 'step-3', 'step-4'],
    'step-1': ['step-1-num', 'step-1-title', 'step-1-desc'],
    'step-2': ['step-2-num', 'step-2-title', 'step-2-desc'],
    'step-3': ['step-3-num', 'step-3-title', 'step-3-desc'],
    'step-4': ['step-4-num', 'step-4-title', 'step-4-desc'],
    patterns: ['patterns-label', 'patterns-title', 'patterns-desc',
      'pat-treegrid', 'pat-listbox', 'pat-tabs', 'pat-combobox', 'pat-grid', 'pat-menu', 'pat-dialog',
      'pat-accordion', 'pat-treeview', 'pat-toolbar', 'pat-disclosure', 'pat-switch', 'pat-radiogroup', 'pat-alertdialog',
    ],
    footer: ['footer-brand', 'footer-links'],
    'footer-links': ['footer-link-docs', 'footer-link-github', 'footer-link-npm'],
  },
})
