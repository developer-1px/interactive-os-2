// ── MECE Axis Design System — Public/Private 2계층 ──
//
// ax()만 사용. style={} 금지.
// Public 축 → rolePreset cascade → Private 주입 → className 합성.
// Private 축 직접 지정이 필요한 경우에만 ax.raw() 사용.

import type {
  AxPublic, AxRole, AxSurface, AxContent, AxInteractive, AxTextStyle,
} from './axPublic'
import { AX_PRIVATE_KEYS } from './axPrivate'
import { resolveRolePreset, resolveTextStylePreset } from './rolePreset'
import { axRaw } from './axRaw'

// Public 타입 re-export — 외부 사용자는 'src/styles/ax' 한 경로만 본다.
// @removed AxScroll — Public 축 제거 (AxLayout의 'scroll'|'scroll-x'|'clip'로 흡수)
export type {
  AxPublic, CsScale, AxRole, AxSurface, AxTone, AxTextStyle, AxContent,
  AxLayout, AxPlacement, AxInteractive, AxWidth, AxFlex, AxClamp, AxAspect,
} from './axPublic'

// 마이그레이션 back-compat: 기존 `Axes` import 경로 유지용 alias.
// Bundle B 이후 Axes = AxPublic (Private 타입 유출 차단).
// 139 데모 마이그레이션 완료 후 제거.
export type Axes = AxPublic

// 전체 축 prefix 매핑 (Public + Private).
// ax()는 Public 키만 직접 수용 — Private는 rolePreset 경유로 주입된다.
// @removed scroll/weight/text/opacity/state (5 entries 삭제 — §1 #4, #5, #6)
const prefixes: Record<string, string> = {
  // Public (13)
  cs: 'cs',
  role: 'rl',
  surface: 'sf',
  tone: 'tn',
  textStyle: 'ts',
  content: 'ct',
  layout: 'ly',
  placement: 'pl',
  width: 'w',
  flex: 'fx',
  clamp: 'cl',
  aspect: 'ar',
  interactive: 'ia',
  // Private (7) — rolePreset 주입 경로로만 도달
  padding: 'pd',
  gap: 'g',
  shape: 'sh',
  border: 'bd',
  icon: 'ic',
  square: 'sq',
  motion: 'mo',
}

const PRIVATE_KEY_SET = new Set<string>(AX_PRIVATE_KEYS as readonly string[])

/**
 * 축 값을 className 문자열로 변환한다.
 * style={} 대신 이것만 사용한다.
 *
 * @invariant 입력 타입은 AxPublic — Private 키는 타입 수준에서 거부
 * @invariant 반환은 순수 문자열
 * @invariant Public 축 변경은 axPublic.ts 1곳, 조합 변경은 rolePreset.ts 1곳
 * @invariant Private 키가 any-cast로 들어오면 dev/prod 모두 TypeError throw (§1 #9)
 * @invariant resolveRolePreset의 throw는 catch 하지 않고 caller로 전파 (Pit of Failure 표면화)
 *
 * @example
 * // 텍스트 버튼
 * ax({ role: 'control', surface: 'action', content: 'text', tone: 'accent' })
 *
 * // 아이콘 버튼
 * ax({ role: 'control', surface: 'ghost', layout: 'center', content: 'icon' })
 *
 * // 툴바 (utility default — role 생략)
 * ax({ layout: 'bar', cs: 'sm' })
 *
 * // 툴팁
 * ax({ role: 'tip', surface: 'inverted', placement: 'above', textStyle: 'caption' })
 */
export function ax(axes: Axes): string {
  // 런타임 입력 — 타입은 Public만 허용되지만 any-cast 우회 가능성에 대비한 runtime view.
  // AxPublic은 discriminated union이라 `Partial<AxesAll>`은 브랜치 교집합으로 narrowing된다.
  // 런타임에서는 키 존재/부재만 확인하면 되므로 Record view로 읽는다.
  const input = axes as Record<string, string | undefined>

  // 1) Private 키 오염 검사 — AS-IS의 console.warn 경로를 throw로 승격 (§1 #9, §4a step2).
  //    타입 통과 경로에서는 unreachable. any-cast 우회 시 즉시 fail-fast.
  //    정책: dev = throw / prod = 동일 throw (silent drop 비선호 — 증상 숨김 재발 차단).
  for (const key in input) {
    if (PRIVATE_KEY_SET.has(key)) {
      throw new TypeError(
        `ax() received private key: "${key}". Use ax.raw() for escape hatch or rolePreset injection.`,
      )
    }
  }

  // 2) rolePreset cascade — role × surface × (content|interactive) 기반 Private 주입.
  //    cs는 Public 키로 그대로 전달되며 preset 조회 키에는 포함하지 않는다.
  //    ★중요: resolveRolePreset이 throw할 수 있다 (role ∈ {control|badge|tip} + surface 지정 + all-miss).
  //           ax()는 catch 하지 않는다 — caller로 전파하여 Pit of Failure 증상 표면화 (§4a step3).
  const rolePreset = resolveRolePreset({
    role: input.role as AxRole | undefined,
    surface: input.surface as AxSurface | undefined,
    content: input.content as AxContent | undefined,
    interactive: input.interactive as AxInteractive | undefined,
  })

  // 3) textStylePreset — padding/gap/shape 등 보조 Private만 주입.
  //    text/weight 키는 Bundle B에서 제거 — surface→text pairing은 CSS layer (§4c)가 SSOT.
  const textPreset = resolveTextStylePreset(input.textStyle as AxTextStyle | undefined)

  // 4) merge — override 순서: textPreset(일반) → rolePreset(role 구체) → input(Public 명시).
  //    input에는 Public 키만 있음이 step1에서 보장됨.
  const merged: Record<string, string | undefined> = { ...textPreset, ...rolePreset, ...input }

  // 5) className 합성 — prefix-value 공백 구분
  let result = ''
  for (const key in merged) {
    const value = merged[key]
    if (value == null) continue
    const prefix = prefixes[key]
    if (!prefix) continue
    if (result) result += ' '
    result += `${prefix}-${value}`
  }
  return result
}

// Escape hatch 부착 — Private 축 직접 지정의 유일 경로.
;(ax as typeof ax & { raw: typeof axRaw }).raw = axRaw

// namespace 선언으로 ax.raw 의 d.ts 형태 제공
export declare namespace ax {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const raw: typeof axRaw
}
