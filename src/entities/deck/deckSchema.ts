/**
 * Deck (Slides/PPT) Zod Schema — single source of truth for Slides app data model.
 *
 * Hierarchy: ROOT → deck → slide[] → block[] (title | bullets | stat | image | quote | code | chart)
 *            Chat root → message[]
 * Revision/theme/comment are independent entities referenced by id.
 */
import { z } from 'zod'

// ── Block schemas (discriminated union on `type`) ──
// Each block is a renderable node inside a slide.

export const blockSchemas = {
  title:   z.object({
    type: z.literal('title'),
    text: z.string().meta({ fieldType: 'short-text' }).describe('Title'),
  }),
  bullets: z.object({
    type: z.literal('bullets'),
    // NOTE: future — items can be split into child blocks (per-item entity).
    items: z.array(z.string()).describe('Items'),
  }),
  stat:    z.object({
    type: z.literal('stat'),
    value:   z.string().meta({ fieldType: 'short-text' }).describe('Value'),
    label:   z.string().meta({ fieldType: 'short-text' }).describe('Label'),
    caption: z.string().meta({ fieldType: 'short-text' }).describe('Caption').optional(),
  }),
  image:   z.object({
    type: z.literal('image'),
    src:     z.string().meta({ fieldType: 'image' }).describe('Image'),
    alt:     z.string().meta({ fieldType: 'short-text' }).describe('Alt'),
    caption: z.string().meta({ fieldType: 'short-text' }).describe('Caption').optional(),
  }),
  quote:   z.object({
    type: z.literal('quote'),
    text:        z.string().meta({ fieldType: 'long-text' }).describe('Quote'),
    attribution: z.string().meta({ fieldType: 'short-text' }).describe('Attribution').optional(),
  }),
  code:    z.object({
    type: z.literal('code'),
    language: z.string().meta({ fieldType: 'short-text' }).describe('Language'),
    source:   z.string().meta({ fieldType: 'long-text' }).describe('Source'),
  }),
  chart:   z.object({
    type: z.literal('chart'),
    kind: z.enum(['bar', 'line', 'pie']).describe('Kind'),
    data: z.array(z.object({
      label: z.string(),
      value: z.number(),
    })).describe('Data'),
  }),
} as const

/** Union of all block variants — element type for slide children. */
export const blockUnion = z.discriminatedUnion('type', [
  blockSchemas.title,
  blockSchemas.bullets,
  blockSchemas.stat,
  blockSchemas.image,
  blockSchemas.quote,
  blockSchemas.code,
  blockSchemas.chart,
])

// ── Container schemas ──

export const deckSchema = z.object({
  type:    z.literal('deck'),
  title:   z.string().meta({ fieldType: 'short-text' }).describe('Title'),
  ratio:   z.enum(['16:9', '4:3']).describe('Aspect Ratio'),
  themeId: z.string().describe('Theme'),
})

export const slideSchema = z.object({
  type:   z.literal('slide'),
  hidden: z.boolean().default(false),
})

// ── Chat / revision / supporting schemas ──

export const messageSchema = z.object({
  type:       z.literal('message'),
  role:       z.enum(['user', 'assistant', 'system']),
  content:    z.string(),
  revisionId: z.string().optional(),
  ts:         z.number(),
})

/**
 * Revision — a batch of mock-LLM edit proposals the user can accept or reject.
 * ops are a discriminated union on `op`. B(commands) tightened the shape.
 * Args are kept as `z.record(z.unknown())` so the Mock-LLM layer can emit any
 * keyed payload (deckId / slideId / blockId / patch / blockType / etc.) without
 * coupling every rule change to a schema change. The concrete DeckOp TS type
 * lives in deckMockLlm.ts and is the authoritative compile-time shape.
 */
export const revisionOpSchema = z.object({
  op: z.enum(['slide:insert', 'slide:delete', 'block:insert', 'block:edit', 'block:delete']),
  args: z.record(z.string(), z.unknown()),
})

export const revisionSchema = z.object({
  type:    z.literal('revision'),
  status:  z.enum(['pending', 'accepted', 'rejected']),
  summary: z.string(),
  ops:     z.array(revisionOpSchema),
})

export const themeSchema = z.object({
  type:    z.literal('theme'),
  name:    z.string().meta({ fieldType: 'short-text' }).describe('Name'),
  primary: z.string().meta({ fieldType: 'short-text' }).describe('Primary'),
  accent:  z.string().meta({ fieldType: 'short-text' }).describe('Accent'),
  font:    z.string().meta({ fieldType: 'short-text' }).describe('Font'),
})

export const commentSchema = z.object({
  type:     z.literal('comment'),
  author:   z.string().meta({ fieldType: 'short-text' }).describe('Author'),
  text:     z.string().meta({ fieldType: 'long-text' }).describe('Comment'),
  resolved: z.boolean(),
  ts:       z.number(),
})

// ── Node schemas registry (type name → Zod schema) ──

export const nodeSchemas = {
  deck:     deckSchema,
  slide:    slideSchema,
  title:    blockSchemas.title,
  bullets:  blockSchemas.bullets,
  stat:     blockSchemas.stat,
  image:    blockSchemas.image,
  quote:    blockSchemas.quote,
  code:     blockSchemas.code,
  chart:    blockSchemas.chart,
  message:  messageSchema,
  revision: revisionSchema,
  theme:    themeSchema,
  comment:  commentSchema,
} as const

// ── Children rules (parent type → allowed children schema) ──
// deck → slide[]  (collection, reorderable)
// slide → block[] (collection of block variants)
// ROOT (chat store) → message[]  (keyed under special slot 'chat')
export const childRules: Record<string, z.ZodType> = {
  deck:  z.array(z.discriminatedUnion('type', [slideSchema])),
  slide: z.array(blockUnion),
  chat:  z.array(z.discriminatedUnion('type', [messageSchema])),
}
