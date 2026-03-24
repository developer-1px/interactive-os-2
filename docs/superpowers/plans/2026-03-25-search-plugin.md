# search Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 범용 검색 plugin + Aria.Search input + Aria.SearchHighlight — 모든 flat Aria 컬렉션에서 Ctrl+F 검색/필터/하이라이트

**Architecture:** search() plugin이 `__search__` 메타엔티티로 filterText 상태 관리 + Ctrl+F keyMap. Aria.Search가 input UI, Aria.SearchHighlight가 `<mark>` 하이라이트. Aria.Item이 렌더 시 `__search__.filterText`로 매칭 안 되는 노드 skip. rename 패턴(plugin 상태 + primitive UI)과 동일 구조.

**Tech Stack:** TypeScript, React, vitest, @testing-library/react, userEvent

**PRD:** `docs/superpowers/specs/2026-03-25-search-plugin-prd.md`

**핵심 메커니즘:**
- Mod+F → `activateSearch()` command → `__search__.active = true` (filterText 유지) → `Aria.Search` useEffect가 input.focus()
- 타이핑 → `searchCommands.setFilter(text)` → `__search__.filterText` 갱신
- **getVisibleNodes + Aria.Item 양쪽에서 필터**: `__search__.filterText` 있으면 entity.data 필드 case-insensitive substring match → 미매칭 노드 skip. getVisibleNodes가 필터하므로 focusNext/Prev가 필터 결과 안에서만 동작.
- `Aria.SearchHighlight`가 children 텍스트에서 filterText 매칭 부분을 `<mark>`로 래핑
- Escape → `searchCommands.clearFilter()` → filterText="", active=false → 컬렉션 포커스 복귀

**Aria.Search re-render 메커니즘:** engine dispatch → forceRender 상태 업데이트 → AriaInternalContext consumer 리렌더 → Aria.Search가 getStore()에서 __search__.active 읽음 → useEffect에서 input.focus()

---

### Task 1: search plugin — commands + keyMap

**Files:**
- Create: `src/interactive-os/plugins/search.ts`
- Modify: `src/interactive-os/primitives/useAria.ts` (META_ENTITY_IDS에 `__search__` 추가)
- Test: `src/interactive-os/__tests__/search-plugin.integration.test.tsx`

- [ ] **Step 1: unit 테스트 — setFilter/clearFilter commands**

searchCommands.setFilter('hero') → __search__.filterText === 'hero'
searchCommands.clearFilter() → __search__.filterText === ''
setFilter로 active 플래그 설정

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `pnpm vitest run src/interactive-os/__tests__/search-plugin.integration.test.tsx`

- [ ] **Step 3: search.ts plugin 구현**

```typescript
// ② 2026-03-25-search-plugin-prd.md
export const SEARCH_ID = '__search__'

export const searchCommands = {
  activateSearch(): Command { ... },           // __search__.active = true (filterText 유지)
  setFilter(text: string): Command { ... },    // __search__.filterText = text, active = true
  clearFilter(): Command { ... },              // __search__.filterText = '', active = false
}

export function search(): Plugin {
  return definePlugin({
    name: 'search',
    commands: { activateSearch: searchCommands.activateSearch, setFilter: searchCommands.setFilter, clearFilter: searchCommands.clearFilter },
    keyMap: {
      'Mod+F': () => searchCommands.activateSearch(),  // active=true만, filterText 유지
    },
  })
}
```

`activateSearch`는 active=true만 설정하고 기존 filterText를 건드리지 않는다. Aria.Search의 useEffect가 active 변경을 감지하여 input.focus() + 기존 텍스트 select 처리.

- [ ] **Step 4: useAria.ts에 `__search__` 추가**

META_ENTITY_IDS Set에 `'__search__'` 추가 (line 20-21 부근).

- [ ] **Step 5: getVisibleNodes.ts에 검색 필터 추가**

`src/interactive-os/engine/getVisibleNodes.ts` 수정:
- store에서 `__search__` 엔티티 읽기
- filterText가 있으면 각 child의 entity.data string 값에 case-insensitive match
- 미매칭 노드는 visible 배열에 push하지 않음
- **이것이 focusNext/focusPrev가 필터 결과 안에서만 동작하게 만드는 핵심**

`matchesSearchFilter(entity, filterText)` 순수 함수를 search.ts에서 export하여 getVisibleNodes와 Aria.Item 양쪽에서 재사용.

- [ ] **Step 6: 테스트 통과 확인**

- [ ] **Step 7: 커밋**

```
feat: search plugin — commands + keyMap + getVisibleNodes 필터
```

---

### Task 2: Aria.Search — 검색 input primitive

**Files:**
- Modify: `src/interactive-os/primitives/aria.tsx` (AriaSearch 함수 추가, Aria export 확장)
- Test: `src/interactive-os/__tests__/search-plugin.integration.test.tsx` (확장)

- [ ] **Step 1: 통합 테스트 추가**

V1: Ctrl+F → 검색 input 포커스
V3: Escape (input에서) → 검색 해제 + 컬렉션 포커스 복귀
V6: 검색어 전부 지우기 → 전체 행 표시
추가: Enter (input에서) → 컬렉션 첫 매칭 행 포커스 (input 유지, 검색어 유지)

StatefulSearchableList: ListBox + search() plugin + Aria.Search + Aria.Item

