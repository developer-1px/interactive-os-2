# Spatial Cross-Boundary Navigation + Sticky Cursor -- PRD

> Discussion 합의: spatial nav의 방향키가 그룹 경계를 넘어 인접 zone으로 이동하고, sticky cursor로 마지막 위치를 기억하여 가역적 동선을 보장한다. OS 데스크탑처럼 ActivityBar, Editor, Panel 사이를 벽 없이 탐색하는 기본기.

## 범위

**이 PRD:** `useSpatialNav` hook의 cross-boundary fallback + sticky cursor 메커니즘
**별도 PRD:** CMS 전용 키맵(CRUD, 인라인 편집 등), zone 간 공유 데이터 동기화

---

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) |
|---|-------|--------------|------|------|-------------|
| M1 | depth 1에서 features 그룹 마지막 card에 포커스 | `spatialParent: 'features'`, `focused: 'card-4'`, findNearest 후보 = features 자식만 | 방향키 (현재 그룹 내 nearest 없음) | 인접 그룹(stats)의 자식 중 시각적 nearest로 이동, depth 유지 | `spatialParent: 'stats'`, `focused: 'stat-1'`, stickyCursor: `{ features: 'card-4' }` |
| M2 | M1 상태에서 stats의 stat-1에 포커스 | `spatialParent: 'stats'`, `focused: 'stat-1'`, stickyCursor: `{ features: 'card-4' }` | 반대 방향키 (현재 그룹 내 nearest 없음) | features의 sticky cursor 위치(card-4)로 복원 | `spatialParent: 'features'`, `focused: 'card-4'`, stickyCursor: `{ stats: 'stat-1' }` |
| M3 | depth 1에서 임의 섹션에 포커스 | 임의의 spatialParent + focused | Escape + 방향키 + Enter 3타 | 1타로 동일 결과 -- cross-boundary가 3타를 1타로 단축 | -- |

**핵심 문제:** 현재 spatial nav는 그룹 경계에서 멈춘다. 사용자가 인접 그룹으로 이동하려면 Escape로 깊이를 빠져나가고, 방향키로 이동하고, Enter로 다시 진입해야 한다. 3타 조작이 필요한 곳에 1타면 충분해야 한다.

**원인:** `useSpatialNav`의 `findNearest`가 현재 `spatialParent`의 자식만 탐색 대상으로 삼는다. 그룹 경계를 넘는 fallback 경로가 없다.

---

## 2. 인터페이스

| 입력 | Data (before) | 조건 | 결과 | Data (after) |
|------|--------------|------|------|-------------|
| Arrow (Up/Down/Left/Right) | `spatialParent: P`, `focused: F`, rects = P의 자식들 | 현재 그룹 내 `findNearest` 성공 | 기존 동작 유지 -- 그룹 내 nearest로 이동 | `focused: nearest` (spatialParent 불변) |
| Arrow | `spatialParent: P`, `focused: F` | 현재 그룹 내 `findNearest` 실패 + 해당 방향에 인접 그룹 존재 + 인접 그룹에 sticky cursor 있음 | sticky cursor 위치로 복원 + spatialParent 전환 | `spatialParent: adjacent`, `focused: stickyCursor[adjacent]`, stickyCursor에 `{ P: F }` 보관 |
| Arrow | `spatialParent: P`, `focused: F` | 현재 그룹 내 `findNearest` 실패 + 해당 방향에 인접 그룹 존재 + sticky cursor 없음 | 인접 그룹 자식 중 `findBestInDirection`으로 nearest 이동 + spatialParent 전환 | `spatialParent: adjacent`, `focused: nearestInAdjacent`, stickyCursor에 `{ P: F }` 보관 |
| Arrow | `spatialParent: P`, `focused: F` | 현재 그룹 내 `findNearest` 실패 + 해당 방향에 인접 그룹 존재 + sticky cursor 없음 + `findBestInDirection` 실패 | 인접 그룹 첫 번째 자식으로 fallback | `spatialParent: adjacent`, `focused: firstChild`, stickyCursor에 `{ P: F }` 보관 |
| Arrow | `spatialParent: P`, `focused: F` | 현재 그룹 내 `findNearest` 실패 + 해당 방향에 인접 그룹 없음 | 무시 (아무 동작 없음) | 불변 |
| Enter | `focused: F` (컨테이너) | 자식 있음 | 기존 동작: `enterChild` + 첫 자식 포커스. **추가:** 진입한 그룹의 sticky cursor 리셋 | `spatialParent: F`, `focused: firstChild`, stickyCursor에서 `F` 키 삭제 |
| Escape | `spatialParent: P` | P != ROOT | 기존 동작: `exitToParent` + P에 포커스. **추가:** 떠나는 깊이의 **모든** 형제 그룹 cursor 삭제 | `spatialParent: grandparent`, `focused: P`, stickyCursor에서 해당 깊이 전체 삭제 |
| Click | 임의의 노드 | -- | 기존 동작: 해당 depth로 점프 + 포커스. **추가:** 점프한 그룹의 sticky cursor 리셋 | `spatialParent: clickedParent`, `focused: clicked`, stickyCursor에서 `clickedParent` 키 삭제 |
| Shift+Arrow | `spatialParent: P`, `focused: F` | 현재 그룹 내 `findNearest` 실패 | cross-boundary 이동 없음 -- 범위 선택은 현재 그룹 내에서만 | 불변 |
| Home | `spatialParent: P` | -- | 기존 동작: 현재 그룹 첫 번째 형제 | `focused: firstSibling` (spatialParent 불변) |
| End | `spatialParent: P` | -- | 기존 동작: 현재 그룹 마지막 형제 | `focused: lastSibling` (spatialParent 불변) |

