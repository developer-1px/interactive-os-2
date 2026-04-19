// 책임: role × surface × (content|interactive) cascade 테이블 + textStyle 테이블.
// AS-IS의 silent {} 정책을 role 브랜치별로 분기 — control/badge/tip은 throw (§1 #7).

import type {
  AxRole, AxSurface, AxContent, AxInteractive, AxTextStyle,
} from './axPublic'
import type { AxPrivate } from './axPrivate'

// Phase 1-a G-5 임시: rolePreset miss throw 완화용 dedup set.
// Bundle E 완료 후 아래 warnedMissKeys 및 관련 warn 로직 제거, throw 재승격.
const warnedMissKeys = new Set<string>()

/**
 * rolePresetTable 키 형식. cascade 해석 순서 = 일반 → 구체 (구체 override).
 * 'role' > 'role.surface' > 'role.surface.interactive' > 'role.surface.content'
 *
 * @invariant cs는 키에서 제외 — 외부 입력(크기)으로 유지, Private 주입과 직교
 * @invariant AxRole 7브랜치 × AxSurface union으로 자동 확장
 * @invariant `tip.inverted`, `tip.inverted.caption` entry 등록 (Tooltip unblock)
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
 * @invariant 값은 Partial<AxPrivate> 만 — text/weight/opacity/state 키 부재 (§1 #4, #5)
 * @invariant cs는 키에 없음 (외부 입력으로 그대로 전달)
 * @invariant `tip.*` entry는 Bundle C CSS의 surface→text pairing과 페어링
 *
 * 현 엔트리는 1761 ax() 호출 스캔(2026-04-18) 결과 기반.
 * (role, surface) 버킷 빈도순 seed.
 */
