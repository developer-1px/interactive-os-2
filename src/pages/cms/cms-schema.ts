/**
 * CMS Zod Schema — single source of truth for CMS data model.
 *
 * Derives: canAccept (paste routing), validate (detail panel),
 *          fieldsOf (editable fields), localeFieldsOf (i18n sheet),
 *          collectEditableGroups (container → grouped fields).
 */
import { z } from 'zod'
import type { CanAcceptFn, CanDeleteFn } from '../../interactive-os/plugins/clipboard'
import type { NormalizedData } from '../../interactive-os/store/types'
import { getChildren } from '../../interactive-os/store/createStore'
import { localized } from './cms-types'
import type { Locale, LocaleMap } from './cms-types'

// ── Field types ──

const FIELD_TYPES = new Set(['short-text', 'long-text', 'url', 'icon', 'image'] as const)
export type FieldType = 'short-text' | 'long-text' | 'url' | 'icon' | 'image'

// ── Locale map ──

const localeMapSchema = z.object({
  ko: z.string(),
  en: z.string(),
  ja: z.string(),
})

// ── Node data schemas ──
// .describe() on each field provides the UI label for Detail Panel.

export const nodeSchemas = {
  badge:            z.object({ type: z.literal('badge'),         value: localeMapSchema.describe('Badge') }),
  icon:             z.object({ type: z.literal('icon'),          value: z.string().meta({ fieldType: 'icon' }).describe('Icon') }),
  text:             z.object({ type: z.literal('text'),          role: z.string(), value: localeMapSchema.describe('Text') }),
  cta:              z.object({ type: z.literal('cta'),           primary: localeMapSchema.describe('Primary CTA'), secondary: localeMapSchema.describe('Secondary CTA') }),
  'stat-value':     z.object({ type: z.literal('stat-value'),    value: z.string().describe('Value') }),
  stat:             z.object({ type: z.literal('stat') }),
  'step-num':       z.object({ type: z.literal('step-num'),      value: z.string().describe('Number') }),
  step:             z.object({ type: z.literal('step') }),
  pattern:          z.object({ type: z.literal('pattern'),       name: localeMapSchema.describe('Name'), icon: z.string().meta({ fieldType: 'icon' }).describe('Icon') }),
  link:             z.object({ type: z.literal('link'),          label: localeMapSchema.describe('Label'), href: z.string().meta({ fieldType: 'url' }).describe('URL') }),
  brand:            z.object({ type: z.literal('brand'),         name: localeMapSchema.describe('Name'), license: z.string().describe('License') }),
  'section-label':  z.object({ type: z.literal('section-label'), value: localeMapSchema.describe('Text') }),
  'section-title':  z.object({ type: z.literal('section-title'), value: localeMapSchema.describe('Text') }),
  'section-desc':   z.object({ type: z.literal('section-desc'),  value: localeMapSchema.meta({ fieldType: 'long-text' }).describe('Text') }),
  links:            z.object({ type: z.literal('links') }),
  card:             z.object({ type: z.literal('card') }),
  section:          z.object({ type: z.literal('section'), variant: z.string() }),
  'tab-group':      z.object({ type: z.literal('tab-group') }),
  'tab-item':       z.object({ type: z.literal('tab-item'),  label: localeMapSchema.describe('Label') }),
  'tab-panel':      z.object({ type: z.literal('tab-panel') }),
  // ② 2026-03-24-cms-editorial-content-prd.md
  'value-item':     z.object({ type: z.literal('value-item'),    icon: z.string().meta({ fieldType: 'icon' }).describe('Icon'), title: localeMapSchema.describe('Title'), desc: localeMapSchema.meta({ fieldType: 'long-text' }).describe('Description') }),
  'quote':          z.object({ type: z.literal('quote'),          text: localeMapSchema.meta({ fieldType: 'long-text' }).describe('Quote'), attribution: localeMapSchema.describe('Attribution') }),
  'article':        z.object({ type: z.literal('article'),        image: z.string().meta({ fieldType: 'image' }).describe('Thumbnail'), icon: z.string().meta({ fieldType: 'icon' }).describe('Icon'), title: localeMapSchema.describe('Title'), category: localeMapSchema.describe('Category'), readTime: z.string().describe('Read Time') }),
  'showcase-item':  z.object({ type: z.literal('showcase-item'),  icon: z.string().meta({ fieldType: 'icon' }).describe('Icon'), label: localeMapSchema.describe('Label'), desc: localeMapSchema.describe('Description') }),
  'stat-card':      z.object({ type: z.literal('stat-card'),      value: z.string().describe('Value'), label: localeMapSchema.describe('Label'), desc: localeMapSchema.describe('Description') }),
  'section-cta':    z.object({ type: z.literal('section-cta'),    label: localeMapSchema.describe('Label'), href: z.string().meta({ fieldType: 'url' }).describe('URL') }),
  // ② 2026-03-27-cms-image-field-prd.md
  'hero-image':     z.object({ type: z.literal('hero-image'),     src: z.string().meta({ fieldType: 'image' }).describe('Banner Image'), alt: localeMapSchema.describe('Alt Text') }),
  'image-card':     z.object({ type: z.literal('image-card') }),
  'gallery-item':   z.object({ type: z.literal('gallery-item'),   image: z.string().meta({ fieldType: 'image' }).describe('Image'), caption: localeMapSchema.describe('Caption') }),
} as const

