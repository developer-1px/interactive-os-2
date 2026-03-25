# Naming Dictionary 명사 MECE 로직트리 — 2026-03-24

## 배경

naming-dictionary.md의 명사 ~90개를 MECE(상호배타·전체포괄)로 분류하여, 현재 이름 체계가 아키텍처 레이어와 얼마나 정렬되어 있는지 가시화한다.

## 내용

### 분류 기준

아키텍처 레이어(L1~L7) + App Shell + Cross-cutting으로 1차 분류.
각 레이어 내에서 역할(구조/읽기/쓰기/상태)로 2차 분류.

### 로직트리

```
명사 (90개)
├─ L1 Store (데이터)
│  ├─ 구조: store, entity, node, root, data
│  ├─ 관계: children, parent
│  ├─ 상태: state
│  └─ 변경감지: diff
│
├─ L2 Engine (실행)
│  ├─ 실행: command, engine
│  └─ 체인: middleware
│
├─ L3 Plugin (데이터 조작)
│  ├─ 프레임: plugin
│  ├─ core 상태
│  │  ├─ 포커스: focus, cursor, recovery
│  │  ├─ 셀렉션: selection, anchor
│  │  └─ 확장: (expand — 동사만, 명사 없음)
│  ├─ CRUD: crud, template
│  ├─ clipboard: clipboard
│  ├─ rename: rename
│  ├─ history: history
│  ├─ dnd: dnd
│  ├─ spatial: spatial, direction, depth
│  ├─ typeahead: typeahead
│  └─ validation: schema, field
│
├─ L4 Behavior (인터랙션 표준)
│  ├─ 프레임: behavior, context
│  ├─ 축: axis, key, keymap, trap, value
│  ├─ 합성: pattern
│  ├─ APG 참조: apg, keyboard, entry, table
│  └─ 프리셋 (UI 패턴명 = behavior + UI 공유)
│     ├─ Navigation: tabs, accordion, disclosure, menu, toolbar, navlist
│     ├─ Selection: listbox, combobox, radio, switch, checkbox, toggle
│     ├─ Data: tree, grid, kanban, treegrid (grid·tree 합성)
│     ├─ Input: slider, spinbutton
│     └─ Feedback: dialog, alertdialog (dialog 하위)
│
├─ L5 Zone (뷰 스코프)
│  ├─ 스코프: zone, scope, view
│  ├─ 글로벌: aria, registry
│  └─ (focus/selection은 L3 소유, L5는 바인딩만)
│
├─ L6 Hook (React 접착)
│  └─ 유틸: resizer
│  (대부분 use- 접두사 = 동사, 명사 부재)
│
├─ L7 UI (완성품)
│  ├─ 프리미티브: item, component, group
│  ├─ Feedback: toaster, toast, tooltip
│  ├─ Overlay: overlay, modal
│  └─ 시각화: diagram, mermaid, display
│
├─ App Shell (앱 레이어)
│  ├─ 라우팅: route, shell
│  ├─ 레이아웃: sidebar, drawer, panel, viewport
│  ├─ 뷰어: viewer, present
│  └─ 타임라인: timeline, column, order, session
│
└─ Cross-cutting (레이어 횡단)
   ├─ 변환: adapter
   ├─ 관측: logger, recorder, repro, snapshot
   ├─ 테스트: fixture, result
   └─ i18n: locale
```

### 관찰

| # | 발견 | 의미 |
|---|------|------|
| 1 | **L4 프리셋 명사 = L7 UI 명사** | `listbox`, `dialog` 등이 behavior와 UI 양쪽에 존재. 레이어가 다르지만 같은 이름 공유 — 이것은 의도된 설계(APG 표준명) |
| 2 | **L6 Hook에 명사가 거의 없음** | Hook은 `use-` 동사 패턴이라 명사 체계에 구멍. "무엇을"이 아니라 "어떻게"의 레이어 |
| 3 | **L5 Zone 명사 빈약** | zone, scope, view 3개뿐. 아키텍처 레이어로서의 무게에 비해 이름 존재감이 약함 |
| 4 | **App Shell 명사가 아키텍처와 분리** | sidebar, drawer, panel 등은 L1~L7과 무관한 별도 세계. 앱 고유 용어 |
| 5 | **Cross-cutting 명사 소수** | adapter, logger 등 8개. 레이어에 속하지 않는 범용 인프라 |
| 6 | **`data` 명사 42건으로 최다** | 거의 모든 레이어에서 접미사로 사용 — 분류 의미 없는 범용어 |
| 7 | **`grid` 28건으로 2위** | L3(gridCol) + L4(behavior) + L7(UI) + App(Page) 4개 레이어 횡단 — 가장 복잡한 명사 |

## 다음 행동

- 이 트리를 기준으로 폴더 구조·라우트·문서의 MECE 정렬 검토 (discuss 계속)
