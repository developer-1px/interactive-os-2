/**
 * Mock LLM responder — pure function + a single setTimeout for perceived latency.
 * No network. Matches the prompt text against a small rule table and emits a
 * `MockLlmResult` that /prompt:submit translates into real deck/chat commands.
 *
 * Rules (patterns are OR-matched, first-match wins):
 *   1. "마케팅 퍼널" | "funnel"                      → scaffold 5 slides
 *   2. "슬라이드 추가" | "슬라이드 더" | "add slide" → append 1 slide
 *   3. "간결하게" | "shorter" + selectedSlideId       → shorten text blocks of that slide
 *   4. "비즈니스" | "professional" + selectedBlockId  → rewrite that block in business tone
 *   5. "차트를 stat으로" | "replace chart with stat" + selectedBlockId(type=chart) → swap
 *   fallback                                          → assistant asks a clarifying question
 */
import { getChildren } from '@os/store/createStore'
import type { NormalizedData } from '@os/store/types'
import type { BlockData, BlockType } from './deckTypes'

// ── Op shape (authoritative B-stage type; schema is z.any() for now) ──

export interface DeckOp {
  op: 'slide:insert' | 'slide:delete' | 'block:insert' | 'block:edit' | 'block:delete'
  args: Record<string, unknown>
}

export interface MockLlmResult {
  /** Markdown text for the assistant message. */
  assistantText: string
  /** One-line revision summary shown in the chat "diff" card. */
  summary: string
  /** Ordered list of mutations the user can accept or reject. */
  ops: DeckOp[]
}

export interface MockLlmContext {
  deck: NormalizedData
  selectedSlideId?: string
  selectedBlockId?: string
}

// ── Latency helper ───────────────────────────────────────────

const MOCK_LATENCY_MS = 600

function delay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

// ── Public entry point ───────────────────────────────────────

export function mockLlmRespond(prompt: string, context: MockLlmContext): Promise<MockLlmResult> {
  const result = respond(prompt, context)
  return delay(result)
}

// ── Rule engine ──────────────────────────────────────────────

function respond(raw: string, ctx: MockLlmContext): MockLlmResult {
  const prompt = raw.toLowerCase().trim()

  if (matches(prompt, ['마케팅 퍼널', 'funnel'])) return ruleFunnelDeck(ctx)
  if (matches(prompt, ['슬라이드 추가', '슬라이드 더', 'add slide'])) return ruleAddSlide(ctx)

  if (ctx.selectedSlideId && matches(prompt, ['간결하게', 'shorter'])) {
    return ruleShortenSlide(ctx, ctx.selectedSlideId)
  }
  if (ctx.selectedBlockId && matches(prompt, ['톤을 비즈니스', '비즈니스', 'professional'])) {
    return ruleProfessionalize(ctx, ctx.selectedBlockId)
  }
  if (ctx.selectedBlockId && matches(prompt, ['차트를 stat으로', 'replace chart with stat', 'chart to stat'])) {
    return ruleChartToStat(ctx, ctx.selectedBlockId)
  }

  return ruleFallback(raw)
}

function matches(prompt: string, needles: string[]): boolean {
  return needles.some((n) => prompt.includes(n.toLowerCase()))
}

// ── Individual rules ─────────────────────────────────────────

function ruleFunnelDeck(ctx: MockLlmContext): MockLlmResult {
  const deckId = findDeckId(ctx.deck)
  const stages: Array<{ title: string; body: BlockData }> = [
    { title: 'Awareness',     body: { type: 'bullets', items: ['SEO & content', 'Paid social', 'PR mentions'] } },
    { title: 'Consideration', body: { type: 'bullets', items: ['Case studies', 'Webinars', 'Free trial'] } },
    { title: 'Purchase',      body: { type: 'stat', value: '12.7%', label: 'Conversion', caption: '+2.1pp YoY' } },
    { title: 'Retention',     body: { type: 'stat', value: '68%',   label: 'Retention 90d', caption: '+4pp' } },
    { title: 'Advocacy',      body: { type: 'quote', text: 'Our power users become our best marketers.', attribution: 'Growth Team' } },
  ]

  const ops: DeckOp[] = [
    { op: 'slide:insert', args: { deckId, initialBlocks: [{ type: 'title', text: 'Marketing Funnel 2026' } as BlockData] } },
    ...stages.map((s) => ({
      op: 'slide:insert' as const,
      args: { deckId, initialBlocks: [{ type: 'title', text: s.title } as BlockData, s.body] },
    })),
  ]

  return {
    assistantText: `**마케팅 퍼널 덱 ${stages.length + 1}장**을 제안했어요.\n\n` +
      `- 표지 1장\n- 단계별 슬라이드 ${stages.length}장 (Awareness → Advocacy)\n\n` +
      `우측에서 수락하거나 거절할 수 있어요.`,
    summary: `마케팅 퍼널 덱 생성 (${stages.length + 1} slides)`,
    ops,
  }
}

function ruleAddSlide(ctx: MockLlmContext): MockLlmResult {
  const deckId = findDeckId(ctx.deck)
  return {
    assistantText: '빈 슬라이드 1장을 덱 끝에 추가할게요.',
    summary: '슬라이드 1장 추가',
    ops: [{
      op: 'slide:insert',
      args: { deckId, initialBlocks: [{ type: 'title', text: 'New Slide' } as BlockData] },
    }],
  }
}

