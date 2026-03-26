# CRUD Focus Binding — PRD

> Discussion: URL을 외부 데이터로 보고, CRUD 모드에서 data prop의 `__focus__`를 존중하여 양방향 포커스 바인딩. 기본은 단방향(내부 focus 관리).

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| 1 | ActivityBar가 toolbar behavior로 렌더링됨, URL은 `/engine/pipeline` | `activityBarStore.entities.__focus__.focusedId = 'cms'` (기본 첫 아이템) | 브라우저 새로고침 | ActivityBar의 `engine` 아이템이 focused (tabindex=0 + 시각적 하이라이트) | `entities.__focus__.focusedId = 'engine'` | |
| 2 | Sidebar가 listbox behavior로 렌더링됨, URL은 `/engine/history` | `sidebarStore.entities.__focus__.focusedId = 'pipeline'` (기본 첫 아이템) | 브라우저 새로고침 | Sidebar의 `history` 아이템이 focused | `entities.__focus__.focusedId = 'history'` | |
| 3 | 사용자가 ActivityBar에서 `axis`를 activate | `entities.__focus__.focusedId = 'engine'` | followFocus로 navigate('/axis/navigate') 호출 | URL이 `/axis/navigate`로 변경, ActivityBar focus는 `axis` | `entities.__focus__.focusedId = 'axis'` | |

상태: 🟢

## 2. 인터페이스

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| `data` prop에 `__focus__` 엔티티 포함 | `data.entities.__focus__ = { id: '__focus__', focusedId: 'engine' }` | data sync 시점 (useEffect) | 외부 focusedId를 engine store에 반영 | `engine store.__focus__.focusedId = 'engine'` | |
| `data` prop에 `__focus__` 엔티티 미포함 | `data.entities`에 `__focus__` 키 없음 | data sync 시점 | 기존 동작 유지: 내부 `__focus__` 보존 | 내부 `__focus__` 불변 | |
| 외부 focusedId가 변경됨 | `data.__focus__.focusedId = 'engine'` → `'axis'` | data prop 변경 감지 | engine store의 focus가 새 값으로 동기화 | `engine store.__focus__.focusedId = 'axis'` | |
| 내부 키보드 네비게이션으로 focus 변경 | `focusedId = 'engine'` | 사용자 ArrowDown | 내부 focus 변경 + followFocus로 onActivate 호출 → URL 변경 → data prop 재전달 | 순환 없음: 같은 값이므로 sync skip | |

상태: 🟢

## 3. 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `useAria.ts` data sync 로직 변경 | `META_ENTITY_IDS` 보호 정책에서 `__focus__`를 조건부 예외 처리: data prop에 `__focus__`가 있으면 외부 값 사용 | `useAria.ts::useAria` |
| `App.tsx` ActivityBar data 구성 | pathname에서 group id 파싱 → `activityBarStore`에 `__focus__` 엔티티 포함하여 전달 | `AppShell.tsx::resolveActivityBarFocusId` |
| `App.tsx` Sidebar data 구성 | pathname에서 item path 파싱 → `sidebarStore`에 `__focus__` 엔티티 포함하여 전달 | `SidebarLayout.tsx::SidebarLayout` |

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| 외부 focusedId가 store에 없는 엔티티를 가리킴 | `data.__focus__.focusedId = 'nonexistent'` | 첫 아이템으로 fallback (기존 stale focus 복구 로직과 동일) | `focusedId = firstChild` | |
| CMS 경로 (`/`) — routeConfig에 매칭 없음 | `pathname = '/'` | ActivityBar에서 `cms` 아이템 focused | `focusedId = 'cms'` | |
| Viewer 경로 (`/viewer`) | `pathname = '/viewer'` | ActivityBar에서 `viewer` 아이템 focused | `focusedId = 'viewer'` | |
| 외부 focusedId와 내부 focusedId가 동일 | `data.__focus__.focusedId = 'engine'`, 내부도 `'engine'` | sync skip, 불필요한 re-render 없음 | 불변 | |
| 초기 마운트 시 data에 `__focus__` 있음 | `data.__focus__.focusedId = 'engine'` | data의 `__focus__`가 initialFocus보다 우선 (명시적 선언 > 힌트) | `focusedId = 'engine'` | |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| 1 | data에 `__focus__`가 없을 때 기존 동작 변경 | 기본=단방향 원칙. 기존 모든 Aria 사용처가 영향받음 | |
| 2 | `Aria` 컴포넌트에 `initialFocus` prop 추가 (이 PRD 범위) | core 비대화 방지. CRUD 레이어에서 data로 해결 | |
| 3 | URL 파싱 로직을 engine/Aria 내부에 넣기 | URL은 app 레이어 관심사. engine은 URL을 모른다 | |
| 4 | dispatch(focusCommands.setFocus())로 외부에서 명령형 주입 | data 바인딩 패턴으로 통일. 명령형과 선언형 혼재 방지 | |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| 1 | `/engine/pipeline`으로 직접 접속 (새로고침) | ActivityBar의 engine 아이템에 `tabindex=0` + `data-focused` 속성 | `activitybar-focus.test.tsx::/ — exactly one item has --active class` |
| 2 | `/axis/select`로 직접 접속 | ActivityBar의 axis focused + Sidebar의 select focused | ❌ 테스트 없음 |
| 3 | ActivityBar에서 키보드로 다른 그룹 이동 | URL 변경 + 해당 그룹 focused (기존 동작 유지) | ❌ 테스트 없음 |
| 4 | data에 `__focus__` 없는 기존 Aria 컴포넌트 | 기존 동작과 동일 (첫 아이템 focused) | `use-aria.test.tsx::first visible node gets focus by default` |
| 5 | 존재하지 않는 경로 접속 (`/nonexistent`) | fallback 동작 (redirect 후 해당 위치 focused) | ❌ 테스트 없음 |

상태: 🟢

---

**전체 상태:** 🟢 6/6
