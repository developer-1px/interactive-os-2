// §1 Private 10축 — rolePreset.ts 와 axRaw.ts 에서만 import.
// ui/ 및 pages/ 에서 직접 import 금지 (guardCssAxes가 import 경로까지 확인).
//
// @invariant AxPublic 과 키 교집합 공집합 — Public/Private 이름 충돌 금지
// @invariant ui/ 및 pages/ 파일에서 import 시 guardCssAxes가 error

export type AxPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type AxGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type AxShape = 'none' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill'

type BorderFull = 'subtle' | 'default' | 'strong' | 'dashed' | 'ring'
type BorderSide = 'bottom' | 'top' | 'start' | 'end'
export type AxBorder = BorderFull | BorderSide

export type AxIcon = 'xs' | 'sm' | 'md' | 'lg'
export type AxSquare = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type AxWeight = 'medium' | 'semi' | 'bold'
export type AxText = 'bright' | 'primary' | 'secondary' | 'muted'
export type AxOpacity = 'dim' | 'faint' | 'hidden'
export type AxState = 'focused' | 'selected'
export type AxMotion =
  | 'pulse' | 'spin' | 'fade-in' | 'slide-up'
  | 'fade-slide-in' | 'slide-in' | 'scale-in' | 'blink' | 'shimmer'

export type AxPrivate = {
  padding?: AxPadding
  gap?: AxGap
  shape?: AxShape
  border?: AxBorder
  icon?: AxIcon
  square?: AxSquare
  weight?: AxWeight
  text?: AxText
  opacity?: AxOpacity
  state?: AxState
  motion?: AxMotion
}

/**
 * Private 축 키 집합 — 런타임 assert 및 guard 훅 파생 참조용.
 * @invariant guardCssAxes.mjs의 하드코딩 리스트와 동기 (axPrivate.ts가 SSOT)
 */
export const AX_PRIVATE_KEYS = [
  'padding', 'gap', 'shape', 'border', 'icon', 'square',
  'weight', 'text', 'opacity', 'state', 'motion',
] as const satisfies ReadonlyArray<keyof AxPrivate>
