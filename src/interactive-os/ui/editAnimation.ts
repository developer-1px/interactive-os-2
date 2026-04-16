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

  // Hold selected
  const fullSelected = new Map<number, HighlightTone>()
  for (let i = start; i <= end; i++) fullSelected.set(i, 'selected')
  frames.push({ frame: { highlights: fullSelected }, delay: 300 })

  // ② Deleted tone (빨강) — 삭제 직전 강조
  const fullDeleted = new Map<number, HighlightTone>()
  for (let i = start; i <= end; i++) fullDeleted.set(i, 'deleted')
  frames.push({ frame: { highlights: fullDeleted }, delay: 400 })

  // 삭제: 사라짐
  const deletedContent = before + after
  frames.push({ frame: { content: deletedContent, highlights: null, cursorLine: startLine }, delay: 150 })

  // ③ 타이핑: 토큰(단어) 단위, 최소 2초 ~ 최대 4초 동안 타이핑
  const cursorLineNum = before.split('\n').length
  const tokens = tokenize(newString)
  const TYPING_DURATION = 2000 + Math.floor(Math.random() * 2000) // 2-4초

  let typed = ''
  let elapsed = 0
  let t = 0
  for (; t < tokens.length && elapsed < TYPING_DURATION; t++) {
    typed += tokens[t]
    const partial = before + typed + after
    const delay = /^\s+$/.test(tokens[t]) ? 40 : 120
    // 타이핑 중인 줄에 inserted 하이라이트
    const typingLines = typed.split('\n').length
    const typingHighlights = new Map<number, HighlightTone>()
    for (let l = 0; l < typingLines; l++) {
      typingHighlights.set(cursorLineNum + l, 'inserted')
    }
    frames.push({ frame: { content: partial, highlights: typingHighlights, cursorLine: cursorLineNum }, delay })
    elapsed += delay
  }

  // ④ Inserted highlights for all new lines
  const newLineCount = newString.split('\n').length
  const insertedStart = before.split('\n').length
  const insertedHighlights = new Map<number, HighlightTone>()
  for (let i = 0; i < newLineCount; i++) {
    insertedHighlights.set(insertedStart + i, 'inserted')
  }

  // 나머지 한번에 짠 (with inserted highlights)
  const fullContent = before + newString + after
  if (t < tokens.length) {
    frames.push({ frame: { content: fullContent, highlights: insertedHighlights, cursorLine: cursorLineNum }, delay: 150 })
  }

  // Hold inserted highlights
  frames.push({ frame: { content: fullContent, highlights: insertedHighlights, cursorLine: cursorLineNum }, delay: Math.min(newLineCount * 200, 2000) })

  // Zoom reset signal (cursorLine: null) — highlights persist
  frames.push({ frame: { content: fullContent, highlights: insertedHighlights, cursorLine: null }, delay: 200 })

  return frames
}

/** Read step frames — show file, short delay. */
export function readFrames(filePath: string, content: string): TimedFrame[] {
  return [{
    frame: { content, filePath, highlights: null, cursorLine: null },
    delay: 50,
  }]
}

/** Split text into tokens: words, operators, whitespace chunks */
function tokenize(text: string): string[] {
  return text.match(/\s+|[a-zA-Z_$][a-zA-Z0-9_$]*|[0-9]+|[^\s]/g) ?? [text]
}

/** Write step frames. */
export function writeFrames(filePath: string, content: string): TimedFrame[] {
  return [{
    frame: { content, filePath, highlights: null, cursorLine: null },
    delay: 400,
  }]
}