export const rolePresetTable: Partial<Record<RolePresetKey, Partial<AxPrivate>>> = {
  // ── control.action — 기본 액션 버튼 (빈도 12) ─────────────────
  'control.action': { padding: 'sm', shape: 'md', gap: 'xs' },
  // control.action.text — 텍스트 라벨 2:1 inline (빈도 10)
  'control.action.text': { padding: 'sm' },
  // control.action.icon — 아이콘 1:1 square (빈도 1)
  'control.action.icon': { padding: 'xs' },
  // control.action.button — 버튼 역할 (빈도 1)
  'control.action.button': { gap: 'sm' },

  // ── control.ghost — 투명 버튼 (빈도 20) ──────────────────────
  'control.ghost': { padding: 'sm', shape: 'md' },
  // control.ghost.icon — 아이콘 ghost 버튼 (빈도 12)
  'control.ghost.icon': { padding: 'xs' },
  // control.ghost.text — 텍스트 ghost (빈도 2)
  'control.ghost.text': { shape: 'sm' },
  // control.ghost.tab — 탭 아이템 (빈도 1)
  'control.ghost.tab': { shape: 'sm' },

  // ── control.input — 폼 입력 (빈도 8) ─────────────────────────
  'control.input': { padding: 'sm', shape: 'sm', border: 'default' },
  // control.input.text — 입력 텍스트 (빈도 8)
  'control.input.text': {},
  // control.input.input — input 인터랙티브 (빈도 1)
  'control.input.input': { shape: 'md' },

  // ── control.placeholder — 로딩 스피너 컨트롤 (spin) ──────────
  'control.placeholder': { padding: 'xs', shape: 'md', motion: 'spin' },

  // ── item.base — 리스트 아이템 기본 preset (surface 미지정 path는 silent {}) ──
  // NOTE: 'item'은 silent role — 아래 entry는 명시 hit일 때만 주입된다.

  // ── badge.display — 표시형 뱃지 (빈도 4) ────────────────────
  'badge.display': { padding: 'xs', shape: 'pill' },
  // badge.ghost — 투명 뱃지 (빈도 2)
  'badge.ghost': { padding: 'xs' },
  // badge.overlay — 오버레이 뱃지 (빈도 1)
  'badge.overlay': { padding: 'xs', shape: 'md' },
  // badge.placeholder — 로딩 상태 칩 (pulse)
  'badge.placeholder': { padding: 'xs', shape: 'pill', motion: 'pulse' },

  // ── item.placeholder — 스트리밍/스켈레톤 행 (shimmer) ───────
  'item.placeholder': { padding: 'sm', gap: 'sm', motion: 'shimmer' },

  // ── control-group.overlay — CMS 플로팅 툴바/픽커 (★신규, ax Liquid Glass B1) ──
  // CMS 3곳(CmsFloatingToolbar/CmsViewportBar/CmsTemplatePicker) last-mile 흡수 seed.
  // 'control-group'은 silent role (strictRoles 미포함) — throw 유발하지 않지만
  // primary target (§1 #1) 이므로 cascade hit을 명시 보장.
  'control-group.overlay': { padding: 'xs', gap: 'xs', shape: 'xl' },

  // ── control-group.raised — Island (★신규) ──────────────────
  // sunken 컨테이너 속에서 떠오른 섬. shape:'island'가 "경계를 가진 독립체" 시멘틱.
  // 예: sidebar section (NavList group), form section card, floating panel group.
  'control-group.raised': { padding: 'sm', gap: 'xs', shape: 'island' },
  // control-group.sunken — 섬들을 담는 컨테이너. padding/gap만 번들, shape 없음(꽉 채움).
  'control-group.sunken': { padding: 'sm', gap: 'sm' },

  // ── cell.* — grid 칸 preset (신규, cs 기본 sm: 28/13, 내부 부품 수용) ──
  // cell은 "컨테이너 + 내부 control 묶음" role. 내부 control은 --cell-cs 상속.
  'cell.display': { padding: 'sm', gap: 'xs' },       // 기본 읽기 셀 (TextCell, BadgeCell 등)
  'cell.ghost':   { padding: 'sm' },                   // 구분선 없는 투명 셀 (ToggleCell)
  'cell.input':   { padding: 'sm', shape: 'sm', border: 'default' },  // 편집 셀 (EditableCell, SearchableCell)

  // ── tip.* — 툴팁 preset (신규, Bundle D Tooltip unblock) ──
  // tip.inverted — 기본 Tooltip 표면 (어두운 배경 + 밝은 텍스트, CSS layer가 색 주입)
  'tip.inverted': { padding: 'xs', shape: 'sm', motion: 'fade-slide-in' },
  // tip.inverted.caption — caption 타이포 조합 (Tooltip 기본 textStyle)
  // content 슬롯 대응: AxContent에 'caption' 없으므로 interactive slot 사용하지 않음 — base만 상속.
  // tip.overlay — overlay Tooltip (투명 배경 + 블러)
  'tip.overlay': { padding: 'xs', shape: 'sm', motion: 'fade-slide-in' },
}

/**
 * textStyle → Private 주입 테이블.
 * surface→text pairing은 CSS layer (§4c)가 SSOT이므로 이 테이블은 text/weight 주입하지 않는다.
 *
 * @invariant 값은 Partial<AxPrivate>만 — padding/gap/shape/border/icon/square/motion 7축 subset
 * @invariant text/weight 필드 전부 제거 (§1 #4, #5 — Bundle B 승격)
 * @invariant rolePreset과 병합 시 role이 우선 (더 구체적 의도)
 *
 * @note 현재 textStyle → Private 주입 경로가 필요한 값은 없음.
 *       모든 엔트리는 빈 객체 `{}`로 유지 (향후 textStyle-별 padding 등 등록 여지).
 */
export const textStylePresetTable: Partial<Record<AxTextStyle, Partial<AxPrivate>>> = {
  hero:     {},
  display:  {},
  page:     {},
  section:  {},
  label:    {},
  body:     {},
  caption:  {},
  code:     {},
  overline: {},
}

