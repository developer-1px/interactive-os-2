// ② 2026-04-03-replay-edit-animation-prd.md
import type { HighlightTone } from '@os/ui/CodeBlock'

// --- Types ---

export interface ViewerFrame {
  /** File content to display (if changed). */
  content?: string
  /** File path (if changed). */
  filePath?: string
  /** Line highlights. */
  highlights?: Map<number, HighlightTone> | null
  /** Cursor line (1-indexed). null = hide cursor. */
  cursorLine?: number | null
}

export interface TimedFrame {
  frame: ViewerFrame
  delay: number
}

// --- Edit animation sequence ---

/**
 * 1. 선택: 1줄씩 cascading (파란)
 * 2. 삭제: old 줄 사라짐
 * 3. 타이핑: 커서 깜빡 + 4-5글자씩 → 나머지 한번에
 */
export function editAnimationFrames(
  preContent: string,
  oldString: string,
  newString: string,
  oldLineRange: { start: number; end: number } | null,
): TimedFrame[] {
  if (!oldLineRange) {
    return [{ frame: {}, delay: 300 }]
  }

  const idx = preContent.indexOf(oldString)
  if (idx === -1) return [{ frame: {}, delay: 300 }]

  const before = preContent.slice(0, idx)
  const after = preContent.slice(idx + oldString.length)
  const startLine = oldLineRange.start
  const frames: TimedFrame[] = []

  // ① Selection: 1줄씩 cascading
  const { start, end } = oldLineRange
  for (let line = start; line <= end; line++) {
    const map = new Map<number, HighlightTone>()
    for (let j = start; j <= line; j++) map.set(j, 'selected')
    frames.push({ frame: { highlights: map }, delay: 80 })
  }

  // Hold
  const fullSelected = new Map<number, HighlightTone>()
  for (let i = start; i <= end; i++) fullSelected.set(i, 'selected')
  frames.push({ frame: { highlights: fullSelected }, delay: 400 })

  // ② 삭제: 사라짐
  const deletedContent = before + after
  frames.push({ frame: { content: deletedContent, highlights: null, cursorLine: startLine }, delay: 150 })

  // ③ 타이핑: 앞쪽 띄어쓰기 skip, 8-12글자 랜덤 타이핑
  const leadingWs = newString.match(/^[\s\n]*/)?.[0] ?? ''
  const typingStart = leadingWs.length
  const TYPING_CHARS = Math.min(newString.length - typingStart, 8 + Math.floor(Math.random() * 5)) // 8-12
  const cursorLineNum = before.split('\n').length

  // 앞쪽 공백은 한번에
  if (typingStart > 0) {
    const partial = before + newString.slice(0, typingStart) + after
    frames.push({ frame: { content: partial, cursorLine: cursorLineNum }, delay: 50 })
  }

  // 글자 하나씩
  for (let c = 1; c <= TYPING_CHARS; c++) {
    const partial = before + newString.slice(0, typingStart + c) + after
    frames.push({ frame: { content: partial, cursorLine: cursorLineNum }, delay: 100 })
  }

  // 나머지 한번에 짠
  const fullContent = before + newString + after
  if (newString.length - typingStart > TYPING_CHARS) {
    frames.push({ frame: { content: fullContent, cursorLine: null }, delay: 100 })
  }

  // Hold
  const newLineCount = newString.split('\n').length
  frames.push({ frame: { content: fullContent, cursorLine: null }, delay: Math.min(newLineCount * 150, 2000) })

  return frames
}

/** Read step frames — show file, short delay. */
export function readFrames(filePath: string, content: string): TimedFrame[] {
  return [{
    frame: { content, filePath, highlights: null, cursorLine: null },
    delay: 400,
  }]
}

/** Write step frames. */
export function writeFrames(filePath: string, content: string): TimedFrame[] {
  return [{
    frame: { content, filePath, highlights: null, cursorLine: null },
    delay: 400,
  }]
}
