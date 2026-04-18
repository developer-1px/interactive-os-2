/**
 * Deck TypeScript types — inferred from Zod schemas in deckSchema.ts.
 * Use these for typed entity data; never duplicate shape manually.
 */
import type { z } from 'zod'
import type {
  blockUnion,
  deckSchema,
  slideSchema,
  messageSchema,
  revisionSchema,
  themeSchema,
  commentSchema,
} from './deckSchema'

export type BlockData    = z.infer<typeof blockUnion>
export type DeckData     = z.infer<typeof deckSchema>
export type SlideData    = z.infer<typeof slideSchema>
export type MessageData  = z.infer<typeof messageSchema>
export type RevisionData = z.infer<typeof revisionSchema>
export type ThemeData    = z.infer<typeof themeSchema>
export type CommentData  = z.infer<typeof commentSchema>

/** 'title' | 'bullets' | 'stat' | 'image' | 'quote' | 'code' | 'chart' */
export type BlockType = BlockData['type']

/** 'pending' | 'accepted' | 'rejected' */
export type RevisionStatus = RevisionData['status']

/** 'user' | 'assistant' | 'system' */
export type MessageRole = MessageData['role']
