# 중복 현황 조사 보고서 — 2026-03-23

## 배경

showcase 제작·내부 코드 작업이 진행되면서 코드·쓰임·문서에 걸쳐 중복이 느껴짐. 정리 방향을 잡기 전에 범주별 현황을 파악한다.

## 내용

### 범주 1: 코드 중복 — Pattern/Collection 페이지 쌍

같은 UI 컴포넌트가 Pattern 라우트와 Collection 라우트에 별도 페이지로 존재. 플러그인 구성만 다름.

| Pattern 라우트 | Collection 라우트 | 차이점 |
|---|---|---|
| `PageListboxNav` (core만) | `PageListbox` (core+crud+clipboard+rename+dnd+history+focusRecovery) | 플러그인 구성 |
| `PageTreeGridNav` (core만) | `PageTreeGrid` (full plugins) | 〃 |
| `PageComboboxNav` (기본) | `PageCombobox` (editable, multi, grouped, creatable 5변형) | Collection 쪽이 훨씬 풍부 |
| `PageGrid` (pattern) | `PageGridCollection` (collection) | 〃 |
| `PageTabs` (pattern) | `PageTabsCrud` (collection) | 〃 |

**영향**: 5쌍 × 약 60~100줄 = 데모 코드·데이터·레이아웃이 이중 관리

### 범주 2: 쓰임 중복 — 같은 컴포넌트의 다중 데모 경로

하나의 UI 컴포넌트가 최대 3~4곳에서 데모됨.

| 컴포넌트 | Pattern 페이지 | Collection 페이지 | showcaseRegistry | Axis 데모 |
|---|---|---|---|---|
| ListBox | PageListboxNav | PageListbox | ✅ | — |
| TreeGrid | PageTreeGridNav | PageTreeGrid | ✅ | — |
| Grid | PageGrid | PageGridCollection | ✅ | — |
| Tabs | PageTabs | PageTabsCrud | ✅ | — |
| Combobox | PageComboboxNav | PageCombobox | ✅ | — |
| Accordion | PageAccordion | — | ✅ | — |
| Slider | PageSlider | — | ✅ | — |
| Spinbutton | PageSpinbutton | — | ✅ | — |

**역할 구분 현황**:
- Pattern 페이지: ARIA 패턴 데모 (APG keyboard table 포함)
- Collection 페이지: 플러그인 풀스택 데모
- showcaseRegistry: UI 카탈로그 (PageUiShowcase, PageThemeCreator에서 사용)
- Axis 데모: 축 행동 시연 (컴포넌트가 아닌 축이 주인공)

### 범주 3: 데모 데이터 파일 분산

8개 데모 데이터 파일이 `src/pages/` 루트에 산재.

| 파일 | 사용처 |
|---|---|
| `shared-list-data.ts` | PageListboxNav, PageListbox, PageTypeahead |
| `shared-tree-data.ts` | PageTreeGridNav, PageTreeGrid |
| `shared-combobox-data.tsx` | PageComboboxNav, PageCombobox |
| `shared-kanban-data.ts` | PageKanban |
| `sharedGridData.ts` | PageGrid, PageGridCollection |
| `showcaseFixtures.ts` | showcaseRegistry, PageThemeCreator |
| `axis-demo-data.ts` | Axis 5개 데모 |
| `apg-data.ts` | Pattern 페이지 ~25곳 |

**문제**: 네이밍 규칙 불일치 (`shared-*` vs `sharedGrid*` vs `showcase*`), 위치 미정리

### 범주 4: 문서 병행 — UI docs / Pattern docs

같은 컴포넌트에 대해 두 문서가 병렬 존재.

| docs/2-areas/ui/ (15개) | docs/2-areas/patterns/ (18개) |
|---|---|
| Props, DOM 구조, CSS 선택자 | Spec, 축 합성(composePattern), keyMap |

**현재 역할 분리**: API 참조(ui/) vs 행동 명세(patterns/) — 의도적 설계이나, "Accordion을 이해하려면 두 파일을 열어야 한다"

### 범주 5: 소스코드 (src/interactive-os/)

**중복 없음.** 축(5)·패턴(17+ presets)·플러그인(10)·UI(22)가 단일 책임으로 분리.

### 요약 매트릭스

| 범주 | 심각도 | 건수 | 핵심 원인 |
|---|---|---|---|
| 1. Pattern/Collection 코드 쌍 | 높음 | 5쌍 | 같은 컴포넌트의 설정 변형이 별도 파일 |
| 2. 다중 데모 경로 | 중간 | 8+ 컴포넌트 | 데모 목적이 3가지(패턴·컬렉션·카탈로그)로 분리 |
| 3. 데이터 파일 분산 | 낮음 | 8파일 | 네이밍·위치 규칙 부재 |
| 4. 문서 병행 | 확인 필요 | 15쌍 | 의도적 분리 vs 통합 가능성 |
| 5. 소스코드 | 없음 | 0 | — |

## 다음 행동

- 각 범주별 정리 방향 결정 (discussion 계속)
- 범주 1, 2가 핵심 — "페이지 구조를 어떻게 재설계할 것인가"
