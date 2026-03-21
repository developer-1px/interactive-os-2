# Spatial Cross-Boundary 이동 + Sticky Cursor — PRD

> Discussion: spatial nav 기본 동작으로 그룹 경계를 넘는 이동을 제공한다. TV 리모컨처럼 벽 없는 공간 탐색이 OS 기본기. sticky cursor로 가역적 동선 보장.

## 범위

**이 PRD:** spatial plugin의 cross-boundary fallback + sticky cursor 메커니즘
**별도 PRD:** CMS 전용 키맵(CRUD, 인라인 편집 등) → 기존 PRD 참조

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| M1 | depth 1에서 features 마지막 card에 포커스 | `spatialParent: 'features'`, `focused: 'card-4'`, findNearest 후보 = features 자식만 | ↓ 방향키 (현재 그룹 내 nearest 없음) | 인접 그룹(stats)의 자식 중 시각적 nearest로 이동, depth 1 유지 | `spatialParent: 'stats'`, `focused: 'stat-1'`, stickyCursor: `{ features: 'card-4' }` | |
| M2 | M1 상태에서 stats의 stat-1에 포커스 | `spatialParent: 'stats'`, `focused: 'stat-1'`, stickyCursor: `{ features: 'card-4' }` | ↑ 방향키 (현재 그룹 내 nearest 없음) | features의 sticky cursor 위치(card-4)로 복원 | `spatialParent: 'features'`, `focused: 'card-4'`, stickyCursor: `{ stats: 'stat-1' }` | |
| M3 | depth 1에서 어느 섹션이든 포커스 | 임의의 spatialParent + focused | Escape→방향키→Enter 3타 | 1타로 동일 결과 — 편집 흐름 끊김 해소 | — | |

상태: 🟢

## 2. 인터페이스

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| ↑ ↓ ← → | `spatialParent: P`, `focused: F`, rects = P의 자식들 | 현재 그룹 내 findNearest 성공 | 기존 동작 유지 — 그룹 내 nearest로 이동 | `focused: nearest` (spatialParent 불변) | |
| ↑ ↓ ← → | `spatialParent: P`, `focused: F` | 현재 그룹 내 findNearest 실패 + 해당 방향에 인접 그룹 존재 + 인접 그룹에 sticky cursor 있음 | sticky cursor 위치로 복원 + spatialParent 전환 | `spatialParent: adjacent`, `focused: stickyCursor[adjacent]`, stickyCursor에 `{ P: F }` 보관 | |
| ↑ ↓ ← → | `spatialParent: P`, `focused: F` | 현재 그룹 내 findNearest 실패 + 해당 방향에 인접 그룹 존재 + sticky cursor 없음 | 인접 그룹 자식 중 findNearest로 이동 + spatialParent 전환 | `spatialParent: adjacent`, `focused: nearestInAdjacent`, stickyCursor에 `{ P: F }` 보관 | |
| ↑ ↓ ← → | `spatialParent: P`, `focused: F` | 현재 그룹 내 findNearest 실패 + 해당 방향에 인접 그룹 존재 + sticky cursor 없음 + findNearest도 실패 | 인접 그룹 첫 번째 자식으로 이동 + spatialParent 전환 | `spatialParent: adjacent`, `focused: firstChild`, stickyCursor에 `{ P: F }` 보관 | |
| ↑ ↓ ← → | `spatialParent: P`, `focused: F` | 현재 그룹 내 findNearest 실패 + 해당 방향에 인접 그룹 없음 | 무시 (기존 동작) | 불변 | |
| Enter | `focused: F` (컨테이너) | 자식 있음 | 기존 동작: enterChild + 첫 자식 포커스. **sticky cursor 리셋**: 진입한 그룹의 저장된 cursor 삭제 | `spatialParent: F`, `focused: firstChild`, stickyCursor에서 `F` 키 삭제 | |
| Escape | `spatialParent: P` | P ≠ ROOT | 기존 동작: exitToParent + P에 포커스. **sticky cursor 리셋**: 떠나는 깊이의 **모든** 그룹 cursor 삭제 (깊이 탐색 종료 = 전체 리셋) | `spatialParent: grandparent`, `focused: P`, stickyCursor에서 해당 깊이의 모든 항목 삭제 | |
| 클릭 | 임의의 노드 | — | 기존 동작: 해당 depth로 점프 + 포커스. **sticky cursor 리셋**: 점프한 그룹의 저장된 cursor 삭제 | `spatialParent: clickedParent`, `focused: clicked`, stickyCursor에서 `clickedParent` 키 삭제 | |
| Shift+방향키 | `spatialParent: P`, `focused: F` | 현재 그룹 내 findNearest 실패 | cross-boundary 이동 없음 — 범위 선택은 현재 그룹 내에서만 | 불변 | |
| Home | `spatialParent: P` | — | 기존 동작: 현재 그룹 첫 번째 형제 | `focused: firstSibling` (spatialParent 불변) | |
| End | `spatialParent: P` | — | 기존 동작: 현재 그룹 마지막 형제 | `focused: lastSibling` (spatialParent 불변) | |

상태: 🟢

