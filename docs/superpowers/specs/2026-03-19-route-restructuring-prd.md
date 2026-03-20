# Route Restructuring — PRD

> Discussion: Collection 라우트에 behavior 쇼케이스와 plugin 데모가 혼재. Navigation(read-only) → Plugin(개별 능력) → Collection(조립 쇼케이스) 3층 분리.

## 1. 유저 스토리

| # | Given | When | Then |
|---|-------|------|------|
| US1 | ActivityBar를 보는 사용자 | Navigation → Plugin → Collection 순서를 봄 | "read-only behavior → 개별 plugin → 조립" 계층이 직관적으로 읽힘 |
| US2 | Navigation/listbox를 보는 사용자 | 페이지를 탐색 | focus/select/navigate만 가능한 read-only listbox를 봄 (crud/clipboard 없음) |
| US3 | Plugin/crud를 보는 사용자 | 페이지를 탐색 | crud plugin의 create/delete 동작만 집중적으로 봄 |
| US4 | Collection/listbox를 보는 사용자 | 페이지를 탐색 | listbox + crud + clipboard + dnd + history + rename이 모두 동작하는 완성된 경험 |

상태: 🟢

## 2. 화면 구조

### ActivityBar 순서 (7 → 8 그룹)

```
Before: Viewer | Store | Engine | Navigation | Collection | Components | Vision
After:  Viewer | Store | Engine | Navigation | Plugin | Collection | Components | Vision
```

### 라우트 매핑

**Navigation (read-only behaviors)** — `/navigation/`
```
기존 유지: accordion, disclosure, switch, tabs, radiogroup, menu, toolbar, dialog, alertdialog, treeview
신규 추가: treegrid, listbox, grid, combobox  (read-only, plugins=[core()])
```
- treegrid ≠ treeview — APG 별도 패턴이므로 독립 유지

**Plugin (개별 능력 데모)** — `/plugin/` (신규 그룹)
```
이동: crud, clipboard, history, dnd, rename
```

**Collection (조립 쇼케이스)** — `/collection/`
```
유지: treegrid, listbox, tabs, combobox
추가: grid (full-plugin 버전 신규 생성)
```
- Collection은 컴포넌트(behavior+plugins 조립) 리스트. plugin 데모는 여기 없음.

상태: 🟢

## 3. 인터랙션 맵

> 라우트 구조 변경이므로 키보드/마우스 인터랙션 변경 없음. 기존 behavior/plugin 인터랙션 그대로 유지.

| 입력 | 현재 상태 | 결과 |
|------|----------|------|
| ActivityBar 클릭/Enter | 어떤 레이어든 | 해당 레이어의 기본 페이지로 이동 |
| Sidebar 클릭/Enter | 레이어 내 | 해당 페이지로 이동 |
| 구 URL `/collection/crud` 직접 접근 | — | `/viewer`로 리다이렉트 (catch-all, 내부 쇼케이스) |

상태: 🟢

## 4. 상태 전이

> 라우트 구조 변경이므로 앱 상태 변화 없음. URL 경로만 변경.

N/A — 이 작업에 상태 전이 없음.

상태: 🟢

## 5. 시각적 피드백

> 기존 ActivityBar/Sidebar 스타일 그대로 사용.

| 요소 | 변경 |
|------|------|
| Plugin 그룹 아이콘 | `Puzzle` (lucide-react) — plugin = 끼워넣는 확장 |
| ActivityBar 아이콘 수 | 7 → 8개 |
| ActivityBar 아이템 | 아이콘(16px) only, 텍스트 라벨 제거, `title` 속성으로 tooltip 제공 |
| 나머지 스타일 | 변경 없음 |

상태: 🟢

## 6. 데이터 모델

### routeConfig 변경

```typescript
// Navigation: 기존 10개 + 신규 4개 = 14개
navigation.items = [
  // 기존 10개 유지 (순서 유지)
  accordion, disclosure, switch, tabs, radiogroup,
  menu, toolbar, dialog, alertdialog, treeview,
  // 신규 read-only 4개 (기존 뒤에 추가)
  treegrid, listbox, grid, combobox,
]

// Plugin: 신규 그룹 5개
plugin.items = [crud, clipboard, history, dnd, rename]

// Collection: 5개 (plugin 데모 제거)
collection.items = [treegrid, listbox, grid, tabs, combobox]
```

