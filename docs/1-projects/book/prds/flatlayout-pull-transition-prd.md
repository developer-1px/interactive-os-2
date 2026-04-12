# BookViewer FlatLayout Pull 전환 — PRD

> Discussion: FlatLayout은 배치 엔진이지 props 운반선이 아니다. BookViewer의 `updateEntityData × 9` Push 체이닝을 제거하고, Cms가 증명한 Pull 패턴(Context + hook pull)으로 전환한다.

## ① 동기

### WHY

- **Impact**: BookViewer를 유지보수하는 개발자가 widget에 값을 추가할 때마다 `useMemo` deps 30+를 건드려야 하고, 매 렌더 NormalizedData 전체가 재생성된다. 가독성·성능·변경 난이도 삼중 파손. `feedback_flatlayout_pull_not_push` 원칙 위반 상태.
- **Forces**:
  - NormalizedData SSOT 유지 (못 바꿈) vs React 훅 내부 ephemeral(콜백 closure, store 구독 결과)은 직렬화 불가
  - pages/ 레이어 규칙(훅 직접 사용 금지) vs widget은 도메인 context에 결합 필요
  - FlatLayout `data` 채널 1개 vs widget 9개가 각자 다른 런타임 값 소비
- **Assets**:
  - 내부: `PageCms.tsx` + `cmsContext.tsx` + `cmsWidgets.tsx` (Pull 정석 전범), `FlatLayout.tsx` widget renderer (`{...(node.props ?? {})}` — props 비어도 동작), `definePage` API
  - 외부: React Context 공식 패턴
  - 규약: `feedback_flatlayout_pull_not_push`(방금 확정), `feedback_all_state_normalized_command`, `feedback_model_first_state`
- **Decision**: BookContext Provider 신설 + `useBook()` hook + `bookWidgets.tsx`의 9개 widget을 Pull 시그니처로 재작성. `baseLayout`의 widget 노드에서 `props` 필드 전부 제거.
  - 기각 대안 1: widget props를 Normalized Command로 더 정교하게 관리 — `feedback_flatlayout_pull_not_push`가 이미 Push 금지로 판정. 콜백·ref 직렬화 불가로 원리상 불가.
  - 기각 대안 2: 현 Push 유지 + `useMemo` 분할 최적화 — 증상 패치(`feedback_occams_razor` 위반). 9개 widget 추가 시 문제 재발.
