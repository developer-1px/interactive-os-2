// §1 Public 11축 타입 SSOT — 여기서만 정의, 다른 파일은 import-only.
// LLM 시스템 프롬프트·ui 공개 타입(AriaComponentProps)이 바라보는 유일한 축 집합.
//
// @invariant Private 10축 키(padding/gap/shape/border/icon/square/weight/text/opacity/state/motion) 미포함
// @invariant AriaComponentProps 등 ui 공개 타입은 AxPublic만 import

export type CsScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type AxRole = 'control' | 'control-group' | 'item' | 'badge'
// 확장 후보: | 'field' | 'chip' | 'card' | 'panel'

export type AxSurface =
  | 'action' | 'input' | 'display' | 'overlay' | 'trap'
  | 'ghost' | 'placeholder' | 'sunken' | 'base' | 'raised' | 'inverted'

export type AxTone =
  | 'accent' | 'danger' | 'success' | 'warning' | 'neutral'
  | 'accent-dim' | 'danger-dim' | 'success-dim' | 'warning-dim' | 'neutral-dim'

export type AxTextStyle =
  | 'hero' | 'display' | 'page' | 'section' | 'label'
  | 'body' | 'caption' | 'code' | 'overline'

export type AxContent = 'text' | 'code' | 'bubble' | 'icon'

export type AxLayout =
  | 'row' | 'center' | 'bar' | 'spread' | 'stack' | 'scroll' | 'scroll-x'
  | 'fill' | 'row-fill' | 'wrap'
  | 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-7' | 'table'
  | 'self-start' | 'self-end' | 'self-center'

export type AxPlacement =
  | 'above' | 'below' | 'bottom' | 'bottom-center' | 'center'
  | 'top-start' | 'top-end' | 'viewport' | 'sticky'
  | 'anchor-below' | 'anchor-below-start' | 'anchor-above' | 'anchor-end' | 'anchor-start'
  | 'relative'
  | 'float-top-start' | 'float-top-center' | 'float-bottom-center' | 'float-bottom'

export type AxInteractive = 'item' | 'tab' | 'check' | 'cell' | 'input' | 'button'
export type AxWidth = 'full' | 'auto' | 'fit' | 'sm' | 'md' | 'lg' | 'xl' | 'prose'
export type AxFlex = 'none' | 'auto' | '1'
export type AxClamp = '1' | '2' | '3' | '4' | 'pre' | 'scroll'
export type AxAspect = '1' | 'video' | 'card'
export type AxScroll = 'hidden' | 'y' | 'x' | 'auto'

export type AxPublic = {
  cs?: CsScale
  role?: AxRole
  surface?: AxSurface
  tone?: AxTone
  textStyle?: AxTextStyle
  content?: AxContent
  layout?: AxLayout
  placement?: AxPlacement
  width?: AxWidth
  flex?: AxFlex
  clamp?: AxClamp
  aspect?: AxAspect
  scroll?: AxScroll
  interactive?: AxInteractive
}

/**
 * Public 축 키 집합 — 런타임 assert 및 guard 훅 파생 참조용.
 */
export const AX_PUBLIC_KEYS = [
  'cs', 'role', 'surface', 'tone', 'textStyle', 'content',
  'layout', 'placement', 'width', 'flex', 'clamp', 'aspect', 'scroll', 'interactive',
] as const satisfies ReadonlyArray<keyof AxPublic>
