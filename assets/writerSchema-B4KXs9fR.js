var e=`// ② 2026-04-04-md-writer-prd.md
import { z } from 'zod'

export const nodeSchemas = {
  document: z.object({
    type: z.literal('document'),
    path: z.string().optional(),
    frontmatter: z.string().optional(),
  }),
  heading: z.object({
    type: z.literal('heading'),
    level: z.number().int().min(1).max(6),
    content: z.string().describe('Heading'),
  }),
  paragraph: z.object({
    type: z.literal('paragraph'),
  }),
  sentence: z.object({
    type: z.literal('sentence'),
    content: z.string().describe('Sentence'),
    role: z.enum(['claim', 'evidence', 'reasoning', 'context', 'counter', 'transition']).optional(),
    relations: z.array(z.object({
      target: z.string(),
      type: z.enum(['supports', 'contradicts', 'elaborates', 'conditions']),
    })).optional(),
  }),
  list: z.object({
    type: z.literal('list'),
    ordered: z.boolean(),
  }),
  listItem: z.object({
    type: z.literal('listItem'),
    content: z.string().describe('List item'),
  }),
  hr: z.object({
    type: z.literal('hr'),
  }),
}

export type DocumentData = z.infer<typeof nodeSchemas.document>
export type HeadingData = z.infer<typeof nodeSchemas.heading>
export type ParagraphData = z.infer<typeof nodeSchemas.paragraph>
export type SentenceData = z.infer<typeof nodeSchemas.sentence>
export type SentenceRole = NonNullable<SentenceData['role']>
export type SentenceRelation = NonNullable<SentenceData['relations']>[number]
export type ListData = z.infer<typeof nodeSchemas.list>
export type ListItemData = z.infer<typeof nodeSchemas.listItem>
export type HrData = z.infer<typeof nodeSchemas.hr>
export type WriterNodeData = DocumentData | HeadingData | ParagraphData | SentenceData | ListData | ListItemData | HrData

export const childRules = {
  document: z.array(z.discriminatedUnion('type', [nodeSchemas.heading, nodeSchemas.paragraph])),
}
`;export{e as default};