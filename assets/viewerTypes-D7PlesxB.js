var e=`// ② 2026-04-03-viewer-command-prd.md
import type { HighlightTone } from '@os/ui/CodeViewer'

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
  | { type: 'update-content'; content: string }
  | { type: 'highlight'; lines: Map<number, HighlightTone> }
  | { type: 'editAnimate'; preContent: string; oldStr: string; newStr: string; range: LineRange | null }
  | { type: 'zoom'; line: number; scale?: number }
  | { type: 'zoom-reset' }
  | { type: 'clear' }

export interface FileViewerHandle {
  dispatch: (command: FileViewerCommand) => void
}
`;export{e as default};