// ── Children rules ──

export const childRules: Record<string, z.ZodType> = {
  // Collections (z.array): children can be added/removed/reordered
  section: z.array(z.discriminatedUnion('type', [
    nodeSchemas.card, nodeSchemas['image-card'], nodeSchemas.stat, nodeSchemas.step, nodeSchemas.pattern,
    nodeSchemas.badge, nodeSchemas.text, nodeSchemas.cta,
    nodeSchemas['section-label'], nodeSchemas['section-title'], nodeSchemas['section-desc'],
    nodeSchemas.icon, nodeSchemas['hero-image'], nodeSchemas.link, nodeSchemas.brand, nodeSchemas.links,
    nodeSchemas['value-item'], nodeSchemas.quote, nodeSchemas.article, nodeSchemas['showcase-item'],
    nodeSchemas['stat-card'], nodeSchemas['section-cta'], nodeSchemas['gallery-item'],
  ])),
  links: z.array(z.discriminatedUnion('type', [nodeSchemas.link])),
  'tab-group': z.array(z.discriminatedUnion('type', [nodeSchemas['tab-item']])),
  // Slots (non-array): fixed structure, children cannot be deleted
  card:  z.discriminatedUnion('type', [nodeSchemas.icon, nodeSchemas.text]),
  'image-card': z.discriminatedUnion('type', [nodeSchemas['hero-image'], nodeSchemas.text]),
  step:  z.discriminatedUnion('type', [nodeSchemas['step-num'], nodeSchemas.text]),
  stat:  z.discriminatedUnion('type', [nodeSchemas['stat-value'], nodeSchemas.text]),
  'tab-item':  z.discriminatedUnion('type', [nodeSchemas['tab-panel']]),
  'tab-panel': z.discriminatedUnion('type', [nodeSchemas.section]),
}

// ── Derived: canAccept (clipboard paste routing) ──

export const cmsCanAccept: CanAcceptFn = (parentData, childData) => {
  if (!childData) return false
  if (!parentData?.type) {
    const isSection = nodeSchemas.section.safeParse(childData).success
    const isTabGroup = nodeSchemas['tab-group'].safeParse(childData).success
    return (isSection || isTabGroup) ? 'insert' : false
  }
  const rule = childRules[parentData.type as string]
  if (!rule) {
    // No childRule = leaf node. Check if same type → overwrite candidate
    if (parentData.type === (childData as Record<string, unknown>).type) return 'overwrite'
    return false
  }
  if (rule instanceof z.ZodArray) {
    // Collection: validate against element schema
    const elementRule = rule.element
    return (elementRule as z.ZodType & { safeParse(data: unknown): { success: boolean } }).safeParse(childData).success ? 'insert' : false
  }
  // Slot container: fixed structure, cannot accept new children → skip
  return false
}

/** Can children of this parent be deleted/cut?
 *  Collection (array rule) → true, Slot (non-array) → false. */
export const cmsCanDelete: CanDeleteFn = (parentData) => {
  if (!parentData?.type) return true // ROOT-level: always deletable
  const rule = childRules[parentData.type as string]
  if (!rule) return true // No rule = leaf, no children to protect
  return rule instanceof z.ZodArray
}

// ── Derived: fieldsOf (editable fields for detail panel) ──

export interface EditableField {
  field: string
  label: string
  isLocaleMap: boolean
  fieldType: FieldType
}

function isLocaleMapShape(schema: z.ZodType): boolean {
  return schema instanceof z.ZodObject && 'ko' in (schema as z.ZodObject<z.core.$ZodLooseShape>).shape
}

function fieldsOf(type: string): EditableField[] {
  const schema = nodeSchemas[type as keyof typeof nodeSchemas]
  if (!schema) return []
  const shape = schema.shape as Record<string, z.ZodType & { description?: string }>
  return Object.entries(shape)
    .filter(([key, fieldSchema]) => key !== 'type' && fieldSchema.description !== undefined)
    .map(([key, fieldSchema]) => {
      const meta = z.globalRegistry.get(fieldSchema)
      return {
        field: key,
        label: fieldSchema.description!,
        isLocaleMap: isLocaleMapShape(fieldSchema),
        fieldType: FIELD_TYPES.has((meta as Record<string, unknown>)?.fieldType as FieldType) ? (meta as Record<string, unknown>).fieldType as FieldType : 'short-text',
      }
    })
}

