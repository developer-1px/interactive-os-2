import type { Command } from '../../interactive-os/core/types'
import { createBatchCommand } from '../../interactive-os/core/types'
import { crudCommands } from '../../interactive-os/plugins/crud'
import { localeMap } from './cms-types'

export type SectionVariant = 'hero' | 'stats' | 'features' | 'workflow' | 'patterns' | 'footer'

interface TemplateVariant {
  id: SectionVariant
  label: string
  icon: string
}

export const TEMPLATE_VARIANTS: TemplateVariant[] = [
  { id: 'hero',     label: 'Hero',     icon: 'star' },
  { id: 'stats',    label: 'Stats',    icon: 'bar-chart' },
  { id: 'features', label: 'Features', icon: 'grid' },
  { id: 'workflow', label: 'Workflow', icon: 'git-branch' },
  { id: 'patterns', label: 'Patterns', icon: 'puzzle' },
  { id: 'footer',   label: 'Footer',   icon: 'minus' },
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

function createHero(): SectionTemplate {
  const rootId = uid('hero')
  const badgeId = uid('hero-badge')
  const titleId = uid('hero-title')
  const subtitleId = uid('hero-subtitle')
  const ctaId = uid('hero-cta')

  return {
    rootId,
    entities: {
      [rootId]:   entity(rootId,   { type: 'section', variant: 'hero' }),
      [badgeId]:  entity(badgeId,  { type: 'badge', value: localeMap('Open Source') }),
      [titleId]:  entity(titleId,  { type: 'text', role: 'hero-title', value: localeMap('Headless ARIA Engine') }),
      [subtitleId]: entity(subtitleId, { type: 'text', role: 'hero-subtitle', value: localeMap('Build fully accessible UI with a normalized store, command engine, and 14 APG-compliant behavior presets — keyboard-first by design.') }),
      [ctaId]:    entity(ctaId,    { type: 'cta', primary: localeMap('Get Started'), secondary: localeMap('View on GitHub') }),
    },
    relationships: {
      [rootId]: [badgeId, titleId, subtitleId, ctaId],
    },
  }
}

function createStats(): SectionTemplate {
  const rootId = uid('stats')
  const s1 = uid('stat-patterns')
  const s2 = uid('stat-tests')
  const s3 = uid('stat-modules')
  const s4 = uid('stat-deps')

  return {
    rootId,
    entities: {
      [rootId]: entity(rootId, { type: 'section', variant: 'stats' }),
      [s1]: entity(s1, { type: 'stat', value: '14',   label: localeMap('APG Patterns') }),
      [s2]: entity(s2, { type: 'stat', value: '365+', label: localeMap('Tests') }),
      [s3]: entity(s3, { type: 'stat', value: '42',   label: localeMap('Modules') }),
      [s4]: entity(s4, { type: 'stat', value: '0',    label: localeMap('Runtime Deps') }),
    },
    relationships: {
      [rootId]: [s1, s2, s3, s4],
    },
  }
}

function createFeatures(): SectionTemplate {
  const rootId = uid('features')
  const labelId = uid('features-label')
  const titleId = uid('features-title')
  const descId  = uid('features-desc')

  const cards = [
    { slug: 'store',    icon: 'database', title: 'Normalized Store',  desc: 'Tree data as flat entities + relationships. O(1) lookups, immutable updates, parent-child traversal built in.' },
    { slug: 'engine',   icon: 'cog',      title: 'Command Engine',    desc: 'Every mutation is a command with undo/redo. Middleware pipeline for validation, logging, and side effects.' },
    { slug: 'aria',     icon: 'shield',   title: '14 ARIA Patterns',  desc: 'Treegrid, listbox, tabs, combobox, dialog, menu, and more. Each preset wires up roles, states, and keyboard interaction.' },
    { slug: 'keyboard', icon: 'keyboard', title: 'Keyboard-First',    desc: 'Every interaction works without a mouse. Roving tabindex, arrow key navigation, spatial nav, and platform-aware shortcuts.' },
  ]

  const entities: SectionTemplate['entities'] = {
    [rootId]:  entity(rootId,  { type: 'section', variant: 'features' }),
    [labelId]: entity(labelId, { type: 'section-label', value: localeMap('Core') }),
    [titleId]: entity(titleId, { type: 'section-title', value: localeMap('Everything you need') }),
    [descId]:  entity(descId,  { type: 'section-desc',  value: localeMap('A complete headless engine for building accessible, keyboard-driven interfaces on any component library.') }),
  }
  const relationships: SectionTemplate['relationships'] = {}
  const cardIds: string[] = []

  for (const card of cards) {
    const cardId  = uid(`card-${card.slug}`)
    const iconId  = uid(`card-${card.slug}-icon`)
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

function createWorkflow(): SectionTemplate {
  const rootId  = uid('workflow')
  const labelId = uid('workflow-label')
  const titleId = uid('workflow-title')
  const descId  = uid('workflow-desc')

  const steps = [
    { num: '01', title: 'Define Store',      desc: 'Create entities and relationships in a normalized tree structure.' },
    { num: '02', title: 'Dispatch Commands', desc: 'Mutations flow through a middleware pipeline with auto undo/redo.' },
    { num: '03', title: 'Apply Behavior',    desc: 'Pick an ARIA preset — it handles roles, states, and key bindings.' },
    { num: '04', title: 'Render UI',         desc: 'Wire the headless state to your own components. Full control.' },
  ]

  const entities: SectionTemplate['entities'] = {
    [rootId]:  entity(rootId,  { type: 'section', variant: 'workflow' }),
    [labelId]: entity(labelId, { type: 'section-label', value: localeMap('Workflow') }),
    [titleId]: entity(titleId, { type: 'section-title', value: localeMap('How it works') }),
    [descId]:  entity(descId,  { type: 'section-desc',  value: localeMap('Four layers, each independently testable. Compose them for any UI pattern.') }),
  }
  const stepIds: string[] = []

  for (const step of steps) {
    const stepId = uid(`step-${step.num}`)
    entities[stepId] = entity(stepId, { type: 'step', num: step.num, title: localeMap(step.title), desc: localeMap(step.desc) })
    stepIds.push(stepId)
  }

  return {
    rootId,
    entities,
    relationships: {
      [rootId]: [labelId, titleId, descId, ...stepIds],
    },
  }
}

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
  ]

  const entities: SectionTemplate['entities'] = {
    [rootId]:  entity(rootId,  { type: 'section', variant: 'patterns' }),
    [labelId]: entity(labelId, { type: 'section-label', value: localeMap('Coverage') }),
    [titleId]: entity(titleId, { type: 'section-title', value: localeMap('14 APG patterns') }),
    [descId]:  entity(descId,  { type: 'section-desc',  value: localeMap('Every composite widget from the W3C ARIA Authoring Practices Guide, fully implemented with keyboard interaction tables.') }),
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

export function createSection(variant: SectionVariant): SectionTemplate {
  switch (variant) {
    case 'hero':     return createHero()
    case 'stats':    return createStats()
    case 'features': return createFeatures()
    case 'workflow': return createWorkflow()
    case 'patterns': return createPatterns()
    case 'footer':   return createFooter()
  }
}

/** Convert a template into a BatchCommand of crudCommands.create calls.
 *  Undo removes all created entities in reverse order. */
export function templateToCommand(variant: SectionVariant, parentId: string, index?: number): { command: Command; rootId: string } {
  const template = createSection(variant)
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
