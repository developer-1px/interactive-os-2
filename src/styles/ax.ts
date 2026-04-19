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
// Phase 1-a G-5 임시: Bundle D/E 마이그레이션 중 throw → warn 완화용 dedup set.
// Bundle E 완료 후 이 Set과 아래 warn 로직 제거, throw 재승격 (§1 #9).
const warnedPrivateKeys = new Set<string>()
// 2026-04-19 ax-textstyle-ssot-prd (W4b): cs 축 deprecate warn dedup set.
// textStyle이 font-size/cs-h/cs-py/cs-px 4-tuple SSOT. 후속 bundle에서 타입 제거 시 이 set도 제거.
const warnedCsCallsites = new Set<string>()

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
 * ax({ layout: 'bar', textStyle: 'body' })
 *
 * // 툴팁
 * ax({ role: 'tip', surface: 'inverted', placement: 'above', textStyle: 'caption' })
 */
export function ax(axes: Axes): string {
  // 런타임 입력 — 타입은 Public만 허용되지만 any-cast 우회 가능성에 대비한 runtime view.
  // AxPublic은 discriminated union이라 `Partial<AxesAll>`은 브랜치 교집합으로 narrowing된다.
  // 런타임에서는 키 존재/부재만 확인하면 되므로 Record view로 읽는다.
  const input = axes as Record<string, string | undefined>

  // 1) Private 키 오염 검사 — Phase 1-a G-5 임시 완화.
  //    원래 Bundle B에서 throw 승격했으나(§1 #9), Bundle D/E 호출부 마이그레이션 미완 상태에서
  //    throw가 React 초기 렌더를 깨뜨려 앱 부팅 실패 → Puppeteer/Gemma 관측 불가능 상태 발생.
  //    smoke test(scripts/smokeTestPuppeteer.mjs)로 원인 확정. G-5는 "Bundle 중간 상태 런타임
  //    smoke test 부재"를 관리 시스템 갭으로 기록.
  //    Bundle E 완료 후 이 블록 제거 + throw 재승격 (§1 #9 promise 이행).
  for (const key in input) {
    if (PRIVATE_KEY_SET.has(key) && !warnedPrivateKeys.has(key)) {
      warnedPrivateKeys.add(key)
      console.warn(
        `ax() received private key: "${key}". TEMP warn (Phase 1-a G-5). ` +
        `Will re-promote to throw after Bundle E migration completes.`,
      )
    }
  }

  // 1b) cs 축 deprecate warn — 2026-04-19 ax-textstyle-ssot-prd (W4b).
  //     textStyle이 font-size·cs-h·cs-py·cs-px 4-tuple SSOT. cs 축 흡수됨.
  //     dedup 키는 value 단위 — 같은 값 callsite는 1회만 warn.
  if ('cs' in input && input.cs != null) {
    const callsite = `cs=${input.cs}`
    if (!warnedCsCallsites.has(callsite)) {
      warnedCsCallsites.add(callsite)
      console.warn(
        `ax() received deprecated 'cs' axis (value: "${input.cs}"). ` +
        `Use 'textStyle' instead — textStyle supplies font-size, cs-h, cs-py, cs-px as 4-tuple. ` +
        `Migration: docs/2026/2026-04/2026-04-19/ax-textstyle-ssot-prd.md`,
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
// eslint-disable-next-line @typescript-eslint/no-namespace -- namespace merging is required to attach `raw` to the ax callable's type
export declare namespace ax {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const raw: typeof axRaw
}
