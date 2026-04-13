// ② 2026-04-03-viewer-command-prd.md
import type { TimelineEvent } from '../viewer/groupEvents'
import type { FileViewerHandle } from '@os/ui/viewerTypes'
import type { FileState } from './fileState'
import { applyRead, applyEdit, applyWrite } from './fileState'
import { fetchFile } from '../viewer/fsClient'
import type { UseViewerTabsReturn } from './useViewerTabs'

/**
 * Process a batch of new timeline events:
 * - Update fileState
 * - Dispatch viewer tab opens
 * - Dispatch FileViewer commands
 *
 * Returns a cleanup-safe promise (for async file fetches).
 */
export function processToolEvents(
  events: TimelineEvent[],
  fileState: FileState,
  fetchedFiles: Set<string>,
  viewerTabs: UseViewerTabsReturn,
  getFileViewerRef: (path: string) => FileViewerHandle | null,
): Promise<void> {
  const toFetch = new Set<string>()
  const deferred: (() => void)[] = []

  for (let i = 0; i < events.length; i++) {
    const evt = events[i]
    if (evt.type !== 'tool_use') continue

    const tool = evt.tool

    // --- File tools ---
    if (tool === 'Read' && evt.filePath) {
      const path = evt.filePath
      if (!fetchedFiles.has(path) && !fileState.files.has(path)) {
        toFetch.add(path)
      }
      // Deferred: after fetch, open tab + dispatch
      deferred.push(() => {
        const content = fileState.files.get(path) ?? ''
        viewerTabs.openFile(path, content)
        const viewer = getFileViewerRef(path)
        if (viewer) viewer.dispatch({ type: 'open', content })
      })
      continue
    }

    if (tool === 'Edit' && evt.filePath && evt.editOld && evt.editNew) {
      const path = evt.filePath
      const preContent = fileState.files.get(path) ?? ''
      const range = applyEdit(fileState, path, evt.editOld, evt.editNew)
      const newContent = fileState.files.get(path) ?? ''

      // Ensure tab exists
      viewerTabs.openFile(path, preContent)

      deferred.push(() => {
        const viewer = getFileViewerRef(path)
        if (viewer) {
          viewer.dispatch({
            type: 'editAnimate',
            preContent,
            oldStr: evt.editOld!,
            newStr: evt.editNew!,
            range: range ? { start: range.oldStart, end: range.oldEnd } : null,
          })
        }
        // Update tab content to final state
        viewerTabs.openFile(path, newContent)
      })
      continue
    }

    if (tool === 'Write' && evt.filePath && evt.editNew) {
      const path = evt.filePath
      applyWrite(fileState, path, evt.editNew)
      viewerTabs.openFile(path, evt.editNew)
      deferred.push(() => {
        const viewer = getFileViewerRef(path)
        if (viewer) viewer.dispatch({ type: 'open', content: evt.editNew! })
      })
      continue
    }

    // --- Search tools ---
    if ((tool === 'Grep' || tool === 'Glob') && evt.text) {
      const result = findNextResult(events, i)
      viewerTabs.openSearch(evt.text, result)
      continue
    }

    // --- Terminal tools ---
    if (tool === 'Bash' && evt.text) {
      const result = findNextResult(events, i)
      viewerTabs.openTerminal(evt.text, result)
      continue
    }
  }

  // Fetch files, then run deferred actions
  if (toFetch.size > 0) {
    return Promise.all([...toFetch].map(async (path) => {
      try {
        const content = await fetchFile(path)
        if (content) {
          applyRead(fileState, path, content, true)
          fetchedFiles.add(path)
        }
      } catch { /* unavailable */ }
    })).then(() => {
      for (const fn of deferred) fn()
    })
  }

  for (const fn of deferred) fn()
  return Promise.resolve()
}

/** Find the next tool_result text after a tool_use at index i. */
function findNextResult(events: TimelineEvent[], i: number): string {
  for (let j = i + 1; j < events.length; j++) {
    if (events[j].type === 'tool_result') return events[j].text ?? ''
    if (events[j].type === 'tool_use') break
  }
  return ''
}
