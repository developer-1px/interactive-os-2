// ② 2026-04-03-command-unification-prd.md
import { useMemo, useCallback, useEffect, useRef } from 'react'
import { useAria } from '../../primitives/useAria'
import { createSingleNodeStore } from '../../store/createSingleNodeStore'
import { disclosure } from '../../pattern/roles/disclosure'
import { EXPANDED_ID } from '../../axis/expand'
import { expandCommands } from '../../axis/expand'
import type { NormalizedData } from '../../store/types'

const CONTENT_ID = 'content'

function buildData(expanded: boolean): NormalizedData {
  const store = createSingleNodeStore(CONTENT_ID)
  return {
    ...store,
    entities: {
      ...store.entities,
      [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: expanded ? [CONTENT_ID] : [] },
    },
  }
}

/**
 * Chat block disclosure hook — replaces <details> + useState(open) + isLatest auto-collapse.
 * Returns { expanded, toggle, toggleProps } for rendering.
 */
export function useDisclosure(options: { initialOpen: boolean; isLatest?: boolean }) {
  const { initialOpen, isLatest } = options
  const data = useMemo(() => buildData(initialOpen), [initialOpen])
  const aria = useAria({ pattern: disclosure, data, autoFocus: false })

  // Auto-collapse when transitioning from live to settled
  const wasLatestRef = useRef(isLatest)
  useEffect(() => {
    if (wasLatestRef.current && !isLatest) {
      aria.dispatch(expandCommands.collapse(CONTENT_ID))
    }
    wasLatestRef.current = isLatest
  }, [isLatest]) // eslint-disable-line react-hooks/exhaustive-deps

  const state = aria.getNodeState(CONTENT_ID)
  const expanded = state.expanded ?? false
  const toggleProps = aria.getNodeProps(CONTENT_ID)

  const toggle = useCallback(() => {
    aria.dispatch(expanded ? expandCommands.collapse(CONTENT_ID) : expandCommands.expand(CONTENT_ID))
  }, [aria, expanded])

  return { expanded, toggle, toggleProps, dispatch: aria.dispatch }
}
