var e=`// ② 2026-04-03-replay-edit-animation-prd.md

/** Mutable file state for replay — tracks file contents across Read/Edit/Write steps. */
export interface FileState {
  files: Map<string, string>
  currentPath: string | null
}

export function createFileState(): FileState {
  return { files: new Map(), currentPath: null }
}

function stripCatN(text: string): string {
  return text
    .split('\\n')
    .map(line => line.replace(/^\\s*\\d+\\t/, ''))
    .join('\\n')
}

/** Apply a Read result — registers file with full content. raw=true skips cat -n stripping. */
export function applyRead(state: FileState, filePath: string, result: string, raw = false): void {
  state.files.set(filePath, raw ? result : stripCatN(result))
  state.currentPath = filePath
}

/** Apply a Write — registers/overwrites file. */
export function applyWrite(state: FileState, filePath: string, content: string): void {
  state.files.set(filePath, content)
  state.currentPath = filePath
}

/**
 * Apply an Edit — replace old_string with new_string in file content.
 * Returns the line range of the old text (1-indexed) for highlight, or null if not found.
 */
export function applyEdit(
  state: FileState,
  filePath: string,
  oldString: string,
  newString: string,
): { oldStart: number; oldEnd: number; newStart: number; newEnd: number } | null {
  const content = state.files.get(filePath)
  if (content == null) return null

  const idx = content.indexOf(oldString)
  if (idx === -1) return null

  // Calculate line numbers (1-indexed)
  const beforeOld = content.slice(0, idx)
  const oldStart = beforeOld.split('\\n').length
  const oldLineCount = oldString.split('\\n').length
  const oldEnd = oldStart + oldLineCount - 1

  // Apply replacement
  const newContent = content.slice(0, idx) + newString + content.slice(idx + oldString.length)
  state.files.set(filePath, newContent)
  state.currentPath = filePath

  const newLineCount = newString.split('\\n').length
  const newStart = oldStart
  const newEnd = newStart + newLineCount - 1

  return { oldStart, oldEnd, newStart, newEnd }
}

/** Get current file content. */
export function getCurrentContent(state: FileState): string | null {
  if (!state.currentPath) return null
  return state.files.get(state.currentPath) ?? null
}
`;export{e as default};