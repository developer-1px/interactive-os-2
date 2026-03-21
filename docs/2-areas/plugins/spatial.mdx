# spatial()

> 공간 네비게이션 컨텍스트 — 깊이 탐색 + cross-boundary 이동 + sticky cursor

> 최종 갱신: 2026-03-22 (retro: spatial-cross-boundary)

## 커맨드

| 커맨드 | 설명 |
|--------|------|
| `enterChild(nodeId)` | 자식으로 진입 (깊이 탐색 + cross-boundary 그룹 전환에 공용) |
| `exitToParent` | 부모로 복귀 |

## 주요 export

| export | 설명 |
|--------|------|
| `SPATIAL_PARENT_ID = '__spatial_parent__'` | 공간 부모 상태 키 |
| `getSpatialParentId` | 현재 공간 부모 ID 조회 |
| `spatialCommands` | 공간 네비게이션 커맨드 집합 |

## useSpatialNav Hook

| export | 설명 |
|--------|------|
| `useSpatialNav(selector, store, scope?)` | DOM 위치 기반 방향키 네비게이션 훅. `SpatialNavResult { keyMap, clearCursorsAtDepth }` 반환 |
| `findNearest(fromId, dir, rects)` | 현재 그룹 내 nearest 탐색 (순수 함수) |
| `findAdjacentGroup(groupId, dir, siblings, groupRects)` | 인접 형제 그룹 탐색 (순수 함수) |
| `Direction` | `'ArrowUp' \| 'ArrowDown' \| 'ArrowLeft' \| 'ArrowRight'` 타입 |

## Cross-Boundary 동작

방향키 → 현재 그룹 findNearest 실패 → 인접 그룹 탐색 → sticky cursor 복원 or nearest or 첫 자식 fallback. `spatialParent` 자동 전환. depth 무관 재귀 적용.

## Sticky Cursor

`useRef<Map<parentId, childId>>` — 그룹을 떠날 때 위치 보관, 돌아올 때 복원. Enter/Escape/클릭 시 `clearCursorsAtDepth`로 리셋. store 밖 (undo/redo 무관).

## 의존

- core store utils (getChildren, getParent)
- focusCommands (setFocus)

## 설계 원칙

- expand(enter-esc) 축과 쌍으로 동작
- cross-boundary는 OS 기본기 (TV 리모컨 패러다임)
- Shift+Arrow, Home/End는 cross-boundary 안 함