### 페이지 컴포넌트 변경

| 작업 | 페이지 | 설명 |
|------|--------|------|
| 신규 | PageTreeGridNav | PageTreeGrid 기반, plugins=[core()] read-only |
| 신규 | PageListboxNav | PageListbox 기반, plugins=[core()] read-only |
| 신규 | PageComboboxNav | PageCombobox 기반, plugins=[core()] read-only |
| 이동 | PageGrid → Navigation | 이미 core만 사용, 그대로 Navigation으로 |
| 신규 | PageGridCollection | PageGrid 기반 + full plugins (crud, clipboard, dnd, history, rename, focusRecovery) |
| 이동 | PageCrud → Plugin | routeConfig만 변경 |
| 이동 | PageClipboard → Plugin | routeConfig만 변경 |
| 이동 | PageHistoryDemo → Plugin | routeConfig만 변경 |
| 이동 | PageDnd → Plugin | routeConfig만 변경 |
| 이동 | PageRename → Plugin | routeConfig만 변경 |

### 파일명 컨벤션

- Navigation read-only 버전: `Page{Behavior}Nav.tsx` (레이어명과 일치)
- Collection full-plugin 버전: `Page{Behavior}Collection.tsx` (신규 생성 시만)

### 공유 데이터 모듈

Nav/Collection 버전 간 데모 데이터 중복을 제거하기 위해 공유 모듈 추출:

| 모듈 | 내용 |
|------|------|
| `shared-tree-data.ts` | `treeData`, `getFileExt()` |
| `SharedTreeComponents.tsx` | `FileIcon`, `RenderTreeItem` |
| `shared-list-data.ts` | `listData` |
| `shared-combobox-data.tsx` | `createFruitStore()`, `createGroupedStore()`, `comboboxRenderItem` |
| `shared-grid-data.ts` | `gridColumns`, `gridInitialData` |

상태: 🟢

## 7. 경계 조건

| 조건 | 예상 동작 |
|------|----------|
| 구 URL `/collection/crud` 직접 접근 | `/viewer`로 리다이렉트 — catch-all 라우트 (내부 쇼케이스 앱) |
| Navigation 14개 항목 | 스크롤 허용, 서브그룹 분리 안 함. 재정렬은 별도 작업 |
| Navigation의 read-only treegrid vs treeview | 별도 항목 — APG 별도 패턴 |
| Plugin basePath | `/plugin/crud` (기본 랜딩) |
| Collection basePath | `/collection/treegrid` (기존 유지) |

상태: 🟢

## 8. 접근성

> 라우트 구조 변경. 기존 ARIA 패턴 유지. 새 그룹의 aria-label만 추가.

- **ARIA role:** 기존 유지 (ActivityBar = tablist, Sidebar = listbox)
- **키보드 패턴(APG):** 변경 없음
- **스크린리더:** Plugin 그룹 `aria-label="Plugin pages"` 추가

상태: 🟢

## 9. 검증 기준

| # | 시나리오 | 예상 결과 | 우선순위 |
|---|---------|----------|---------|
| V1 | ActivityBar에 8개 그룹 표시 | Viewer, Store, Engine, Navigation, Plugin, Collection, Components, Vision 순서 | P0 |
| V2 | `/navigation/listbox` 접근 | read-only listbox (focus/select만, crud 없음) | P0 |
| V3 | `/navigation/grid` 접근 | read-only grid (기존 PageGrid) | P0 |
| V4 | `/plugin/crud` 접근 | crud plugin 데모 페이지 | P0 |
| V5 | `/collection/listbox` 접근 | full-plugin listbox 쇼케이스 | P0 |
| V6 | `/collection/grid` 접근 | full-plugin grid 쇼케이스 | P0 |
| V7 | `/collection/crud` 접근 | `/viewer`로 리다이렉트 (catch-all) | P0 |
| V8 | 기존 테스트 통과 | 라우트 변경 외 기능 변화 없음 | P0 |

상태: 🟢

---

**전체 상태:** 🟢 9/9
