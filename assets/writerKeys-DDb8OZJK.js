var e=`// Writer keyboard plugin — navigate filters, edit key handler, keyMap
// ② 2026-04-05-writer-tree-crud-prd.md

import { writerCommands } from './writerCommands'
import { writerState } from './writerStore'
import { storeToMd, mdToStore } from './writerTransform'
import { definePlugin } from '@os/plugins/definePlugin'
import { key } from '@os/axis/types'
import { history } from '@os/plugins/history'
import { crud, crudCommands } from '@os/plugins/crud'
import { dnd, dndCommands } from '@os/plugins/dnd'
import { rename, renameCommands } from '@os/plugins/rename'
import { clipboard } from '@os/plugins/clipboard'
import { focusHistory } from '@os/plugins/focusHistory'
import { scope } from '@os/plugins/scope'
import { getVisibleNodes } from '@os/engine/getVisibleNodes'
import { createBatchCommand, type Command, type Plugin } from '@os/engine/types'
import type { EditKeyContext } from '@os/primitives/aria'
import type { NormalizedData } from '@os/store/types'
import type { VisibilityFilter } from '@os/engine/types'

// ── Navigate Filter ──────────────────────────────────────
// Skip list and document from navigation — paragraph is now focusable/selectable

const CONTAINER_TYPES = new Set(['list', 'document'])

// Leaf-only filter for Alt+Arrow reorder — skips paragraph so sentences swap with sentences
const LEAF_SKIP = new Set(['paragraph', 'list', 'document'])

const writerLeafFilter: VisibilityFilter = {
  isFocusable: (nodeId: string, store: NormalizedData) => {
    const entity = store.entities[nodeId]
    const type = (entity?.data as Record<string, unknown> | undefined)?.type as string | undefined
    return !type || !LEAF_SKIP.has(type)
  },
}

export const writerNavigateFilter: VisibilityFilter = {
  isFocusable: (nodeId: string, store: NormalizedData) => {
    const entity = store.entities[nodeId]
    const type = (entity?.data as Record<string, unknown> | undefined)?.type as string | undefined
    return !type || !CONTAINER_TYPES.has(type)
  },
}

// ── Edit Key Handler (runs during editing) ───────────────

let _splitCounter = 0

function getAdjacentVisible(store: NormalizedData, nodeId: string, filters: VisibilityFilter[], direction: -1 | 1): string | undefined {
  const visible = getVisibleNodes(store, filters)
  const idx = visible.indexOf(nodeId)
  const target = idx + direction
  return target >= 0 && target < visible.length ? visible[target] : undefined
}

function getPrevVisibleNode(store: NormalizedData, nodeId: string, filters: VisibilityFilter[]): string | undefined {
  return getAdjacentVisible(store, nodeId, filters, -1)
}

function writerEditKeyDown(store: NormalizedData, e: React.KeyboardEvent, ctx: EditKeyContext): Command | void {
  const { nodeId, field, content, cursorOffset } = ctx
  const entity = store.entities[nodeId]
  const d = entity?.data as Record<string, unknown> | undefined
  const type = d?.type as string

  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    const firstHalf = content.slice(0, cursorOffset)
    const secondHalf = content.slice(cursorOffset)
    const newId = \`ws\${++_splitCounter}\`
    return createBatchCommand([
      renameCommands.confirmRename(nodeId, field, firstHalf),
      writerCommands.insertAfter(nodeId, newId, { type, content: secondHalf }),
      renameCommands.startRename(newId),
    ])
  }

  if (e.key === 'Backspace' && cursorOffset === 0 && !e.metaKey && !e.ctrlKey) {
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed) return undefined

    const prevId = getPrevVisibleNode(store, nodeId, [writerNavigateFilter])
    if (!prevId) return undefined
    const prevData = store.entities[prevId]?.data as Record<string, unknown> | undefined
    const prevContent = (prevData?.content as string) ?? ''
    // hr has no content field — can't merge into it
    if (prevData?.type === 'hr') return undefined

    const mergedContent = prevContent + content
    return createBatchCommand([
      renameCommands.cancelRename(),
      writerCommands.merge(prevId, mergedContent, nodeId),
      renameCommands.startRename(prevId),
    ])
  }

  if (e.key === 'Tab' && !e.shiftKey) {
    return createBatchCommand([
      renameCommands.confirmRename(nodeId, field, content),
      dndCommands.moveIn(nodeId),
    ])
  }

  if (e.key === 'Tab' && e.shiftKey) {
    return createBatchCommand([
      renameCommands.confirmRename(nodeId, field, content),
      dndCommands.moveOut(nodeId),
    ])
  }

  return undefined
}

export const writerItemOptions = {
  editKeyDown: (e: React.KeyboardEvent, ctx: EditKeyContext) => writerEditKeyDown(writerState.getData(), e, ctx),
}

// ── Writer Keys Plugin ───────────────────────────────────

let _insertCounter = 0

function writerKeysPlugin(): Plugin {
  return definePlugin({
    name: 'writerKeys',
    visibilityFilter: writerNavigateFilter,
    commands: {
      insertAfter: writerCommands.insertAfter,
      insertBefore: writerCommands.insertBefore,
      merge: writerCommands.merge,
      updateContent: writerCommands.updateContent,
      wrapInList: writerCommands.wrapInList,
      unwrapFromList: writerCommands.unwrapFromList,
      convertType: writerCommands.convertType,
      visibleSwap: writerCommands.visibleSwap,
      setAnalysis: writerCommands.setAnalysis,
    },
    keyMap: {
      'Enter': key(['rename:start'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        if (d?.type === 'hr') return undefined
        return renameCommands.startRename(ctx.focused)
      }),

      'Mod+Enter': key(['writer:insert-after', 'rename:start'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        if (!d) return undefined
        const type = d.type as string
        const parentId = ctx.getParent(ctx.focused)
        if (!parentId) return undefined
        const newId = \`wi\${++_insertCounter}\`

        let newData: Record<string, unknown>
        if (type === 'heading') {
          newData = { type: 'heading', level: d.level, content: '' }
        } else if (type === 'sentence') {
          newData = { type: 'sentence', content: '' }
        } else if (type === 'listItem') {
          newData = { type: 'listItem', content: '' }
        } else {
          return undefined
        }

        return createBatchCommand([
          writerCommands.insertAfter(ctx.focused, newId, newData),
          renameCommands.startRename(newId),
        ])
      }),

      'Shift+Enter': key(['writer:insert-before', 'rename:start'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        if (!d) return undefined
        const type = d.type as string
        const parentId = ctx.getParent(ctx.focused)
        if (!parentId) return undefined
        const newId = \`wi\${++_insertCounter}\`

        let newData: Record<string, unknown>
        if (type === 'heading') {
          newData = { type: 'heading', level: d.level, content: '' }
        } else if (type === 'sentence') {
          newData = { type: 'sentence', content: '' }
        } else if (type === 'listItem') {
          newData = { type: 'listItem', content: '' }
        } else {
          return undefined
        }

        return createBatchCommand([
          writerCommands.insertBefore(ctx.focused, newId, newData),
          renameCommands.startRename(newId),
        ])
      }),

      'Mod+Shift+Enter': key(['crud:create', 'rename:start'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        if (d?.type !== 'heading') return undefined
        const newId = \`wi\${++_insertCounter}\`
        return createBatchCommand([
          crudCommands.create({ id: newId, data: { type: 'sentence', content: '' } }, ctx.focused, 0),
          renameCommands.startRename(newId),
        ])
      }),

      'Tab': key(['dnd:move-in'], (ctx) => dndCommands.moveIn(ctx.focused)),
      'Shift+Tab': key(['dnd:move-out'], (ctx) => dndCommands.moveOut(ctx.focused)),

      'Alt+ArrowUp': key(['writer:visible-swap'], (ctx) => {
        const prev = getAdjacentVisible(writerState.getData(), ctx.focused, [writerLeafFilter], -1)
        if (!prev) return undefined
        return writerCommands.visibleSwap(ctx.focused, prev, -1)
      }),
      'Alt+ArrowDown': key(['writer:visible-swap'], (ctx) => {
        const next = getAdjacentVisible(writerState.getData(), ctx.focused, [writerLeafFilter], 1)
        if (!next) return undefined
        return writerCommands.visibleSwap(ctx.focused, next, 1)
      }),

      'Mod+ArrowDown': key(['core:focus', 'dnd:move-down'], (ctx, original) => {
        const cmd = ctx.focusNextGroup()
        if ((cmd.payload as Record<string, unknown>)?.nodeId === ctx.focused) return original?.()
        return cmd
      }),

      'Mod+ArrowUp': key(['core:focus', 'dnd:move-up'], (ctx, original) => {
        const cmd = ctx.focusPrevGroup()
        if ((cmd.payload as Record<string, unknown>)?.nodeId === ctx.focused) return original?.()
        return cmd
      }),

      'Backspace': key(['crud:delete', 'rename:start'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        const content = (d?.content as string) ?? ''
        if (!content || content.trim() === '') {
          return crudCommands.remove(ctx.focused)
        }
        return renameCommands.startRename(ctx.focused)
      }),

      'Mod+l': key(['writer:wrap-list'], (ctx) => {
        const selectedIds = ctx.selected?.ids ?? []
        const nodeIds = selectedIds.length > 0 ? selectedIds : [ctx.focused]
        const listId = \`wl\${++_insertCounter}\`
        return writerCommands.wrapInList(nodeIds, listId, false)
      }),

      'Mod+Shift+l': key(['writer:unwrap-list'], (ctx) => writerCommands.unwrapFromList(ctx.focused)),

      'Mod+Digit0': key(['writer:convert-type'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        if (d?.type !== 'heading') return undefined
        return writerCommands.convertType(ctx.focused, 'paragraph')
      }),

      'Mod+Shift+h': key(['writer:convert-type'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        if (d?.type !== 'paragraph') return undefined
        return writerCommands.convertType(ctx.focused, 'heading')
      }),
    },
  })
}

// ② 2026-04-04-clipboard-serialize-prd.md
export const writerPlugins: Plugin[] = [
  crud(),
  clipboard({
    serialize: (subtree) => storeToMd(subtree),
    deserialize: (text) => mdToStore(text),
  }),
  dnd(),
  focusHistory(),
  history(),
  rename(),
  scope(),
  writerKeysPlugin(),
]
`;export{e as default};