```tsx
<Aria behavior={listbox()} data={data} plugins={[core(), search()]} aria-label="Test">
  <Aria.Search placeholder="검색..." />
  <Aria.Item render={...} />
</Aria>
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

- [ ] **Step 3: AriaSearch 구현**

AriaInternalContext에서 dispatch, getStore 접근.
input의 onChange → searchCommands.setFilter(value) dispatch.
Escape → searchCommands.clearFilter() dispatch + 컬렉션 첫 행 focus().
Enter → 컬렉션 첫 매칭 행에 focus() (검색어와 input 유지).
`__search__.active` 감시 useEffect → active=true면 input.focus() + 기존 텍스트 selectAll.

**Escape-from-collection 결정:** 컬렉션 포커스 중 Escape → 패턴 기본 동작(dismiss 등)으로 넘김. 검색 해제는 Aria.Search input에서만. search plugin은 Escape keyMap을 소유하지 않음.

props: placeholder?, className?, 'aria-label'?

Aria export에 Search 추가: `Object.assign(AriaRoot, { ..., Search: AriaSearch })`

- [ ] **Step 4: 테스트 통과 확인**

- [ ] **Step 5: 커밋**

```
feat: Aria.Search — 검색 input primitive, Ctrl+F 포커스 + Escape 해제
```

---

### Task 3: Aria.Item 필터 — __search__ 기반 노드 skip

**Files:**
- Modify: `src/interactive-os/primitives/aria.tsx` (AriaItem 함수 수정)
- Test: `src/interactive-os/__tests__/search-plugin.integration.test.tsx` (확장)

- [ ] **Step 1: 통합 테스트 추가**

V2: "hero" 타이핑 → "hero" 포함 행만 표시
V5: 필터 상태에서 ArrowDown → 필터된 행 내 이동
V8: 매칭 0개 → 행 0개 표시
V11: 대소문자 무시

- [ ] **Step 2: 테스트 실행 — 실패 확인**

- [ ] **Step 3: AriaItem에 검색 필터 로직 추가**

AriaItem의 renderNodes에서:
1. store에서 `__search__` 엔티티 읽기
2. filterText가 있으면 각 child에 대해 entity.data의 모든 string 값을 case-insensitive로 검사
3. 매칭 안 되면 skip (renderNode 호출 안 함)
4. filterText 없거나 빈 문자열이면 기존 동작 (전체 렌더)

매칭 함수: `matchesFilter(entity, filterText)` — entity.data의 모든 string 값에 대해 toLowerCase().includes(filterText.toLowerCase())

주의: `ids` 모드에서도 필터 적용 — ids 배열에서 매칭 안 되는 것 제외.

- [ ] **Step 4: 테스트 통과 확인**

- [ ] **Step 5: 커밋**

```
feat: Aria.Item 검색 필터 — __search__.filterText 기반 노드 skip
```

---

### Task 4: Aria.SearchHighlight — 매칭 텍스트 `<mark>` 래핑

**Files:**
- Modify: `src/interactive-os/primitives/aria.tsx` (AriaSearchHighlight 함수 추가)
- Test: `src/interactive-os/__tests__/search-plugin.integration.test.tsx` (확장)

- [ ] **Step 1: 테스트 추가**

V4: 매칭 텍스트에 `<mark>` 태그 존재
V10: filterText 없으면 children 그대로 (mark 없음)

- [ ] **Step 2: 테스트 실행 — 실패 확인**

- [ ] **Step 3: AriaSearchHighlight 구현**

AriaInternalContext에서 getStore → `__search__.filterText` 읽기.
filterText 없거나 빈 문자열 → children 그대로 반환.
filterText 있으면 → children의 string children을 split하여 매칭 부분을 `<mark>` 로 래핑.

구현 접근: React.Children.map으로 순회, typeof child === 'string'이면 split+mark, ReactElement면 재귀 clone.

Aria export에 SearchHighlight 추가.

- [ ] **Step 4: 테스트 통과 확인**

- [ ] **Step 5: 커밋**

```
feat: Aria.SearchHighlight — 매칭 텍스트 <mark> 하이라이트
```

---

### Task 5: i18n Editor 통합 + 나머지 V-시나리오

**Files:**
- Modify: `src/pages/PageI18nEditor.tsx` (search plugin + Aria.Search + SearchHighlight 추가)
- Test: `src/interactive-os/__tests__/search-plugin.integration.test.tsx` (V7, V9 추가)
- Test: `src/__tests__/i18n-editor-app.integration.test.tsx` (검색 테스트 추가)

- [ ] **Step 1: 나머지 V-시나리오 테스트**

V7: plugin 없이 Ctrl+F → 브라우저 기본 (plugin keyMap 미등록이므로 자동 통과)
V9: 필터로 포커스 노드 제외 → focusRecovery 동작

- [ ] **Step 2: PageI18nEditor에 search 적용**

```tsx
import { search } from '../interactive-os/plugins/search'

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery(), search()]

// Grid 위에 Aria.Search는... Grid가 Aria를 내부에서 렌더하므로,
// Grid에 searchable prop을 추가하거나, Grid 대신 Aria 직접 사용.
// 판단: Grid.tsx에 searchable prop 추가 — Aria.Search를 Grid 내부에서 렌더.
```

Grid.tsx에 `searchable?: boolean` prop 추가:
- searchable이면 search() plugin을 mergedPlugins에 추가
- Grid 내부 Aria 위에 Aria.Search 렌더
- renderCell에서 Aria.SearchHighlight 래핑은 소비자 책임

- [ ] **Step 3: 테스트 통과 확인**

- [ ] **Step 4: 전체 테스트 스위트 실행**

Run: `pnpm vitest run`

- [ ] **Step 5: 커밋**

```
feat: i18n Editor 검색 통합 + Grid searchable prop
```
