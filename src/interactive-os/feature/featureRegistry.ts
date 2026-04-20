// featureRegistry — AppDefinition을 런타임 레지스트리로 투사.
//
// 깡통은 레지스트리만 읽는다 (하드코딩 금지). Feature 추가·제거가 레지스트리 조작으로 끝남.

import type {
  AppDefinition,
  FeatureContext,
  ViewModeContribution,
  PreviewRendererContribution,
  ToolbarContribution,
  SidebarContribution,
  DataSourceContribution,
  CommandPaletteContribution,
  KeymapContribution,
  FeatureCommandHandler,
} from './defineFeature'

export interface FeatureRegistry {
  dataSources: DataSourceContribution[]
  sidebars: SidebarContribution[]
  toolbars: ToolbarContribution[]
  viewModes: ViewModeContribution[]
  previewRenderers: PreviewRendererContribution[] // priority desc 정렬됨
  commandPalette: CommandPaletteContribution[]
  keymaps: KeymapContribution[] // priority desc 정렬됨
  commands: Record<string, FeatureCommandHandler>
}

export function buildRegistry(app: AppDefinition): FeatureRegistry {
  const reg: FeatureRegistry = {
    dataSources: [],
    sidebars: [],
    toolbars: [],
    viewModes: [],
    previewRenderers: [],
    commandPalette: [],
    keymaps: [],
    commands: {},
  }

  for (const f of app.features) {
    if (f.dataSource) reg.dataSources.push(f.dataSource)
    if (f.sidebar) reg.sidebars.push(...f.sidebar)
    if (f.toolbar) reg.toolbars.push(...f.toolbar)
    if (f.viewMode) reg.viewModes.push(f.viewMode)
    if (f.previewRenderer) reg.previewRenderers.push(...f.previewRenderer)
    if (f.commandPalette) reg.commandPalette.push(...f.commandPalette)
    if (f.keymap) reg.keymaps.push(...f.keymap)
    if (f.commands) Object.assign(reg.commands, f.commands)
  }

  // priority desc 정렬
  reg.previewRenderers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  reg.keymaps.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  reg.sidebars.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  reg.toolbars.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return reg
}

/** 현재 앱 상태에 활성인 keymap만 골라 key→commandId 맵으로 평탄화. priority 순 첫 매치 채택. */
export function resolveActiveKeymap(reg: FeatureRegistry, ctx: FeatureContext): Record<string, string> {
  const out: Record<string, string> = {}
  for (const km of reg.keymaps) {
    if (km.scope && !km.scope(ctx)) continue
    for (const [key, cmdId] of Object.entries(km.bindings)) {
      if (!(key in out)) out[key] = cmdId // priority 높은 게 먼저 들어오므로 덮어쓰기 방지
    }
  }
  return out
}
