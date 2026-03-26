# Design System Primitives Preview — PRD

> Discussion: /internals/theme에 5개 번들 + 독립 축의 읽기 전용 스펙시먼 추가. 기존 편집 패널 제거, 시나리오 카드 유지.

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: 디자인 시스템의 토큰/번들이 잘 설계되어 있지만, "이 시스템이 뭔지" 시각적으로 보여주는 곳이 없다. 시나리오 카드(실제 UI 컴포넌트)로는 개별 번들의 레벨 스펙트럼을 이해할 수 없다.
- **Forces**: ① 토큰 네이밍 확정됨(인터페이스=계약) ② 번들 5개(surface/shape/type/tone/motion) + 독립 축(weight/leading/color/border/spacing) ③ 기존 편집 패널은 개별 축 단위라 번들 철학과 불일치 ④ Light/Dark 토글은 ActivityBar에 이미 있음
- **Decision**: 읽기 전용 스펙시먼 + 기존 시나리오 카드 유지. 편집 기능은 컴포넌트 완성 후 별도. 기각: (A) 프리셋 스위처 — 프리셋 없음, 과투자 (B) 레벨 슬라이더 — 값 튜닝 중, 과투자
- **Non-Goals**: 토큰 값 편집, 새 토큰 추가, 컴포넌트 로직 변경, 반응형 레이아웃

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | /internals/theme 접근 | 페이지 로드 | 5개 번들 스펙시먼 + 독립 축 + 시나리오 카드가 단일 스크롤에 표시 | |
| S2 | Surface 스펙시먼 확인 | 6단계 스와치 나열 | base→outlined 각각 실제 data-surface 적용된 박스, 이름+값 라벨 | |
| S3 | Type 스펙시먼 확인 | 6단계 계단식 텍스트 | hero→caption 순서, 실제 font 렌더링, size+weight+family+lh 표시 | |
| S4 | Tone 스펙시먼 확인 | 5×6 매트릭스 | primary~neutral × base/hover/dim/mid/bright/foreground, 실제 색상 | |
| S5 | Shape 스펙시먼 확인 | 6개 레벨 박스 | xs→pill, 실제 radius+padding 적용, 수치 라벨 | |
| S6 | Motion 스펙시먼 확인 | 3단계 박스 | instant/normal/enter, 클릭 시 해당 duration+easing으로 이동 | |
| S7 | Light/Dark 토글 | ActivityBar에서 전환 | 모든 스펙시먼 값이 즉시 반영 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `PageThemeCreator.tsx` 리팩터 | 편집 패널(controls) 제거. Primitives 섹션 + Scenarios 섹션으로 재구성. TokenControl 관련 코드 삭제 | |
| `PageThemeCreator.module.css` 리팩터 | .controls/.tokenRow/.hex/.valueInput 삭제. .primitives/.specimen-* 추가 | |
| Specimen 컴포넌트들 (인라인) | SurfaceSpecimen, ShapeSpecimen, TypeSpecimen, ToneSpecimen, MotionSpecimen, IndependentAxesSpecimen — PageThemeCreator 내 로컬 컴포넌트 | |

### 페이지 구조

```
┌──────────────────────────────────────────────┐
│  단일 스크롤 컬럼 (max-width: 1200px)        │
│                                              │
│  ── Design System ───────────────────────    │
│                                              │
│  [Surface]   6단계 스와치 가로               │
│  [Shape]     6레벨 둥근 사각형               │
│  [Type]      6단계 텍스트 계단               │
│  [Tone]      5×6 매트릭스                   │
│  [Motion]    3단계 애니메이션                │
│  [독립 축]   weight·leading·color·border·spacing │
│                                              │
│  ── Components ──────────────────────────    │
│  [기존 11개 시나리오 카드 3컬럼 그리드]      │
│                                              │
└──────────────────────────────────────────────┘
```

완성도: 🟢

## ③ 인터페이스

> 이 페이지는 읽기 전용 스펙시먼이므로 키보드 인터랙션이 거의 없다. Motion 스펙시먼만 클릭 상호작용.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 페이지 로드 | — | 모든 스펙시먼 렌더 | CSS custom property를 직접 참조하므로 현재 테마 값이 즉시 반영 | 스펙시먼 표시 | |
| Motion 박스 클릭 | idle | 박스가 오른쪽으로 이동 후 복귀 | 해당 레벨의 --motion-{level}-duration + easing으로 transition | 애니메이션 재생 후 idle | |
| Light/Dark 토글 (외부) | dark/light | :root data-theme 변경 | 모든 토큰이 CSS 변수이므로 cascade가 자동 전파 | 모든 스펙시먼 값 즉시 갱신 | |
| 스크롤 | 스펙시먼 영역 | 페이지 스크롤 | 단일 스크롤 컬럼 구조 | 시나리오 카드까지 도달 | |

### 각 스펙시먼의 시각적 구성

**Surface**: 가로 6칸. 각 칸은 `data-surface` 속성이 적용된 64×64 박스. 아래에 레벨명(base, sunken, ...) + outlined는 투명 배경에 border.

**Shape**: 가로 6칸. 각 칸은 해당 shape 번들이 적용된 박스(radius+padding). 내부에 "Aa" 텍스트. 아래에 레벨명 + radius값.

**Type**: 세로 6행. 각 행은 해당 type 번들 4축(size+weight+family+lh) 전부 적용. 텍스트 내용: "The quick brown fox" 또는 레벨명. 오른쪽에 size/weight/family 표시.

