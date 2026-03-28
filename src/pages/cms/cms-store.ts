// ② 2026-03-24-cms-editorial-content-prd.md
import { createStore } from '../../interactive-os/store/createStore'
import { ROOT_ID } from '../../interactive-os/store/types'
import { localeMap } from './cms-types'

export const cmsStore = createStore({
  entities: {
    // ── Sections ──
    hero:        { id: 'hero',        data: { type: 'section', variant: 'hero' } },
    manifesto:   { id: 'manifesto',   data: { type: 'section', variant: 'manifesto' } },
    features:    { id: 'features',    data: { type: 'section', variant: 'features' } },
    patterns:    { id: 'patterns',    data: { type: 'section', variant: 'patterns' } },
    showcase:    { id: 'showcase',    data: { type: 'section', variant: 'showcase' } },
    journal:     { id: 'journal',     data: { type: 'section', variant: 'journal' } },
    testimonial: { id: 'testimonial', data: { type: 'section', variant: 'testimonial' } },
    cta:         { id: 'cta',         data: { type: 'section', variant: 'cta' } },
    footer:      { id: 'footer',      data: { type: 'section', variant: 'footer' } },

    // ── Hero ──
    'hero-badge':    { id: 'hero-badge',    data: { type: 'badge', value: localeMap('Open Source · MIT') } },
    'hero-title':    { id: 'hero-title',    data: { type: 'text', role: 'hero-title', value: localeMap("Accessibility shouldn't be\nthe thing you add last.") } },
    'hero-subtitle': { id: 'hero-subtitle', data: { type: 'text', role: 'hero-subtitle', value: localeMap('Keyboard, focus, CRUD, clipboard, undo, drag & drop — everything you used to build from scratch, in one plugin.') } },
    'hero-cta':      { id: 'hero-cta',      data: { type: 'cta', primary: localeMap('Get Started'), secondary: localeMap('View on GitHub') } },
    'hero-image':    { id: 'hero-image',   data: { type: 'hero-image', src: '', alt: localeMap('Hero banner') } },

    // ── Manifesto ──
    'manifesto-title':    { id: 'manifesto-title',    data: { type: 'section-title', value: localeMap('Built for keyboards,\ndesigned for everyone.') } },
    'manifesto-keyboard': { id: 'manifesto-keyboard', data: { type: 'value-item', icon: 'keyboard', title: localeMap('Keyboard-first'), desc: localeMap('Arrow, Tab, Enter, Escape, Home, End — every keyboard pattern defined by W3C APG is built in. The mouse is a convenience. The keyboard is the default.') } },
    'manifesto-a11y':     { id: 'manifesto-a11y',     data: { type: 'value-item', icon: 'shield', title: localeMap('Accessible by default'), desc: localeMap('role, aria-selected, aria-expanded, aria-level — ARIA attributes bind automatically to state across 16 patterns. Zero extra lines for accessibility.') } },
    'manifesto-headless': { id: 'manifesto-headless', data: { type: 'value-item', icon: 'layers', title: localeMap('Renderer-independent'), desc: localeMap('Only 2 of 7 layers depend on React. Store, Engine, Plugin, Axis, and Pattern are pure logic. Prove it on the web, then take it native.') } },

    // ── Features ──
    'features-label': { id: 'features-label', data: { type: 'section-label', value: localeMap('Core') } },
    'features-title': { id: 'features-title', data: { type: 'section-title', value: localeMap('Four layers.\nIndependently testable.\nInfinitely composable.') } },
    'features-desc':  { id: 'features-desc',  data: { type: 'section-desc', value: localeMap('Store, Engine, Pattern, and Plugin — each layer does one thing well. Compose them to build any ARIA widget, tested with 705 assertions.') } },

    'card-store':          { id: 'card-store',          data: { type: 'card' } },
    'card-store-icon':     { id: 'card-store-icon',     data: { type: 'icon', value: 'database' } },
    'card-store-title':    { id: 'card-store-title',    data: { type: 'text', role: 'title', value: localeMap('Normalized Store') } },
    'card-store-desc':     { id: 'card-store-desc',     data: { type: 'text', role: 'desc', value: localeMap('Any external data normalizes into two flat maps — entities and relationships. JSON trees, arrays, GraphQL — one internal shape. O(1) lookup, immutable updates.') } },

    'card-engine':         { id: 'card-engine',         data: { type: 'card' } },
    'card-engine-icon':    { id: 'card-engine-icon',    data: { type: 'icon', value: 'cog' } },
    'card-engine-title':   { id: 'card-engine-title',   data: { type: 'text', role: 'title', value: localeMap('Command Engine') } },
    'card-engine-desc':    { id: 'card-engine-desc',    data: { type: 'text', role: 'desc', value: localeMap('Every user action is a Command with execute() and undo(). Middleware intercepts every dispatch — history snapshots, focus recovery, schema validation, all automatic.') } },

    'card-behavior':       { id: 'card-behavior',       data: { type: 'card' } },
    'card-behavior-icon':  { id: 'card-behavior-icon',  data: { type: 'icon', value: 'shield' } },
    'card-behavior-title': { id: 'card-behavior-title', data: { type: 'text', role: 'title', value: localeMap('7 Axes, 17 Patterns') } },
    'card-behavior-desc':  { id: 'card-behavior-desc',  data: { type: 'text', role: 'desc', value: localeMap('navigate, select, expand, activate, tab, value, edit — combine atomic axes to compose any ARIA pattern from treegrid to spinbutton. New patterns are just axis declarations.') } },

    'card-keyboard':       { id: 'card-keyboard',       data: { type: 'card' } },
    'card-keyboard-icon':  { id: 'card-keyboard-icon',  data: { type: 'icon', value: 'keyboard' } },
    'card-keyboard-title': { id: 'card-keyboard-title', data: { type: 'text', role: 'title', value: localeMap('11 Plugins') } },
    'card-keyboard-desc':  { id: 'card-keyboard-desc',  data: { type: 'text', role: 'desc', value: localeMap('history, crud, clipboard, dnd, rename, spatial, typeahead, zodSchema — each owns its keyMap, declares dependencies via requires, and composes into an array. That\'s it.') } },

    // ── Patterns ──
    'patterns-label': { id: 'patterns-label', data: { type: 'section-label', value: localeMap('Coverage') } },
    'patterns-title': { id: 'patterns-title', data: { type: 'section-title', value: localeMap('16 APG patterns.\nZero guesswork.') } },
    'patterns-desc':  { id: 'patterns-desc',  data: { type: 'section-desc', value: localeMap('16 of 19 composite widgets from the W3C ARIA Authoring Practices Guide. Each preset generates role, aria-* attributes, and keyboard interaction tables automatically. Verified by 705 tests.') } },

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
    'pat-slider':      { id: 'pat-slider',      data: { type: 'pattern', name: localeMap('Slider'),      icon: 'slider' } },
    'pat-spinbutton':  { id: 'pat-spinbutton',  data: { type: 'pattern', name: localeMap('Spinbutton'),  icon: 'hash' } },

    // ── Stat cards (Features metrics) ──
    'stat-tests':    { id: 'stat-tests',    data: { type: 'stat-card', value: '705', label: localeMap('Assertions'), desc: localeMap('unit + integration') } },
    'stat-patterns': { id: 'stat-patterns', data: { type: 'stat-card', value: '16', label: localeMap('APG Patterns'), desc: localeMap('of 19 composite widgets') } },
    'stat-plugins':  { id: 'stat-plugins',  data: { type: 'stat-card', value: '11', label: localeMap('Plugins'), desc: localeMap('keyboard, CRUD, history…') } },

    // ── Section CTAs ──
    'features-cta': { id: 'features-cta', data: { type: 'section-cta', label: localeMap('View Architecture'), href: '/internals/architecture' } },
    'patterns-cta': { id: 'patterns-cta', data: { type: 'section-cta', label: localeMap('Browse all patterns'), href: '/ui' } },
    'showcase-cta': { id: 'showcase-cta', data: { type: 'section-cta', label: localeMap('Try the CMS'), href: '/' } },

    // ── Showcase ──
    'showcase-label': { id: 'showcase-label', data: { type: 'section-label', value: localeMap('Proof') } },
    'showcase-title': { id: 'showcase-title', data: { type: 'section-title', value: localeMap('This page is the proof.') } },
    'showcase-desc':  { id: 'showcase-desc',  data: { type: 'section-desc', value: localeMap('The landing page you\'re reading is edited with a Visual CMS built on interactive-os. Navigate sections with arrow keys. Copy nodes. Undo. Every interaction you see runs on the engine below.') } },

    'showcase-store':     { id: 'showcase-store',     data: { type: 'showcase-item', icon: 'database', label: localeMap('Store'),      desc: localeMap('9 sections, 60+ entities in one normalized tree') } },
    'showcase-nav':       { id: 'showcase-nav',       data: { type: 'showcase-item', icon: 'compass',  label: localeMap('Navigation'), desc: localeMap('↑↓ across sections, ←→ into depth, spatial across kanban') } },
    'showcase-select':    { id: 'showcase-select',    data: { type: 'showcase-item', icon: 'click',    label: localeMap('Selection'),  desc: localeMap('Click, Shift+Click range, Ctrl+Click toggle') } },
    'showcase-clipboard': { id: 'showcase-clipboard', data: { type: 'showcase-item', icon: 'scissors', label: localeMap('Clipboard'),  desc: localeMap('⌘C ⌘V ⌘X — zodSchema validates paste targets automatically') } },
    'showcase-history':   { id: 'showcase-history',   data: { type: 'showcase-item', icon: 'clock',    label: localeMap('History'),    desc: localeMap('⌘Z ⌘⇧Z — delta-based undo/redo for every command') } },
    'showcase-i18n':      { id: 'showcase-i18n',      data: { type: 'showcase-item', icon: 'globe',    label: localeMap('i18n'),       desc: localeMap('ko/en/ja — three languages, one entity, tab to switch') } },

    // ── Journal ──
    'journal-title': { id: 'journal-title', data: { type: 'section-title', value: localeMap('From the docs') } },

    'article-start':    { id: 'article-start',    data: { type: 'article', image: '', icon: 'file',     title: localeMap('Getting Started'),                              category: localeMap('Guides'),       readTime: '5 min' } },
    'article-concepts': { id: 'article-concepts', data: { type: 'article', image: '', icon: 'layers',   title: localeMap('7 Layers: Store to UI'),                        category: localeMap('Architecture'), readTime: '10 min' } },
    'article-keyboard': { id: 'article-keyboard', data: { type: 'article', image: '', icon: 'keyboard', title: localeMap('Keyboard Interaction Tables'),                   category: localeMap('Reference'),    readTime: '—' } },
    'article-plugins':  { id: 'article-plugins',  data: { type: 'article', image: '', icon: 'cog',      title: localeMap('Plugin System: definePlugin & Middleware'),      category: localeMap('Deep Dive'),     readTime: '8 min' } },
    'article-axes':     { id: 'article-axes',     data: { type: 'article', image: '', icon: 'compass',  title: localeMap('Axis Decomposition: 7 Atoms of Interaction'),   category: localeMap('Deep Dive'),     readTime: '12 min' } },

    // ── Testimonial ──
    'testimonial-quote': { id: 'testimonial-quote', data: { type: 'quote', text: localeMap('The cost of accessibility\nhas been hiding its value.\nWhen the cost is zero,\nevery interface is accessible.'), attribution: localeMap('interactive-os') } },

    // ── CTA ──
    'cta-title':   { id: 'cta-title',   data: { type: 'section-title', value: localeMap('Start building\naccessible interfaces.') } },
    'cta-buttons': { id: 'cta-buttons', data: { type: 'cta', primary: localeMap('Get Started'), secondary: localeMap('View on GitHub') } },

    // ── Footer ──
    'footer-brand':       { id: 'footer-brand',       data: { type: 'brand', name: localeMap('interactive-os'), license: 'MIT' } },
    'footer-tagline':     { id: 'footer-tagline',     data: { type: 'text', role: 'footer-tagline', value: localeMap('Accessibility as infrastructure, not afterthought.') } },
    'footer-links':       { id: 'footer-links',       data: { type: 'links' } },
    'footer-link-docs':   { id: 'footer-link-docs',   data: { type: 'link', label: localeMap('Documentation'), href: '#docs' } },
    'footer-link-github': { id: 'footer-link-github', data: { type: 'link', label: localeMap('GitHub'),        href: '#github' } },
    'footer-link-npm':    { id: 'footer-link-npm',    data: { type: 'link', label: localeMap('npm'),           href: '#npm' } },
    'footer-link-api':    { id: 'footer-link-api',    data: { type: 'link', label: localeMap('API Reference'), href: '#api' } },

    // ── Gallery ──
    gallery:         { id: 'gallery',         data: { type: 'section', variant: 'gallery' } },
    'gallery-title': { id: 'gallery-title',   data: { type: 'section-title', value: localeMap('Gallery') } },
    'gallery-1':     { id: 'gallery-1',       data: { type: 'gallery-item', image: '', caption: localeMap('Screenshot 1') } },
    'gallery-2':     { id: 'gallery-2',       data: { type: 'gallery-item', image: '', caption: localeMap('Screenshot 2') } },
    'gallery-3':     { id: 'gallery-3',       data: { type: 'gallery-item', image: '', caption: localeMap('Screenshot 3') } },
    'gallery-4':     { id: 'gallery-4',       data: { type: 'gallery-item', image: '', caption: localeMap('Screenshot 4') } },
  },
  relationships: {
    [ROOT_ID]: ['hero', 'manifesto', 'features', 'patterns', 'showcase', 'journal', 'gallery', 'testimonial', 'cta', 'footer'],

    hero:        ['hero-badge', 'hero-title', 'hero-subtitle', 'hero-cta', 'hero-image'],
    manifesto:   ['manifesto-title', 'manifesto-keyboard', 'manifesto-a11y', 'manifesto-headless'],
    features:    ['features-label', 'features-title', 'features-desc', 'features-cta', 'stat-tests', 'stat-patterns', 'stat-plugins', 'card-store', 'card-engine', 'card-behavior', 'card-keyboard'],
    'card-store':    ['card-store-icon',    'card-store-title',    'card-store-desc'],
    'card-engine':   ['card-engine-icon',   'card-engine-title',   'card-engine-desc'],
    'card-behavior': ['card-behavior-icon', 'card-behavior-title', 'card-behavior-desc'],
    'card-keyboard': ['card-keyboard-icon', 'card-keyboard-title', 'card-keyboard-desc'],
    patterns:    ['patterns-label', 'patterns-title', 'patterns-desc', 'patterns-cta',
      'pat-treegrid', 'pat-listbox', 'pat-tabs', 'pat-combobox', 'pat-grid', 'pat-menu', 'pat-dialog',
      'pat-accordion', 'pat-treeview', 'pat-toolbar', 'pat-disclosure', 'pat-switch', 'pat-radiogroup', 'pat-alertdialog',
      'pat-slider', 'pat-spinbutton',
    ],
    showcase:    ['showcase-label', 'showcase-title', 'showcase-desc', 'showcase-cta', 'showcase-store', 'showcase-nav', 'showcase-select', 'showcase-clipboard', 'showcase-history', 'showcase-i18n'],
    journal:     ['journal-title', 'article-start', 'article-concepts', 'article-keyboard', 'article-plugins', 'article-axes'],
    testimonial: ['testimonial-quote'],
    cta:         ['cta-title', 'cta-buttons'],
    footer:      ['footer-brand', 'footer-tagline', 'footer-links'],
    gallery:     ['gallery-title', 'gallery-1', 'gallery-2', 'gallery-3', 'gallery-4'],
    'footer-links': ['footer-link-docs', 'footer-link-github', 'footer-link-npm', 'footer-link-api'],
  },
})
