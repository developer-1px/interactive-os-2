// ② 2026-03-24-cms-editorial-content-prd.md
import type { Command } from '../../interactive-os/engine/types'
import { createBatchCommand } from '../../interactive-os/engine/types'
import { crudCommands } from '../../interactive-os/plugins/crud'
import { localeMap } from './cms-types'

export type SectionVariant = 'hero' | 'manifesto' | 'features' | 'patterns' | 'showcase' | 'journal' | 'testimonial' | 'cta' | 'footer'
export type TemplateType = SectionVariant | 'tab-group'

interface TemplateVariant {
  id: TemplateType
  label: string
  icon: string
}

export const TEMPLATE_VARIANTS: TemplateVariant[] = [
  { id: 'hero',        label: 'Hero',        icon: 'star' },
  { id: 'manifesto',   label: 'Manifesto',   icon: 'heart' },
  { id: 'features',    label: 'Features',    icon: 'grid' },
  { id: 'patterns',    label: 'Patterns',    icon: 'shield' },
  { id: 'showcase',    label: 'Showcase',    icon: 'layers' },
  { id: 'journal',     label: 'Journal',     icon: 'book' },
  { id: 'testimonial', label: 'Testimonial', icon: 'quote' },
  { id: 'cta',         label: 'CTA',         icon: 'zap' },
  { id: 'footer',      label: 'Footer',      icon: 'arrow-right' },
  { id: 'tab-group',   label: 'Tab Group',   icon: 'paneltop' },
]

interface SectionTemplate {
  entities: Record<string, { id: string; data: Record<string, unknown> }>
  relationships: Record<string, string[]>
  rootId: string
}

let counter = 0
function uid(prefix: string): string {
  return `${prefix}-${++counter}`
}

function entity(id: string, data: Record<string, unknown>) {
  return { id, data }
}

// ── Hero ──

function createHero(): SectionTemplate {
  const rootId = uid('hero')
  const badgeId = uid('hero-badge')
  const titleId = uid('hero-title')
  const subtitleId = uid('hero-subtitle')
  const ctaId = uid('hero-cta')

  return {
    rootId,
    entities: {
      [rootId]:     entity(rootId,     { type: 'section', variant: 'hero' }),
      [badgeId]:    entity(badgeId,    { type: 'badge', value: localeMap('Open Source') }),
      [titleId]:    entity(titleId,    { type: 'text', role: 'hero-title', value: localeMap("Accessibility shouldn't be the thing you add last.") }),
      [subtitleId]: entity(subtitleId, { type: 'text', role: 'hero-subtitle', value: localeMap('키보드 인터랙션, ARIA 역할, 포커스 관리 — 이 모든 것이 설계의 첫 번째 결정이 되는 엔진.') }),
      [ctaId]:      entity(ctaId,      { type: 'cta', primary: localeMap('Get Started'), secondary: localeMap('View on GitHub') }),
    },
    relationships: {
      [rootId]: [badgeId, titleId, subtitleId, ctaId],
    },
  }
}

// ── Manifesto ──

function createManifesto(): SectionTemplate {
  const rootId = uid('manifesto')
  const titleId = uid('manifesto-title')

  const values = [
    { slug: 'keyboard', icon: 'keyboard', title: 'Keyboard-first, not keyboard-also', desc: '모든 인터랙션이 키보드에서 시작한다. 마우스는 편의, 키보드는 기본값.' },
    { slug: 'accessible', icon: 'shield', title: 'Accessible by default', desc: 'ARIA 역할과 상태가 자동으로 바인딩된다. 접근성은 추가 작업이 아니라 기본 동작.' },
    { slug: 'headless', icon: 'layers', title: 'Headless, not styleless', desc: '렌더링은 당신의 것. 상태와 인터랙션은 엔진의 것. 어떤 컴포넌트 라이브러리 위에서든 동작한다.' },
  ]

  const entities: SectionTemplate['entities'] = {
    [rootId]:  entity(rootId,  { type: 'section', variant: 'manifesto' }),
    [titleId]: entity(titleId, { type: 'section-title', value: localeMap('Built for keyboards.\nDesigned for everyone.') }),
  }
  const relationships: SectionTemplate['relationships'] = {}
  const childIds: string[] = [titleId]

  for (const v of values) {
    const id = uid(`value-${v.slug}`)
    entities[id] = entity(id, { type: 'value-item', icon: v.icon, title: localeMap(v.title), desc: localeMap(v.desc) })
    childIds.push(id)
  }

  relationships[rootId] = childIds
  return { rootId, entities, relationships }
}

