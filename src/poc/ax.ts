// ── MECE Axis Design System — 순수 TypeScript ──
//
// ax()만 사용. style={} 금지.
// 시각 5축 + 구조 5축 = 10축. 이게 전부.

// ── 시각 축 ──

type Surface = 'action' | 'input' | 'display' | 'overlay' | 'ghost'
type ControlSize = 'sm' | 'md' | 'lg'
type TextStyle = 'hero' | 'display' | 'page' | 'section' | 'label' | 'body' | 'caption' | 'code'
type Tone = 'accent' | 'danger' | 'success' | 'warning' | 'neutral'
type Text = 'bright' | 'primary' | 'secondary' | 'muted'

// ── 구조 축 ──

// layout: 역할 기반 구조 번들 (display + direction + align + justify + overflow)
type Layout =
  | 'row'     // flex row
  | 'column'  // flex column
  | 'center'  // flex center+center (아이콘 래퍼 등)
  | 'bar'     // flex row + align:center (툴바, 헤더)
  | 'spread'  // flex row + align:center + justify:space-between
  | 'stack'   // flex column (gap은 gap 축에서)
  | 'scroll'  // flex column + overflow:auto

type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Padding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Width = 'full' | 'auto' | 'fit' | 'sm' | 'md' | 'lg'
type Flex = 'none' | 'auto' | '1'

export interface Axes {
  // 시각 축
  surface?: Surface
  controlSize?: ControlSize
  textStyle?: TextStyle
  tone?: Tone
  text?: Text

  // 구조 축
  layout?: Layout
  gap?: Gap
  padding?: Padding
  width?: Width
  flex?: Flex
}

// ── className 매핑 ──

const prefixes: Record<keyof Axes, string> = {
  surface: 'sf',
  controlSize: 'cs',
  textStyle: 'ts',
  tone: 'tn',
  text: 'tx',
  layout: 'ly',
  gap: 'g',
  padding: 'pd',
  width: 'w',
  flex: 'fx',
}

/**
 * 축 값을 className 문자열로 변환한다.
 * style={} 대신 이것만 사용한다.
 *
 * @example
 * // 버튼: controlSize가 display+align+justify 소유
 * ax({ surface: 'action', controlSize: 'md', tone: 'accent' })
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
