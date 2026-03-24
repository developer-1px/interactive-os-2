// ② 2026-03-24-cms-editorial-content-prd.md
import { createStore } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'
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
    'hero-badge':    { id: 'hero-badge',    data: { type: 'badge', value: localeMap('Open Source') } },
    'hero-title':    { id: 'hero-title',    data: { type: 'text', role: 'hero-title', value: localeMap("Accessibility shouldn't be the thing you add last.") } },
    'hero-subtitle': { id: 'hero-subtitle', data: { type: 'text', role: 'hero-subtitle', value: localeMap('키보드 인터랙션, ARIA 역할, 포커스 관리 — 이 모든 것이 설계의 첫 번째 결정이 되는 엔진.') } },
    'hero-cta':      { id: 'hero-cta',      data: { type: 'cta', primary: localeMap('Get Started'), secondary: localeMap('View on GitHub') } },

    // ── Manifesto ──
    'manifesto-title':    { id: 'manifesto-title',    data: { type: 'section-title', value: localeMap('Built for keyboards.\nDesigned for everyone.') } },
    'manifesto-keyboard': { id: 'manifesto-keyboard', data: { type: 'value-item', icon: 'keyboard', title: localeMap('Keyboard-first, not keyboard-also'), desc: localeMap('모든 인터랙션이 키보드에서 시작한다. 마우스는 편의, 키보드는 기본값.') } },
    'manifesto-a11y':     { id: 'manifesto-a11y',     data: { type: 'value-item', icon: 'shield', title: localeMap('Accessible by default'), desc: localeMap('ARIA 역할과 상태가 자동으로 바인딩된다. 접근성은 추가 작업이 아니라 기본 동작.') } },
    'manifesto-headless': { id: 'manifesto-headless', data: { type: 'value-item', icon: 'layers', title: localeMap('Headless, not styleless'), desc: localeMap('렌더링은 당신의 것. 상태와 인터랙션은 엔진의 것. 어떤 컴포넌트 라이브러리 위에서든 동작한다.') } },

    // ── Features ──
    'features-label': { id: 'features-label', data: { type: 'section-label', value: localeMap('Core') } },
    'features-title': { id: 'features-title', data: { type: 'section-title', value: localeMap('Everything you need to build accessible interfaces') } },
    'features-desc':  { id: 'features-desc',  data: { type: 'section-desc', value: localeMap('네 개의 독립 레이어. 각각 테스트 가능. 조합하면 어떤 UI 패턴이든.') } },

    'card-store':          { id: 'card-store',          data: { type: 'card' } },
    'card-store-icon':     { id: 'card-store-icon',     data: { type: 'icon', value: 'database' } },
    'card-store-title':    { id: 'card-store-title',    data: { type: 'text', role: 'title', value: localeMap('Normalized Store') } },
    'card-store-desc':     { id: 'card-store-desc',     data: { type: 'text', role: 'desc', value: localeMap('엔티티와 관계를 정규화 트리로 관리. O(1) 조회, 불변 업데이트, 부모-자식 순회.') } },

    'card-engine':         { id: 'card-engine',         data: { type: 'card' } },
    'card-engine-icon':    { id: 'card-engine-icon',    data: { type: 'icon', value: 'cog' } },
    'card-engine-title':   { id: 'card-engine-title',   data: { type: 'text', role: 'title', value: localeMap('Command Engine') } },
    'card-engine-desc':    { id: 'card-engine-desc',    data: { type: 'text', role: 'desc', value: localeMap('모든 변경은 커맨드. 미들웨어 파이프라인으로 유효성 검증, 로깅, undo/redo.') } },

    'card-behavior':       { id: 'card-behavior',       data: { type: 'card' } },
    'card-behavior-icon':  { id: 'card-behavior-icon',  data: { type: 'icon', value: 'shield' } },
    'card-behavior-title': { id: 'card-behavior-title', data: { type: 'text', role: 'title', value: localeMap('16 ARIA Behaviors') } },
    'card-behavior-desc':  { id: 'card-behavior-desc',  data: { type: 'text', role: 'desc', value: localeMap('Treegrid, listbox, tabs, combobox — 프리셋 하나로 역할, 상태, 키 바인딩 완성.') } },

    'card-keyboard':       { id: 'card-keyboard',       data: { type: 'card' } },
    'card-keyboard-icon':  { id: 'card-keyboard-icon',  data: { type: 'icon', value: 'keyboard' } },
    'card-keyboard-title': { id: 'card-keyboard-title', data: { type: 'text', role: 'title', value: localeMap('Keyboard Interaction') } },
    'card-keyboard-desc':  { id: 'card-keyboard-desc',  data: { type: 'text', role: 'desc', value: localeMap('로빙 탭인덱스, 방향키 탐색, 공간 내비게이션, 플랫폼 인식 단축키.') } },

    // ── Patterns ──
    'patterns-label': { id: 'patterns-label', data: { type: 'section-label', value: localeMap('Coverage') } },
    'patterns-title': { id: 'patterns-title', data: { type: 'section-title', value: localeMap('16 APG patterns. Zero guesswork.') } },
    'patterns-desc':  { id: 'patterns-desc',  data: { type: 'section-desc', value: localeMap('W3C ARIA Authoring Practices Guide의 모든 복합 위젯. 키보드 인터랙션 테이블 완비.') } },

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

    // ── Showcase ──
    'showcase-label': { id: 'showcase-label', data: { type: 'section-label', value: localeMap('Proof') } },
    'showcase-title': { id: 'showcase-title', data: { type: 'section-title', value: localeMap('Built with interactive-os') } },
    'showcase-desc':  { id: 'showcase-desc',  data: { type: 'section-desc', value: localeMap('이 페이지가 증거다.\n지금 보고 있는 랜딩 페이지는 interactive-os 위에서 동작하는 Visual CMS로 편집되고 있다.') } },

    'showcase-store':     { id: 'showcase-store',     data: { type: 'showcase-item', icon: 'database', label: localeMap('Store'),      desc: localeMap('정규화 트리로 모든 엔티티 관리') } },
    'showcase-nav':       { id: 'showcase-nav',       data: { type: 'showcase-item', icon: 'compass',  label: localeMap('Navigation'), desc: localeMap('방향키로 모든 섹션 탐색') } },
    'showcase-select':    { id: 'showcase-select',    data: { type: 'showcase-item', icon: 'click',    label: localeMap('Selection'),  desc: localeMap('Shift+Click 다중 선택') } },
    'showcase-clipboard': { id: 'showcase-clipboard', data: { type: 'showcase-item', icon: 'scissors', label: localeMap('Clipboard'),  desc: localeMap('Cut/Copy/Paste + canAccept') } },
    'showcase-history':   { id: 'showcase-history',   data: { type: 'showcase-item', icon: 'clock',    label: localeMap('History'),    desc: localeMap('Undo/Redo 전체 이력') } },
    'showcase-i18n':      { id: 'showcase-i18n',      data: { type: 'showcase-item', icon: 'globe',    label: localeMap('i18n'),       desc: localeMap('3개 언어 동시 편집') } },

    // ── Journal ──
    'journal-title': { id: 'journal-title', data: { type: 'section-title', value: localeMap('From the docs') } },

    'article-start':    { id: 'article-start',    data: { type: 'article', icon: 'file',     title: localeMap('Getting Started'),            category: localeMap('Guides'),       readTime: '5 min' } },
    'article-concepts': { id: 'article-concepts', data: { type: 'article', icon: 'layers',   title: localeMap('Core Concepts'),              category: localeMap('Architecture'), readTime: '10 min' } },
    'article-keyboard': { id: 'article-keyboard', data: { type: 'article', icon: 'keyboard', title: localeMap('Keyboard Interaction Tables'), category: localeMap('Reference'),    readTime: '—' } },

    // ── Testimonial ──
    'testimonial-quote': { id: 'testimonial-quote', data: { type: 'quote', text: localeMap('The cost of accessibility has been hiding its value.\nWhen the cost is zero, every interface is accessible.'), attribution: localeMap('interactive-os') } },

    // ── CTA ──
    'cta-title':   { id: 'cta-title',   data: { type: 'section-title', value: localeMap('Start building accessible interfaces.') } },
    'cta-buttons': { id: 'cta-buttons', data: { type: 'cta', primary: localeMap('Get Started'), secondary: localeMap('View on GitHub') } },

    // ── Footer ──
    'footer-brand':       { id: 'footer-brand',       data: { type: 'brand', name: localeMap('interactive-os'), license: 'MIT' } },
    'footer-links':       { id: 'footer-links',       data: { type: 'links' } },
    'footer-link-docs':   { id: 'footer-link-docs',   data: { type: 'link', label: localeMap('Documentation'), href: '#docs' } },
    'footer-link-github': { id: 'footer-link-github', data: { type: 'link', label: localeMap('GitHub'),        href: '#github' } },
    'footer-link-npm':    { id: 'footer-link-npm',    data: { type: 'link', label: localeMap('npm'),           href: '#npm' } },
  },
  relationships: {
    [ROOT_ID]: ['hero', 'manifesto', 'features', 'patterns', 'showcase', 'journal', 'testimonial', 'cta', 'footer'],

    hero:        ['hero-badge', 'hero-title', 'hero-subtitle', 'hero-cta'],
    manifesto:   ['manifesto-title', 'manifesto-keyboard', 'manifesto-a11y', 'manifesto-headless'],
    features:    ['features-label', 'features-title', 'features-desc', 'card-store', 'card-engine', 'card-behavior', 'card-keyboard'],
    'card-store':    ['card-store-icon',    'card-store-title',    'card-store-desc'],
    'card-engine':   ['card-engine-icon',   'card-engine-title',   'card-engine-desc'],
    'card-behavior': ['card-behavior-icon', 'card-behavior-title', 'card-behavior-desc'],
    'card-keyboard': ['card-keyboard-icon', 'card-keyboard-title', 'card-keyboard-desc'],
    patterns:    ['patterns-label', 'patterns-title', 'patterns-desc',
      'pat-treegrid', 'pat-listbox', 'pat-tabs', 'pat-combobox', 'pat-grid', 'pat-menu', 'pat-dialog',
      'pat-accordion', 'pat-treeview', 'pat-toolbar', 'pat-disclosure', 'pat-switch', 'pat-radiogroup', 'pat-alertdialog',
      'pat-slider', 'pat-spinbutton',
    ],
    showcase:    ['showcase-label', 'showcase-title', 'showcase-desc', 'showcase-store', 'showcase-nav', 'showcase-select', 'showcase-clipboard', 'showcase-history', 'showcase-i18n'],
    journal:     ['journal-title', 'article-start', 'article-concepts', 'article-keyboard'],
    testimonial: ['testimonial-quote'],
    cta:         ['cta-title', 'cta-buttons'],
    footer:      ['footer-brand', 'footer-links'],
    'footer-links': ['footer-link-docs', 'footer-link-github', 'footer-link-npm'],
  },
})
