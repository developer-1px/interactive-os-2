/**
 * Deck domain commands — B stage (commands + mock-LLM pipeline).
 *
 * All mutations go through engine.dispatch(). Handlers receive the previous
 * store, return a new store. Direct `store.entities[id] = ...` is forbidden.
 *
 * Command families:
 *  - slide:*     — structural CRUD + reorder + hidden toggle
 *  - block:*     — CRUD + field-merge edit + (MVP) no-op restyle
 *  - prompt:*    — user text → chat message + async mock-LLM → assistant message + pending revision
 *  - revision:*  — accept replays ops via slide/block commands; reject just marks status
 *
 *                ┌─ user types → prompt:submit
 *    Chat ─────>┤
 *                └─ mock-LLM → chat append + revision entity (status=pending)
 *                              │
 *                              ├─ revision:accept → replay ops as concrete deck commands
 *                              └─ revision:reject → status='rejected'
 */
import { defineCommands } from '@os/engine/defineCommand'
import {
  addEntity,
  removeEntity,
  updateEntityData,
  moveNode,
  getChildren,
  getParent,
  getEntity,
} from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData, Entity } from '@os/store/types'
import type { Command, CommandEngine } from '@os/engine/types'
import type { BlockData, BlockType } from './deckTypes'
import type { DeckOp } from './deckMockLlm'
import { mockLlmRespond } from './deckMockLlm'

// ── id helpers ───────────────────────────────────────────────

