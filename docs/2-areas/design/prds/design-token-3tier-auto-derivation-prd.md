# 디자인 토큰 3티어 자동 파생 — PRD

> Discussion: list/tree selection이 raised로 안 보이는 문제를 추적하다, 토큰 시스템이 손 매핑 2티어(palette → role)인 게 근본 원인임을 확인. 자동 파생 3티어(palette → semantic elev → role)로 재배선.

## ① 동기

### WHY

- **Impact**: 컴포넌트 작성자/리뷰어. selection이 raised로 안 보이거나 context가 사라지는 시각 버그가 발생해도 원인 추적이 어려움. depth-base-sel-context = surface bg = stone-850 처럼 손 매핑 표에 구조적 모순이 박혀있어도 못 잡음.
- **Forces**: ① 4 surface × 5 state × 2 theme = 40개 매핑을 손으로 관리해야 함. ② 원칙(chroma ladder, accent budget)은 단단한데 적용 메커니즘이 raw 값(stone-750) 직접 참조라 원칙↔구현 정합성이 깨짐. ③ Firefox/구 Safari가 OKLCH `from`을 미지원 → 정석을 그대로 못 씀.
- **Assets**:
  - 내부: `src/styles/tokens.css`, `palette.css`, `ax.css` (이미 3-layer 구조 흉내), `surface` 축, `pnpm score:design`/`score:design-visual`
  - 외부: CSS Color Module Level 5 `from` 문법, Radix Colors 12-step semantic scale 모델
