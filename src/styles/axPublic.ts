// 책임: Public 11축 타입 SSOT — discriminated union by role.
// LLM 시스템 프롬프트·ui 공개 타입(AriaComponentProps)이 바라보는 유일한 축 집합.
//
// @removed AxScroll — Public 축에서 제거. overflow 제어는 AxLayout('scroll'|'scroll-x'|'clip') 흡수 (§1 #6)
// @removed CsScale — Public 축에서 제거. 크기는 textStyle 4-tuple(font-size·cs-h·cs-py·cs-px)이 SSOT (2026-04-19 ax-textstyle-ssot-prd)
// @removed AxText, AxWeight, AxState, AxOpacity — Public에 존재한 적 없으나 @removed 명시 (Private 측 제거 동반)
// @invariant Private 7축 키(padding/gap/shape/border/icon/square/motion) 미포함
// @invariant 외부(ui/, pages/) 공개 타입은 AxPublic만 import — Axes 합성 타입 import 금지

// ── 1) value 단위 열거형 ─────────────────────────────────────────────

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
export type AxClamp = '1' | '2' | '3' | '4' | 'pre'
export type AxAspect = '1' | 'video' | 'card'

// ── 2) role discriminant — 10 브랜치 (metric/signal/placeholder 신규) ─────────
/**
 * @invariant role은 AxPublic discriminated union의 유일 discriminant
 * @invariant 'utility'는 role 키 미지정(key-absence) 시 default 브랜치
 * @invariant 'tip'은 Tooltip 전용 — surface가 SurfaceTip subset으로 잠긴다
 * @invariant 'cell'은 grid 칸 컨테이너 + 내부 control 묶음 역할 — surface가 SurfaceCell subset으로 잠긴다
 * @invariant 'metric'은 숫자 강조 표시 — surface가 SurfaceMetric subset으로 잠긴다 (strictRoles)
 * @invariant 'signal'은 시스템→사용자 알림 — surface가 SurfaceSignal subset으로 잠긴다 (strictRoles)
 * @invariant 'placeholder'는 로딩/Skeleton — surface optional (rolePreset이 motion:shimmer/pulse 공급)
 */
export type AxRole =
  | 'control'
  | 'control-group'
  | 'item'
  | 'cell'       // 신규 — grid 칸 컨테이너 + 내부 control 묶음
  | 'badge'
  | 'utility'   // 신규
  | 'tip'       // 신규 (§2.0 결정)
  | 'metric'    // 신규 — ax-p0-roles-prd — 숫자 강조 표시
  | 'signal'    // 신규 — ax-p0-roles-prd — 시스템→사용자 알림
  | 'placeholder' // 신규 — ax-p0-roles-prd — 로딩/Skeleton

// ── 3) surface 파티션 — 7 subset (role-별 잠금) ──────────────────────
/**
 * @invariant 각 subset은 AxRole 브랜치 1개에 대응 — 외부 export 안 함 (module-local)
 * @invariant SurfaceActionable ∪ … ∪ SurfacePanel = AxSurface (외부 노출 union)
 */
type SurfaceActionable = 'action' | 'ghost' | 'input' | 'placeholder'     // role: 'control'
type SurfaceDisplay    = 'display' | 'ghost' | 'overlay' | 'placeholder'  // 미사용 시 control-group 보조
type SurfaceRow        = 'ghost' | 'display'                               // role: 'item'
type SurfaceCell       = 'display' | 'ghost' | 'input'                     // role: 'cell' (신규)
type SurfaceBadge      = 'display' | 'ghost' | 'overlay' | 'placeholder'  // role: 'badge'
type SurfaceTip        = 'inverted' | 'overlay'                            // role: 'tip'
type SurfacePanel      = 'sunken' | 'base' | 'raised' | 'overlay'          // role: 'control-group'
type SurfaceMetric      = 'display' | 'ghost' | 'sunken'                   // role: 'metric' (신규, ax-p0-roles-prd)
type SurfaceSignal      = 'display' | 'overlay' | 'ghost'                  // role: 'signal' (신규, ax-p0-roles-prd)
type SurfacePlaceholder = 'sunken' | 'ghost' | 'display'                   // role: 'placeholder' (신규, ax-p0-roles-prd)

/** AxSurface — 모든 subset의 union (외부 enumeration용) */
export type AxSurface =
  | SurfaceActionable | SurfaceDisplay | SurfaceRow
  | SurfaceCell                                     // 신규
  | SurfaceBadge | SurfaceTip | SurfacePanel
  | SurfaceMetric | SurfaceSignal | SurfacePlaceholder  // 신규 (ax-p0-roles-prd)

