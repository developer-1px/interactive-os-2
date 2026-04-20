// ② flat-layout-engine-prd.md
// ② cmux-layout-prd.md
// 순수 타입 파일 — defineLayout 팩토리는 ./defineLayout.ts로 분리.
import type { PaneSize } from '../store/types'

// ── Layout node types ─────────────────────────────────

/** 모든 레이아웃 노드의 공통 속성 — 배치 + 가시성 + 스크롤 + 재질 의도.
 *  스크롤/재질은 defineLayout의 1급 축 — 각 필드 외에는 pages·widget·module.css에서
 *  overflow/shape/surface를 직접 선언하지 않는다(단일 SSOT). */
export interface LayoutBase extends Record<string, unknown> {
  hidden?: boolean
  padding?: 'xs' | 'sm' | 'md' | 'lg'
  /** 이 노드를 스크롤 컨테이너로 선언. 미지정 = clip (사일런트 overflow 차단).
   *  'y' 세로, 'x' 가로. */
  scroll?: 'y' | 'x'
  /** 이 컨테이너가 담을 자식의 재질 의도. SSOT — widget은 island/glass 여부를 몰라도 됨.
   *  - 'island': 자식을 raised island로 감싸고 컨테이너에 ground 여백 제공
   *  - 'glass':  자식을 overlay glass로 감싸고 blur clearance 제공
   *  - 'dense':  꽉 채움, gap 최소
   *  미지정 = 기본 (spacing preset 기본값). */
  holds?: 'island' | 'glass' | 'dense'
}

export interface SplitNode extends LayoutBase {
  type: 'split'
  direction: 'horizontal' | 'vertical'
  sizes: PaneSize[]
  resizable?: boolean  // ② flatlayout-resizable-split-prd.md — 기본 true, false면 고정 비율
}

export interface StackNode extends LayoutBase {
  type: 'stack'
  gap?: 'sm' | 'md' | 'lg'
}

export interface OverlayNode extends LayoutBase {
  type: 'overlay'
  overlayType: 'modal' | 'popup' | 'hint'
  placement?: string
  trigger?: string
  visible?: boolean
}

export interface BarNode extends LayoutBase {
  type: 'bar'
  justify?: 'start' | 'center' | 'between' | 'end'
  gap?: 'xs' | 'sm' | 'md' | 'lg'
}

export interface WidgetNode extends LayoutBase {
  type: 'widget'
  widget: string
  props?: Record<string, unknown>
  source?: string
}

export interface GridNode extends LayoutBase {
  type: 'grid'
  columns: 2 | 3 | 4 | 5 | 7
  gap?: 'sm' | 'md' | 'lg'
}

export interface NavNode extends LayoutBase {
  type: 'nav'
  sidebarWidth?: number  // 0~1 비율, 기본 0.2
}

/** Tabgroup — activeTabId로 자식 탭 중 활성 탭 결정. workspaceStore의 TabGroupData와 동일 스키마. */
export interface TabgroupNode extends LayoutBase {
  type: 'tabgroup'
  activeTabId: string
}

/** Tab — workspaceStore의 TabData와 동일 스키마. contentType/contentRef로 위젯에 콘텐츠 식별자 전달. */
export interface TabNode extends LayoutBase {
  type: 'tab'
  label: string
  contentType?: string
  contentRef?: string
}

export interface SectionNode extends LayoutBase {
  type: 'section'
  title: string
  count?: number
}

export interface FloatingNode extends LayoutBase {
  type: 'floating'
  anchor: 'float-top-start' | 'float-top-center' | 'float-bottom-center' | 'float-bottom'
  hidden?: boolean
}

/** 데이터 전용 노드 — 렌더링되지 않고, 위젯 간 shared state를 store에 보관하는 용도. command로 업데이트, useFlatLayout()로 읽기. */
export interface StateNode extends LayoutBase {
  type: 'state'
  [key: string]: unknown
}

export type LayoutNode = SplitNode | StackNode | BarNode | OverlayNode | WidgetNode | GridNode | NavNode | TabgroupNode | TabNode | SectionNode | FloatingNode | StateNode