// ── Features ──

function createFeatures(): SectionTemplate {
  const rootId = uid('features')
  const labelId = uid('features-label')
  const titleId = uid('features-title')
  const descId  = uid('features-desc')

  const cards = [
    { slug: 'store',    icon: 'database', title: 'Normalized Store',     desc: '엔티티와 관계를 정규화 트리로 관리. O(1) 조회, 불변 업데이트, 부모-자식 순회.' },
    { slug: 'engine',   icon: 'cog',      title: 'Command Engine',       desc: '모든 변경은 커맨드. 미들웨어 파이프라인으로 유효성 검증, 로깅, undo/redo.' },
    { slug: 'behavior', icon: 'shield',   title: '16 ARIA Behaviors',    desc: 'Treegrid, listbox, tabs, combobox — 프리셋 하나로 역할, 상태, 키 바인딩 완성.' },
    { slug: 'keyboard', icon: 'keyboard', title: 'Keyboard Interaction', desc: '로빙 탭인덱스, 방향키 탐색, 공간 내비게이션, 플랫폼 인식 단축키.' },
  ]

  const entities: SectionTemplate['entities'] = {
    [rootId]:  entity(rootId,  { type: 'section', variant: 'features' }),
    [labelId]: entity(labelId, { type: 'section-label', value: localeMap('Core') }),
    [titleId]: entity(titleId, { type: 'section-title', value: localeMap('Everything you need to build accessible interfaces') }),
    [descId]:  entity(descId,  { type: 'section-desc',  value: localeMap('네 개의 독립 레이어. 각각 테스트 가능. 조합하면 어떤 UI 패턴이든.') }),
  }
  const relationships: SectionTemplate['relationships'] = {}
  const cardIds: string[] = []

  for (const card of cards) {
    const cardId   = uid(`card-${card.slug}`)
    const iconId   = uid(`card-${card.slug}-icon`)
    const cTitleId = uid(`card-${card.slug}-title`)
    const cDescId  = uid(`card-${card.slug}-desc`)

    entities[cardId]   = entity(cardId,   { type: 'card' })
    entities[iconId]   = entity(iconId,   { type: 'icon',  value: card.icon })
    entities[cTitleId] = entity(cTitleId, { type: 'text',  role: 'title', value: localeMap(card.title) })
    entities[cDescId]  = entity(cDescId,  { type: 'text',  role: 'desc',  value: localeMap(card.desc) })

    relationships[cardId] = [iconId, cTitleId, cDescId]
    cardIds.push(cardId)
  }

  relationships[rootId] = [labelId, titleId, descId, ...cardIds]
  return { rootId, entities, relationships }
}

// ── Patterns ──

function createPatterns(): SectionTemplate {
  const rootId  = uid('patterns')
  const labelId = uid('patterns-label')
  const titleId = uid('patterns-title')
  const descId  = uid('patterns-desc')

  const patternDefs = [
    { slug: 'treegrid',    name: 'Treegrid',    icon: 'table' },
    { slug: 'listbox',     name: 'Listbox',     icon: 'list' },
    { slug: 'tabs',        name: 'Tabs',        icon: 'paneltop' },
    { slug: 'combobox',    name: 'Combobox',    icon: 'message' },
    { slug: 'grid',        name: 'Grid',        icon: 'grid' },
    { slug: 'menu',        name: 'Menu',        icon: 'menu' },
    { slug: 'dialog',      name: 'Dialog',      icon: 'layers' },
    { slug: 'accordion',   name: 'Accordion',   icon: 'chevrondown' },
    { slug: 'treeview',    name: 'Tree View',   icon: 'chevronright' },
    { slug: 'toolbar',     name: 'Toolbar',     icon: 'keyboard' },
    { slug: 'disclosure',  name: 'Disclosure',  icon: 'click' },
    { slug: 'switch',      name: 'Switch',      icon: 'toggle' },
    { slug: 'radiogroup',  name: 'RadioGroup',  icon: 'radio' },
    { slug: 'alertdialog', name: 'AlertDialog', icon: 'shield' },
    { slug: 'slider',      name: 'Slider',      icon: 'slider' },
    { slug: 'spinbutton',  name: 'Spinbutton',  icon: 'hash' },
  ]

  const entities: SectionTemplate['entities'] = {
    [rootId]:  entity(rootId,  { type: 'section', variant: 'patterns' }),
    [labelId]: entity(labelId, { type: 'section-label', value: localeMap('Coverage') }),
    [titleId]: entity(titleId, { type: 'section-title', value: localeMap('16 APG patterns. Zero guesswork.') }),
    [descId]:  entity(descId,  { type: 'section-desc',  value: localeMap('W3C ARIA Authoring Practices Guide의 모든 복합 위젯. 키보드 인터랙션 테이블 완비.') }),
  }
  const patIds: string[] = []

  for (const pat of patternDefs) {
    const patId = uid(`pat-${pat.slug}`)
    entities[patId] = entity(patId, { type: 'pattern', name: localeMap(pat.name), icon: pat.icon })
    patIds.push(patId)
  }

  return {
    rootId,
    entities,
    relationships: {
      [rootId]: [labelId, titleId, descId, ...patIds],
    },
  }
}

