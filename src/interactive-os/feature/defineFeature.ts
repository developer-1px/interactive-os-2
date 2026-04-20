// defineFeature — 마켓플레이스 단위. 깡통 앱 위에 수직 기능 슬라이스를 조립한다.
//
// 기존 `definePlugin`은 엔진 수평 행동(history/clipboard 등)을 소유한다.
// `defineFeature`는 앱 수직 기능(데이터 소스/뷰 모드/프리뷰 렌더러 등)을 소유한다.
//
// 7 기여 타입:
//   dataSource      — NormalizedData 공급 (Fs, Mock, Github)
//   sidebar         — 좌측 사이드바 섹션 (Favorites, Recent)
//   toolbar         — 툴바 버튼 (Sort, Filter, Back)
//   viewMode        — TreeView 대체 렌더러 (Miller, Book, Gallery)
//   previewRenderer — 파일 타입별 Preview (Markdown, Image, Code)
//   commandPalette  — QuickOpen 명령어
//   keymap          — 스코프된 키바인딩
//
// 저층 리소스(선택):
//   schema          — NormalizedData 노드 타입 확장
//   commands        — 커스텀 command 등록
//   plugin          — 엔진 플러그인 (기존 definePlugin 재사용 가능)

import type { NormalizedData, Entity } from '@os/store/types'
import type { Plugin } from '@os/engine/types'
import type { ReactNode, ComponentType } from 'react'

export type FeatureId = string

// ── Feature scope: 언제 기여가 활성화되는가 ──

export interface FeatureContext {
  viewMode: string
  activeDataSourceId?: string
  [key: string]: unknown
}

/** 현재 앱 상태 기반 활성 판정. 반환 true면 기여 활성. */
export type FeatureScope = (ctx: FeatureContext) => boolean

/** Feature가 등록하는 command 핸들러. keymap/commandPalette가 id로 참조. */
export type FeatureCommandHandler = (ctx: FeatureContext) => void | Promise<void>

// ── 7 기여 타입 ──

export interface DataSourceContribution {
  id: string
  label: string
  icon?: ReactNode
  /** 최초 로드 또는 currentRoot 변경 시 호출 */
  load: (args: { rootPath?: string; signal?: AbortSignal }) => Promise<NormalizedData>
  /** 선택: 실시간 구독 (SSE/WS) */
  subscribe?: (args: { onPatch: (patch: Partial<NormalizedData>) => void }) => () => void
}

export interface SidebarContribution {
  id: string
  section: 'favorites' | 'recent' | 'custom'
  order?: number
  render: () => ReactNode
}

export interface ToolbarContribution {
  id: string
  slot: 'left' | 'center' | 'right'
  order?: number
  render: (ctx: FeatureContext) => ReactNode
  scope?: FeatureScope
}

export interface ViewModeContribution {
  id: string
  label: string
  icon?: ReactNode
  /** 이 뷰 모드가 활성일 때 메인 영역 렌더러 */
  render: ComponentType<{ data: NormalizedData; onChange: (next: NormalizedData) => void }>
  /** 이 뷰 모드가 선호하는 레이아웃 override (예: preview 숨김) */
  layout?: {
    hidePreview?: boolean
    hideSidebar?: boolean
    customTree?: unknown // FlatLayout override — 추후 구체화
  }
}

export interface PreviewRendererContribution {
  id: string
  /** 이 renderer가 처리할 수 있는 엔티티인지 판정 */
  canHandle: (entity: Entity) => boolean
  priority?: number // 높을수록 우선
  render: ComponentType<{ entity: Entity; path: string }>
}

export interface CommandPaletteContribution {
  id: string
  label: string
  /** QuickOpen에 나타날 명령어. select 시 실행 */
  run: (ctx: FeatureContext) => void | Promise<void>
  keywords?: string[]
  scope?: FeatureScope
}

export interface KeymapContribution {
  id: string
  bindings: Record<string, string> // 'ArrowLeft' → commandId
  scope?: FeatureScope // 예: () => ctx.viewMode === 'book'
  /** 충돌 시 우선순위 (높을수록 우선). 기본 0. */
  priority?: number
}

// ── 저층 리소스 ──

export interface FeatureSchema {
  nodeTypes?: Record<string, unknown> // Zod schema 등, 추후 구체화
}

// ── defineFeature 본체 ──

export interface FeatureDefinition {
  id: FeatureId
  name: string
  version: string
  description?: string

  // 기여 (전부 선택)
  dataSource?: DataSourceContribution
  sidebar?: SidebarContribution[]
  toolbar?: ToolbarContribution[]
  viewMode?: ViewModeContribution
  previewRenderer?: PreviewRendererContribution[]
  commandPalette?: CommandPaletteContribution[]
  keymap?: KeymapContribution[]

  // 저층 리소스 (선택)
  schema?: FeatureSchema
  /** Feature 자체 command 핸들러. keymap/commandPalette가 id로 참조. */
  commands?: Record<string, FeatureCommandHandler>
  /** 엔진 수평 plugin (history/clipboard 등). 기존 definePlugin 재사용. */
  plugin?: Plugin

  // 생명주기 (선택)
  onInstall?: (ctx: FeatureContext) => void | Promise<void>
  onUninstall?: (ctx: FeatureContext) => void | Promise<void>
}

export function defineFeature(def: FeatureDefinition): FeatureDefinition {
  return def
}

// ── defineApp: 깡통 + Features 조립 ──

export interface BaselineDefinition {
  id: string
  name: string
  /** 깡통이 요구하는 기여 종류 (예: 'dataSource' 1개 이상 필수) */
  required?: Array<'dataSource' | 'viewMode' | 'previewRenderer'>
  /** 깡통 기본 슬롯 */
  slots: string[]
}

export interface AppDefinition {
  baseline: BaselineDefinition
  features: FeatureDefinition[]
  /** 깡통이 required로 지정한 기여가 없으면 컴파일 타임 오류 대상 */
}

export function defineApp(def: AppDefinition): AppDefinition {
  // 런타임 검증: required 기여 누락 시 throw
  const required = def.baseline.required ?? []
  for (const req of required) {
    const hasIt = def.features.some(f => {
      if (req === 'dataSource') return Boolean(f.dataSource)
      if (req === 'viewMode') return Boolean(f.viewMode)
      if (req === 'previewRenderer') return Boolean(f.previewRenderer?.length)
      return false
    })
    if (!hasIt) {
      throw new Error(`[defineApp] baseline "${def.baseline.id}" requires at least one "${req}" contribution`)
    }
  }
  return def
}
