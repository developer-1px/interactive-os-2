# Pattern Composition 로직트리 — 2026-03-20

## 배경

interactive-os에서 AriaBehavior(pattern)를 만드는 과정을 한 눈에 이해할 수 있는 로직트리가 필요. axis decomposition 이후 pattern = metadata + axes 스택인데, 이 구조가 문서화되어 있지 않음.

## 내용

### Pattern을 만드는 전체 흐름

```
composePattern(metadata, ...axes) → AriaBehavior
├── 1. metadata 결정
│   ├── 정체성 (identity)
│   │   ├── role: 이 위젯이 뭔가? (listbox, tree, grid, dialog...)
│   │   └── childRole: 자식이 뭔가? (option, treeitem, row, group...)
│   ├── 포커스 전략 (focus mechanism)
│   │   ├── roving-tabindex: 하나의 Tab stop, 내부 화살표 이동
│   │   └── natural-tab-order: 각 아이템이 독립 Tab stop
│   │   └── orientation: vertical | horizontal | both
│   ├── 행동 플래그 (behavior flags)
│   │   ├── expandable?: 펼침/접기 가능 여부
│   │   ├── selectionMode?: single | multiple
│   │   ├── activateOnClick?: 클릭 시 자동 활성화
│   │   ├── followFocus?: 포커스 이동 시 자동 활성화
│   │   └── colCount?: 그리드 열 수 (navGrid가 읽음)
│   └── 렌더링 (rendering)
│       └── ariaAttributes: (node, state) → aria-* 속성 맵
│
├── 2. axes 선택 (키보드 행동 조합)
│   │
│   ├── Navigation (어떻게 이동하는가?)
│   │   ├── navV          — ↑↓ Home End (세로)
│   │   ├── navH()        — ←→ Home End (가로, wrap 옵션)
│   │   ├── navVhUniform()— ↑↓←→ 모두 prev/next (wrap 옵션)
│   │   └── navGrid()     — ↑↓←→ + Mod+Home/End (2D, colCount 의존)
│   │
│   ├── Depth (계층을 어떻게 탐색하는가?)
│   │   ├── depthArrow    — ←→ expand/collapse/child/parent
│   │   └── depthEnterEsc — Enter 진입, Esc 탈출 (spatial 플러그인 필요)
│   │
│   ├── Selection (어떻게 선택하는가?)
│   │   ├── selectToggle  — Space 토글
│   │   └── selectExtended— Shift+↑↓Home/End 범위 선택
│   │
│   ├── Activation (어떻게 실행하는가?)
│   │   └── activate      — Enter/Space → activate()
│   │
│   └── Trap (어떻게 빠져나가는가?)
│       └── focusTrap     — Esc → collapse()
│
└── 3. 합성 (composition)
    ├── 모든 축의 키를 수집
    ├── 키 중복 시 → chain of responsibility
    │   ├── 위 축부터 순서대로 핸들러 호출
    │   ├── 첫 non-void Command 승리
    │   └── 전부 void → no-op
    └── metadata + merged keyMap → AriaBehavior 반환
```

### 실제 패턴 = 위 트리에서 경로 선택

```
listbox  = metadata(listbox/option/vertical/multiple)
         + selectExtended + selectToggle + activate + navV

tree     = metadata(tree/treeitem/vertical/expandable)
         + selectExtended + selectToggle + activate + depthArrow + navV

tabs     = metadata(tablist/tab/horizontal/followFocus)
         + activate + navH()

dialog   = metadata(dialog/group/natural-tab-order)
         + focusTrap

radiogroup = metadata(radiogroup/radio/vertical/single)
           + selectToggle + navVhUniform({wrap:true})

grid     = metadata(grid/row/vertical/colCount:N)
           + selectToggle + navGrid()
```

### 미해결 문제

- `activateFollowFocus` 축은 `activate`와 코드 100% 동일. followFocus는 metadata 속성이지 축 동작이 아님. 삭제 후 `activate`로 통합 검토 필요.
- metadata 내 행동 플래그(followFocus, activateOnClick, selectionMode)는 축이 아닌 비-키보드 행동. 쇼케이스에서 이 구분이 보이지 않음.
