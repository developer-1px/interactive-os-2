import type {
  AxPublic, AxRole, AxSurface, AxContent, AxInteractive,
} from './axPublic'
import type { AxPrivate } from './axPrivate'

/**
 * rolePresetTable 키 형식. cascade 해석 순서 = 구체 → 일반.
 * 'role.surface.content' > 'role.surface.interactive' > 'role.surface' > 'role'
 *
 * @invariant cs는 키에서 제외 — 외부 입력(크기)으로 유지, Private 주입과 직교
 */
export type RolePresetKey =
  | `${AxRole}`
  | `${AxRole}.${AxSurface}`
  | `${AxRole}.${AxSurface}.${AxContent}`
  | `${AxRole}.${AxSurface}.${AxInteractive}`

/**
 * role × surface × (content|interactive) → Private 값 cascade 테이블.
 * 단일 SSOT. §1 불변식 #4 — 조합 변경은 이 파일 수정만으로 완결.
 *
 * @invariant 값은 Partial<AxPrivate> 만 — AxPublic 키 포함 금지
 * @invariant cs는 키에 없음 (외부 입력으로 그대로 전달)
 *
 * 현 엔트리는 1761 ax() 호출 스캔(2026-04-18) 결과 기반.
 * (role, surface) 버킷 빈도순 seed.
 */
export const rolePresetTable: Partial<Record<RolePresetKey, Partial<AxPrivate>>> = {
  // control.action — 기본 액션 버튼 (빈도 12)
  'control.action': { padding: 'sm', shape: 'md', gap: 'xs', weight: 'medium', text: 'bright' },
  // control.action.text — 텍스트 라벨 2:1 inline (빈도 10, 샘플: src/interactive-os/ui/Toaster.demo.tsx:21)
  'control.action.text': { padding: 'sm' },
  // control.action.icon — 아이콘 1:1 square (빈도 1, 샘플: src/interactive-os/ui/StreamFeed.tsx:66)
  'control.action.icon': { padding: 'xs' },
  // control.action.button — 버튼 역할 (빈도 1, 샘플: src/pages/showcase/gmail/gmailWidgets.tsx:61)
  'control.action.button': { gap: 'sm' },

  // control.ghost — 투명 버튼 (빈도 20)
  'control.ghost': { padding: 'sm', shape: 'md', text: 'secondary' },
  // control.ghost.icon — 아이콘 ghost 버튼 (빈도 12, 샘플: src/interactive-os/ui/CopyButton.tsx:19)
  'control.ghost.icon': { padding: 'xs' },
  // control.ghost.text — 텍스트 ghost (빈도 2, 샘플: src/interactive-os/ui/items/TabItem.tsx:28)
  'control.ghost.text': { shape: 'sm' },
  // control.ghost.tab — 탭 아이템 (빈도 1, 샘플: src/interactive-os/ui/items/TabItem.tsx:28)
  'control.ghost.tab': { shape: 'sm' },

  // control.input — 폼 입력 (빈도 8)
  'control.input': { padding: 'sm', shape: 'sm', border: 'default', text: 'primary' },
  // control.input.text — 입력 텍스트 (빈도 8, 샘플: src/interactive-os/ui/Combobox.tsx:276)
  'control.input.text': { text: 'primary' },
  // control.input.input — input 인터랙티브 (빈도 1, 샘플: src/interactive-os/ui/TextInput.tsx:13)
  'control.input.input': { shape: 'md' },

  // item.base — 리스트 아이템
  'item.base': { padding: 'sm', gap: 'sm' },

  // badge.display — 표시형 뱃지 (빈도 4)
  'badge.display': { padding: 'xs', shape: 'pill', weight: 'semi', text: 'bright' },
  // badge.ghost — 투명 뱃지 (빈도 2, 샘플: src/interactive-os/ui/FilterBar.tsx:48)
  'badge.ghost': { padding: 'xs', text: 'muted' },
  // badge.overlay — 오버레이 뱃지 (빈도 1, 샘플: src/pages/replay/replayWidgets.tsx:330)
  'badge.overlay': { padding: 'xs', shape: 'md', weight: 'semi' },
}

/**
 * Public 입력에서 Private 값을 cascade 로 해석.
 * @invariant 반환은 Partial<AxPrivate> 키만 — AxPublic 키 미포함
 * @invariant rolePresetTable 에 키 없으면 {} 반환, throw 금지
 *
 * cascade 순서 (일반 → 구체 병합, 구체가 override):
 *   1. role                             (fallback)
 *   2. role.surface                     (base)
 *   3. role.surface.interactive         (interactive 분기)
 *   4. role.surface.content             (content 분기, 최우선)
 */
export function resolveRolePreset(
  input: Pick<AxPublic, 'role' | 'surface' | 'content' | 'interactive'>,
): Partial<AxPrivate> {
  // A) role 없으면 early return {}
  if (!input.role) return {}

  // B) 키 후보 생성 — 일반 → 구체 (뒤가 덮음)
  const keys: RolePresetKey[] = [`${input.role}` as RolePresetKey]
  if (input.surface) {
    keys.push(`${input.role}.${input.surface}` as RolePresetKey)
    if (input.interactive) {
      keys.push(`${input.role}.${input.surface}.${input.interactive}` as RolePresetKey)
    }
    if (input.content) {
      keys.push(`${input.role}.${input.surface}.${input.content}` as RolePresetKey)
    }
  }

  // C) 누적 병합 — 일반(base) 먼저, 구체가 override
  let out: Partial<AxPrivate> = {}
  for (const k of keys) {
    const hit = rolePresetTable[k]
    if (hit) out = { ...out, ...hit }
  }

  return out
}
