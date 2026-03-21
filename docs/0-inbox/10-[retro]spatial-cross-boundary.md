# Retro: Spatial Cross-Boundary + Sticky Cursor — 2026-03-22

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-22-spatial-cross-boundary-prd.md
- **Diff 범위:** 99425d3 (단일 커밋)
- **커밋 수:** 1
- **변경 파일:** 7 (소스 코드 5, docs 2)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 동기 | ✅ | M1~M3 모두 구현 | — |
| 2 | 인터페이스 | ✅ | 11개 행 모두 구현 | — |
| 3 | 산출물 | 🔀 | saveCursor 외부 API 제거 (내부 전용으로 판단). findBestInDirection 추출은 PRD에 없던 개선 | — |
| 4 | 경계 | ✅ | 6개 경계 조건 모두 코드에 반영 | — |
| 5 | 금지 | ✅ | N1~N4 모두 코드+테스트에서 검증 | — |
| 6 | 검증 | 🔀 | 13개 중 10개 테스트 구현. T5/T7/T8 미구현 (코드는 존재) | L1 |

**일치율: 5/6** (검증 커버리지 77%)

## 갭 상세

### ❌ PRD에 있는데 테스트 안 됨

1. **T5 (cross-boundary 후 Enter)** — 코드에 `clearCursorsAtDepth(ctx.focused)` 호출 존재하나, 테스트 fixture에 자식 있는 leaf 노드가 필요하여 스킵됨
2. **T7 (cross-boundary 후 클릭 리셋)** — 코드에 `spatialNav.clearCursorsAtDepth(parentId)` 호출 존재하나, TestCanvas의 클릭 핸들러가 CmsCanvas의 depth-jump 로직을 완전 미러링하지 않음
3. **T8 (삭제된 sticky cursor fallback)** — 코드에 `entities[sticky]` 가드 존재하나, 테스트에서 CRUD 삭제 후 cross-boundary 복귀 시나리오를 구성하지 않음

### ⚠️ 구현됐는데 PRD에 없었음

1. **findBestInDirection 공통 함수 추출** — simplify 리뷰에서 findNearest/findAdjacentGroup 중복을 발견하여 리팩토링. PRD에서 예측 불가한 개선.
2. **storeRef 패턴** — clearCursorsAtDepth의 stale closure 방지. 구현 수준 디테일이므로 PRD 범위 밖.
3. **allowed 참조 안정화** — useMemo + join key. 효율 리뷰에서 발견. PRD 범위 밖.

### 🔀 의도와 다르게 구현됨

1. **saveCursor 외부 API 제거** — PRD 산출물에 `saveCursor` / `clearCursorsAtDepth` 둘 다 외부 노출로 명세했으나, 구현 시 saveCursor는 내부 전용(cross-boundary 핸들러에서만 호출)으로 판단하여 제거. `SpatialNavResult`에 `clearCursorsAtDepth`만 노출. 이것은 올바른 판단 — 불필요한 API 노출 방지.

## 계층별 개선 제안

### L1 코드 — /backlog
- [ ] T5/T7/T8 테스트 추가 — fixture 확장 필요 (자식 있는 노드, 클릭 depth-jump, CRUD 삭제 시나리오)

### L2 PRD 스킬 — 해당 없음
PRD가 충분히 촘촘했음. T5/T7/T8 미구현은 Plan의 테스트 fixture 설계 한계이지 PRD 누락이 아님.

### L3 스킬 — 해당 없음

### L4 지식 — 해당 없음
cross-boundary/sticky cursor 관련 memory는 discussion 종료 시 이미 저장됨.

### L5 사용자 피드백
- 해당 없음. Discussion → PRD → Plan → Execute 흐름에서 모호성 갭 없었음.

## 다음 행동
- L1 백로그 1건 (T5/T7/T8 테스트) → `/backlog`에 저장