## 3. 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `useSpatialNav.ts` 확장 — sticky cursor ref | `useRef<Map<string, string>>()` — `Map<parentId, lastFocusedChildId>`. store에 넣지 않음 (undo/redo 밖) | |
| `useSpatialNav.ts` 확장 — cross-boundary fallback | 방향키 핸들러: ① 현재 그룹 findNearest → ② 실패 시 `findAdjacentGroup` → ③ sticky cursor 복원 or 인접 그룹 자식 findNearest or 첫 자식 | |
| `findAdjacentGroup` 함수 (`useSpatialNav.ts` 내) | 현재 spatialParent의 형제들(= 부모의 children)에서 해당 방향에 있는 가장 가까운 그룹 ID 반환. DOM rect 기반 | |
| `useSpatialNav` 반환값 확장 | `saveCursor(parentId, childId)` / `clearCursorsAtDepth(parentId)` 콜백을 반환. 외부(Enter/Escape/클릭 핸들러)에서 호출 | |
| `spatialCommands.enterChild` / `exitToParent` 호출부 수정 | Enter: `clearCursorsAtDepth(진입그룹)` 호출. Escape: `clearCursorsAtDepth(현재 spatialParent의 모든 형제)` 호출. 클릭: `clearCursorsAtDepth(클릭 대상 그룹)` 호출 | |

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| ROOT(depth 0)에서 방향키 끝 도달 | `spatialParent: ROOT`, 마지막 섹션에 포커스 | 무시 — ROOT에는 상위 형제 그룹 없음 | 불변 | |
| depth 2+ 에서 cross-boundary | `spatialParent: card-1` (features 내부), card-1 > desc에 포커스 | card-1의 형제 그룹(card-2)의 자식으로 넘어감. 동일 알고리즘 재귀 적용 — depth 무관 | `spatialParent: card-2`, `focused: card-2의 nearest/sticky`, stickyCursor: `{ card-1: 'desc' }` | |
| sticky cursor 대상 노드가 삭제됨 | stickyCursor: `{ features: 'card-3' }`, card-3 삭제됨 | 삭제된 cursor 무시 → findNearest fallback 사용 | stickyCursor에서 해당 항목 제거 | |
| 인접 그룹이 자식 0개 | 빈 섹션은 CMS 규칙상 존재 불가 | 발생하지 않음 (CMS: 빈 컨테이너 자동 삭제) | — | |
| 리사이즈 후 cross-boundary | 배치 변경으로 인접 그룹이 달라짐 | 다음 키 입력 시 DOM rect 재계산 — 변경된 배치 반영 | rect 갱신 후 새 인접 그룹 기준 | |
| 같은 방향에 인접 그룹이 여러 개 | 가로 grid 아래에 세로 섹션 2개 | 가장 가까운(DOM nearest) 인접 그룹 선택 | — | |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| N1 | Shift+방향키로 cross-boundary 이동 | 범위 선택이 그룹을 넘어가면 선택 모델이 복잡해지고, 다른 그룹의 노드를 동시 선택하는 것은 의미론적으로 모호 | |
| N2 | Home/End로 cross-boundary 이동 | Home/End는 "현재 그룹의 처음/끝"이 의미. 다른 그룹까지 가면 의미가 깨짐 | |
| N3 | sticky cursor를 store에 영구 저장 | 세션 내 임시 상태. undo/redo 히스토리에 들어가면 안 됨 | |
| N4 | 방향키 이동 시 래핑 (끝→처음 순환) | 기존 PRD 정책 유지. cross-boundary는 "넘어감"이지 "순환"이 아님 | |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| T1 | features(2열 grid) 마지막 행 card에서 ↓ | stats의 자식 중 시각적 nearest로 이동. spatialParent가 stats로 전환 | |
| T2 | T1 후 stats에서 ↑ | features의 sticky cursor (원래 card)로 복원 | |
| T3 | features card에서 ↓↓↓ 연타 | features→stats→workflow→... 순차 섹션 이동 | |
| T4 | 마지막 섹션(footer) 마지막 자식에서 ↓ | 무시 (인접 그룹 없음) | |
| T5 | cross-boundary 후 Enter | 해당 노드 자식으로 깊이 진입 + 도착한 그룹의 sticky cursor 리셋 | |
| T6 | cross-boundary 후 Escape | 부모 깊이로 복귀 + 해당 깊이 sticky cursor 리셋 | |
| T7 | cross-boundary 후 클릭으로 다른 노드 이동 | 클릭 대상의 depth로 점프 + 해당 그룹 sticky cursor 리셋 | |
| T8 | sticky cursor 대상 노드가 CRUD로 삭제된 상태에서 복귀 | findNearest fallback 사용 | |
| T9 | 기존 동작: 같은 그룹 내 방향키 이동 | 변경 없음 — 기존 findNearest 동작 유지 | |
| T10 | ROOT(depth 0)에서 방향키 끝 | 무시 — cross-boundary 없음 (ROOT에 상위 없음) | |
| T11 | Shift+방향키로 그룹 끝 | cross-boundary 안 함 — 범위 선택은 현재 그룹 내에서만 | |
| T12 | depth 2: card-1 > desc에서 ↓ | card-2 > nearest 자식으로 이동. spatialParent card-1→card-2 전환 | |
| T13 | T12 후 ↑ | card-1 > desc로 sticky cursor 복원 | |

상태: 🟢

---

**전체 상태:** 🟢 6/6
