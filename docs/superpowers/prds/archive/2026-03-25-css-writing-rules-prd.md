# CSS Writing Rules — PRD

> Discussion: CSS 작성 규칙 통합 — 구조/디자인 분리, specificity 관리, lint 강제
> 보완 대상: `2026-03-25-css-layer-architecture-prd.md` (6레이어 SRP)

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: LLM/사람 모두 CSS 작성 시 "구조는 어디에, 디자인은 어디에, specificity 충돌은 어떻게" 판단 기준이 없다. layout.css에 구조+디자인 혼재, components.css의 ARIA 셀렉터가 specificity (0,3,1)로 module.css에서 override 불가, raw 값 산재.
- **Forces**: DESIGN.md 번들 체계(닫힌 토큰 시스템) vs layout.css 구조+디자인 혼재 vs components.css 고 specificity ARIA 셀렉터 vs module.css에서 override 시 군비경쟁
- **Decision**: 구조=수치 없는 atomic class(Tailwind 네이밍, 닫힌 체계), 디자인=토큰 CSS 파일, specificity=`:where()` 래핑, stylelint로 강제. 기각 — Tailwind(escape hatch 남용), Layout 컴포넌트(추상화 과잉, v1 교훈), @layer(all-or-nothing 마이그레이션), className 함수(de facto 가독성 대비 이득 없음)
- **Non-Goals**: 수치 있는 atomic class(gap-md, p-4 등 — 추이 보고 판단), 프레임워크 도입, 기존 CSS 일괄 마이그레이션(점진적), Tailwind/Panda CSS 도입

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 새 컴포넌트 작성 | JSX에서 레이아웃 구조 설정 | `className="flex-col items-center"` atomic class 사용 | |
| S2 | 새 컴포넌트 작성 | 디자인 속성(color, spacing, shape) 필요 | module.css에서 토큰으로 작성 | |
| S3 | module.css에서 ARIA 기본 스타일 override 필요 | 컴포넌트별 focus 스타일 커스텀 | components.css가 `:where()`로 specificity 0이므로 아무 셀렉터로 바로 override | |
| S4 | LLM이 CSS 작성 | display:flex를 module.css에 작성 시도 | stylelint가 경고 — structure.css atomic class 사용 유도 | |
| S5 | 개발자가 raw px 작성 | `padding: 6px` 작성 | stylelint가 error — 토큰 사용 강제 | |
| S6 | components.css에 `:where()` 없이 셀렉터 추가 | ARIA 상태 규칙 작성 | stylelint가 error — `:where()` 래핑 강제 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/설정

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/styles/structure.css` | 수치 없는 atomic class ~15개. Tailwind 네이밍. 닫힌 체계 (정의된 것만 사용 가능). 초안 목록은 discuss에서 도출, 전수조사 시 부족분 추가 | ✅ `structure.css` (~40 classes) |
| `components.css` `:where()` 래핑 | 기존 ARIA 셀렉터 전체를 `:where()`로 래핑. specificity (0,0,0) | ✅ `components.css` 전체 래핑 |
| `.stylelintrc` | CSS 작성 규칙 자동 강제. raw 값 금지, margin 금지, `:where()` 강제, structure 속성 경고 | 🔀 `stylelint.config.mjs` — margin 금지 구현, `:where()` 강제/structure 속성 경고는 미구현 (커스텀 플러그인 필요) |
| `DESIGN.md § CSS 작성 판단 흐름` | "이 속성을 어디에 쓸까?" 판단 플로우차트 추가 | ✅ `DESIGN.md` §3 추가 |

완성도: 🟢

## ③ 인터페이스

> 이 PRD는 CSS 파일/설정이므로, 인터페이스 = "작성자가 CSS를 쓸 때의 판단 흐름"

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| CSS 속성 작성 필요 | — | 판단: display/flex/grid/align/justify/overflow? | 수치 없는 레이아웃 속성은 DOM과 co-locate해야 인지 부하 감소 | structure.css atomic class 사용 | |
| CSS 속성 작성 필요 | — | 판단: color/font/spacing/border/shadow/radius? | 디자인 속성은 시스템 일관성에 속하므로 토큰 기반 CSS 파일 | module.css + 토큰으로 작성 | |
| ARIA 상태 스타일 필요 | components.css에 기본값 존재 | 판단: 기본값 충분? 커스텀 필요? | `:where()` specificity 0이므로 아무 셀렉터로 override 가능 | 기본값 사용 or module.css에서 override | |
| module.css에서 override 시도 | components.css 기본값과 충돌 | `:where()` 덕에 바로 override | ARIA 기본 스타일은 "기본값 제공자" 역할 — 쉽게 덮어쓸 수 있어야 | module.css 셀렉터가 이김 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| LLM이 존재하지 않는 atomic class 사용 | — | 닫힌 체계: 정의 없으면 무시됨. JIT 없음 | 스타일 미적용 (조용한 실패) | 시각적으로 발견 가능 | |
| structure.css에 수치 있는 class 추가 시도 | ~15개 고정 | 수치 = 디자인 토큰 영역. 경계선 논쟁 방지 | 추가하지 않음 — 토큰으로 CSS 파일에서 처리 | 현재 목록 유지 | |
| `:where()` 래핑 후 module.css 없는 컴포넌트 | ARIA 기본값만 존재 | specificity 0이지만 override 없으면 그대로 적용 | 기본 ARIA 스타일 정상 작동 | 변화 없음 | |
| `:where()` 래핑 후 기존 시각 변경 | specificity 하락 | module.css에 이미 같은 속성이 있으면 module.css가 이김 | 기존과 시각 변경 가능 — 검증 필수 | 시각 테스트로 확인 | |
| stylelint raw 값 규칙 + 정당한 예외 | — | 999px(pill) 같은 값은 토큰이어야 함 | 토큰 추가가 정답. stylelint disable 주석은 최후 수단 | 토큰 스케일 확장 | |
| 수치 있는 atomic class 확장 시점 | 추이 관찰 중 | 현재는 수치 없는 것만. gap-md 등은 나중 판단 | 별도 논의 필요 | 현재 PRD 범위 밖 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | raw value 금지 (feedback_all_values_must_be_tokens) | ③ structure.css | ✅ 준수 | structure.css에 수치 없음 | |
| P2 | margin 금지, gap 사용 (feedback_gap_over_margin) | ③ stylelint | ✅ 준수 | stylelint에서 margin 금지 규칙 추가 | |
| P3 | 번들 단위 사용 (DESIGN.md) | ③ module.css 작성 | ✅ 준수 | /design-implement 스킬이 번들 강제 | |
| P4 | 같은 역할 = 같은 디자인 (feedback_same_role_same_design) | ② components.css `:where()` | ✅ 준수 | ARIA 기본값이 모든 같은 role에 동일 적용 | |
| P5 | 토큰 약어 규칙 (feedback_token_abbreviation_rule) | ② structure.css 네이밍 | ✅ 준수 | Tailwind de facto 네이밍 사용 | |
| P6 | Focus: 컬렉션=bg, 독립=ring (feedback_focus_indicator_rule) | ③ components.css | ✅ 준수 | `:where()` 래핑이 규칙 자체는 변경하지 않음 | |
| P7 | v1 추상화 과잉 교훈 (project_v1_abstraction_failure) | ② structure.css | ✅ 준수 | atomic class는 추상화가 아니라 alias | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | components.css `:where()` 래핑 | specificity 하락으로 기존 시각 변경 가능 | 높 | `:where()` 래핑 후 전 페이지 시각 비교 필수 | |
| E2 | structure.css 추가 | 기존 layout.css와 class 충돌 가능 | 낮 | layout.css에 같은 이름 없음 확인 (layout은 `.page`, `.sidebar` 등 의미적 이름) | |
| E3 | stylelint 도입 | 기존 코드에서 대량 warning/error 발생 | 중 | 초기 설정 시 기존 파일에 대해 점진적 적용 (ignore 패턴 또는 warning 등급) | |
| E4 | DESIGN.md 섹션 추가 | /design-implement 스킬이 새 섹션 참조해야 함 | 낮 | 스킬 업데이트는 별도 작업 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| N1 | structure.css에 수치 있는 class 추가 | 설계 결정 | 수치 = 토큰 영역. 경계선 논쟁 방지 | |
| N2 | structure.css에 Tailwind JIT/escape hatch 도입 | 설계 결정 | 닫힌 체계가 핵심 가치 | |
| N3 | components.css/interactive.css에서 `:where()` 없이 셀렉터 작성 | ⑥E1 | specificity 군비경쟁 재발 | |
| N4 | module.css에서 display:flex/grid 직접 작성 (신규 코드) | 설계 결정 | structure.css atomic class 사용 | |
| N5 | stylelint disable 주석 남발 | ⑤P1 | 토큰 추가가 정답, disable은 최후 수단 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①S1 | JSX에서 `className="flex-col items-center"` 사용 | 레이아웃 정상 적용 | ✅ structure.css 정의됨, 전수조사 시 적용 예정 |
| V2 | ①S3 | module.css에서 `[role="option"]:focus { background: red }` 작성 | components.css의 `:where()` 기본값을 override | ✅ `:where()` specificity (0,0,0) 확인 |
| V3 | ①S5 | `padding: 6px` 작성 → stylelint 실행 | error 보고 | ✅ standard 규칙이 커버 (severity=warning) |
| V4 | ①S6 | components.css에 `:where()` 없이 셀렉터 추가 → stylelint 실행 | error 보고 | ❌ stylelint 커스텀 규칙 미구현 |
| V5 | ④경계1 | 존재하지 않는 `flex-reverse` class 사용 | 스타일 미적용 (조용한 실패) | ✅ 닫힌 체계 동작 확인 |
| V6 | ④경계4 | `:where()` 래핑 전후 시각 비교 | 모든 페이지에서 시각 변경 없음 (또는 의도된 변경만) | ❌ 브라우저 시각 검증 미실시 |
| V7 | ⑥E3 | 기존 코드에 stylelint 실행 | 기존 위반 목록 파악, 점진 수정 계획 수립 | ✅ defaultSeverity=warning으로 점진 적용 |
| V8 | 전체 | `pnpm typecheck` 통과 | 타입 에러 없음 | ✅ pre-existing 에러만 (변경 무관) |
| V9 | 전체 | 기존 vitest 통과 | 테스트 깨짐 없음 | ✅ 86 files, 806 tests passed |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

| 단계 | 완성도 |
|------|--------|
| ① 동기 | 🟢 |
| ② 산출물 | 🟢 |
| ③ 인터페이스 | 🟢 |
| ④ 경계 | 🟢 |
| ⑤ 원칙 대조 | 🟢 |
| ⑥ 부작용 | 🟢 |
| ⑦ 금지 | 🟢 |
| ⑧ 검증 | 🟢 |
