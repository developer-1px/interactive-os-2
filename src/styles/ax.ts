// ── MECE Axis Design System — 순수 TypeScript ──
//
// ax()만 사용. style={} 금지.
// 시각 축 + 구조 축. 이게 전부.

// ── 시각 축 ──

type Surface = 'action' | 'input' | 'display' | 'overlay' | 'ghost' | 'placeholder' | 'sunken' | 'base'
type ControlSize = 'sm' | 'md' | 'lg'
type TextStyle = 'hero' | 'display' | 'page' | 'section' | 'label' | 'body' | 'caption' | 'code' | 'overline'
type Tone = 'accent' | 'danger' | 'success' | 'warning' | 'neutral'
  | 'accent-dim' | 'danger-dim' | 'success-dim' | 'warning-dim' | 'neutral-dim'
type Text = 'bright' | 'primary' | 'secondary' | 'muted' | 'accent' | 'danger' | 'success' | 'warning'
// shape: 비-컨트롤 요소의 border-radius (컨트롤은 controlSize가 소유)
type Shape = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'pill'

// weight: textStyle weight와 독립적인 오버라이드
type Weight = 'medium' | 'semi' | 'bold'
// state: surface 조립식 확장 — focused/selected 상태 시각
type State = 'focused' | 'selected'
// opacity: 비-disabled 시각적 약화 (disabled는 surface 소관)
type Opacity = 'dim' | 'faint' | 'hidden'
// motion: 반복 애니메이션 (transition은 surface 소유, motion은 반복/진입)
type Motion = 'pulse' | 'spin' | 'fade-in' | 'slide-up'
// content: 콘텐츠 유형 — padding의 inline:block 비율을 결정 (text=2:1)
type Content = 'text'

// ── 구조 축 ──

// layout: 역할 기반 구조 번들 (display + direction + align + justify + overflow)
type Layout =
  | 'row'     // flex row
  | 'column'  // flex column
  | 'center'  // flex center+center (아이콘 래퍼 등)
  | 'bar'     // flex row + align:center (툴바, 헤더)
  | 'spread'  // flex row + align:center + justify:space-between
  | 'stack'   // flex column (gap은 gap 축에서)
  | 'scroll'  // flex column + overflow-y:auto + min-height:0 (스크롤 패널)
  | 'fill'    // flex:1 + flex column + overflow:hidden + min-*:0 (패인/분할창 전체 채움)
  // self-alignment (자식이 부모 안에서의 위치 지정)
  | 'self-start'  // align-self: flex-start
  | 'self-end'    // align-self: flex-end
  | 'self-center' // align-self: center

type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type Padding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Width = 'full' | 'auto' | 'fit' | 'sm' | 'md' | 'lg'
type Flex = 'none' | 'auto' | '1'
// clamp: 텍스트 줄 수 제한 ('1'=nowrap+ellipsis, '2'~'4'=line-clamp)
type Clamp = '1' | '2' | '3' | '4'
// icon: SVG 크기 (width + height)
type Icon = 'xs' | 'sm' | 'md' | 'lg'

export interface Axes {
  // 시각 축
  surface?: Surface
  controlSize?: ControlSize
  textStyle?: TextStyle
  tone?: Tone
  text?: Text
  weight?: Weight
  state?: State
  opacity?: Opacity
  shape?: Shape
  motion?: Motion
  content?: Content

  // 구조 축
  layout?: Layout
  gap?: Gap
  padding?: Padding
  width?: Width
  flex?: Flex
  clamp?: Clamp
  icon?: Icon
}

// ── className 매핑 ──

const prefixes: Record<keyof Axes, string> = {
  surface: 'sf',
  controlSize: 'cs',
  textStyle: 'ts',
  tone: 'tn',
  text: 'tx',
  weight: 'wt',
  state: 'st',
  opacity: 'op',
  shape: 'sh',
  motion: 'mo',
  content: 'ct',
  layout: 'ly',
  gap: 'g',
  padding: 'pd',
  width: 'w',
  flex: 'fx',
  clamp: 'cl',
  icon: 'ic',
}

/**
 * 축 값을 className 문자열로 변환한다.
 * style={} 대신 이것만 사용한다.
 *
 * @example
 * // 텍스트 버튼: padding + content:'text'로 2:1 inline 비율
 * ax({ surface: 'action', controlSize: 'md', padding: 'sm', content: 'text', tone: 'accent' })
 *
 * // 아이콘 버튼: cs의 min-width=min-height로 정사각
 * ax({ surface: 'ghost', controlSize: 'md', layout: 'center' })
 *
 * // 툴바: bar = flex row + align:center
 * ax({ layout: 'bar', gap: 'sm' })
 *
 * // 텍스트
 * ax({ textStyle: 'body', text: 'secondary' })
 */
export function ax(axes: Axes): string {
  let result = ''
  for (const key in axes) {
    const value = axes[key as keyof Axes]
    if (value != null) {
      if (result) result += ' '
      result += `${prefixes[key as keyof Axes]}-${value}`
    }
  }
  return result
}
