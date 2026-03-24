# useSpatialNav()

> 공간 네비게이션 훅 — DOM 위치 기반 방향키 이동 + cross-boundary + sticky cursor

> 최종 갱신: 2026-03-22 (spatial cross-boundary)

## API

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| containerSelector | string (CSS) | 탐색 범위를 한정할 컨테이너 셀렉터 |
| store | NormalizedData | 현재 store |
| scope? | string | zone 스코프 (multi-view 시) |

## 반환값 — `SpatialNavResult`

| 필드 | 타입 | 설명 |
|------|------|------|
| keyMap | Record\<string, KeyHandler\> | 8개 방향키 핸들러 (Arrow×4 + Shift+Arrow×4) |
| clearCursorsAtDepth | (parentId: string) => void | 해당 그룹의 형제 sticky cursor 전부 삭제 |

## 순수 함수 (export)

| 함수 | 설명 |
|------|------|
| `findNearest(fromId, dir, rects)` | rects 내에서 fromId 기준 해당 방향 nearest 반환 |
| `findAdjacentGroup(groupId, dir, siblings, groupRects)` | 형제 그룹 중 해당 방향 nearest 반환 |

둘 다 내부적으로 `findBestInDirection(fromRect, dir, candidates)` 공통 스코어링 사용.

## 핵심 동작

### 그룹 내 이동 (기존)
- DOM 위치 기반 탐색 (시각적 위치 기준, 데이터 순서 아님)
- 방향 필터(1px tolerance) + primary/secondary axis 스코어링(secondary ×2 penalty)

### Cross-Boundary (신규)
- 현재 그룹 내 findNearest 실패 → 인접 형제 그룹 탐색
- Fallback 체인: sticky cursor 복원 → findBestInDirection → 첫 자식
- `spatialCommands.enterChild(adjacentId)` + `focusCommands.setFocus(target)` 배치 커맨드
- ROOT(depth 0)에서는 비활성. depth 무관 재귀 적용

### Sticky Cursor (신규)
- `useRef<Map<parentId, childId>>` — store 밖 (undo/redo 무관)
- 방향키로 그룹을 떠날 때 자동 보관, 돌아올 때 복원
- Enter/Escape/클릭 시 `clearCursorsAtDepth`로 리셋 (소비자 책임)

### 금지
- Shift+Arrow: cross-boundary 안 함 (선택 확장은 그룹 내에서만)
- Home/End: behavior 레이어에서 처리, cross-boundary 없음

## 관계

- `spatial` 플러그인: enterChild/exitToParent 커맨드 제공
- `spatial` behavior: Home/End/F2 keyMap, expand(enter-esc) 축
- CmsCanvas: Enter/Escape/클릭에서 `clearCursorsAtDepth` 호출