function ruleShortenSlide(ctx: MockLlmContext, slideId: string): MockLlmResult {
  const childIds = getChildren(ctx.deck, slideId)
  const ops: DeckOp[] = []

  for (const id of childIds) {
    const data = ctx.deck.entities[id]?.data as BlockData | undefined
    if (!data) continue
    if (data.type === 'title') {
      ops.push({ op: 'block:edit', args: { blockId: id, patch: { text: shorten(data.text, 32) } } })
    } else if (data.type === 'bullets') {
      ops.push({
        op: 'block:edit',
        args: { blockId: id, patch: { items: data.items.map((t) => shorten(t, 24)) } },
      })
    } else if (data.type === 'quote') {
      ops.push({ op: 'block:edit', args: { blockId: id, patch: { text: shorten(data.text, 60) } } })
    }
  }

  if (ops.length === 0) {
    return {
      assistantText: '이 슬라이드에는 단축할 텍스트 블록이 없어요.',
      summary: '',
      ops: [],
    }
  }

  return {
    assistantText: `선택된 슬라이드의 텍스트 ${ops.length}개를 간결하게 줄였어요.`,
    summary: `슬라이드 텍스트 단축 (${ops.length}건)`,
    ops,
  }
}

function ruleProfessionalize(ctx: MockLlmContext, blockId: string): MockLlmResult {
  const data = ctx.deck.entities[blockId]?.data as BlockData | undefined
  if (!data) return ruleFallback('block not found')

  if (data.type === 'title') {
    return {
      assistantText: '제목을 비즈니스 톤으로 바꿨어요.',
      summary: '제목 톤 변경',
      ops: [{ op: 'block:edit', args: { blockId, patch: { text: toBusinessTone(data.text) } } }],
    }
  }
  if (data.type === 'quote') {
    return {
      assistantText: '인용문을 비즈니스 톤으로 재작성했어요.',
      summary: '인용문 톤 변경',
      ops: [{ op: 'block:edit', args: { blockId, patch: { text: toBusinessTone(data.text) } } }],
    }
  }
  if (data.type === 'bullets') {
    return {
      assistantText: '불릿 항목들을 비즈니스 톤으로 다듬었어요.',
      summary: '불릿 톤 변경',
      ops: [{
        op: 'block:edit',
        args: { blockId, patch: { items: data.items.map(toBusinessTone) } },
      }],
    }
  }
  return {
    assistantText: '선택된 블록 타입은 톤 변경을 지원하지 않아요.',
    summary: '',
    ops: [],
  }
}

function ruleChartToStat(ctx: MockLlmContext, blockId: string): MockLlmResult {
  const slideId = parentOf(ctx.deck, blockId)
  const data = ctx.deck.entities[blockId]?.data as BlockData | undefined
  if (!data || data.type !== 'chart' || !slideId) {
    return {
      assistantText: '선택된 블록이 chart 타입이 아니에요.',
      summary: '',
      ops: [],
    }
  }

  // Pick the largest data point as the stat focus.
  const top = [...data.data].sort((a, b) => b.value - a.value)[0]
  const statBlock: BlockData = top
    ? { type: 'stat', value: String(top.value), label: top.label }
    : { type: 'stat', value: '0', label: 'Metric' }

  return {
    assistantText: '차트를 대표값 1개짜리 stat 블록으로 치환할게요.',
    summary: 'chart → stat 치환',
    ops: [
      { op: 'block:delete', args: { blockId } },
      { op: 'block:insert', args: { slideId, blockType: 'stat' as BlockType, data: statBlock } },
    ],
  }
}

function ruleFallback(raw: string): MockLlmResult {
  const preview = raw.length > 40 ? `${raw.slice(0, 40)}…` : raw
  return {
    assistantText: `"${preview}" — 어떤 변경을 원하시나요?\n\n` +
      `시도해볼 수 있는 예:\n` +
      `- "마케팅 퍼널 덱 만들어줘"\n` +
      `- "슬라이드 추가"\n` +
      `- 슬라이드 선택 후 "간결하게"\n` +
      `- 블록 선택 후 "톤을 비즈니스로"\n` +
      `- 차트 블록 선택 후 "차트를 stat으로"`,
    summary: '',
    ops: [],
  }
}

// ── helpers ──────────────────────────────────────────────────

function findDeckId(store: NormalizedData): string {
  const roots = store.relationships['__root__'] ?? []
  for (const id of roots) {
    const d = store.entities[id]?.data as { type?: string } | undefined
    if (d?.type === 'deck') return id
  }
  return roots[0] ?? 'deck-1'
}

function parentOf(store: NormalizedData, nodeId: string): string | undefined {
  for (const [parentId, children] of Object.entries(store.relationships)) {
    if (children.includes(nodeId)) return parentId
  }
  return undefined
}

function shorten(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

function toBusinessTone(text: string): string {
  // Extremely simple mock — prepend a businessy verb if missing.
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  if (/^(we|우리|당사|전사적)/i.test(trimmed)) return trimmed
  return `당사는 ${trimmed}`
}
