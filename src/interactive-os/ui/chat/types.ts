// ② 2026-03-27-chat-module-prd.md
import type { ComponentType } from 'react'

// --- Chat Message ---

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  ts: number
  blocks: ChatBlock[]
}

// --- Chat Block (discriminated union) ---

export type ChatBlock =
  | TextBlock
  | CodeBlock
  | DiffBlock
  | DataBlock
  | StoreBlock

/** Markdown text */
export interface TextBlock {
  type: 'text'
  content: string
}

/** Syntax-highlighted code */
export interface CodeBlock {
  type: 'code'
  content: string
  language?: string
  filename?: string
}

/** Side-by-side or inline diff */
export interface DiffBlock {
  type: 'diff'
  old: string
  new: string
  filePath?: string
}

/** Read-only block with inline data (extensible) */
export interface DataBlock {
  type: string
  data: unknown
  storeKey?: never // discriminated: no storeKey
}

/** Interactive block bound to a store (extensible) */
export interface StoreBlock {
  type: string
  storeKey: string
  view?: unknown
  data?: never // discriminated: no data
}

// --- Block Renderer ---

/** Each renderer is a React component receiving the block as props */
export type BlockRenderer<B extends ChatBlock = ChatBlock> = ComponentType<{ block: B }>

/** Map of block type → renderer component. Record lookup, no switch-case. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- BlockRenderer is covariant, any is intentional for registry flexibility
export type BlockRendererMap = Record<string, BlockRenderer<any>>