**Tone**: 5행(primary~neutral) × 6열(base/hover/dim/mid/bright/foreground). 각 셀은 해당 색상의 24×24 원형 스와치. primary에만 mid/bright가 있고 나머지는 빈 셀(해당 없음).

**Motion**: 가로 3칸. 각 칸에 작은 사각형 + 레벨명. 클릭하면 사각형이 오른쪽으로 translateX(80px) 이동 후 복귀. duration+easing이 다른 것을 시각적으로 비교.

**독립 축**: weight(5단계, 같은 텍스트 다른 굵기), leading(5단계, 여러 줄 텍스트 다른 행간), text color(4단계 스와치), border(3단계), spacing(7단계 막대).

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| tone mid/bright가 없는 tone (destructive 등) | primary만 mid/bright 정의 | 미정의 토큰 참조 시 빈 값 → 깨진 UI | 해당 셀 비움 또는 "—" 표시 | 깨지지 않음 | |
| 매우 좁은 뷰포트 | 3컬럼 그리드 | 스펙시먼이 잘려보이면 소개 목적 달성 불가 | 스펙시먼은 가로 스크롤 허용 또는 wrapping | 모든 레벨 확인 가능 | |
| prefers-reduced-motion | motion 번들 active | 접근성 — 모션 민감 사용자 보호 | Motion 스펙시먼 duration 0.01ms로 override (기존 reset 규칙) | 즉시 완료, 시각적 차이 없음 | |
| 기존 시나리오 카드와 scroll 위치 | 스펙시먼 위에 카드 아래 | 기존 사용자가 카드를 찾으려면 스크롤 필요 | "Components" 섹션 헤더에 앵커 ID | 직접 이동 가능 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | raw value 금지 (feedback_all_values_must_be_tokens) | ③ 스펙시먼 CSS | ✅ 준수 | 스펙시먼도 토큰만 사용 | |
| P2 | 번들 단위 사용 필수 (feedback_design_bundle_system) | ③ shape/type 스펙시먼 | ✅ 준수 | 스펙시먼이 번들을 시연하는 것 자체 | |
| P3 | 파일명 = 주 export (feedback_filename_equals_export) | ② PageThemeCreator.tsx | ✅ 준수 | 파일명 유지, 내부 리팩터만 | |
| P4 | CSS 작성 시 /design-implement 필수 (CLAUDE.md) | ② module.css | ⚠️ 주의 | 새 CSS는 DESIGN.md 번들 기준으로 작성 | |
| P5 | 디자인은 기능 (feedback_design_is_function) | ① 동기 | ✅ 준수 | 시스템 소개 = 기능적 목적 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | 편집 패널 제거 → 라이브 토큰 편집 기능 소실 | 값 미세 조정 불가 | 낮 | 컴포넌트 완성 후 번들 단위 편집 재도입 예정. 현재는 코드에서 조정 | |
| E2 | TokenControl 관련 코드 삭제 → ColorInput/TextInput import 불필요 | dead import 발생 가능 | 낮 | import 정리 | |
| E3 | 페이지 레이아웃 변경 (2패널→1컬럼) | 기존 PageThemeCreator 테스트가 있다면 깨짐 | 중 | 테스트 존재 여부 확인 후 업데이트 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| N1 | 스펙시먼에 하드코딩 색상값 | ⑤P1 | 토큰 인터페이스 참조만. 값은 토큰이 결정 | |
| N2 | 스펙시먼 전용 새 토큰 추가 | Non-Goals | 기존 토큰만으로 구성. 빈 곳은 "—" 표시 | |
| N3 | 시나리오 카드 로직 변경 | Non-Goals | 기존 카드는 그대로 유지, 위치만 이동 | |
| N4 | 별도 라우트나 탭 분리 | discuss 결정 | 같은 페이지 단일 스크롤 — 프리미티브와 시나리오를 동시 확인 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | /internals/theme 접근 | 스펙시먼 6종 + 시나리오 카드 11개 모두 렌더 | |
| V2 | ①S2 | Surface 스펙시먼 | 6칸 스와치, data-surface 속성 적용, 레벨명 라벨 | |
| V3 | ①S3 | Type 스펙시먼 | 6행 텍스트, 각 행에 type 번들 4축 적용, 크기 차이 시각 확인 | |
| V4 | ①S4 | Tone 스펙시먼 | 5행 × 최대 6열 색상 스와치, primary만 6열 모두 채워짐 | |
| V5 | ①S5 | Shape 스펙시먼 | 6칸 둥근 사각형, radius+padding 적용 | |
| V6 | ①S6 | Motion 스펙시먼 클릭 | 3개 박스가 각각 다른 속도로 이동+복귀 | |
| V7 | ①S7 | Light/Dark 토글 | 모든 스펙시먼 색상/값 즉시 반영 | |
| V8 | ④경계1 | tone mid/bright 미정의 | 해당 셀이 빈 상태, UI 깨짐 없음 | |
| V9 | ④경계3 | prefers-reduced-motion | Motion 박스 클릭 시 즉시 이동 (모션 없음) | |
| V10 | ⑥E1 | 편집 패널 | 존재하지 않음 (제거 확인) | |
| V11 | 전체 | vitest 전체 통과 | 기존 테스트 깨짐 없음 | |

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
