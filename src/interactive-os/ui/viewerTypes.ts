// ② 2026-04-03-viewer-command-prd.md
import type { HighlightTone } from '@os/ui/CodeBlock'

export interface LineRange {
  start: number
  end: number
}

// --- Viewer tab types ---

export type ViewerTab =
  | FileTab
  | SearchTab
  | TerminalTab

export interface FileTab {
  type: 'file'
  id: string        // file path
  path: string
  content: string
}

export interface SearchTab {
  type: 'search'
  id: string        // unique per invocation
  query: string
  output: string
}

export interface TerminalTab {
  type: 'terminal'
  id: string        // unique per invocation
  command: string
  output: string
}

// --- FileViewer commands ---

export type FileViewerCommand =
  | { type: 'open'; content: string }
  | { type: 'highlight'; lines: Map<number, HighlightTone> }
  | { type: 'editAnimate'; preContent: string; oldStr: string; newStr: string; range: LineRange | null }
  | { type: 'clear' }

export interface FileViewerHandle {
  dispatch: (command: FileViewerCommand) => void
}
