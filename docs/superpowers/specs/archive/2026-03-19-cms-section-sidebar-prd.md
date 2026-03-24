# CMS Section Sidebar — PRD

> Discussion: PPT 슬라이드 패널 모델. 섹션 썸네일 프리뷰 + CRUD + 드래그 리오더 + 템플릿 선택으로 새 섹션 추가.

## 1. 동기

| # | Given | When | Then |
|---|-------|------|------|
| M1 | 관리자가 페이지의 섹션 구성을 파악하려 함 | CMS를 열면 | 왼쪽에 모든 섹션의 썸네일 프리뷰가 세로로 나열되어 전체 구조를 한눈에 볼 수 있다 |
| M2 | 관리자가 특정 섹션으로 이동하려 함 | 사이드바 썸네일을 클릭하면 | 캔버스가 해당 섹션으로 스크롤된다 |
| M3 | 관리자가 섹션 순서를 변경하려 함 | 썸네일을 드래그하면 | 순서가 바뀌고 캔버스에 즉시 반영된다 |
| M4 | 관리자가 새 섹션을 추가하려 함 | [+] 버튼을 누르면 | 섹션 종류(템플릿)를 선택하는 UI가 나타난다 |
| M5 | 관리자가 섹션을 삭제하려 함 | 섹션을 선택하고 삭제하면 | 섹션이 제거되고 undo로 복원 가능하다 |

상태: 🟢

## 2. 인터페이스

> interactive-os의 behavior + plugin 조합으로 인터랙션이 자연스럽게 도출된다.

### 사이드바 구조 (세로 배치)

```
┌───────┐
│ ┌───┐ │
│ │ ▮ │ │  ← 섹션 썸네일 (미니 프리뷰)
│ └───┘ │
│ ┌───┐ │
│ │ ▮ │ │  ← 현재 선택: 포커스 링
│ └───┘ │
│ ┌───┐ │
│ │ ▮ │ │
│ └───┘ │
│       │
│  [+]  │  ← 새 섹션 추가
└───────┘
```

### behavior + plugin 조합

- **behavior**: `listbox` (세로 목록, role: listbox, childRole: option)
- **plugins**: `core()` + `history()` + `crud()` + `clipboard()` + `dnd()`

→ listbox behavior가 제공하는 것:
- ↑↓: 포커스 이동
- Home/End: 첫/마지막
- 클릭: 선택

→ plugin이 제공하는 것:
- `crud()`: Delete → 삭제, create → 추가
- `clipboard()`: Cmd+D → 복제, Cmd+C/X/V → 복사/잘라내기/붙여넣기
- `dnd()`: Cmd+↑↓ → 리오더
- `history()`: Cmd+Z / Cmd+Shift+Z → undo/redo

### 추가 인터랙션 (behavior/plugin 밖)

| 입력 | 조건 | 결과 |
|------|------|------|
| Enter | 썸네일에 포커스 | 캔버스의 해당 섹션으로 포커스 진입 (사이드바 → 캔버스 전환) |
| Escape | 사이드바에 포커스 | 캔버스로 포커스 이동 |
| 클릭 | 썸네일 | 선택 + 캔버스 스크롤 동기화 |
| 드래그 | 썸네일 | 드래그 앤 드롭 리오더 (dnd plugin의 moveTo) |
| 클릭 | [+] 버튼 | 템플릿 선택 UI 열림 |
| 이벤트 버블링 | 사이드바 ↔ 캔버스 | 독립된 `<Aria>` 인스턴스로 이벤트 격리 |

상태: 🟢

## 3. 산출물

