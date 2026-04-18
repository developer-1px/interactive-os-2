/**
 * Deck selectors — pure read functions over NormalizedData.
 * Thin wrappers that project the generic store into typed deck/chat views.
 */
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { getChildren } from '@os/store/createStore'
import type { DeckData, SlideData, MessageData, RevisionData } from './deckTypes'

/** First `deck` entity under ROOT, or null for an empty store. */
export function getCurrentDeck(store: NormalizedData): (DeckData & { id: string }) | null {
  for (const id of getChildren(store, ROOT_ID)) {
    const data = store.entities[id]?.data as DeckData | undefined
    if (data?.type === 'deck') return { ...data, id }
  }
  return null
}

/**
 * All slide ids under a deck, in declared order (visible + hidden interleaved
 * exactly as they live in relationships — filtering is the caller's job).
 */
export function getSlidesOfDeck(store: NormalizedData, deckId: string): string[] {
  return getChildren(store, deckId).filter((id) => {
    const d = store.entities[id]?.data as SlideData | undefined
    return d?.type === 'slide'
  })
}

/** Block ids inside a slide, in declared order. */
export function getBlocksOfSlide(store: NormalizedData, slideId: string): string[] {
  return getChildren(store, slideId)
}

/**
 * Chat messages under ROOT, ordered by relationship order (which is also the
 * append order since messageAppend always pushes to the end).
 */
export function getMessages(chatStore: NormalizedData): Array<MessageData & { id: string }> {
  const out: Array<MessageData & { id: string }> = []
  for (const id of getChildren(chatStore, ROOT_ID)) {
    const data = chatStore.entities[id]?.data as MessageData | undefined
    if (data?.type === 'message') out.push({ ...data, id })
  }
  return out
}

/** Pending revisions under ROOT, most recent last. */
export function getPendingRevisions(chatStore: NormalizedData): Array<RevisionData & { id: string }> {
  const out: Array<RevisionData & { id: string }> = []
  for (const id of getChildren(chatStore, ROOT_ID)) {
    const data = chatStore.entities[id]?.data as RevisionData | undefined
    if (data?.type === 'revision' && data.status === 'pending') out.push({ ...data, id })
  }
  return out
}

/** Resolve a single revision by id (any status). */
export function getRevision(
  chatStore: NormalizedData,
  revisionId: string,
): (RevisionData & { id: string }) | null {
  const data = chatStore.entities[revisionId]?.data as RevisionData | undefined
  if (!data || data.type !== 'revision') return null
  return { ...data, id: revisionId }
}