- **Non-Goals**:
  - widget 레이어 공식 위치 결정(GAP #6, `experiments/` 이동) — 별도 discuss
  - `warnFlatLayout.mjs`에 widget props 금지 정적 검사 추가 — 별도 `/antipattern`
  - Cms/SkillKanban/Catalog/Creator의 Pull 전환 — 별도 사이클
  - book 도메인 로직 재설계(bookContent/bookNavStore 구조)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | BookViewer가 열려 있고 chromeVisible=true | 개발자가 `pill` widget에 새 콜백 필드를 추가한다 | `bookWidgets.tsx`의 `BookPill` 안에서만 수정하면 되고, `PageBookViewer.tsx`는 건드리지 않는다 | |
| 2 | BookViewer 초기 렌더 | 아무 상태 변경 없이 재렌더가 1회 더 일어난다 | `layoutData` 참조가 동일(identity equal). FlatLayout 내부 reconcile은 skip | |
| 3 | 사용자가 페이지를 넘긴다 (currentPage 변경) | `BookReader`만 새 page를 소비 | `layoutData` 재생성 없음. `useBook()` consumer 중 `page`를 쓰는 컴포넌트만 리렌더 | |
| 4 | 사용자가 Cmd+P로 QuickOpen을 연다 | `quickOpenVisible` OS 상태 변경 | `quick-open` overlay가 `visible: true` Command로 갱신 → `BookQuickOpen`이 Context에서 `quickOpenVisible` pull | |
| 5 | 리팩토링 전후 | `route-book.screen.test.tsx` 실행 | 모든 기존 테스트 통과 (라우트 진입, ArrowDown/Up 네비) | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/pages/book/bookContext.tsx` (신규) | `BookContextValue` interface + `BookContext` + `BookProvider` + `useBook()` hook. `cmsContext.tsx`를 원형으로 삼는다 | |
| `src/pages/book/PageBookViewer.tsx` (수정) | `layoutData = baseLayout` 단순 참조로 축소(useMemo + updateEntityData × 9 제거). 9개 useState/useCallback은 유지하되 `BookProvider value={...}`로 주입 | |
| `src/pages/book/bookWidgets.tsx` (수정) | 9개 widget 함수 모두 props 인자 제거 → `useBook()` 내부 호출로 전환. 필요한 값만 구조 분해 | |
| `src/pages/book/bookLayout` (수정 또는 `baseLayout` 상수) | `definePage` 내 widget 노드에서 `props` 필드 전부 제거, `type`/`widget`/정적 config만 유지 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `<PageBookViewer />` 마운트 | — | `BookProvider`로 children 감싼다 + `<FlatLayout data={baseLayout} registry={bookWidgets} />` | FlatLayout은 정적 baseLayout을 1회만 받고, widget은 Provider에서 pull | BookViewer 렌더, Context value 준비 | |
| widget 함수 호출(FlatLayout renderer) | Provider 트리 안 | `const { page, ... } = useBook()` | widget은 FlatLayout의 자식 slot이 아닌 독립 컴포넌트로서 Context를 소비 | widget이 필요한 값 획득 | |
| 페이지 넘김 (`setCurrentPage(n)`) | `currentPage = n-1` | PageBookViewer가 state 업데이트 → Context value 재생성 → `BookReader`만 리렌더 | Context value의 해당 필드 참조만 바뀜. `layoutData`는 불변 | `currentPage = n`, reader만 업데이트 | |
| Cmd+P (QuickOpen 열기) | `quickOpenVisible = false` | `setQuickOpenVisible(true)` → Context 갱신 + overlay `visible` Command | ephemeral input state는 Context, OS overlay visible은 store (역할 분리) | overlay 표시 + BookQuickOpen이 Context pull | |
| widget 새 필드 추가 | — | `BookContextValue`에 필드 추가 + 해당 widget에서 `useBook()` 구조 분해만 추가 | `PageBookViewer.tsx`와 `baseLayout`은 수정 대상 아님 | 수정 지점 1개 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| Provider 밖에서 widget 호출 | FlatLayout이 항상 Provider 안이므로 발생 불가 | `useBook()`은 `null` 반환 시 throw해야 실수를 런타임에 즉시 드러낸다 (Cms와 동일) | `Error: useBook must be used within BookProvider` | 명시적 에러 | |
| `baseLayout`에 여전히 `props` 필드가 남아있는 경우 | FlatLayout renderer가 `{...(node.props ?? {})}`로 spread | widget 함수 시그니처에 props 인자가 없으므로 React가 unknown props 경고 가능 | props 필드를 전부 제거하여 방지 | 경고 없음 | |
| Context value가 매 렌더 새 객체 | deps 30+ 배열이 그대로 | Provider value는 `useMemo` 1개로 구성(Cms 패턴) + 필드별 callback은 `useCallback` | 1개 useMemo, deps는 원시값만 | 최소 재생성 | |
| overlay `visible` Command와 Context의 `tocOpen` 이중 출처 | 현재 이중화 | 이 전환에서 **Context가 단일 출처**. overlay visible은 Context 값을 읽어 Command로 반영하는 effect 또는 widget 내부에서 처리 | widget이 Context의 `tocOpen`을 pull하고, PageBookViewer가 useEffect로 store overlay visible을 sync | 단일 SSOT (Context 우선) | |
| route-book.screen.test.tsx가 Push 기반 내부 구조를 테스트 | 리서치 결과: 통합 테스트만 (ArrowDown/Up 라우트) | 블랙박스 테스트라 내부 구조 변경에 무관 | 수정 불필요 | 녹색 통과 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | `feedback_flatlayout_pull_not_push` | ②③ | 이 PRD의 목적 자체가 해소 | — | |
| 2 | `feedback_all_state_normalized_command` | ②④ 경계4 | 미위반: OS 상태(overlay visible)는 Command 유지, ephemeral(콜백·ref)은 Context (스코프 명확화 적용) | — | |
| 3 | `feedback_model_first_state` | ② | 미위반: NormalizedData는 그대로 SSOT | — | |
| 4 | `feedback_occams_razor` | ② | 미위반: Push의 복잡도 증상을 Pull로 근본 제거 | — | |
| 5 | `feedback_ui_over_primitives` | ② bookWidgets | widget이 `@os/ui/*` 완성품만 쓰는지 재확인 필요 | 리팩토링 중 primitives 직접 사용이 있으면 ui/로 교체 | |
| 6 | CLAUDE.md "pages/에서 useAria/useAriaZone 직접 사용 금지" | ② | widget은 ui/ 조합이므로 직접 사용 금지 해당. Context pull은 허용 | — | |
| 7 | `feedback_declarative_ocp` | ② bookWidgets registry | 미위반: widget 추가 = 행 추가 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `PageBookViewer.tsx`의 `layoutData` useMemo + deps 30+ | 제거 시 외부에서 이 reference에 의존하는 코드 없는지 확인 | 낮음 | 리서치로 확인됨: 내부 사용만 | |
| 2 | `bookWidgets.tsx` 9개 widget 시그니처 | 함수 시그니처 변경 → 외부 import 없는지 | 낮음 | 리서치: registry 외부 노출 없음 | |
| 3 | overlay visible 이중화 제거 | 기존 Command 기반 overlay가 Context의 `tocOpen`과 동기 안 되면 UI 깜빡임 | 중 | Provider 내부 useEffect로 단방향 sync (Context → Command) | |
| 4 | `route-book.screen.test.tsx` | 리서치: 통합 테스트만. Push 내부 구조 의존 없음 | 없음 | 수정 없음. 녹색 통과 확인 | |
| 5 | `baseLayout` 구조 | `props` 필드 제거만. 트리 구조 불변 | 없음 | FlatLayout renderer 호환 확인됨 | |
| 6 | Context 과다 구독으로 인한 리렌더 | 모든 widget이 Context를 구독하면 필드 하나 바뀔 때 전체 리렌더 | 중 | Cms도 동일 구조로 충분히 빠름. 필요시 `React.memo` + 선택적 구독은 후속 | |
| 7 | `warnFlatLayout.mjs` | 현재 widget props 금지 룰 없음 | 없음 | 이번 PRD 밖 (별도 `/antipattern`) | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | `baseLayout` widget 노드에 `props` 필드 남기기 | ⑤-1 | Push 패턴 회귀. 부분 Push는 SSOT 2개를 만든다 | |
| 2 | `useBook()`을 Provider 밖에서 호출 | ④ 경계1 | 실수를 런타임에 즉시 드러내기 위해 throw | |
| 3 | Context value를 widget 렌더 중 `useMemo` 없이 inline 객체로 생성 | ⑥-6 | 매 렌더 전체 리렌더 유발 — Push와 같은 파손 재현 | |
| 4 | widget 안에서 `updateEntityData(data, ..., { props })` 호출 | ⑤-1, feedback_flatlayout_pull_not_push | 원칙의 정면 위반 | |
| 5 | overlay visible을 Context에만 두고 store Command는 버리기 | ⑤-2, feedback_all_state_normalized_command | OS overlay state는 devtools/replay/undo 대상. Context는 그것의 consumer일 뿐 | |
| 6 | `bookWidgets.tsx`에서 `useAria`/`useAriaZone` 직접 사용 | ⑤-6, CLAUDE.md | widget은 ui/ 완성품만 조합. Pull은 도메인 context 한정 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| 1 | ①시나리오1 | `BookPill`에 새 콜백 필드를 추가 (코드 수정 작업) | `PageBookViewer.tsx`/`baseLayout`에 diff 0. `bookContext.tsx` + `bookWidgets.tsx`에만 diff | |
| 2 | ①시나리오2, ④경계3 | 초기 렌더 후 아무 상태 변경 없이 강제 재렌더 1회 | `layoutData`(=`baseLayout`) 참조 identity 보존. FlatLayout 내부 re-render skip (devtools 관찰) | |
| 3 | ①시나리오3 | `currentPage`를 0→1로 변경 | `BookReader`만 리렌더(다른 widget은 React.memo/Context selector로 보호되지 않으면 리렌더되어도 됨 — non-goal). `layoutData` 재생성 없음 | |
| 4 | ①시나리오4, ④경계4 | Cmd+P로 QuickOpen 열기 | store overlay `visible=true` Command 발생 + `BookQuickOpen`이 `useBook()`에서 `quickOpenVisible` pull하여 UI 표시 | |
| 5 | ①시나리오5, ⑥-4 | `pnpm test -- src/__tests__/route-book.screen.test.tsx` | 전부 통과 | |
| 6 | ④경계1 | Provider 밖에서 `useBook()` 호출하는 테스트 컴포넌트 | `throw Error('useBook must be used within BookProvider')` | |
| 7 | ⑥-3 | toc 오픈 후 닫기 반복 | Context `tocOpen` ↔ store overlay `visible` sync 유지, 깜빡임 없음 | |
| 8 | ⑦-1 정적 검사 | `baseLayout`에 `.props` 필드 포함 여부 grep | 0 hit | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## 교차 검증

| # | 검증 | 결과 |
|---|------|------|
| 1 | 동기 ↔ 검증: 시나리오 1~5가 모두 검증 1~5에 매핑 | ✅ |
| 2 | 인터페이스 ↔ 산출물: Provider/hook/widget 3개 산출물이 ③의 5개 행동을 전부 지원 | ✅ |
| 3 | 경계 ↔ 검증: 경계1→검증6, 경계3→검증2, 경계4→검증4·7 | ✅ |
| 4 | 금지 ↔ 출처: 6개 금지 모두 ⑤ 또는 ⑥에 출처 | ✅ |
| 5 | 원칙 대조 ↔ 전체: Pull 전환이 `feedback_flatlayout_pull_not_push`와 나머지 6개 원칙을 동시에 충족 | ✅ |

## Non-Goals (재확인 참조)

- widget 레이어 공식 위치(GAP #6) → 별도 `/discuss`
- `warnFlatLayout.mjs` 정적 검사 추가 → 별도 `/antipattern`
- Cms 외 다른 FlatLayout 사용처(SkillKanban/Catalog/Creator/Incident) Pull 검증 → 이 PRD 완료 후 점진