export function getEditableFields(data: Record<string, unknown>): EditableField[] {
  const type = data.type as string | undefined
  return type ? fieldsOf(type) : []
}

// ── Derived: localeFieldsOf (i18n translatable fields) ──

export function localeFieldsOf(type: string): string[] {
  return fieldsOf(type).filter(f => f.isLocaleMap).map(f => f.field)
}

// ── Derived: collectEditableGroups (container → grouped fields for Detail Panel) ──

export interface EditableGroupEntry {
  nodeId: string
  field: string
  label: string
  isLocaleMap: boolean
  fieldType: FieldType
}

export interface EditableGroup {
  groupLabel: string
  entries: EditableGroupEntry[]
}

/** Derive a human-readable label for a container group.
 *  - section → capitalize variant
 *  - other containers → first text child with title/label role
 *  - fallback → node type */
function deriveGroupLabel(
  store: NormalizedData,
  nodeId: string,
  locale: Locale,
  children?: string[],
): string {
  const data = (store.entities[nodeId]?.data ?? {}) as Record<string, unknown>

  if (data.type === 'section') {
    const v = data.variant as string
    return v.charAt(0).toUpperCase() + v.slice(1)
  }

  const kids = children ?? getChildren(store, nodeId)
  for (const childId of kids) {
    const cd = (store.entities[childId]?.data ?? {}) as Record<string, unknown>
    if (cd.type === 'text') {
      const role = cd.role as string
      if (role?.includes('title') || role?.includes('label')) {
        return localized(cd.value as string | LocaleMap, locale).text
      }
    }
  }

  return (data.type as string) ?? nodeId
}

function contextualLabel(data: Record<string, unknown>, fieldLabel: string): string {
  if (data.type === 'text' && data.role) {
    const role = data.role as string
    // subtitle before title — 'subtitle'.includes('title') is true
    if (role.includes('subtitle')) return 'Subtitle'
    if (role.includes('title')) return 'Title'
    if (role.includes('desc')) return 'Description'
    if (role.includes('label')) return 'Label'
  }
  if (data.type === 'section-label') return 'Label'
  if (data.type === 'section-title') return 'Title'
  if (data.type === 'section-desc') return 'Description'
  return fieldLabel
}

/** Collect editable fields from a node and its children as groups.
 *  - Leaf with fields → single group (no label)
 *  - Container → recurse children, group by sub-container
 *  - Depth limited to 2 levels (matches CMS data model) */
export function collectEditableGroups(
  store: NormalizedData,
  nodeId: string,
  locale: Locale,
): EditableGroup[] {
  const entity = store.entities[nodeId]
  if (!entity) return []

  const data = (entity.data ?? {}) as Record<string, unknown>
  const fields = getEditableFields(data)
  const children = getChildren(store, nodeId)

  // Leaf with fields → single group, backward-compatible
  if (children.length === 0) {
    if (fields.length === 0) return []
    return [{
      groupLabel: '',
      entries: fields.map(f => ({ nodeId, field: f.field, label: f.label, isLocaleMap: f.isLocaleMap, fieldType: f.fieldType })),
    }]
  }

  // Container → collect children
  const groups: EditableGroup[] = []
  const headerEntries: EditableGroupEntry[] = []

  for (const childId of children) {
    const childEntity = store.entities[childId]
    if (!childEntity) continue
    const childData = (childEntity.data ?? {}) as Record<string, unknown>
    const childFields = getEditableFields(childData)
    const childChildren = getChildren(store, childId)

    if (childChildren.length > 0) {
      // Sub-container → create a named group from its leaf children
      const subEntries: EditableGroupEntry[] = []
      for (const gcId of childChildren) {
        const gcEntity = store.entities[gcId]
        if (!gcEntity) continue
        const gcData = (gcEntity.data ?? {}) as Record<string, unknown>
        const gcFields = getEditableFields(gcData)
        for (const f of gcFields) {
          subEntries.push({
            nodeId: gcId,
            field: f.field,
            label: contextualLabel(gcData, f.label),
            isLocaleMap: f.isLocaleMap,
            fieldType: f.fieldType,
          })
        }
      }
      if (subEntries.length > 0) {
        groups.push({
          groupLabel: deriveGroupLabel(store, childId, locale, childChildren),
          entries: subEntries,
        })
      }
    } else if (childFields.length > 0) {
      // Leaf child with fields → header entries
      for (const f of childFields) {
        headerEntries.push({
          nodeId: childId,
          field: f.field,
          label: contextualLabel(childData, f.label),
          isLocaleMap: f.isLocaleMap,
          fieldType: f.fieldType,
        })
      }
    }
  }

  // Header group first (section headers, standalone leaf fields)
  if (headerEntries.length > 0) {
    const label = deriveGroupLabel(store, nodeId, locale, children)
    groups.unshift({ groupLabel: label, entries: headerEntries })
  }

  return groups
}
