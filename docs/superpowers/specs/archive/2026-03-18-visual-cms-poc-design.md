# Visual CMS PoC — Design Spec

> interactive-os의 store+command+plugin 스택이 visual CMS 편집 엔진으로 동작하는지 검증하는 PoC

## 목적

포털 홈페이지의 섹션+슬롯 구조를 interactive-os의 normalized store에 매핑하고, 실제 렌더링된 tailwind+HTML 블록 위에서 nested array 콘텐츠를 편집할 수 있는지 실증한다.

## 핵심 가설

> "interactive-os의 tree 구조(normalized store) + command engine + plugins(crud, clipboard, dnd, history)로 nested array 기반 visual CMS 편집이 가능하다"

## 데이터 모델

### CMS JSON → Normalized Store 매핑

```
ROOT
├── hero         Entity<{ type: 'hero', title, subtitle, cta }>
├── features     Entity<{ type: 'cards' }>
│   ├── card-1   Entity<{ type: 'card', title, description, icon }>
│   ├── card-2   Entity<{ type: 'card', title, description, icon }>
│   └── card-3   Entity<{ type: 'card', title, description, icon }>
├── tabs-section Entity<{ type: 'tabs' }>
│   ├── tab-1    Entity<{ type: 'tab', label }>
│   │   ├── item-1  Entity<{ type: 'card', title, description }>
│   │   └── item-2  Entity<{ type: 'card', title, description }>
│   └── tab-2    Entity<{ type: 'tab', label }>
│       └── item-3  Entity<{ type: 'card', title, description }>
└── footer       Entity<{ type: 'footer', copyright, links[] }>
```

각 노드의 `type` 필드가 렌더링 방식을 결정한다. 부모-자식 관계는 relationships로 표현.

### 노드 타입별 편집 가능 필드

| Type | Editable Fields | Array? |
|------|----------------|--------|
| hero | title, subtitle, cta | no |
| cards | (container only) | children = card[] |
| card | title, description, icon | no |
| tabs | (container only) | children = tab[] |
| tab | label | children = card[] |
| footer | copyright | no |

## Behavior: Tree

단일 `<Aria>` 인스턴스 + `tree` behavior로 전체 페이지 콘텐츠를 탐색.

- **↑↓**: 노드 간 이동 (섹션, 탭, 카드 순회)
- **→**: expand (섹션 열기, 탭 열기)
- **←**: collapse 또는 부모로 이동
- **Enter**: 인라인 편집 시작 (rename plugin)
- **Escape**: 편집 취소
- **Ctrl+C/X/V**: clipboard (subtree deep copy)
- **Delete**: 삭제
- **Alt+↑↓**: 리오더
- **Ctrl+Z/Y**: undo/redo

## 렌더링 전략

`renderItem` 콜백에서 `node.data.type`에 따라 다른 tailwind 블록을 렌더링한다. **UI를 새로 만드는 게 아니라, 실제 포털 페이지처럼 보이는 HTML을 그대로 쓴다.**

포커스된 노드에는 편집 오버레이(파란 아웃라인 + 툴바)를 표시한다.

### 노드 타입별 렌더링

- **hero**: 풀폭 히어로 배너 (큰 제목 + 소제목 + CTA 버튼)
- **cards container**: 3열 그리드 래퍼
- **card**: 아이콘 + 제목 + 설명 카드
- **tabs container**: 탭 헤더 바
- **tab**: 탭 패널 (active 탭만 자식 표시)
- **footer**: 저작권 텍스트

### 포커스/선택 시각 표현

```
┌─ 포커스된 노드 ─────────────────────┐
│  ┌ blue outline (ring-2 ring-blue) ┐ │
│  │  실제 콘텐츠 렌더링              │ │
│  └──────────────────────────────────┘ │
│  [Edit] [Copy] [Delete] [↑] [↓]      │  ← 미니 툴바 (포커스 시)
└───────────────────────────────────────┘
```

## 플러그인 구성

```ts
const plugins = [
  core(),
  crud(),
  clipboard(),
  rename(),
  dnd(),
  history(),
  focusRecovery(),
]
```

## 페이지 구조

- 파일: `src/pages/PageVisualCms.tsx`
- 라우트: `/vision/visual-cms` (Vision 그룹에 추가)
- 레이아웃: 좌측 콘텐츠 트리 패널 + 우측 실제 렌더링 미리보기
  - 좌: tree view로 구조 탐색 (기존 TreeGrid와 유사)
  - 우: 실제 포털 페이지 렌더링 (포커스된 노드 하이라이트)
  - 양쪽이 같은 store를 공유하므로 동기화 자동

### 또는 단일 패널

렌더링된 페이지 자체가 편집 인터페이스. 좌측 트리 없이, 페이지 위에서 직접 노드를 클릭/키보드로 선택하고 편집.

**선택: 단일 패널** — visual CMS의 핵심 가치인 "보이는 것이 편집하는 것"을 직접 보여준다.

## 검증 시나리오

1. **카드 추가**: features 섹션에서 Enter로 새 카드 추가 → 즉시 렌더링
2. **카드 리오더**: Alt+↑↓로 카드 순서 변경 → 3열 그리드 내 순서 반영
3. **탭 복사**: tab-1을 Ctrl+C → Ctrl+V → 하위 카드까지 deep copy
4. **Undo**: Ctrl+Z로 복사 취소 → 원래 상태 복원
5. **인라인 편집**: 카드 포커스 → Enter → title 수정 → Enter 확인
6. **Nested 삭제**: 탭 삭제 → 하위 카드 모두 삭제 → Undo로 전체 복원

## 범위 밖

- API 연동 (save/load)
- 이미지 업로드
- 드래그 앤 드롭 (마우스 DnD) — 키보드 dnd만
- 다국어
- 반응형 미리보기