let _idCounter = 0
function nextId(prefix: string): string {
  _idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${_idCounter}`
}

/** Test-only — reset id counter for deterministic snapshots */
export function resetDeckIdCounter(): void {
  _idCounter = 0
}

// ── block default data ───────────────────────────────────────

function defaultBlockData(type: BlockType): BlockData {
  switch (type) {
    case 'title':   return { type: 'title', text: 'New Title' }
    case 'bullets': return { type: 'bullets', items: ['Item 1', 'Item 2'] }
    case 'stat':    return { type: 'stat', value: '0', label: 'Metric' }
    case 'image':   return { type: 'image', src: '', alt: '' }
    case 'quote':   return { type: 'quote', text: 'Quote text' }
    case 'code':    return { type: 'code', language: 'ts', source: '// code' }
    case 'chart':   return { type: 'chart', kind: 'bar', data: [] }
  }
}

// ── deckCommands registry ────────────────────────────────────

export const deckCommands = defineCommands({
  // ── Slide ──

  slideInsert: {
    type: 'slide:insert' as const,
    create: (deckId: string, position?: number, initialBlocks?: BlockData[]) => ({
      deckId, position, initialBlocks, newSlideId: nextId('slide'),
    }),
    handler: (store, { deckId, position, initialBlocks, newSlideId }) => {
      let s = addEntity(
        store,
        { id: newSlideId, data: { type: 'slide', hidden: false } },
        deckId,
        position,
      )
      if (initialBlocks?.length) {
        for (const blk of initialBlocks) {
          s = addEntity(s, { id: nextId('block'), data: blk }, newSlideId)
        }
      }
      return s
    },
  },

  slideDuplicate: {
    type: 'slide:duplicate' as const,
    create: (slideId: string) => ({ slideId, cloneSlideId: nextId('slide') }),
    handler: (store, { slideId, cloneSlideId }) => {
      const src = getEntity(store, slideId)
      if (!src) return store
      const parentId = getParent(store, slideId) ?? ROOT_ID
      const siblings = getChildren(store, parentId)
      const idx = siblings.indexOf(slideId)
      const insertAt = idx < 0 ? siblings.length : idx + 1

      let s = addEntity(
        store,
        { id: cloneSlideId, data: { ...(src.data as Record<string, unknown>) } },
        parentId,
        insertAt,
      )

      for (const childId of getChildren(store, slideId)) {
        const child = store.entities[childId]
        if (!child) continue
        s = addEntity(
          s,
          { id: nextId('block'), data: { ...(child.data as Record<string, unknown>) } },
          cloneSlideId,
        )
      }
      return s
    },
  },

  slideDelete: {
    type: 'slide:delete' as const,
    create: (slideId: string) => ({ slideId }),
    handler: (store, { slideId }) => removeEntity(store, slideId),
  },

  slideReorder: {
    type: 'slide:reorder' as const,
    create: (slideId: string, toIndex: number) => ({ slideId, toIndex }),
    handler: (store, { slideId, toIndex }) => {
      const parentId = getParent(store, slideId)
      if (!parentId) return store
      return moveNode(store, slideId, parentId, toIndex)
    },
  },

  slideToggleHidden: {
    type: 'slide:toggleHidden' as const,
    create: (slideId: string) => ({ slideId }),
    handler: (store, { slideId }) => {
      const entity = getEntity(store, slideId)
      const cur = (entity?.data as { hidden?: boolean } | undefined)?.hidden ?? false
      return updateEntityData(store, slideId, { hidden: !cur })
    },
  },

  // ── Block ──

  blockInsert: {
    type: 'block:insert' as const,
    create: (slideId: string, blockType: BlockType, position?: number, data?: Partial<BlockData>) => ({
      slideId, blockType, position, data, newBlockId: nextId('block'),
    }),
    handler: (store, { slideId, blockType, position, data, newBlockId }) => {
      const merged = { ...defaultBlockData(blockType), ...(data ?? {}) } as BlockData
      return addEntity(store, { id: newBlockId, data: merged }, slideId, position)
    },
  },

  blockEdit: {
    type: 'block:edit' as const,
    create: (blockId: string, partialData: Partial<BlockData>) => ({ blockId, partialData }),
    handler: (store, { blockId, partialData }) =>
      updateEntityData(store, blockId, partialData as Record<string, unknown>),
  },

  blockDelete: {
    type: 'block:delete' as const,
    create: (blockId: string) => ({ blockId }),
    handler: (store, { blockId }) => removeEntity(store, blockId),
  },

  blockRestyle: {
    type: 'block:restyle' as const,
    // MVP: no concrete style axis yet — store patch under data.__style for round-trip only.
    create: (blockId: string, stylePatch: Record<string, unknown>) => ({ blockId, stylePatch }),
    handler: (store, { blockId, stylePatch }) => {
      const entity = getEntity(store, blockId)
      if (!entity) return store
      const prevStyle = (entity.data as { __style?: Record<string, unknown> } | undefined)?.__style ?? {}
      return updateEntityData(store, blockId, { __style: { ...prevStyle, ...stylePatch } })
    },
  },

  // ── Chat / prompt / revision (store-side pieces) ──

  messageAppend: {
    type: 'message:append' as const,
    create: (
      role: 'user' | 'assistant' | 'system',
      content: string,
      revisionId?: string,
    ) => ({ role, content, revisionId, newMessageId: nextId('msg'), ts: Date.now() }),
    handler: (store, { role, content, revisionId, newMessageId, ts }) => {
      const entity: Entity = {
        id: newMessageId,
        data: {
          type: 'message',
          role,
          content,
          ts,
          ...(revisionId ? { revisionId } : {}),
        },
      }
      return addEntity(store, entity, ROOT_ID)
    },
  },

  revisionCreate: {
    type: 'revision:create' as const,
    create: (summary: string, ops: DeckOp[]) => ({
      summary, ops, newRevisionId: nextId('rev'),
    }),
    handler: (store, { summary, ops, newRevisionId }) => {
      const entity: Entity = {
        id: newRevisionId,
        data: { type: 'revision', status: 'pending', summary, ops },
      }
      // revisions live in the chat store under ROOT so the chat UI can resolve them by id.
      return addEntity(store, entity, ROOT_ID)
    },
  },

  revisionSetStatus: {
    type: 'revision:setStatus' as const,
    create: (revisionId: string, status: 'pending' | 'accepted' | 'rejected') => ({
      revisionId, status,
    }),
    handler: (store, { revisionId, status }) =>
      updateEntityData(store, revisionId, { status }),
  },
})

// ── ergonomic command factories (stable return ids) ──────────

/**
 * Convenience tuple for prompt:submit — returns both the user-message command
 * and a promise that resolves with follow-up commands after the mock LLM
 * finishes. Chat widget pattern:
 *   const { userCommand, llmPromise } = buildPromptSubmit(...)
 *   engine.dispatch(userCommand)
 *   const llmCommands = await llmPromise
 *   for (const cmd of llmCommands) engine.dispatch(cmd)
 */
export interface PromptSubmitContext {
  selectedSlideId?: string
  selectedBlockId?: string
  bulkSelection?: string[]
}

export interface PromptSubmitPipeline {
  userCommand: Command
  /** Resolves to [assistantMessage, revisionCreate] commands */
  llmPromise: Promise<Command[]>
  /** Summary text so UI can preview */
  previewPromise: Promise<{ assistantText: string; summary: string; opCount: number }>
}

/**
 * Build a prompt-submit pipeline.
 * The caller dispatches `userCommand` immediately and awaits `llmPromise` to
 * append the assistant reply + pending revision. Revision acceptance is a
 * separate user action handled by `dispatchRevisionAccept`.
 */
export function buildPromptSubmit(
  deckStore: NormalizedData,
  text: string,
  context: PromptSubmitContext = {},
): PromptSubmitPipeline {
  const userCommand = deckCommands.messageAppend('user', text)

  const resultPromise = mockLlmRespond(text, {
    deck: deckStore,
    selectedSlideId: context.selectedSlideId,
    selectedBlockId: context.selectedBlockId,
  })

  const llmPromise: Promise<Command[]> = resultPromise.then((result) => {
    const commands: Command[] = []
    if (result.ops.length > 0) {
      const revision = deckCommands.revisionCreate(result.summary, result.ops)
      const revisionId = (revision.payload as { newRevisionId: string }).newRevisionId
      commands.push(deckCommands.messageAppend('assistant', result.assistantText, revisionId))
      commands.push(revision)
    } else {
      commands.push(deckCommands.messageAppend('assistant', result.assistantText))
    }
    return commands
  })

  const previewPromise = resultPromise.then((r) => ({
    assistantText: r.assistantText,
    summary: r.summary,
    opCount: r.ops.length,
  }))

  return { userCommand, llmPromise, previewPromise }
}

/**
 * Accept a revision — replay every op against the deck engine, then mark
 * the chat-side revision entity as 'accepted'.
 *
 * @param chatEngine  Engine bound to the chat NormalizedData (messages + revisions)
 * @param deckEngine  Engine bound to the deck NormalizedData (slides + blocks)
 */
export function dispatchRevisionAccept(
  chatEngine: CommandEngine,
  deckEngine: CommandEngine,
  revisionId: string,
): void {
  const chatStore = chatEngine.getStore()
  const revisionEntity = chatStore.entities[revisionId]
  const revisionData = revisionEntity?.data as
    | { type: 'revision'; status: string; ops: DeckOp[] }
    | undefined
  if (!revisionData || revisionData.type !== 'revision') return
  if (revisionData.status !== 'pending') return

  for (const op of revisionData.ops) {
    const cmd = opToCommand(op, deckEngine.getStore())
    if (cmd) deckEngine.dispatch(cmd)
  }

  chatEngine.dispatch(deckCommands.revisionSetStatus(revisionId, 'accepted'))
}

/** Reject a revision — just mark status, leave ops untouched. */
export function dispatchRevisionReject(
  chatEngine: CommandEngine,
  revisionId: string,
): void {
  const entity = chatEngine.getStore().entities[revisionId]
  if (!entity) return
  chatEngine.dispatch(deckCommands.revisionSetStatus(revisionId, 'rejected'))
}

// ── op → command mapping (revision replay) ───────────────────

function opToCommand(op: DeckOp, deckStore: NormalizedData): Command | null {
  switch (op.op) {
    case 'slide:insert': {
      const deckId = (op.args.deckId as string | undefined) ?? firstDeckId(deckStore)
      if (!deckId) return null
      const position = op.args.position as number | undefined
      const initialBlocks = op.args.initialBlocks as BlockData[] | undefined
      return deckCommands.slideInsert(deckId, position, initialBlocks)
    }
    case 'slide:delete': {
      const slideId = op.args.slideId as string | undefined
      if (!slideId) return null
      return deckCommands.slideDelete(slideId)
    }
    case 'block:insert': {
      const slideId = op.args.slideId as string | undefined
      const blockType = op.args.blockType as BlockType | undefined
      if (!slideId || !blockType) return null
      return deckCommands.blockInsert(
        slideId,
        blockType,
        op.args.position as number | undefined,
        op.args.data as Partial<BlockData> | undefined,
      )
    }
    case 'block:edit': {
      const blockId = op.args.blockId as string | undefined
      const patch = op.args.patch as Partial<BlockData> | undefined
      if (!blockId || !patch) return null
      return deckCommands.blockEdit(blockId, patch)
    }
    case 'block:delete': {
      const blockId = op.args.blockId as string | undefined
      if (!blockId) return null
      return deckCommands.blockDelete(blockId)
    }
  }
}

function firstDeckId(store: NormalizedData): string | undefined {
  const roots = getChildren(store, ROOT_ID)
  for (const id of roots) {
    const d = store.entities[id]?.data as { type?: string } | undefined
    if (d?.type === 'deck') return id
  }
  return undefined
}