> 구조, 관계, 이름

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| 섹션 사이드바 컴포넌트 | CMS 레이아웃의 좌측 패널. 썸네일 리스트 + [+] 버튼 + 선택 상태 동기화 | ✅ `CmsSidebar.tsx::CmsSidebar` |
| 썸네일 렌더링 | 실제 섹션 JSX의 축소 프리뷰 (CSS transform scale) | ✅ `CmsSidebar.tsx::CmsSidebar` |
| 섹션-캔버스 동기화 | 사이드바 선택 ↔ 캔버스 스크롤 위치 양방향 연동 | ✅ `CmsSidebar.tsx::CmsSidebar` (activeSectionId prop) |
| 리오더 | dnd plugin의 moveUp/moveDown + 드래그 앤 드롭. store의 relationships 순서 변경 | ✅ `CmsSidebar.tsx::CmsSidebar` (plugins prop) |
| 데이터 | 기존 `cms-store.ts`의 ROOT_ID children이 섹션 목록 | ✅ `cms-store.ts::cmsStore` |
| store 공유 | CMS 앱 전체가 하나의 store. 사이드바와 캔버스는 같은 store의 서로 다른 `<Aria>` 뷰 | ✅ `CmsLayout.tsx::CmsLayout` (단일 store 전달) |

상태: 🟢

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| 섹션이 1개뿐일 때 삭제 시도 | 삭제 차단 (최소 1개 유지) |
| 섹션이 많아서 사이드바 스크롤 필요 | 사이드바 내부 세로 스크롤, 선택된 썸네일 자동 스크롤 |
| 썸네일 프리뷰가 실제 섹션과 동기화 안 됨 | 실시간 반영 (CSS transform scale이면 자동) |
| 드래그 중 마우스가 사이드바 밖으로 나감 | 드래그 취소 또는 가장 가까운 위치에 드롭 |
| 새 섹션 추가 후 | 추가된 섹션이 선택되고 캔버스가 해당 위치로 스크롤 |
| undo로 삭제된 섹션 복원 | 원래 위치에 복원, 썸네일 재생성 |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| N1 | 썸네일에서 직접 편집 | 썸네일은 프리뷰 전용. 편집은 캔버스에서만 |
| N2 | 섹션 내부 필드 구조 변경 | 디자이너가 정한 템플릿 구조 보존 |
| N3 | 사이드바와 캔버스 간 이벤트 누수 | 같은 store, 다른 `<Aria>` 인스턴스로 자연 격리 |
| N4 | 사이드바 전용 store 분리 | 하나의 앱 = 하나의 store. 동기화 문제 원천 차단 |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| V1 | CMS 진입 시 | 좌측에 6개 섹션 썸네일이 세로로 나열됨 | ✅ `cms-tab-container.test.tsx::sidebar lists tab-internal sections as focusable items` |
| V2 | 썸네일 클릭 | 캔버스가 해당 섹션으로 스크롤 | ✅ `cms-tab-container.test.tsx::Enter on sidebar tab-internal section activates that tab in canvas` |
| V3 | ↑↓ 키로 썸네일 이동 + Enter | 포커스 이동 후 캔버스 스크롤 | ✅ `cms-tab-container.test.tsx::sidebar ↑↓ navigates through tab-internal sections` |
| V4 | Cmd+↓로 리오더 | 섹션 순서 변경, 캔버스에 즉시 반영 | — |
| V5 | 드래그로 리오더 | 섹션 순서 변경, 캔버스에 즉시 반영 | — |
| V6 | [+] 클릭 → 템플릿 선택 → 확인 | 새 섹션 추가, 썸네일 생성, 캔버스에 표시 | — |
| V7 | Delete로 섹션 삭제 → Cmd+Z | 섹션 삭제 후 undo로 복원 | ✅ `cms-tab-container.test.tsx::Delete on tab-item removes tab (min 1 guard)` |
| V8 | 캔버스에서 다른 섹션으로 spatial nav 이동 | 사이드바 선택이 해당 섹션으로 동기화 | ✅ `cms-tab-container.test.tsx::active tab label is highlighted when canvas tab changes` |

상태: 🟢

---

**전체 상태:** 🟢 6/6
