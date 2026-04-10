# ax() Pit of Success 불변량 — PRD

> Discussion: ax() 축 간 관계(불변량)가 없어서 조합이 깨질 수 있다. 페어링/레벨/시드 3가지 불변량을 도입하여 어떤 조합도 안전한 시스템을 만든다.

## ① 동기

### WHY

- **Impact**: ax()로 tone+surface를 조합할 때, sf-action 외 8개 surface에서 전경색(--_fg)이 소비되지 않아 contrast가 깨진다. 실제 8곳(Alert, Toaster, ChatFeed, ChatPane 등)에서 tone+non-action 조합이 사용 중이며 잠재 버그.
- **Forces**: ax()의 12축이 독립 직교로 설계되어 자유도가 높지만, 디자인에서 자유도는 위험. shadcn(페어링), Linear(레벨 물리학)는 관계를 잠가서 pit of success 달성.
- **Decision**: ax() API는 유지하되 CSS 레이어에서 3가지 관계를 강제. 원자 단위 재정의(B안)는 마이그레이션 비용이 높아 기각.
- **Non-Goals**: ax() 함수 시그니처 변경, JS 런타임 계산, 라이트 테마 (이후 별도)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | tone: 'accent' + surface: 'display' | 렌더링 | 파란 배경 위 흰 글씨 (contrast 자동 보장) | |
| S2 | tone: 'danger' + surface: 'overlay' | 토스트 표시 | 빨간 배경 위 흰 글씨 + hover=한단계 밝음 | |
| S3 | surface: 'display' (tone 없음) | 렌더링 | 기존과 동일 (inherit fallback) | |
| S4 | --radius-seed: 0.75rem으로 변경 | 전체 UI | 모든 컴포넌트 radius가 비율 유지하며 커짐 | |
| S5 | sf-ghost + tx-secondary 병용 | 렌더링 | tx-secondary 색이 우선 (specificity tx > sf) | |
| S6 | sf-overlay 내부 아이템 hover | hover | depth 레벨+1 색상 자동 적용 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ax.css` surface 수정 | sf-display/input/overlay/trap/sunken/base/ghost에 `color: var(--_fg, inherit)` 추가 | |
| `tokens.css` depth 5단계 | `--level-0`~`--level-4` + 각 레벨의 hover/active/selection 자동 파생 토큰 | |
| `tokens.css` radius 시드 | `--radius-seed` 1개 + 비율 파생 `--shape-*-radius` 재정의 | |
| `ax.css` recipe radius | 하드코딩된 border-radius를 `var(--shape-*)` 토큰으로 교체 | |
| `tokens.css` 누락 토큰 | 4px(`--shape-2xs-radius`), 8px(`--shape-sm-radius` 재정의) 추가 | |

완성도: 🟢

## ③ 인터페이스

### Phase 1: 페어링

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `ax({ tone: 'accent', surface: 'display' })` | sf-display에 color 없음 → fg=inherit | surface가 `color: var(--_fg, inherit)` 소비 | tone이 `--_fg: var(--tone-primary-foreground)` 주입, surface가 소비 → 페어링 완성 | fg=흰색 (contrast 보장) | |
| `ax({ surface: 'display' })` (tone 없음) | sf-display에 color 없음 → fg=inherit | surface가 `color: var(--_fg, inherit)` 소비 | `--_fg` 미주입 → fallback `inherit` → 부모 색 상속 | 기존과 동일 | |
| `ax({ tone: 'accent', surface: 'display', text: 'secondary' })` | tx-secondary가 color 선언 | tx-가 sf-보다 뒤에 선언 (same layer, same specificity) | 소스 순서에서 tx-가 이김 | tx-secondary 색이 우선 | |
| `:where(.tn-accent)` 독립 텍스트 + surface 추가 | :where() specificity=0 | surface의 color(0,1,0)가 이김 | :where()는 specificity를 0으로 만듦 | surface의 --_fg가 우선. tone 독립 텍스트 색은 덮임 | |

### Phase 2: 레벨 스케일

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| sf-sunken 내부 아이템 hover | `--bg-hover: var(--depth-sunken-hover)` | hover시 background: var(--bg-hover) | depth가 sunken(level-0) → hover=level-1 색 자동 | 한 단계 밝은 배경 | |
| sf-overlay 내부 아이템 hover | `--bg-hover: var(--depth-overlay-hover)` | 동일 | depth가 overlay(level-3) → hover=level-4 색 자동 | 한 단계 밝은 배경 | |

### Phase 3: 시드 파생

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `--radius-seed: 8px` (기본) | shape 토큰이 하드코딩 | 비율 calc()로 자동 파생 | `--shape-sm-radius: calc(seed * 0.75)` = 6px | 현재와 동일한 값 | |
| `--radius-seed: 12px` (변경) | seed 변경 | 비율 calc()로 자동 파생 | `--shape-sm-radius: calc(12 * 0.75)` = 9px | 전체 radius가 비율 유지하며 커짐 | |
| pill/circle | `border-radius: 9999px` / `50%` | seed와 무관 | 형태 의도가 고정 (원형/pill) | 시드 영향 없음 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| tone 없이 모든 surface 사용 | --_fg 미주입 | fallback inherit이 기존 동작 보존 | 시각 변화 zero | 기존 동일 | |
| tone + sf-placeholder | sf-placeholder는 `color: var(--text-muted)` 하드코딩 | placeholder의 muted 색은 의미적으로 고정 | --_fg보다 하드코딩이 우선 (같은 클래스 내 후선언) | sf-placeholder 색 유지 | |
| depth level-4에서 hover | 최상위 레벨, +1 불가 | 최대 레벨은 자기 자신 유지 또는 미세 밝기 변화 | hover=level-4 자체 (또는 +alpha) | 시각적 피드백 유지 | |
| --radius-seed: 0 | 모든 radius가 0 | calc(0 * ratio) = 0 | 전체 sharp edge. pill(9999px)만 유지 | 일관된 sharp 테마 | |
| --radius-seed: 24px | 과도한 radius | calc(24 * ratio)로 전부 둥글어짐 | 과도하지만 비율은 유지. 깨지진 않음 | 둥근 테마 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | `--_fg` 소유권: L6(tone Variant)이 값 선언, surface가 소비 (DESIGN.md §3) | Phase 1 | **주의** | tone이 `--_fg`를 **주입**(선언), surface가 `color:`로 **소비**. 소유권은 tone 유지, surface는 소비만. 위반 아님 | |
| 2 | surface 소유 속성에 module.css last-mile 금지 (feedback_surface_no_lastmile) | Phase 1 | 미위반 | `color: var(--_fg, inherit)`은 ax.css 내 추가. module.css 아님 | |
| 3 | @layer cascade 잠금: state > component (feedback_css_layer_lock) | Phase 1 | 미위반 | surface는 이미 `@layer state` 내. 추가도 같은 layer | |
| 4 | accent 예산 1채널 (feedback_accent_budget) | Phase 2 | 미위반 | 레벨 스케일은 neutral stone 기반. accent 토큰 소비 안 함 | |
| 5 | chroma ladder: selection=stone (feedback_chroma_ladder) | Phase 2 | 미위반 | depth level = stone ladder 활용. chroma=0 유지 | |
| 6 | ax() 축은 의도/역할 기준 (feedback_ax_semantic_not_css) | Phase 2 | **주의** | depth를 숫자(0~4)로 노출하면 CSS 속성화. → 기존 어휘(sunken/base/raised/overlay) 유지, 내부적으로만 level 매핑 | |
| 7 | depth 4종: sunken/base/raised/overlay (DESIGN.md) | Phase 2 | **수정 필요** | 5단계 중 5번째 = `prominent` 추가. DESIGN.md 매트릭스 갱신 | |
| 8 | 구조 잠금, 색만 개방 (project_ax_shadcn_insight) | Phase 3 | 미위반 | seed 기본값 고정, override만 허용. 기본=잠금 유지 | |
| 9 | cs=크기급만, padding은 pd축 (feedback_cs_padding_content) | Phase 3 | 미위반 | radius seed는 radius만 파생. padding 미포함 | |
| 10 | 3층 색상: tone h/c → fg 자동파생 (feedback_3layer_color_system) | Phase 1 | **겹침** | oklch 자동파생이 미래 구현이면 `--_fg`를 tone이 oklch에서 계산하여 주입하는 구조로 확장 가능. 현재는 수동 토큰이므로 충돌 없음 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `:where(.tn-accent)` 독립 텍스트 + surface 병용 | surface의 `color: var(--_fg)`가 :where() tone 색을 덮음 | 중 | tone 독립 텍스트가 필요한 곳은 tone 없이 tx- 축 사용으로 전환. grep으로 사전 파악 | |
| 2 | sf-placeholder의 `color: var(--text-muted)` | 페어링 추가 시 --_fg inherit과 하드코딩이 공존 | 저 | sf-placeholder는 예외로 두고 --_fg 추가 안 함 (이미 의미적 고정 색) | |
| 3 | DESIGN.md depth 매트릭스 | 5단계 도입 시 문서 갱신 필요 | 저 | prominent 추가 후 매트릭스 갱신 | |
| 4 | app.css L185 `--bg-hover: var(--depth-raised-hover)` | depth 토큰 네이밍 변경 시 참조 깨짐 | 저 | 새 토큰명으로 교체 | |
| 5 | rc-item `border-radius: 4px`, rc-container-sm `8px` | 토큰 없는 값이 시드 파생에서 누락 | 중 | 4px=`--shape-2xs-radius`, 8px 재정의로 토큰 추가 | |
| 6 | cs-md `8px` vs shape-md-radius `10px` 불일치 | 시드 파생 시 어느 값이 맞는지 결정 필요 | 중 | recipe가 cs를 대체하므로 recipe 기준으로 통일. cs는 레거시 | |

완성도: 🟡 (75% — #1 :where(tn-) 덮임 사례를 실제 grep으로 확인 필요)

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | depth를 숫자(0~4)로 ax() API에 노출 | ⑤#6 ax 의미적 어휘 | 축은 역할 기준이어야. 숫자는 내부 매핑만 | |
| 2 | sf-placeholder에 --_fg 추가 | ⑥#2 하드코딩 의미색 | placeholder의 muted 색은 의도적 고정 | |
| 3 | radius seed가 padding까지 파생 | ⑤#9 cs/pd 축 분리 | padding은 layout 유형이 결정. radius와 무관 | |
| 4 | module.css에서 surface color override | ⑤#2 surface_no_lastmile | surface 소유 속성은 ax.css에서만 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | `ax({ tone: 'accent', surface: 'display' })` 렌더링 | 파란 배경 + 흰 글씨 | |
| V2 | S2 | `ax({ tone: 'danger', surface: 'overlay' })` 토스트 | 빨간 배경 + 흰 글씨 | |
| V3 | S3 | `ax({ surface: 'display' })` tone 없이 | 기존과 시각 변화 zero | |
| V4 | S5 | `ax({ tone: 'accent', surface: 'ghost', text: 'secondary' })` | tx-secondary 색 우선 | |
| V5 | S4 | `--radius-seed` 변경 후 전체 UI | 모든 radius 비율 유지 | |
| V6 | S6 | sf-overlay 내부 아이템 hover | depth+1 색상 | |
| V7 | 경계 | `--radius-seed: 0` → 전체 sharp | pill(9999px)만 둥글게 유지 | |
| V8 | 경계 | tone 없는 기존 컴포넌트 139개 | 시각 변화 zero | |
| V9 | ⑥#1 | `:where(.tn-accent)` + surface 병용 | surface --_fg가 이김 (의도적) | |

완성도: 🟢

---

**전체 완성도:** 🟢 7/8 (⑥만 🟡 — :where(tn-) 사례 실측 미확인)

## 실행 순서

1. **Phase 1 (페어링)**: ax.css surface 8곳에 `color: var(--_fg, inherit)` 추가. sf-placeholder 제외.
2. **Phase 2 (레벨)**: tokens.css에 5단계 레벨 토큰 + depth surface가 레벨 매핑. DESIGN.md 갱신.
3. **Phase 3 (시드)**: tokens.css에 `--radius-seed` + calc 파생. ax.css recipe/cs 하드코딩 교체. 4px/8px 토큰 추가.