// ── Showcase ──

function createShowcase(): SectionTemplate {
  const rootId  = uid('showcase')
  const labelId = uid('showcase-label')
  const titleId = uid('showcase-title')
  const descId  = uid('showcase-desc')

  const items = [
    { slug: 'store',     icon: 'database', label: 'Store',      desc: '정규화 트리로 모든 엔티티 관리' },
    { slug: 'nav',       icon: 'compass',  label: 'Navigation', desc: '방향키로 모든 섹션 탐색' },
    { slug: 'select',    icon: 'click',    label: 'Selection',  desc: 'Shift+Click 다중 선택' },
    { slug: 'clipboard', icon: 'scissors', label: 'Clipboard',  desc: 'Cut/Copy/Paste + canAccept' },
    { slug: 'history',   icon: 'clock',    label: 'History',    desc: 'Undo/Redo 전체 이력' },
    { slug: 'i18n',      icon: 'globe',    label: 'i18n',       desc: '3개 언어 동시 편집' },
  ]

  const entities: SectionTemplate['entities'] = {
    [rootId]:  entity(rootId,  { type: 'section', variant: 'showcase' }),
    [labelId]: entity(labelId, { type: 'section-label', value: localeMap('Proof') }),
    [titleId]: entity(titleId, { type: 'section-title', value: localeMap('Built with interactive-os') }),
    [descId]:  entity(descId,  { type: 'section-desc',  value: localeMap('이 페이지가 증거다.\n지금 보고 있는 랜딩 페이지는 interactive-os 위에서 동작하는 Visual CMS로 편집되고 있다.') }),
  }
  const relationships: SectionTemplate['relationships'] = {}
  const itemIds: string[] = []

  for (const item of items) {
    const id = uid(`showcase-${item.slug}`)
    entities[id] = entity(id, { type: 'showcase-item', icon: item.icon, label: localeMap(item.label), desc: localeMap(item.desc) })
    itemIds.push(id)
  }

  relationships[rootId] = [labelId, titleId, descId, ...itemIds]
  return { rootId, entities, relationships }
}

// ── Journal ──

function createJournal(): SectionTemplate {
  const rootId  = uid('journal')
  const titleId = uid('journal-title')

  const articles = [
    { slug: 'getting-started', icon: 'file',     title: 'Getting Started',             category: 'Guides',       readTime: '5 min' },
    { slug: 'core-concepts',   icon: 'layers',   title: 'Core Concepts',               category: 'Architecture', readTime: '10 min' },
    { slug: 'keyboard-tables', icon: 'keyboard', title: 'Keyboard Interaction Tables',  category: 'Reference',    readTime: '—' },
  ]

  const entities: SectionTemplate['entities'] = {
    [rootId]:  entity(rootId,  { type: 'section', variant: 'journal' }),
    [titleId]: entity(titleId, { type: 'section-title', value: localeMap('From the docs') }),
  }
  const relationships: SectionTemplate['relationships'] = {}
  const childIds: string[] = [titleId]

  for (const a of articles) {
    const id = uid(`article-${a.slug}`)
    entities[id] = entity(id, { type: 'article', icon: a.icon, title: localeMap(a.title), category: localeMap(a.category), readTime: a.readTime })
    childIds.push(id)
  }

  relationships[rootId] = childIds
  return { rootId, entities, relationships }
}

// ── Testimonial ──

