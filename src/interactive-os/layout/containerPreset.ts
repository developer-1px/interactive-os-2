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

export type ContainerVariant = 'root' | 'nested' | 'island' | 'overlay'

export type ContainerPresetKey =
  | ContainerType
  | `${ContainerType}.${ContainerVariant}`

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
  // Split — island가 pane 전체를 채우고 pane 간 separator가 gap 역할.
  // 외부 padding 불필요 — island 경계 = pane 경계, 수직 정렬 자연스러움.
  'split.root':    {},
  'split.nested':  {},

  // Stack — 기본 gap md (FlatLayout stack 렌더러 기본값 공식화)
  'stack':         { gap: 'md' },

  // Bar — toolbar island들 사이 gap (control-group 간격)
  'bar':           { gap: 'sm' },

  // Grid
  'grid':          { gap: 'md' },

  // Widget — 기본값 없음 (위젯 내부가 소유). island는 pane 전체를 채우고
  // 내부 자체 스크롤을 관리한다. wrapper padding 없음 — island 경계 = pane 경계.
  'widget':        {},
  'widget.island': {},
  'widget.overlay': {},

  // Miller
  'miller.root':   { gap: 'sm' },
  'miller.column': { padding: 'xs', gap: 'xs' },
}

/**
 * 컨테이너 preset 조회.
 * @param type 컨테이너 타입
 * @param variant optional variant (root/nested) — 미지정 시 type 단독 키 조회
 */
export function resolveContainerPreset(
  type: ContainerType,
  variant?: ContainerVariant,
): ContainerPreset {
  if (variant) {
    const hit = containerPresetTable[`${type}.${variant}` as ContainerPresetKey]
    if (hit) return hit
  }
  return containerPresetTable[type] ?? {}
}
