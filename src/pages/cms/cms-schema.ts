/**
 * CMS Zod Schema — single source of truth for CMS data model.
 *
 * Derives: canAccept (paste routing), validate (detail panel),
 *          fieldsOf (editable fields), localeFieldsOf (i18n sheet).
 */
import { z } from 'zod'
import type { CanAcceptFn } from '../../interactive-os/plugins/clipboard'

// ── Locale map ──

export const localeMapSchema = z.object({
  ko: z.string(),
  en: z.string(),
  ja: z.string(),
})

// ── Node data schemas ──
// .describe() on each field provides the UI label for Detail Panel.

export const nodeSchemas = {
  badge:            z.object({ type: z.literal('badge'),         value: localeMapSchema.describe('Badge') }),
  icon:             z.object({ type: z.literal('icon'),          value: z.string() }),
  text:             z.object({ type: z.literal('text'),          role: z.string().describe('Role'), value: localeMapSchema.describe('Text') }),
  cta:              z.object({ type: z.literal('cta'),           primary: localeMapSchema.describe('Primary CTA'), secondary: localeMapSchema.describe('Secondary CTA') }),
  stat:             z.object({ type: z.literal('stat'),          value: z.string().describe('Value'), label: localeMapSchema.describe('Label') }),
  step:             z.object({ type: z.literal('step'),          num: z.string().describe('Number'), title: localeMapSchema.describe('Title'), desc: localeMapSchema.describe('Description') }),
  pattern:          z.object({ type: z.literal('pattern'),       name: localeMapSchema.describe('Name'), icon: z.string() }),
  link:             z.object({ type: z.literal('link'),          label: localeMapSchema.describe('Label'), href: z.string().describe('URL') }),
  brand:            z.object({ type: z.literal('brand'),         name: localeMapSchema.describe('Name'), license: z.string().describe('License') }),
  'section-label':  z.object({ type: z.literal('section-label'), value: localeMapSchema.describe('Text') }),
  'section-title':  z.object({ type: z.literal('section-title'), value: localeMapSchema.describe('Text') }),
  'section-desc':   z.object({ type: z.literal('section-desc'),  value: localeMapSchema.describe('Text') }),
  links:            z.object({ type: z.literal('links') }),
  card:             z.object({ type: z.literal('card') }),
  section:          z.object({ type: z.literal('section'), variant: z.string() }),
} as const

// ── Children rules ──

export const childRules: Record<string, z.ZodType> = {
  section: z.discriminatedUnion('type', [
    nodeSchemas.card, nodeSchemas.stat, nodeSchemas.step, nodeSchemas.pattern,
    nodeSchemas.badge, nodeSchemas.text, nodeSchemas.cta,
    nodeSchemas['section-label'], nodeSchemas['section-title'], nodeSchemas['section-desc'],
    nodeSchemas.icon, nodeSchemas.link, nodeSchemas.brand, nodeSchemas.links,
  ]),
  card:  z.discriminatedUnion('type', [nodeSchemas.icon, nodeSchemas.text]),
  links: z.discriminatedUnion('type', [nodeSchemas.link]),
}

// ── Derived: canAccept (clipboard paste routing) ──

export const cmsCanAccept: CanAcceptFn = (parentData, childData) => {
  if (!childData) return false
  if (!parentData?.type) return nodeSchemas.section.safeParse(childData).success
  const rule = childRules[parentData.type as string]
  return rule ? rule.safeParse(childData).success : false
}

// ── Derived: validate (detail panel input validation) ──

const allNodeSchemas = z.discriminatedUnion('type', [
  nodeSchemas.badge, nodeSchemas.icon, nodeSchemas.text, nodeSchemas.cta,
  nodeSchemas.stat, nodeSchemas.step, nodeSchemas.pattern,
  nodeSchemas.link, nodeSchemas.brand,
  nodeSchemas['section-label'], nodeSchemas['section-title'], nodeSchemas['section-desc'],
  nodeSchemas.links, nodeSchemas.card, nodeSchemas.section,
])

export function validateNode(data: unknown): { success: boolean; error?: string } {
  const result = allNodeSchemas.safeParse(data)
  if (result.success) return { success: true }
  return { success: false, error: result.error.issues.map(i => i.message).join(', ') }
}

// ── Derived: fieldsOf (editable fields for detail panel) ──

export interface EditableField {
  field: string
  label: string
  isLocaleMap: boolean
}

function isLocaleMapShape(schema: z.ZodType): boolean {
  return schema instanceof z.ZodObject && 'ko' in (schema as z.ZodObject<z.core.$ZodLooseShape>).shape
}

export function fieldsOf(type: string): EditableField[] {
  const schema = nodeSchemas[type as keyof typeof nodeSchemas]
  if (!schema) return []
  const shape = schema.shape as Record<string, z.ZodType & { description?: string }>
  return Object.entries(shape)
    .filter(([key, fieldSchema]) => key !== 'type' && fieldSchema.description !== undefined)
    .map(([key, fieldSchema]) => ({
      field: key,
      label: fieldSchema.description!,
      isLocaleMap: isLocaleMapShape(fieldSchema),
    }))
}

// ── Derived: getEditableFields (backward-compatible wrapper) ──
// Takes entity data object, extracts type, delegates to fieldsOf.

export function getEditableFields(data: Record<string, unknown>): EditableField[] {
  const type = data.type as string | undefined
  return type ? fieldsOf(type) : []
}

// ── Derived: localeFieldsOf (i18n translatable fields) ──

export function localeFieldsOf(type: string): string[] {
  return fieldsOf(type).filter(f => f.isLocaleMap).map(f => f.field)
}
