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
type Text = 'bright' | 'primary' | 'secondary' | 'muted'
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
  | 'fade-slide-in' | 'slide-in' | 'scale-in' | 'blink' | 'shimmer'
// content: 콘텐츠 유형 — padding의 inline:block 비율 + 레이아웃 어포던스
// text: inline 2:1 (텍스트 버튼, 라벨)
// code: block 0, inline만 (코드 행, diff 행, 테이블 셀)
// bubble: 우측 정렬 말풍선 (채팅, 코멘트) — max-width:80% + margin-left:auto + 비대칭 radius
// diff: 2열 삭제/추가 비교 (grid 2열 + gap:0 + border 구분선)
type Content = 'text' | 'code' | 'bubble' | 'diff'
// scroll: overflow 제어 — 컨테이너 경계 클리핑 또는 스크롤 방향
type Scroll = 'hidden' | 'y' | 'x' | 'auto'
// border: 테두리 — 전체, 단면, 스타일
type Border = 'subtle' | 'default' | 'strong' | 'dashed'
  | 'bottom' | 'top' | 'start' | 'end'
// interactive: 동적 상태 시각 (hover/focus/selected/checked/disabled)
// surface=정적 시각(cursor/border/shadow), interactive=동적 상태 응답
type Interactive = 'item' | 'tab' | 'check' | 'cell' | 'input' | 'button'

// ── 구조 축 ──

// placement: 의도 기반 배치 (position + inset + transform 번들)
type Placement =
  | 'above'         // absolute + bottom:100% + left:0 + right:0 (dropdown upward)
  | 'below'         // absolute + top:100% + left:0 + right:0 (dropdown downward)
  | 'bottom'        // absolute + bottom:0 + left:0 + right:0 (flush bottom edge)
  | 'bottom-center' // absolute + bottom:md + left:50% + translateX(-50%) (floating FAB)
  | 'center'        // absolute + inset:0 + margin:auto (center overlay)
  | 'top-start'     // absolute + top:0 + inset-inline-start:0 (badge)
  | 'viewport'      // fixed + inset:0 (modal backdrop)
  | 'sticky'        // sticky + top:0 + z-index:1 (pinned header)
  | 'anchor-below'  // fixed + position-area:block-end + flip-block (anchor 아래)
  | 'anchor-end'    // fixed + position-area:inline-end + flip-inline (anchor 오른쪽)

// layout: 역할 기반 구조 번들 (display + direction + align + justify + overflow)
type Layout =
  | 'row'     // flex row
  | 'column'  // flex column
  | 'center'  // flex center+center (아이콘 래퍼 등)
  | 'bar'     // flex row + align:center (툴바, 헤더)
  | 'spread'  // flex row + align:center + justify:space-between
  | 'stack'   // flex column (gap은 gap 축에서)
  | 'scroll'  // flex column + overflow-y:auto + min-height:0 (스크롤 패널)
  | 'scroll-x' // flex row + overflow-x:auto + min-width:0 (가로 스크롤)
  | 'fill'    // flex:1 + flex column + overflow:hidden + min-*:0 (패인/분할창 전체 채움)
  // grid (display:grid + equal columns)
  | 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-7'
  // self-alignment (자식이 부모 안에서의 위치 지정)
  | 'self-start'  // align-self: flex-start
  | 'self-end'    // align-self: flex-end
  | 'self-center' // align-self: center

type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type Padding = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Width = 'full' | 'auto' | 'fit' | 'sm' | 'md' | 'lg' | 'xl' | 'prose'
type Flex = 'none' | 'auto' | '1'
// clamp: 콘텐츠 제한 — 줄 수 또는 높이
// '1'~'4': 텍스트 줄 수 제한, 'pre': 코드 공백 보존+1줄 말줄임
// 'scroll': 높이 제한(300px) + overflow-y:auto (disclosure, 코드 프리뷰)
type Clamp = '1' | '2' | '3' | '4' | 'pre' | 'scroll'
// icon: SVG 크기 (width + height)
type Icon = 'xs' | 'sm' | 'md' | 'lg'
// size: 정사각 크기 (width + height) — 비-SVG 요소용 (avatar, dot, swatch 등)
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
// aspect: 종횡비
type Aspect = '1' | 'video' | 'card'

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
  border?: Border
  scroll?: Scroll
  interactive?: Interactive

  // 구조 축
  placement?: Placement
  layout?: Layout
  gap?: Gap
  padding?: Padding
  width?: Width
  flex?: Flex
  clamp?: Clamp
  icon?: Icon
  size?: Size
  aspect?: Aspect
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
  border: 'bd',
  scroll: 'sc',
  interactive: 'ia',
  placement: 'pl',
  layout: 'ly',
  gap: 'g',
  padding: 'pd',
  width: 'w',
  flex: 'fx',
  clamp: 'cl',
  icon: 'ic',
  size: 'sz',
  aspect: 'ar',
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
