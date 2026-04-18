/**
 * Deck fixtures — initial NormalizedData for Slides app.
 *
 *  - createEmptyDeck       → zero-slide deck (first-visit placeholder state)
 *  - createSampleDeck      → 4-slide marketing-funnel sample
 *  - createEmptyChatStore  → empty chat store for Mock LLM pipeline
 */
import { createStore, ROOT_ID } from '@os/schema'
import type { NormalizedData } from '@os/schema'

// ── Empty deck ───────────────────────────────────────────────

export function createEmptyDeck(): NormalizedData {
  return createStore({
    entities: {
      'deck-1': {
        id: 'deck-1',
        data: { type: 'deck', title: 'Untitled', ratio: '16:9', themeId: 'default' },
      },
    },
    relationships: {
      [ROOT_ID]: ['deck-1'],
      'deck-1': [],
    },
  })
}

// ── Sample deck (4 slides: title / bullets / stat / quote) ──

export function createSampleDeck(): NormalizedData {
  return createStore({
    entities: {
      // Deck
      'deck-1': {
        id: 'deck-1',
        data: { type: 'deck', title: 'Marketing Funnel 2026', ratio: '16:9', themeId: 'default' },
      },

      // Slide 1: title
      'slide-1': { id: 'slide-1', data: { type: 'slide', hidden: false } },
      'block-1-title': {
        id: 'block-1-title',
        data: { type: 'title', text: 'Marketing Funnel 2026' },
      },

      // Slide 2: title + bullets
      'slide-2': { id: 'slide-2', data: { type: 'slide', hidden: false } },
      'block-2-title': {
        id: 'block-2-title',
        data: { type: 'title', text: 'Four Stages of the Funnel' },
      },
      'block-2-bullets': {
        id: 'block-2-bullets',
        data: {
          type: 'bullets',
          items: ['Awareness', 'Consideration', 'Purchase', 'Retention'],
        },
      },

      // Slide 3: 3 stats
      'slide-3': { id: 'slide-3', data: { type: 'slide', hidden: false } },
      'block-3-title': {
        id: 'block-3-title',
        data: { type: 'title', text: 'Funnel by the Numbers' },
      },
      'block-3-stat-a': {
        id: 'block-3-stat-a',
        data: { type: 'stat', value: '2.4M', label: 'Monthly Visitors', caption: '+18% YoY' },
      },
      'block-3-stat-b': {
        id: 'block-3-stat-b',
        data: { type: 'stat', value: '12.7%', label: 'Conversion Rate', caption: '+2.1pp' },
      },
      'block-3-stat-c': {
        id: 'block-3-stat-c',
        data: { type: 'stat', value: '68%', label: 'Retention (90d)', caption: '+4pp' },
      },

      // Slide 4: quote
      'slide-4': { id: 'slide-4', data: { type: 'slide', hidden: false } },
      'block-4-quote': {
        id: 'block-4-quote',
        data: {
          type: 'quote',
          text: 'The best marketing doesn\'t feel like marketing.',
          attribution: 'Tom Fishburne',
        },
      },
    },
    relationships: {
      [ROOT_ID]: ['deck-1'],
      'deck-1': ['slide-1', 'slide-2', 'slide-3', 'slide-4'],
      'slide-1': ['block-1-title'],
      'slide-2': ['block-2-title', 'block-2-bullets'],
      'slide-3': ['block-3-title', 'block-3-stat-a', 'block-3-stat-b', 'block-3-stat-c'],
      'slide-4': ['block-4-quote'],
    },
  })
}

// ── Empty chat store ────────────────────────────────────────

export function createEmptyChatStore(): NormalizedData {
  return createStore({
    entities: {},
    relationships: { [ROOT_ID]: [] },
  })
}
