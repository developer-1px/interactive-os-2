import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'

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