- **Decision**: palette → semantic elev step(`--elev-step-N`) → role(`--selection`, `--bg-hover`) 3티어로 재배선. 자동 파생은 OKLCH `from` 단독. 최신 방식 채택, browserslist는 `from` 지원 브라우저로 좁힘. 기각 대안: ① 손 매핑 유지(원인 못 잡음) ② `@supports` fallback(복잡도 ↑, 점진 비용 ↑).
- **Non-Goals**:
  - palette(stone scale) 자체 재정의 안 함
  - accent/brand/sys 색상 토큰 재구조화 안 함 (별도 PRD)
  - light theme 색감 자체 변경 안 함 (구조만 통일)
  - 시각 회귀 0%는 보장 안 함 — 의도된 raised 강화는 변화를 만든다

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | base surface 위의 ListBox | 한 항목을 select | bg가 명확히 *raised*로 인지됨 (위로 들림), sunken으로 오인 0 | |
| 2 | grid row context (커서 행) | 행 위에 cursor 있을 때 | 주변과 구분되는 약한 highlight, surface bg와 절대 동일 X | |
| 3 | 새 컴포넌트 작성자 | `var(--selection)`을 사용 | 어떤 surface에 놓이든 자동으로 그 surface의 +Δelev로 파생됨, 손 매핑 0 | |
| 4 | 리뷰어 | grep으로 `--stone-`, `--depth-` 직접 참조 검사 | role/recipe/component 레이어에 직접 참조 0건 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/styles/tokens.css` 재구성 | palette layer는 그대로, semantic elev tier 신설(`--elev-step-N`), role tier(`--selection`, `--bg-hover`, `--selection-context`, `--selection-cursor`)는 elev step 함수로 파생 | |
| `--depth-{surface}-{state}` 토큰 폐지 | 40개 손 매핑 토큰 제거. surface별 분기는 surface 자신이 base elev를 잡고, role이 +Δ로 자동 따라감 | |
| `package.json` browserslist 명시 | OKLCH `from` 지원 브라우저로 타깃 좁힘 (Chrome 130+, Safari 16.4+, Firefox 128+) | |
| 위반 스캐너 | role/recipe/component 레이어 css에서 `--stone-`, `--depth-`, raw oklch 직접 참조 검출. `pnpm check:tokens` 추가 또는 기존 score:design 확장 | |
| `feedback_chroma_ladder` 메모리 갱신 | stone-750/700/650 raw 표 → elev step 표로 교체 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 컴포넌트가 `var(--selection)` 사용, surface=base | base surface 활성 | role 토큰 평가 | role은 `--elev-step-2` 참조, base context의 `--elev-base` 위에서 `oklch(from --elev-base calc(l + 0.07) c h)`로 파생 | base bg 대비 약 +7% L의 raised bg | |
| 동일 컴포넌트, surface=raised | raised surface 활성 | 같은 role 토큰 평가 | raised context의 `--elev-base`가 더 밝아진 상태 → 같은 +Δ 함수가 더 밝은 결과 산출 | raised bg 대비 +Δ의 더 raised bg | |
| 컴포넌트가 `var(--selection-context)` | 어떤 surface든 | 평가 | `--elev-step-1`(약 +3% L) 적용 | bg와 명확히 구분되는 subtle highlight | |
| role 토큰을 module.css에서 직접 hardcode 시도 | 위반 코드 | 스캐너 실행 | `--stone-`/`--depth-` 직접 참조 발견 | CI/lint 실패, 위반 위치 보고 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| sunken surface (가장 어두운 base) 위 selection | 정의됨 | sunken에서도 raised 메타포 유지: 더 밝아져야 함 | `--elev-base = stone-900`, +Δ → stone-850 근처. surface bg와 동일 X | 시각적 raised 인지 가능 | |
| overlay surface (가장 밝은 dark base) 위 selection | 정의됨 | overlay에서 +Δ가 너무 밝으면 흰색 포화. 함수에 L 상한 clamp 필요 | `clamp(l, 0, 0.95)` 등으로 안전하게 | 포화 없이 raised | |
| light theme | dark와 별도 분기 존재 | light는 빛이 위에서 와도 selection은 *darker*가 raised 메타포(흰 종이 위 카드는 그림자로 떠 보임). dark/light는 함수의 부호가 반대 | dark: `+Δ`, light: `-Δ` (또는 contrast aware) | 양 theme 모두 raised로 인지 | |
| context = bg 회귀 | 현재 진짜 버그 | 함수가 `+Δ ≥ 1 step`을 강제 → 0이 될 수 없음 | `step-1`이 정의상 step-0보다 항상 다름 | 구조적으로 불가능 | |
| `from` 함수가 nested chain | CSS Color 5 사양 허용 | role(elev) → elev(palette) 두 단계 chain 안전 | 평가 가능 | 정상 파생 | |
| 디자인 점수 회귀 | score:design-visual로 측정 | raised 강화는 의도된 변화. 회귀 ≠ 즉시 fail. baseline 갱신 가능 | 점수 변동 보고 + 사용자 승인 후 baseline 갱신 | 새 baseline | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 자동 파생 = 시스템 (feedback_auto_derivation_is_system) | ②③ | ✅ 핵심 동력 | — | |
| 2 | Chroma ladder selection=neutral (feedback_chroma_ladder) | ② | 🟡 기존 stone-750 raw 표 사용 → 갱신 | ⑦에 raw 값 hardcode 금지 추가, memory 파일 갱신 | |
| 3 | Accent budget (feedback_accent_budget) | ③ | ✅ selection은 여전히 stone elev, accent 미사용 | — | |
| 4 | 3-layer color system sys/brand/tone (feedback_3layer_color_system) | ② | ✅ 본 PRD는 elev 축, 색상 축은 별도. 충돌 X | — | |
| 5 | Style is hatch / ax만 사용 (feedback_style_is_hatch) | ③ | ✅ tokens는 ax 통해서만 소비됨 | — | |
| 6 | CSS layer lock (feedback_css_layer_lock) | ② | ✅ tokens는 `tokens` layer, role 파생도 동일 layer | — | |
| 7 | Surface no last-mile (feedback_surface_no_lastmile) | ② | ✅ surface가 elev base를 소유, role은 자동 따라감 | — | |
| 8 | Harness convergence (feedback_harness_convergence) | ② | ✅ 위반 스캐너로 점진 수렴 | — | |
| 9 | Fix root not symptom (feedback_fix_root_not_symptom) | ① | ✅ 시각 버그의 root는 토큰 구조 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | 19개 css 파일의 토큰 참조 (tokens 86건, stone 98건 등) | role tier(--selection 등)는 호환성 유지로 무영향. depth-* raw 토큰 폐지로 깨지는 곳 존재 가능 | 중 | 폐지 토큰을 알리어스로 전환(deprecated) → 1 사이클 grace → 제거 | |
| 2 | 시각 회귀 (score:design-visual baseline) | 의도된 raised 강화로 selection bg가 1~3% 밝아짐 | 중 | 사용자 시각 검수 후 baseline 갱신 | |
| 3 | OKLCH `from` 미지원 환경 (iOS Safari <16.4 등) | 해당 브라우저 사용자는 깨진 토큰 → 사실상 차단 | 중 | browserslist를 `from` 지원 브라우저로 좁힘. 사용자 결정: 최신 방식 채택. | |
| 4 | light theme 분기 | dark와 부호 반대 함수 적용 → 색감 변동 가능 | 중 | light/dark 각각 시각 검수 | |
| 5 | feedback_chroma_ladder 메모리 (stone-750 raw 표) | stale → 새 컨벤션과 충돌 | 저 | 메모리 즉시 갱신, raw 표 → elev step 표 | |
| 6 | 외부 도구가 토큰 이름 의존 | depth-* 토큰명 폐지 | 저 | grep 결과상 외부 의존 없음 (스타일 외부 0건) | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | role/recipe/component css에서 `--stone-*` 직접 참조 | ⑤-1, ① | 3티어 깨짐, 자동 파생 무력화 | |
| 2 | role/recipe/component css에서 `--depth-*` 직접 참조 | ⑤-1 | depth-* 토큰 폐지 대상 | |
| 3 | tokens.css 외부에서 raw `oklch(...)` 리터럴 사용 | ⑤-1, ⑤-5 | semantic 우회 | |
| 4 | `--selection`을 accent 색으로 매핑 | ⑤-3 (chroma ladder, accent budget) | selection은 neutral elev | |
| 5 | 손 매핑 테이블 부활 | ⑤-1 (자동 파생) | 시스템의 본질 위배 | |
| 6 | 시각 회귀 발견 시 baseline을 자동 갱신 | ⑥-2 | 사용자 검수 없이 점수 조작 금지 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| 1 | ①-1 | base surface 위 ListBox 1개 항목 select → 스크린샷 | selection bg가 surface bg보다 명확히 밝음 (L delta ≥ 5%) | |
| 2 | ①-2 | grid row cursor 표시 → 스크린샷 | selection-context가 surface bg와 다름 (L delta ≥ 2%) | |
| 3 | ①-3 | 새 컴포넌트가 base/raised/sunken 각각에 놓일 때 selection 적용 | 각 surface에서 +Δ raised로 파생, 손 매핑 0 | |
| 4 | ①-4 | `pnpm check:tokens` 또는 grep 실행 | role/recipe/component layer에서 stone/depth 직접 참조 0건 | |
| 5 | ④-light | light theme 동일 시나리오 | dark와 반대 부호로 raised 메타포 유지 | |
| 6 | ④-context-bug | depth-base-sel-context = bg 회귀 시도 | 함수가 +Δ를 강제 → 동일 값 불가 | |
| 7 | ⑦-1~3 | 위반 코드 의도적 작성 후 스캐너 실행 | 위반 검출 + 위치 보고 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## 마이그레이션 순서 (참고 — Plan에서 상세화)

1. browserslist 명시 (Chrome 130+, Safari 16.4+, Firefox 128+)
2. semantic elev tier 신설 (`--elev-step-N`, surface별 elev base)
3. role tier를 elev step `from` 함수로 재배선
4. depth-* 토큰을 alias로 전환 (deprecated 표시)
5. 위반 스캐너 추가 + 기존 위반 0 확인
6. light theme 검증 + 시각 검수 + baseline 갱신
7. depth-* alias 제거 (1 사이클 후)
8. memory `feedback_chroma_ladder` 갱신