/**
 * textStyle 입력에서 Private 값을 해석.
 *
 * @invariant 반환은 Partial<AxPrivate> 키만 — AxPublic 키 미포함
 * @invariant 미정의/undefined 입력 시 {} 반환, throw 금지
 * @invariant text/weight 주입 없음 — surface→text pairing은 CSS layer (§4c)가 SSOT
 */
export function resolveTextStylePreset(
  textStyle: AxTextStyle | undefined,
): Partial<AxPrivate> {
  if (!textStyle) return {}
  return textStylePresetTable[textStyle] ?? {}
}

/**
 * resolveRolePreset 입력 타입.
 * AxPublic이 discriminated union이라 `Pick<AxPublic, ...>`은 브랜치 교집합만 반환한다.
 * 실용적으로 4 필드를 풀어 쓴다 — 각 필드는 브랜치별 optional.
 */
interface ResolveRolePresetInput {
  role?: AxRole
  surface?: AxSurface
  content?: AxContent
  interactive?: AxInteractive
}

/**
 * Public 입력에서 Private 값을 cascade로 해석.
 *
 * @invariant 반환은 Partial<AxPrivate> 키만 — AxPublic 키 미포함
 * @invariant role 없으면 {} 반환 (utility default — 1,701 role-less 호출 보호)
 * @invariant role ∈ {'control','badge','tip','cell'} AND surface 지정 AND all-miss → throw (§1 #7)
 *            (Pit of Failure 차단 — Tooltip-class 버그 재발 방지)
 * @invariant role ∈ {'control-group','item','utility'} OR surface 미지정 → silent {}
 * @invariant cascade 순서: role → role.surface → role.surface.interactive → role.surface.content
 *            (일반 → 구체, 구체가 override)
 */
export function resolveRolePreset(
  input: ResolveRolePresetInput,
): Partial<AxPrivate> {
  // A) role 없으면 early return {} (1,701 role-less 호출 보호)
  if (!input.role) return {}

  // B) 키 후보 생성 — 일반(base) → 구체(override) 순서
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

  // C) 누적 병합 — 뒤 키가 앞 키를 override. anyHit 트래킹으로 miss 구분.
  let out: Partial<AxPrivate> = {}
  let anyHit = false
  for (const k of keys) {
    const hit = rolePresetTable[k]
    if (hit) {
      out = { ...out, ...hit }
      anyHit = true
    }
  }

  // D) 모든 키 miss 시 분기 정책 (§1 #7, §4b):
  //    - role ∈ {control|badge|tip|cell} AND surface 지정 → throw (Pit of Failure 차단)
  //      · 이 4 role은 surface 필수 — preset 누락은 감사 실패 (Tooltip-class 버그).
  //    - role ∈ {control-group|item|utility} OR surface 미지정 → silent {}
  //      · 이 role들은 surface optional — panel/row는 layout만으로도 시각 구분 가능.
  if (!anyHit) {
    const strictRoles: AxRole[] = ['control', 'badge', 'tip', 'cell']
    if (strictRoles.includes(input.role) && input.surface) {
      const suffix =
        (input.content ? `.${input.content}` : '') +
        (input.interactive ? `.${input.interactive}` : '')
      // Phase 1-a G-5 임시: throw → warn 완화.
      // Bundle D/E 미완료 상태에서 미등록 preset이 React 초기 렌더를 깨뜨려 관측 불가.
      // Bundle E 완료 후 throw 재승격 (§1 #7 promise 이행).
      const missKey = `${input.role}.${input.surface}${suffix}`
      if (!warnedMissKeys.has(missKey)) {
        warnedMissKeys.add(missKey)
        console.warn(
          `rolePreset miss: "${missKey}" — TEMP warn (Phase 1-a G-5). ` +
          `Will re-promote to throw after Bundle E migration completes.`,
        )
      }
    }
    return {}  // silent branch (throw 완화 중 유일 경로)
  }

  return out
}
