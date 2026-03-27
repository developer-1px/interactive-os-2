// ② 2026-03-27-chat-module-prd.md — public API
export { ChatFeed } from './ChatFeed'
export type { ChatFeedProps } from './ChatFeed'
export { ChatInput } from './ChatInput'
export type { ChatInputProps } from './ChatInput'
export { TextBlock } from './TextBlock'
export { ChatCodeBlock } from './ChatCodeBlock'
export { DiffBlock } from './DiffBlock'
export { FallbackBlock } from './FallbackBlock'
export type {
  ChatMessage,
  ChatBlock,
  TextBlock as TextBlockType,
  CodeBlock as CodeBlockType,
  DiffBlock as DiffBlockType,
  DataBlock,
  StoreBlock,
  BlockRenderer,
  BlockRendererMap,
} from './types'
