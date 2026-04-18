// 책임: Public 11축 타입 SSOT — discriminated union by role.
// LLM 시스템 프롬프트·ui 공개 타입(AriaComponentProps)이 바라보는 유일한 축 집합.
//
// @removed AxScroll — Public 축에서 제거. overflow 제어는 AxLayout('scroll'|'scroll-x'|'clip') 흡수 (§1 #6)
// @removed AxText, AxWeight, AxState, AxOpacity — Public에 존재한 적 없으나 @removed 명시 (Private 측 제거 동반)
// @invariant Private 7축 키(padding/gap/shape/border/icon/square/motion) 미포함
// @invariant 외부(ui/, pages/) 공개 타입은 AxPublic만 import — Axes 합성 타입 import 금지

// ── 1) value 단위 열거형 ─────────────────────────────────────────────
export type CsScale = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type AxTone =
  | 'accent' | 'danger' | 'success' | 'warning' | 'neutral'
  | 'accent-dim' | 'danger-dim' | 'success-dim' | 'warning-dim' | 'neutral-dim'

export type AxTextStyle =
  | 'hero' | 'display' | 'page' | 'section' | 'label'
  | 'body' | 'caption' | 'code' | 'overline'

export type AxContent = 'text' | 'code' | 'bubble' | 'icon'

export type AxInteractive = 'item' | 'tab' | 'check' | 'cell' | 'input' | 'button'

export type AxLayout =
  | 'row' | 'center' | 'bar' | 'spread' | 'stack' | 'scroll' | 'scroll-x' | 'clip'
  | 'fill' | 'row-fill' | 'wrap'
  | 'grid-2' | 'grid-3' | 'grid-4' | 'grid-5' | 'grid-7' | 'table'
  | 'self-start' | 'self-end' | 'self-center'

export type AxPlacement =
  | 'above' | 'below' | 'bottom' | 'bottom-center' | 'center'
  | 'top-start' | 'top-end' | 'viewport' | 'sticky'
  | 'anchor-below' | 'anchor-below-start' | 'anchor-above' | 'anchor-end' | 'anchor-start'
  | 'relative'
  | 'float-top-start' | 'float-top-center' | 'float-bottom-center' | 'float-bottom'

export type AxWidth = 'full' | 'auto' | 'fit' | 'sm' | 'md' | 'lg' | 'xl' | 'prose'
export type AxFlex = 'none' | 'auto' | '1'
export type AxClamp = '1' | '2' | '3' | '4' | 'pre' | 'scroll'
export type AxAspect = '1' | 'video' | 'card'

// ── 2) role discriminant — 6 브랜치 (utility/tip 신규) ───────────────
/**
 * @invariant role은 AxPublic discriminated union의 유일 discriminant
 * @invariant 'utility'는 role 키 미지정(key-absence) 시 default 브랜치
 * @invariant 'tip'은 Tooltip 전용 — surface가 SurfaceTip subset으로 잠긴다
 */
export type AxRole =
  | 'control'
  | 'control-group'
  | 'item'
  | 'badge'
  | 'utility'   // ★신규
  | 'tip'       // ★신규 (§2.0 결정)

// ── 3) surface 파티션 — 6 subset (role-별 잠금) ──────────────────────
/**
 * @invariant 각 subset은 AxRole 브랜치 1개에 대응 — 외부 export 안 함 (module-local)
 * @invariant SurfaceActionable ∪ … ∪ SurfacePanel = AxSurface (외부 노출 union)
 */
type SurfaceActionable = 'action' | 'ghost' | 'input' | 'placeholder'     // role: 'control'
type SurfaceDisplay    = 'display' | 'ghost' | 'overlay' | 'placeholder'  // 미사용 시 control-group 보조
type SurfaceRow        = 'ghost' | 'display'                               // role: 'item'
type SurfaceBadge      = 'display' | 'ghost' | 'overlay' | 'placeholder'  // role: 'badge'
type SurfaceTip        = 'inverted' | 'overlay'                            // role: 'tip'
type SurfacePanel      = 'sunken' | 'base' | 'raised'                      // role: 'control-group'

/** AxSurface — 모든 subset의 union (외부 enumeration용) */
export type AxSurface =
  | SurfaceActionable | SurfaceDisplay | SurfaceRow
  | SurfaceBadge | SurfaceTip | SurfacePanel