### 우선순위 체인 (방향키 핸들러 내부)

```
1. findNearest(focused, direction, currentGroupRects)  --> 그룹 내 이동
2. findAdjacentGroup(spatialParent, direction, siblingGroupIds, groupRects)  --> 인접 그룹 탐색
3. stickyCursor.get(adjacentGroupId)  --> 기억된 위치 복원
4. findBestInDirection(focusedRect, direction, adjacentChildRects)  --> 인접 그룹 내 nearest
5. adjacentChildren[0]  --> 최종 fallback
```

---

## 3. 산출물

| 산출물 | 설명 |
|--------|------|
| `useSpatialNav.ts` -- sticky cursor ref | `useRef<Map<string, string>>()` -- `Map<parentId, lastFocusedChildId>`. store에 넣지 않음 (undo/redo 밖, 세션 내 임시 상태) |
| `useSpatialNav.ts` -- cross-boundary fallback | 방향키 핸들러(`makeHandler`): (1) 현재 그룹 `findNearest` -> (2) 실패 시 `findAdjacentGroup` -> (3) sticky cursor 복원 or 인접 그룹 자식 `findBestInDirection` or 첫 자식 |
| `findAdjacentGroup` 함수 | 현재 `spatialParent`의 형제들(= 부모의 children)에서 해당 방향에 있는 가장 가까운 그룹 ID 반환. `findBestInDirection`과 동일한 DOM rect 기반 스코어링 사용 |
| `findBestInDirection` 내부 함수 | `findNearest`와 `findAdjacentGroup` 공통 스코어링 로직 추출. 주축 거리 + 부축 거리x2 패널티 |
| `SpatialNavResult` 반환 타입 | `{ keyMap, clearCursorsAtDepth }` -- `clearCursorsAtDepth(parentId)`는 해당 깊이 모든 형제 그룹의 cursor를 삭제 |
| 그룹 rect 수집 확장 | `useLayoutEffect`에서 현재 allowed 자식 rect 외에, 형제 그룹(`grandparent.children`) rect도 수집 |
| `storeRef` 패턴 | `useRef(store)` -- render-time store closure 문제 해결. `makeHandler`가 keypress 시점의 최신 store 참조 |

### 파일 변경 범위

| 파일 | 변경 유형 |
|------|----------|
| `src/interactive-os/hooks/useSpatialNav.ts` | 수정 -- cross-boundary fallback, sticky cursor, `findAdjacentGroup`, `findBestInDirection`, 반환 타입 변경 |
| `src/pages/cms/CmsCanvas.tsx` (또는 해당 소비자) | 수정 -- `useSpatialNav` 반환값 구조 변경 적용, Enter/Escape/click 핸들러에 `clearCursorsAtDepth` 호출 추가 |
| `src/__tests__/hooks/use-spatial-nav.test.ts` | 수정 -- `findAdjacentGroup` 순수 함수 단위 테스트 추가 |
| `src/interactive-os/__tests__/hooks/use-spatial-nav.test.ts` | 수정 -- hook 반환 구조 테스트 업데이트 |

---

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| ROOT(depth 0)에서 방향키 끝 도달 | 무시 -- ROOT에는 상위 형제 그룹 없음 (`spatialParentId === ROOT_ID` 가드) |
| depth 2+ 에서 cross-boundary | 동일 알고리즘 재귀 적용 -- depth 무관. card-1의 자식에서 card-2의 자식으로 넘어감 |
| sticky cursor 대상 노드가 삭제됨 | 삭제된 cursor 무시 (`store.entities[sticky]` 체크) -> `findBestInDirection` fallback 사용 |
| 인접 그룹이 자식 0개 | `adjChildren.length > 0` 가드로 빈 그룹 스킵 |
| 리사이즈 후 cross-boundary | 다음 키 입력 시 DOM rect 재계산 (resize handler + `useLayoutEffect` 재수집) |
| 같은 방향에 인접 그룹이 여러 개 | `findAdjacentGroup`이 DOM nearest 기준으로 가장 가까운 그룹 선택 |
| `useAriaZone` 기반 multi-zone | 각 zone은 독립 store에 zone-local `focusedId`를 관리. cross-boundary는 단일 store 내 형제 그룹 간 이동이며, zone 간 이동과는 별개 레이어 |