// ── 4) AxPublic — discriminated union by role ─────────────────────────
/**
 * @invariant role 키 부재 → 'utility' 브랜치로 brand (key-absence discriminant)
 * @invariant role: 'utility' 브랜치는 surface/interactive/content/tone 키 자체 부재 (타입 거부)
 * @invariant role 브랜치별 surface는 role-local subset만 허용 (cross-role surface 거부)
 * @invariant role: 'tip' 브랜치는 textStyle을 'caption' | 'label' | 'body'로 잠근다(option)
 * @invariant role: 'control' / 'badge' / 'tip' / 'cell' / 'metric' / 'signal' 브랜치는 surface 필수 — rolePreset 주입 진입점 (strictRoles)
 * @invariant role: 'placeholder' 브랜치는 surface optional — rolePreset이 motion:shimmer/pulse 기본 공급
 * @invariant text/weight/state/opacity/scroll/cs 키는 모든 브랜치에서 부재
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
      clamp?: AxClamp
    }
  // ⑤ cell — grid 칸 컨테이너 + 내부 control 묶음 (신규)
  /**
   * @invariant role:'cell' 브랜치는 surface 필수 — rolePreset 주입 진입점 (strictRoles)
   * @invariant 내부 role:'control'은 cell --cs-h를 --cell-cs로 상속, min-height/shape unset (interactive.css)
   */
  | {
      role: 'cell'
      surface: SurfaceCell
      interactive?: AxInteractive
      content?: AxContent
      tone?: AxTone
      textStyle?: AxTextStyle
      layout?: AxLayout
      width?: AxWidth
      flex?: AxFlex
      clamp?: AxClamp
    }
  // ⑥ 툴팁/오버레이 보조 표면 — 신규
  | {
      role: 'tip'
      surface: SurfaceTip                    // 'inverted' | 'overlay' (필수)
      textStyle?: 'caption' | 'label' | 'body'
      placement: AxPlacement                 // D3 결정: 필수화 (Tooltip.tsx positionAnchor 의존 + 의미적 정합)
      width?: AxWidth
    }
  // ⑦ utility — 레이아웃/타이포 전용 default 브랜치 (role 생략 허용)
  | {
      role?: 'utility'
      // surface/interactive/content/tone 키 자체 부재 (타입 수준 거부)
      textStyle?: AxTextStyle
      layout?: AxLayout
      placement?: AxPlacement
      width?: AxWidth
      flex?: AxFlex
      clamp?: AxClamp
      aspect?: AxAspect
    }
  // ⑧ metric — 숫자 강조 표시 (신규, ax-p0-roles-prd)
  /**
   * @invariant role:'metric' 브랜치는 surface 필수 — rolePreset 주입 진입점 (strictRoles)
   * @invariant layout:'stack' = value/label 세로 / layout:'bar' = 가로 (rolePreset CSS 파생)
   */
  | {
      role: 'metric'
      surface: SurfaceMetric
      tone?: AxTone
      textStyle?: AxTextStyle
      content?: 'text' | 'bubble'
      layout?: AxLayout
      width?: AxWidth
      flex?: AxFlex
    }
  // ⑨ signal — 시스템→사용자 알림 (신규, ax-p0-roles-prd)
  /**
   * @invariant role:'signal' 브랜치는 surface 필수 — rolePreset 주입 진입점 (strictRoles)
   * @invariant interactive:'button'은 dismiss 있을 때만. placement는 toast 시 float-*
   */
  | {
      role: 'signal'
      surface: SurfaceSignal
      tone?: AxTone
      textStyle?: AxTextStyle
      content?: 'text' | 'bubble' | 'icon'
      interactive?: 'button'
      placement?: AxPlacement
      layout?: AxLayout
      width?: AxWidth
    }
  // ⑩ placeholder — 로딩/Skeleton 전용 (신규, ax-p0-roles-prd)
  /**
   * @invariant role:'placeholder' 브랜치는 surface optional — strictRoles 제외
   * @invariant motion은 rolePreset이 shimmer/pulse 자동 공급
   * @invariant aria-hidden="true" DOM 주입은 ui 컴포넌트(Skeleton) 책임
   */
  | {
      role: 'placeholder'
      surface?: SurfacePlaceholder
      layout?: AxLayout
      width?: AxWidth
      aspect?: AxAspect
      flex?: AxFlex
      clamp?: AxClamp
    }

// ── 5) Public 키 enumeration ─────────────────────────────────────────
/** AxPublic 모든 브랜치 키의 union (보조 타입) — 12개 */
export type AxPublicKey =
  | 'role' | 'surface' | 'tone' | 'textStyle' | 'content'
  | 'layout' | 'placement' | 'width' | 'flex' | 'clamp' | 'aspect' | 'interactive'

/**
 * Public 축 키 집합 — 런타임 guard / prefix map / scanOsViolations 파생 참조용.
 * @invariant 'scroll' 미포함 (@removed)
 * @invariant 'cs' 미포함 (@removed — textStyle 4-tuple SSOT)
 * @note discriminated union의 keyof 연산은 브랜치 교집합만 반환하므로
 *       string literal tuple로 명시 (TS 한계 우회).
 */
export const AX_PUBLIC_KEYS = [
  'role', 'surface', 'tone', 'textStyle', 'content',
  'layout', 'placement', 'width', 'flex', 'clamp', 'aspect', 'interactive',
] as const satisfies ReadonlyArray<AxPublicKey>
