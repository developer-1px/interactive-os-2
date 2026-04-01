// ── MECE Axis Design System — 순수 TypeScript ──
//
// ax()만 사용. style={} 금지.
// 시각도 구조도 전부 축 값으로만 표현한다.

// ── 축 타입 정의 ──

// 시각 축
type Surface = 'action' | 'input' | 'display' | 'overlay' | 'ghost'
type ControlSize = 'sm' | 'md' | 'lg'
type Interaction = 'input' | 'nav' | 'action'
type Tone = 'primary' | 'destructive' | 'success' | 'warning' | 'neutral'
type Proximity = 'inline' | 'element' | 'group' | 'section' | 'page'
type TextStyle = 'hero' | 'display' | 'page' | 'section' | 'label' | 'body' | 'caption' | 'code'
type TextColor = 'bright' | 'primary' | 'secondary' | 'muted'

// 구조 축
type Layout = 'row' | 'column' | 'grid' | 'center'
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
type Justify = 'start' | 'center' | 'end' | 'between'
type Padding = 'none' | 'inline' | 'element' | 'group' | 'section' | 'page'
type Width = 'full' | 'auto' | 'fit' | 'sm' | 'md' | 'lg'
type Overflow = 'hidden' | 'auto' | 'scroll'
type Position = 'relative' | 'absolute' | 'fixed' | 'sticky'
type Flex = 'none' | 'auto' | '1'

export interface Axes {
  // 시각 축
  surface?: Surface
  controlSize?: ControlSize
  interaction?: Interaction
  tone?: Tone
  proximity?: Proximity
  textStyle?: TextStyle
  text?: TextColor

  // 구조 축
  layout?: Layout
  align?: Align
  justify?: Justify
  padding?: Padding
  width?: Width
  overflow?: Overflow
  position?: Position
  flex?: Flex
}

// ── className 매핑 ──

const prefixes: Record<keyof Axes, string> = {
  // 시각
  surface: 'sf',
  controlSize: 'cs',
  interaction: 'ix',
  tone: 'tn',
  proximity: 'px',
  textStyle: 'ts',
  text: 'tx',
  // 구조
  layout: 'ly',
  align: 'al',
  justify: 'jc',
  padding: 'pd',
  width: 'w',
  overflow: 'of',
  position: 'ps',
  flex: 'fx',
}

/**
 * 축 값을 className 문자열로 변환한다.
 * style={} 대신 이것만 사용한다.
 *
 * @example
 * // 버튼
 * ax({ surface: 'action', controlSize: 'md', tone: 'primary', proximity: 'inline' })
 *
 * // 레이아웃 컨테이너
 * ax({ layout: 'column', proximity: 'page', padding: 'section' })
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
