import type {
  AxPublic, AxRole, AxSurface, CsScale, AxContent, AxInteractive,
} from './axPublic'
import type { AxPrivate } from './axPrivate'

/**
 * rolePresetTable 키 형식. cascade 해석 순서 = 구체 → 일반.
 * 'role.surface.cs.content' > 'role.surface.cs.interactive' > 'role.surface.cs'
 */
export type RolePresetKey =
  | `${AxRole}.${AxSurface}.${CsScale}`
  | `${AxRole}.${AxSurface}.${CsScale}.${AxContent}`
  | `${AxRole}.${AxSurface}.${CsScale}.${AxInteractive}`

/**
 * role × surface × cs × (content|interactive) → Private 값 cascade 테이블.
 * 단일 SSOT. §1 불변식 #4 — 조합 변경은 이 파일 수정만으로 완결.
 *
 * 현 상태: 최소 seed. 139 데모 마이그레이션 시 실측 기반으로 확장.
 *
 * @invariant 값은 Partial<AxPrivate> 만 — AxPublic 키 포함 금지
 */
export const rolePresetTable: Partial<Record<RolePresetKey, Partial<AxPrivate>>> = {
  // control.action — 기본 액션 버튼
  'control.action.xs': { padding: 'xs', shape: 'sm', gap: 'xs', weight: 'medium', text: 'bright' },
  'control.action.sm': { padding: 'xs', shape: 'sm', gap: 'xs', weight: 'medium', text: 'bright' },
  'control.action.md': { padding: 'sm', shape: 'md', gap: 'xs', weight: 'medium', text: 'bright' },
  'control.action.lg': { padding: 'md', shape: 'md', gap: 'sm', weight: 'medium', text: 'bright' },
  'control.action.xl': { padding: 'lg', shape: 'lg', gap: 'sm', weight: 'semi', text: 'bright' },

  // control.ghost — 투명 버튼
  'control.ghost.md': { padding: 'sm', shape: 'md', text: 'secondary' },

  // control.input — 폼 입력
  'control.input.md': { padding: 'sm', shape: 'sm', border: 'default', text: 'primary' },

  // item.base — 리스트 아이템
  'item.base.md': { padding: 'sm', gap: 'sm' },

  // badge
  'badge.display.sm': { padding: 'xs', shape: 'pill', weight: 'semi', text: 'bright' },
}

/**
 * Public 입력에서 Private 값을 cascade 로 해석.
 * @invariant 반환은 Partial<AxPrivate> 키만 — AxPublic 키 미포함
 * @invariant rolePresetTable 에 키 없으면 {} 반환, throw 금지
 */
export function resolveRolePreset(
  input: Pick<AxPublic, 'role' | 'surface' | 'cs' | 'content' | 'interactive'>,
): Partial<AxPrivate> {
  // A) 필수 3축 없으면 early return {}
  if (!input.role || !input.surface || !input.cs) return {}

  // B) 키 후보 생성 — 구체 → 일반
  const keys: RolePresetKey[] = []
  if (input.content) {
    keys.push(`${input.role}.${input.surface}.${input.cs}.${input.content}` as RolePresetKey)
  }
  if (input.interactive) {
    keys.push(`${input.role}.${input.surface}.${input.cs}.${input.interactive}` as RolePresetKey)
  }
  keys.push(`${input.role}.${input.surface}.${input.cs}` as RolePresetKey)

  // C) 누적 병합 — 일반이 base, 구체가 override (역순 reduce)
  let out: Partial<AxPrivate> = {}
  for (const k of [...keys].reverse()) {
    const hit = rolePresetTable[k]
    if (hit) out = { ...out, ...hit }
  }

  return out
}
