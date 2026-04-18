// §1 Private 7축 — rolePreset.ts 와 axRaw.ts 에서만 import.
// ui/ 및 pages/ 에서 직접 import 금지 (guardCssAxes가 import 경로까지 확인).
//
// @removed AxText, AxWeight, AxOpacity, AxState — Private에서 제거 (§1 #4, #5)
// @removed AxPrivate.text/weight/opacity/state 필드 (text 색은 surface+role CSS layer가 자동 파생 — Material on-*)
// @invariant AxPublic 과 키 교집합 공집합 — Public/Private 이름 충돌 금지
// @invariant ui/ 및 pages/ 파일에서 import 시 guardCssAxes가 error
// @invariant 모든 키는 ax.raw() 또는 rolePreset 내부에서만 도달 (§1 #9)

export type AxPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AxGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type AxShape = 'none' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill'

type BorderFull = 'subtle' | 'default' | 'strong' | 'dashed' | 'ring'
type BorderSide = 'bottom' | 'top' | 'start' | 'end'
export type AxBorder = BorderFull | BorderSide

export type AxIcon = 'xs' | 'sm' | 'md' | 'lg'
export type AxSquare = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type AxMotion =
  | 'pulse' | 'spin' | 'fade-in' | 'slide-up'
  | 'fade-slide-in' | 'slide-in' | 'scale-in' | 'blink' | 'shimmer'

/**
 * @invariant 7개 키만 — text/weight/opacity/state 부재
 * @invariant 모든 필드 optional — Partial<AxPrivate>가 rolePreset/axRaw 입출력 타입
 */
export type AxPrivate = {
  padding?: AxPadding
  gap?: AxGap
  shape?: AxShape
  border?: AxBorder
  icon?: AxIcon
  square?: AxSquare
  motion?: AxMotion
}

/**
 * Private 축 키 집합 — 7개. 런타임 guard / prefix map의 SSOT.
 * @invariant keyof AxPrivate 와 1:1 — `as const satisfies ReadonlyArray<keyof AxPrivate>` 강제
 * @invariant guardOsPatterns.mjs / scanOsViolations.mjs / axRaw.ts 가 모두 이 배열을 참조
 */
export const AX_PRIVATE_KEYS = [
  'padding', 'gap', 'shape', 'border', 'icon', 'square', 'motion',
] as const satisfies ReadonlyArray<keyof AxPrivate>
