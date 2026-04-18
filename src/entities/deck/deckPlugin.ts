/**
 * Deck plugin — exposes deckCommands under the `commands` field so callers can
 * dispatch via type string (engine.dispatch(deckCommands.slideInsert(...))).
 *
 * Commands registered:
 *  slide:insert, slide:duplicate, slide:delete, slide:reorder, slide:toggleHidden
 *  block:insert, block:edit, block:delete, block:restyle
 *  message:append, revision:create, revision:setStatus
 *
 * Prompt flow + revision accept/reject are orchestrated in deckCommands.ts
 * (buildPromptSubmit, dispatchRevisionAccept, dispatchRevisionReject) because
 * they span two engines (chat store + deck store) and thus can't live inside a
 * single Plugin.commands handler.
 */
import { definePlugin } from '@os/plugins/definePlugin'
import type { Plugin } from '@os/engine/types'
import { deckCommands } from './deckCommands'

export function deckPlugin(): Plugin {
  return definePlugin({
    name: 'deck',
    commands: {
      slideInsert:         deckCommands.slideInsert,
      slideDuplicate:      deckCommands.slideDuplicate,
      slideDelete:         deckCommands.slideDelete,
      slideReorder:        deckCommands.slideReorder,
      slideToggleHidden:   deckCommands.slideToggleHidden,
      blockInsert:         deckCommands.blockInsert,
      blockEdit:           deckCommands.blockEdit,
      blockDelete:         deckCommands.blockDelete,
      blockRestyle:        deckCommands.blockRestyle,
      messageAppend:       deckCommands.messageAppend,
      revisionCreate:      deckCommands.revisionCreate,
      revisionSetStatus:   deckCommands.revisionSetStatus,
    },
  })
}