function createTestimonial(): SectionTemplate {
  const rootId  = uid('testimonial')
  const quoteId = uid('testimonial-quote')

  return {
    rootId,
    entities: {
      [rootId]:  entity(rootId,  { type: 'section', variant: 'testimonial' }),
      [quoteId]: entity(quoteId, { type: 'quote', text: localeMap('The cost of accessibility has been hiding its value.\nWhen the cost is zero, every interface is accessible.'), attribution: localeMap('interactive-os') }),
    },
    relationships: {
      [rootId]: [quoteId],
    },
  }
}

// ── CTA ──

function createCta(): SectionTemplate {
  const rootId  = uid('cta')
  const titleId = uid('cta-title')
  const ctaId   = uid('cta-buttons')

  return {
    rootId,
    entities: {
      [rootId]:  entity(rootId,  { type: 'section', variant: 'cta' }),
      [titleId]: entity(titleId, { type: 'section-title', value: localeMap('Start building accessible interfaces.') }),
      [ctaId]:   entity(ctaId,   { type: 'cta', primary: localeMap('Get Started'), secondary: localeMap('View on GitHub') }),
    },
    relationships: {
      [rootId]: [titleId, ctaId],
    },
  }
}

// ── Footer ──

function createFooter(): SectionTemplate {
  const rootId   = uid('footer')
  const brandId  = uid('footer-brand')
  const linksId  = uid('footer-links')
  const docsId   = uid('footer-link-docs')
  const githubId = uid('footer-link-github')
  const npmId    = uid('footer-link-npm')

  return {
    rootId,
    entities: {
      [rootId]:   entity(rootId,   { type: 'section', variant: 'footer' }),
      [brandId]:  entity(brandId,  { type: 'brand', name: localeMap('interactive-os'), license: 'MIT' }),
      [linksId]:  entity(linksId,  { type: 'links' }),
      [docsId]:   entity(docsId,   { type: 'link', label: localeMap('Documentation'), href: '#docs' }),
      [githubId]: entity(githubId, { type: 'link', label: localeMap('GitHub'),        href: '#github' }),
      [npmId]:    entity(npmId,    { type: 'link', label: localeMap('npm'),           href: '#npm' }),
    },
    relationships: {
      [rootId]:  [brandId, linksId],
      [linksId]: [docsId, githubId, npmId],
    },
  }
}

// ── Tab Group ──

function createTabGroup(): SectionTemplate {
  const rootId = uid('tab-group')
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const relationships: Record<string, string[]> = {}

  entities[rootId] = { id: rootId, data: { type: 'tab-group' } }
  relationships[rootId] = []

  for (let i = 0; i < 2; i++) {
    const tabId = uid('tab-item')
    const panelId = uid('tab-panel')
    const sectionId = uid('section')

    entities[tabId] = { id: tabId, data: { type: 'tab-item', label: localeMap(`Tab ${i + 1}`) } }
    entities[panelId] = { id: panelId, data: { type: 'tab-panel' } }
    entities[sectionId] = { id: sectionId, data: { type: 'section', variant: 'features' } }

    relationships[rootId].push(tabId)
    relationships[tabId] = [panelId]
    relationships[panelId] = [sectionId]
    relationships[sectionId] = []
  }

  return { rootId, entities, relationships }
}

// ── Template factory ──

function createTemplate(variant: TemplateType): SectionTemplate {
  switch (variant) {
    case 'hero':        return createHero()
    case 'manifesto':   return createManifesto()
    case 'features':    return createFeatures()
    case 'patterns':    return createPatterns()
    case 'showcase':    return createShowcase()
    case 'journal':     return createJournal()
    case 'testimonial': return createTestimonial()
    case 'cta':         return createCta()
    case 'footer':      return createFooter()
    case 'tab-group':   return createTabGroup()
  }
}

/** Convert a template into a BatchCommand of crudCommands.create calls.
 *  Undo removes all created entities in reverse order. */
export function templateToCommand(variant: TemplateType, parentId: string, index?: number): { command: Command; rootId: string } {
  const template = createTemplate(variant)
  const commands: Command[] = []

  commands.push(crudCommands.create(
    template.entities[template.rootId]!,
    parentId,
    index,
  ))

  function addChildren(entityId: string) {
    const childIds = template.relationships[entityId]
    if (!childIds) return
    for (let i = 0; i < childIds.length; i++) {
      const childId = childIds[i]!
      commands.push(crudCommands.create(template.entities[childId]!, entityId, i))
      addChildren(childId)
    }
  }
  addChildren(template.rootId)

  return { command: createBatchCommand(commands), rootId: template.rootId }
}
