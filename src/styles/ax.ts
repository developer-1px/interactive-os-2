// ── MECE Axis Design System — Public/Private 2계층 ──
//
// ax()만 사용. style={} 금지.
// Public 축 → rolePreset cascade → Private 주입 → className 합성.
// Private 축 직접 지정이 필요한 경우에만 ax.raw() 사용.

import type { AxPublic } from './axPublic'
import type { AxPrivate } from './axPrivate'
import { AX_PRIVATE_KEYS } from './axPrivate'
import { resolveRolePreset, resolveTextStylePreset } from './rolePreset'
import { axRaw } from './axRaw'

// Public 타입 re-export — 외부 사용자는 'src/styles/ax' 한 경로만 본다.
export type {
  AxPublic, CsScale, AxRole, AxSurface, AxTone, AxTextStyle, AxContent,
  AxLayout, AxPlacement, AxInteractive, AxWidth, AxFlex, AxClamp, AxAspect, AxScroll,
} from './axPublic'

// 마이그레이션 back-compat: 기존 `Axes` import 경로 유지용 alias.
// 139 데모 마이그레이션 완료 후 제거.
// recipe 축은 제거됨 — 레거시 CSS @layer recipe 이름과 혼동 주의 (별개 개념).
export type Axes = AxPublic & Partial<AxPrivate>

// 전체 축 prefix 매핑 (Public + Private).
// Private 축은 rolePreset 주입 또는 마이그레이션 기간 직접 입력 모두 수용.
type AxesAll = AxPublic & AxPrivate

const prefixes: Record<keyof AxesAll, string> = {
  // Public
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
  scroll: 'sc',
  interactive: 'ia',
  // Private
  padding: 'pd',
  gap: 'g',
  shape: 'sh',
  border: 'bd',
  icon: 'ic',
  square: 'sq',
  weight: 'wt',
  text: 'tx',
  opacity: 'op',
  state: 'st',
  motion: 'mo',
}

const PRIVATE_KEY_SET = new Set<string>(AX_PRIVATE_KEYS as readonly string[])
const warnedKeys = new Set<string>()

/**
 * 축 값을 className 문자열로 변환한다.
 * style={} 대신 이것만 사용한다.
 *
 * @invariant 입력 타입은 AxPublic — Private 키는 타입 수준에서 거부
 * @invariant 반환은 순수 문자열
 * @invariant Public 축 변경은 axPublic.ts 1곳, 조합 변경은 rolePreset.ts 1곳
 *
 * 마이그레이션 유예: 현 시점 호출부 중 Private 키를 직접 쓰는 사례가 다수 존재한다.
 * 타입 시그니처는 AxPublic으로 전환하되, 런타임은 dev 경고 후 기존 동작을 유지한다.
 * 139 데모 마이그레이션 완료 후 dev throw + guardCssAxes block으로 승격.
 *
 * @example
 * // 텍스트 버튼
 * ax({ role: 'control', surface: 'action', content: 'text', tone: 'accent' })
 *
 * // 아이콘 버튼
 * ax({ role: 'control', surface: 'ghost', layout: 'center' })
 *
 * // 툴바
 * ax({ layout: 'bar', cs: 'sm' })
 */
export function ax(axes: Axes): string {
  // 런타임 입력 — 마이그레이션 기간에는 Private 키도 사실상 들어올 수 있다.
  const input = axes as Partial<AxesAll>

  // 1) rolePreset cascade — role × surface × (content|interactive) 기반 Private 주입
  //    cs는 Public 키로 그대로 전달되며 preset 조회 키에는 포함하지 않는다.
  const rolePreset = resolveRolePreset({
    role: input.role,
    surface: input.surface,
    content: input.content,
    interactive: input.interactive,
  })

  // 1b) textStylePreset — textStyle(Public)이 weight/text(Private)를 주입.
  //     textStyle은 role과 직교하므로 별도 테이블로 해석한다.
  //     role preset이 weight/text를 이미 지정한 경우 textStyle preset이 우선하지 않도록
  //     role preset을 뒤에 얹는다(role이 더 구체적).
  const textPreset = resolveTextStylePreset(input.textStyle)
  const preset = { ...textPreset, ...rolePreset }

  // 2) merge — preset을 base로 깔고 input이 덮는다.
  //    마이그레이션 기간: input에 Private 키가 있으면 경고 후 통과.
  if (import.meta.env?.DEV) {
    for (const key in input) {
      if (PRIVATE_KEY_SET.has(key) && !warnedKeys.has(key)) {
        warnedKeys.add(key)
        console.warn(
          `ax() received private key: "${key}". Migrate to role preset or ax.raw().`,
        )
      }
    }
  }
  const merged: Partial<AxesAll> = { ...preset, ...input }

  // 3) className 합성 — prefix-value 공백 구분
  let result = ''
  for (const key in merged) {
    const value = (merged as Record<string, string | undefined>)[key]
    if (value == null) continue
    const prefix = prefixes[key as keyof AxesAll]
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
