# Visual CMS 키보드 네비게이션 — PRD

> Discussion: 어떤 HTML 디자인에든 적용 가능한 보편적 키보드 네비게이션 도구. HTML 요소에 role을 부여하면 깊이 탐색과 방향 이동이 자동으로 붙는다.

## 범위

**이 PRD:** 보편적 깊이 탐색(Enter/Escape) + DOM 위치 기반 방향 이동 + 선택
**별도 PRD:** CRUD(삭제/복제/리오더), 인라인 편집, clipboard → `visual-cms-editing-prd.md`

**사전 작업 (OS 레이어):**
- spatial behavior에 extended selection (Shift+방향키 범위 선택) 통합 — 현재 listbox/treegrid에만 구현됨

## 1. 유저 스토리

| # | Given | When | Then |
|---|-------|------|------|
| US1 | 임의의 HTML 페이지에 CMS role이 부여됨 | 방향키 입력 | DOM 위치 기반으로 시각적 배치에 맞게 이동 (가로면 ←→, 세로면 ↑↓, 그리드면 4방향) |
| US2 | 포커스가 자식 있는 요소에 | Enter | 한 단계 깊이 진입, 자식 요소들이 이동 대상 |
| US3 | 깊이 진입한 상태 | Escape | 상위 레벨로 복귀 |
| US4 | 아무 깊이의 아무 요소에 포커스 | Space | 선택 토글 |
| US5 | 아무 깊이에서 포커스 | Shift+방향키 | 방향으로 범위 선택 (anchor 기반) |
| US6 | 아무 깊이에서 포커스 | Tab | DOM 순서 다음 입력 가능 요소로 (브라우저 네이티브) |

> US 범위 밖 → `visual-cms-editing-prd.md`: 인라인 편집, CRUD, clipboard

상태: 🟢

## 2. 화면 구조

### 보편 모델

Visual CMS는 **임의의 HTML**에 적용된다. 특정 레이아웃을 가정하지 않는다.

**깊이 모델:** HTML 요소에 `data-node-id`를 부여하면 CMS 대상이 된다. 부모-자식 관계는 normalized store의 relationships가 결정. 깊이는 무제한 — 깊이마다 같은 규칙이 반복.

**방향 결정:** CSS 레이아웃이 아닌 **DOM 상의 실제 렌더링 위치**로 결정. `useSpatialNav`의 `findNearest`가 각 요소의 `getBoundingClientRect()`를 비교.

- 가로 배치 (flex-row, inline) → ← → 이동
- 세로 배치 (flex-column, block) → ↑ ↓ 이동
- 그리드 배치 (grid, flex-wrap) → ↑ ↓ ← → 4방향 이동
- **어떤 배치든 동일한 알고리즘** — 개발자가 방향을 지정하지 않음, DOM이 결정

### 적용 예시: 현재 랜딩 페이지

```
Page (세로 스크롤)
├── Hero — 세로 stacked → ↑ ↓
│   ├── title, subtitle, CTA
├── Stats — 가로 flex-row → ← →
│   ├── stat 항목들
│       ├── label, value
├── Features — 2열 grid → ↑ ↓ ← →
│   ├── card들
│       ├── icon, title, desc
├── How It Works — 4열 grid → ← →
│   ├── step들
│       ├── title, desc
├── Patterns — auto-fill grid → ↑ ↓ ← →
│   ├── pattern 아이콘들
│       ├── name, icon
└── Footer — 가로 flex → ← →
    ├── brand, links 그룹
        ├── 개별 링크들
```

상태: 🟢

## 3. 인터랙션 맵

### 보편 규칙 (모든 깊이에서 동일)

| 입력 | 결과 |
|------|------|
| ↑ ↓ ← → | DOM 위치 기반 nearest 이동 (`findNearest`). 해당 방향에 대상 없으면 무시 |
| Enter | 자식 있으면 한 단계 깊이 진입 (`enterChild`). 자식 없으면 무시 |
| Escape | 상위 레벨로 복귀 (`exitToParent`). 최상위면 무시 |
| Space | 선택 토글 |
| Shift+방향키 | 범위 선택 (anchor 기반 extended selection) |
| Tab | DOM 순서 다음 입력 가능 요소 (브라우저 네이티브, 위젯 내부에 가두지 않음) |
| Home | 현재 깊이의 첫 번째 형제로 |
| End | 현재 깊이의 마지막 형제로 |
| 클릭 | 해당 요소 포커스 + 해당 깊이로 자동 전환 |