// ── 4) AxPublic — discriminated union by role ─────────────────────────
/**
 * @invariant role 키 부재 → 'utility' 브랜치로 brand (key-absence discriminant)
 * @invariant role: 'utility' 브랜치는 surface/interactive/content/tone 키 자체 부재 (타입 거부)
 * @invariant role 브랜치별 surface는 role-local subset만 허용 (cross-role surface 거부)
 * @invariant role: 'tip' 브랜치는 textStyle을 'caption' | 'label' | 'body'로 잠근다(option)
 * @invariant role: 'control' / 'badge' / 'tip' 브랜치는 surface 필수 — rolePreset 주입 진입점
 * @invariant text/weight/state/opacity/scroll 키는 모든 브랜치에서 부재
 */
export type AxPublic =
  // ① 인터랙티브 컨트롤
  | {
      role: 'control'
      surface: SurfaceActionable
      interactive?: AxInteractive
      content?: AxContent
      tone?: AxTone
      textStyle?: AxTextStyle
      cs?: CsScale
      layout?: AxLayout
      placement?: AxPlacement
      width?: AxWidth
      flex?: AxFlex
      clamp?: AxClamp
      aspect?: AxAspect
    }
  // ② 컨트롤 묶음 컨테이너
  | {
      role: 'control-group'
      surface?: SurfacePanel | 'ghost'
      cs?: CsScale
      layout?: AxLayout
      width?: AxWidth
      flex?: AxFlex
      placement?: AxPlacement
    }
  // ③ 리스트/트리/탭 행
  | {
      role: 'item'
      interactive?: AxInteractive
      content?: AxContent
      surface?: SurfaceRow
      tone?: AxTone
      textStyle?: AxTextStyle
      cs?: CsScale
      layout?: AxLayout
      width?: AxWidth
      flex?: AxFlex
      clamp?: AxClamp
      placement?: AxPlacement
    }
  // ④ 뱃지
  | {
      role: 'badge'
      surface: SurfaceBadge
      tone?: AxTone
      content?: AxContent
      interactive?: 'button'                 // dismiss 가능 뱃지 한정
      textStyle?: AxTextStyle
      cs?: CsScale
      clamp?: AxClamp
    }
  // ⑤ 툴팁/오버레이 보조 표면 — ★신규
  | {
      role: 'tip'
      surface: SurfaceTip                    // 'inverted' | 'overlay' (필수)
      textStyle?: 'caption' | 'label' | 'body'
      placement: AxPlacement                 // D3 결정: 필수화 (Tooltip.tsx positionAnchor 의존 + 의미적 정합)
      cs?: CsScale
      width?: AxWidth
    }
  // ⑥ utility — 레이아웃/타이포 전용 default 브랜치 (role 생략 허용)
  | {
      role?: 'utility'
      // surface/interactive/content/tone 키 자체 부재 (타입 수준 거부)
      textStyle?: AxTextStyle
      cs?: CsScale
      layout?: AxLayout
      placement?: AxPlacement
      width?: AxWidth
      flex?: AxFlex
      clamp?: AxClamp
      aspect?: AxAspect
    }

// ── 5) Public 키 enumeration ─────────────────────────────────────────
/** AxPublic 모든 브랜치 키의 union (보조 타입) — 13개 */
export type AxPublicKey =
  | 'cs' | 'role' | 'surface' | 'tone' | 'textStyle' | 'content'
  | 'layout' | 'placement' | 'width' | 'flex' | 'clamp' | 'aspect' | 'interactive'

/**
 * Public 축 키 집합 — 런타임 guard / prefix map / scanOsViolations 파생 참조용.
 * @invariant 'scroll' 미포함 (@removed)
 * @note discriminated union의 keyof 연산은 브랜치 교집합만 반환하므로
 *       string literal tuple로 명시 (TS 한계 우회).
 */
export const AX_PUBLIC_KEYS = [
  'cs', 'role', 'surface', 'tone', 'textStyle', 'content',
  'layout', 'placement', 'width', 'flex', 'clamp', 'aspect', 'interactive',
] as const satisfies ReadonlyArray<AxPublicKey>
