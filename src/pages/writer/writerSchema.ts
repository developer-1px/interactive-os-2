// ② 2026-04-04-md-writer-prd.md
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
    content: z.string().describe('Content'),
  }),
}

export type DocumentData = z.infer<typeof nodeSchemas.document>
export type HeadingData = z.infer<typeof nodeSchemas.heading>
export type ParagraphData = z.infer<typeof nodeSchemas.paragraph>
export type WriterNodeData = DocumentData | HeadingData | ParagraphData

export const childRules = {
  document: z.array(z.discriminatedUnion('type', [nodeSchemas.heading, nodeSchemas.paragraph])),
}