**래핑 없음:** 끝에서 같은 방향 입력 시 무시. 순환하지 않음.

### 핵심: 섹션별 테이블 불필요

위 규칙이 **모든 HTML 구조에서 동일하게 적용**된다. 가로/세로/그리드를 개발자가 지정하지 않고, `findNearest`가 DOM 렌더링 위치를 보고 자동 결정.

> CRUD 키 (Cmd+C/X/V, Delete, Cmd+D, Cmd+↑↓, Cmd+Z/Shift+Z) → `visual-cms-editing-prd.md`
> 더블클릭 → `visual-cms-editing-prd.md`

상태: 🟢

## 4. 상태 전이

| 상태 | 진입 조건 | 탈출 조건 | 시각적 변화 |
|------|----------|----------|------------|
| Depth N (탐색) | Enter from Depth N-1 | Escape → Depth N-1 | 현재 깊이 요소에 포커스 링 |
| Selected | Space 토글 / Shift+방향키 (어느 깊이에서든) | Space 토글 해제 | 선택 표시 (accent background) |

> Edit 상태 → `visual-cms-editing-prd.md`

**깊이 N은 무제한.** 페이지 로드 시 Depth 0 (최상위 자식들). Enter로 진입할 때마다 N+1. Escape로 N-1. 모든 깊이에서 같은 규칙.

상태: 🟢

## 5. 시각적 피드백

| 상태 | 사용자가 보는 것 |
|------|----------------|
| 포커스 | 해당 요소에 accent border + shadow (`border-color: var(--accent)`, `box-shadow: 0 0 0 1px var(--accent)`) |
| 선택 | accent background `var(--accent-dim)` — 포커스(border)와 독립, 동시 표시 가능 |
| 포커스 + 선택 | border + shadow + background 모두 적용 |
| 비포커스 깊이 | 포커스 링 없음 — 현재 깊이의 포커스된 요소만 ring 표시 |

> Edit 시각적 피드백 → `visual-cms-editing-prd.md`

상태: 🟢

## 6. 데이터 모델

### 보편 구조

```
HTML 요소에 data-node-id → normalized store Entity
부모-자식 관계 → store relationships
현재 깊이 → __spatial_parent__ 엔티티
```

**behavior:** 전체 페이지에 단일 `spatial` behavior + `useSpatialNav` hook.
**방향 결정:** `findNearest(fromId, direction, rects)` — DOM `getBoundingClientRect()` 기반.
**깊이 추적:** `__spatial_parent__` 엔티티가 현재 탐색 중인 부모 ID를 저장. `enterChild`/`exitToParent` 커맨드로 변경.

### 적용 예시: 현재 랜딩 페이지

```
ROOT
├── hero            { type: 'section', variant: 'hero' }
│   ├── hero-title      { type: 'text', role: 'title' }
│   └── hero-subtitle   { type: 'text', role: 'subtitle' }
├── features        { type: 'section', variant: 'cards' }
│   ├── card-1          { type: 'card' }
│   │   ├── card-1-icon     { type: 'icon' }
│   │   ├── card-1-title    { type: 'text', role: 'title' }
│   │   └── card-1-desc     { type: 'text', role: 'body' }
│   └── ... (4 cards)
├── stats           { type: 'section', variant: 'stats' }
│   └── stat-1..4       { type: 'stat', label, value }
├── workflow        { type: 'section', variant: 'steps' }
│   └── step-1..4       { type: 'step', title, desc }
├── patterns        { type: 'section', variant: 'patterns' }
│   └── pattern-1..14   { type: 'pattern', name, icon }
└── footer          { type: 'section', variant: 'footer' }
```

상태: 🟢

## 7. 경계 조건