---

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| N1 | Shift+Arrow로 cross-boundary 이동 | 범위 선택이 그룹을 넘어가면 선택 모델이 복잡해지고, 다른 그룹의 노드를 동시 선택하는 것은 의미론적으로 모호 |
| N2 | Home/End로 cross-boundary 이동 | Home/End는 "현재 그룹의 처음/끝" 의미. 다른 그룹까지 가면 의미가 깨짐 |
| N3 | sticky cursor를 store에 영구 저장 | 세션 내 임시 상태. undo/redo 히스토리에 들어가면 안 됨. `useRef<Map>` 사용 |
| N4 | 방향키 이동 시 래핑 (끝에서 처음으로 순환) | cross-boundary는 "넘어감"이지 "순환"이 아님. 기존 정책 유지 |
| N5 | `findAdjacentGroup`에서 DOM 외 계산 사용 | 시각적 위치 기반이 본질. 데이터 순서(relationships)가 아닌 DOM rect 기반으로만 인접 그룹 결정 |

---

## 6. 검증

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| T1 | features(2열 grid) 마지막 행 card에서 ArrowDown | stats의 자식 중 시각적 nearest로 이동. `spatialParent`가 stats로 전환 |
| T2 | T1 후 stats에서 ArrowUp | features의 sticky cursor (원래 card)로 복원. 가역적 동선 검증 |
| T3 | features card에서 ArrowDown 연타 | features -> stats -> workflow -> ... 순차 섹션 이동 |
| T4 | 마지막 섹션(footer) 마지막 자식에서 ArrowDown | 무시 (인접 그룹 없음) |
| T5 | cross-boundary 후 Enter | 해당 노드 자식으로 깊이 진입 + 도착한 그룹의 sticky cursor 리셋 |
| T6 | cross-boundary 후 Escape | 부모 깊이로 복귀 + 해당 깊이 모든 형제 그룹의 sticky cursor 리셋 |
| T7 | cross-boundary 후 클릭으로 다른 노드 이동 | 클릭 대상의 depth로 점프 + 해당 그룹 sticky cursor 리셋 |
| T8 | sticky cursor 대상 노드가 CRUD로 삭제된 상태에서 복귀 | `findBestInDirection` fallback 사용 (삭제된 cursor 무시) |
| T9 | 기존 동작: 같은 그룹 내 방향키 이동 | 변경 없음 -- 기존 `findNearest` 동작 유지 (회귀 없음) |
| T10 | ROOT(depth 0)에서 방향키 끝 | 무시 -- cross-boundary 없음 (ROOT에 상위 없음) |
| T11 | Shift+Arrow로 그룹 끝 | cross-boundary 안 함 -- 범위 선택은 현재 그룹 내에서만 |
| T12 | depth 2: card-1 > desc에서 ArrowDown | card-2 > nearest 자식으로 이동. `spatialParent` card-1에서 card-2로 전환 |
| T13 | T12 후 ArrowUp | card-1 > desc로 sticky cursor 복원 |

---

## Knowledge (Discussion 합의)

- **K1. 공간 이동은 가역적이어야 한다:** 한 방향으로 이동한 후 반대 방향으로 돌아오면 원래 위치로 복귀해야 한다. sticky cursor가 이를 보장한다.
- **K2. sticky cursor는 zone별로 마지막 위치 기억:** `Map<parentId, lastFocusedChildId>` 구조. store 밖 `useRef`로 관리하여 undo/redo에 영향 없음.
- **K3. cross-boundary는 `findBestInDirection`으로 인접 zone 자식 중 nearest 탐색:** 주축 거리 + 부축 거리x2 패널티 스코어링. 기존 `findNearest`와 동일 알고리즘을 공유하여 일관된 방향 감각 제공.

---

## 아키텍처 컨텍스트

### 현재 구조

```
useEngine(data, plugins)        -- 공유 CommandEngine (데이터 CRUD)
  +-- useAriaZone(engine, behavior, scope="sidebar")   -- zone-local focusedId/selectedIds
  +-- useAriaZone(engine, behavior, scope="canvas")     -- zone-local focusedId/selectedIds
  +-- useAriaZone(engine, behavior, scope="panel")      -- zone-local focusedId/selectedIds
```

- 각 zone은 독립적인 `focusedId`, `selectedIds`, `expandedIds`를 `useState`로 관리
- 데이터 변경(CRUD)은 공유 `engine.dispatch()`를 통해 모든 zone에 반영
- `useSpatialNav`는 zone 내부에서 사용되며, 해당 zone의 store 내 형제 그룹 간 이동을 담당

### cross-boundary의 위치

cross-boundary는 **하나의 zone 내부**에서 `spatialParent`의 형제 그룹 간 이동이다. zone 간 이동(ActivityBar -> Editor)과는 다른 레이어이며, 이 PRD의 범위는 zone 내부 그룹 경계 이동에 한정된다.

```
Zone (e.g., CmsCanvas)
  spatialParent = "features"
    [a] [b] [c] [d]      <-- findNearest 범위
  spatialParent = "stats"   <-- cross-boundary 대상
    [e] [f] [g]
  spatialParent = "workflow" <-- cross-boundary 대상
    [h] [i]
```

---

**전체 상태:** 6/6 섹션 완료
