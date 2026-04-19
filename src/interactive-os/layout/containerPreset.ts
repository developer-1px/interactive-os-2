// 책임: 컨테이너(FlatLayout 노드, UI 컴포넌트 래퍼)의 기본 padding/gap SSOT.
//
// rolePreset은 Item/Control의 role × surface × content 베이스 정책을 소유하고,
// containerPreset은 컨테이너의 type × variant 베이스 정책을 소유한다.
//
// @invariant 호출부(defineLayout, ui 컴포넌트)는 override가 필요할 때만 명시 —
//            지정 없으면 이 테이블의 기본값이 주입된다.
// @invariant 값 변경은 이 파일 1곳 수정으로 완결. 토큰 바뀌면 여기만 고치면 됨.

import type { AxPadding, AxGap } from '@styles/axPrivate'

export type ContainerType =
  | 'split'        // 분할 패널 (resizable split 포함)
  | 'stack'        // 세로 스택
  | 'bar'          // 가로 툴바
  | 'grid'         // 균등 그리드
  | 'widget'       // 일반 위젯
  | 'miller.root'  // MillerColumns 바깥 컨테이너
  | 'miller.column' // MillerColumns 각 컬럼

/** 구조 variant (DOM 위치) */
export type ContainerVariant = 'root' | 'nested' | 'overlay'
/** 재질 의도 (holds 축) — 자식의 재질에 따라 spacing을 다르게 줌 */
export type ContainerHolds = 'island' | 'glass' | 'dense'

export type ContainerPresetKey =
  | ContainerType
  | `${ContainerType}.${ContainerVariant}`
  | `${ContainerType}.${ContainerHolds}`
  | `${ContainerType}.${ContainerVariant}.${ContainerHolds}`

export interface ContainerPreset {
  padding?: AxPadding
  gap?: AxGap
}

/**
 * 컨테이너 type × variant → 기본 padding/gap 테이블.
 *
 * 원칙:
 * - root split은 바깥 inset(padding) 소유 — island들이 공통 ground 위에 여백을 가짐.
 *   내부 split(nested)은 이미 부모가 inset했으므로 추가 padding 없음.
 * - split은 gap 개념 없음 — SplitPane separator가 space-sm으로 gap 역할.
 * - stack/bar는 자식 사이 gap만 소유. padding은 필요 시 override.
 * - widget은 기본값 없음 — 위젯 내부가 자체 padding 소유.
 */
export const containerPresetTable: Partial<Record<ContainerPresetKey, ContainerPreset>> = {
  // ── Split ──
  // 기본: 외부 padding 없음 — pane 경계가 그대로 자리잡음.
  'split.root':          {},
  'split.nested':        {},
  // holds:'island' — 자식이 island로 떠있음. 바깥 ground 여백(sm) 필수.
  'split.root.island':   { padding: 'sm' },
  // holds:'glass' — overlay glass blur clearance (lg).
  'split.root.glass':    { padding: 'lg' },
  // holds:'dense' — 여백 없음 (기본과 동일).
  'split.root.dense':    {},

  // ── Stack ──
  // 기본: gap md
  'stack':         { gap: 'md' },
  // holds:'island' — island들 사이 gap sm + 컨테이너 padding sm.
  'stack.island':  { padding: 'sm', gap: 'sm' },
  'stack.glass':   { padding: 'lg', gap: 'lg' },
  'stack.dense':   { gap: 'xs' },

  // ── Bar ──
  'bar':           { gap: 'sm' },
  'bar.island':    { padding: 'xs', gap: 'sm' },
  'bar.dense':     { gap: 'xs' },

  // ── Grid ──
  'grid':          { gap: 'md' },
  'grid.island':   { padding: 'sm', gap: 'sm' },
  'grid.dense':    { gap: 'xs' },

  // ── Widget ──
  // 기본값 없음 — 위젯 내부가 자체 padding 소유. wrapper padding 없음.
  'widget':        {},
  'widget.overlay': {},
  // holds로 island 슬롯 래핑 시 내부 inset — 아이템이 island 경계에 닿지 않도록.
  'widget.island':  { padding: 'xs' },
  'widget.glass':   { padding: 'sm' },

  // ── Miller ──
  'miller.root':   { gap: 'sm' },
  'miller.column': { padding: 'xs', gap: 'xs' },
}

/**
 * 컨테이너 preset 조회.
 * 우선순위: type.variant.holds > type.holds > type.variant > type
 *
 * @param type 컨테이너 타입
 * @param variant optional 구조 variant (root/nested)
 * @param holds optional 재질 의도 (island/glass/dense)
 */
export function resolveContainerPreset(
  type: ContainerType,
  variant?: ContainerVariant,
  holds?: ContainerHolds,
): ContainerPreset {
  if (variant && holds) {
    const hit = containerPresetTable[`${type}.${variant}.${holds}` as ContainerPresetKey]
    if (hit) return hit
  }
  if (holds) {
    const hit = containerPresetTable[`${type}.${holds}` as ContainerPresetKey]
    if (hit) return hit
  }
  if (variant) {
    const hit = containerPresetTable[`${type}.${variant}` as ContainerPresetKey]
    if (hit) return hit
  }
  return containerPresetTable[type] ?? {}
}