| 조건 | 예상 동작 |
|------|----------|
| 자식 없는 요소에서 Enter | 무시 |
| 자식 1개인 요소에서 Enter | 진입, 해당 자식에 포커스, 방향키 이동 없음 |
| 빈 섹션 (자식 0개) | 자동 삭제 (빈 컨테이너는 존재하지 않음, 컨텐츠 추가는 템플릿 기반) → `visual-cms-editing-prd.md` |
| 방향키로 끝 도달 | 무시 (래핑 안 함) |
| 그리드 마지막 행 불완전 | ↓ 시 DOM nearest로 가장 가까운 항목 |
| 최상위(Depth 0)에서 Escape | 무시 |
| 윈도우 리사이즈로 배치 변경 | 다음 키 입력 시 DOM 위치 기반 재계산 (캐시 무효화) |
| 포커스된 항목 삭제 후 | focusRecovery: 다음 형제 → 이전 형제 → 부모 → `visual-cms-editing-prd.md` |

상태: 🟢

## 8. 접근성

- **ARIA role:**
  - 모든 CMS 노드: `group` + `aria-label="[노드명]"`
  - spatial behavior의 기존 설계 (`role: group`, `childRole: group`)
  - 배치 방향과 무관하게 `group` 통일 — spatial nav는 시각적 공간 탐색이므로 semantic role이 아닌 generic group
- **키보드 패턴:**
  - 깊이 탐색: Enter/Escape (spatial behavior)
  - 방향 이동: useSpatialNav (DOM 위치 기반)
  - 선택: Space 토글 + Shift+방향키 범위 선택
- **스크린리더:**
  - 노드명 `aria-label` 필수
  - `aria-posinset`/`aria-setsize` 적용 안 함 — spatial nav는 공간 위치 기반이므로 논리적 순서 의미 없음

상태: 🟢

## 9. 검증 기준

### 보편 규칙 테스트

| # | 시나리오 | 예상 결과 | 우선순위 |
|---|---------|----------|---------|
| T1 | 가로 배치 요소에서 → | 오른쪽 nearest 요소로 이동 | P0 |
| T2 | 가로 배치 요소에서 ↑↓ | 해당 방향에 대상 없으면 무시 | P0 |
| T3 | 그리드 배치 요소에서 4방향 | DOM 위치 기반 nearest 이동 | P0 |
| T4 | Enter로 깊이 진입 | 자식들이 이동 대상, 첫 번째 자식 포커스 | P0 |
| T5 | Escape로 깊이 복귀 | 부모 레벨로 돌아감, 진입했던 요소에 포커스 | P0 |
| T6 | Space | 선택 토글 (accent background) | P0 |
| T7 | Shift+방향키 | anchor 기반 범위 선택 | P0 |
| T8 | Tab | 위젯 밖 DOM 순서 다음 요소로 | P0 |
| T9 | 끝에서 같은 방향 | 무시 (래핑 없음) | P1 |
| T10 | 불완전 그리드 행에서 ↓ | DOM nearest로 가장 가까운 항목 | P1 |
| T11 | 리사이즈 후 방향키 | DOM 위치 재계산, 변경된 배치 반영 | P1 |
| T12 | 자식 없는 요소에서 Enter | 무시 | P1 |
| T13 | Home/End | 현재 깊이 첫/마지막 형제 | P1 |
| T14 | 클릭으로 깊이 점프 | 해당 깊이로 자동 전환 + 포커스 | P0 |

### 적용 예시 테스트 (랜딩 페이지)

| # | 시나리오 | 예상 결과 | 우선순위 |
|---|---------|----------|---------|
| E1 | Features(2열 그리드) 진입 → → | 같은 행 오른쪽 카드 | P0 |
| E2 | Features 진입 → ↓ | 아래 행 같은 열 카드 | P0 |
| E3 | Stats(가로) 진입 → → | 다음 stat 항목 | P0 |
| E4 | Hero(세로) 진입 → ↓ | title → subtitle → CTA 순 | P0 |
| E5 | Footer 진입 → → | brand → links 그룹 | P0 |
| E6 | Patterns(auto-fill) 진입 → 4방향 | DOM 위치 기반 이동 | P0 |
| E7 | card 진입 → ↓ | icon → title → desc 순 | P0 |

> T: 삭제 후 포커스 복구, 인라인 편집 → `visual-cms-editing-prd.md`

상태: 🟢

---

**전체 상태:** 🟢 9/9
