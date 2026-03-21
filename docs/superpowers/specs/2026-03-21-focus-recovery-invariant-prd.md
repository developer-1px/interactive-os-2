# Focus Recovery Invariant — PRD

> Discussion: focusRecovery는 옵션이 아닌 불변 조건. isVisible()이 tree 전용이라 spatial에서 끈 것이 근본 원인. "도달 가능(reachable)" 판정을 zone별 pluggable로 분리하여 옵션 제거. 모듈 분리(SRP)는 유지하되, CRUD가 있으면 focusRecovery는 반드시 동작.

## 1. 동기

| # | Given | When | Then |
|---|-------|------|------|
| M1 | CMS Canvas에서 노드에 포커스가 있음 | Delete로 삭제 | 포커스가 사라짐 (복구 안 됨) |
| M2 | CMS Canvas에서 노드를 잘라내기(Cmd+X) → 붙여넣기(Cmd+V) | 붙여넣기 후 | 새 노드에 포커스가 안 감 |
| M3 | CMS Canvas에서 undo(Cmd+Z)로 삭제 복원 | 복원 후 | 복원된 노드에 포커스가 안 감 |
| M4 | TreeGrid 등 일반 쇼케이스에서 같은 동작 | 삭제/붙여넣기/undo | 포커스 자동 복구됨 (정상) |

**핵심 원칙:** focusRecovery 모듈은 SRP로 분리 유지. 그러나 CRUD를 쓰면 focusRecovery는 반드시 동작해야 한다 — 끌 수 있는 옵션이 아니라, 항상 켜진 불변 조건.

상태: 🟢

## 2. 인터페이스

| 입력 | 조건 | 결과 |
|------|------|------|
| `useAriaZone({ isReachable })` | zone이 커스텀 도달 가능 판정을 제공 | focusRecovery가 해당 판정 사용 |
| `useAriaZone({})` (isReachable 미제공) | 기본값 | tree 모델 판정 (존재 + 조상 expanded) |
| 데이터 커맨드 실행 후 | 포커스된 노드가 store에서 사라짐 | fallback 체인: 다음 형제 → 이전 형제 → 조상 → 첫 루트 자식 |
| 데이터 커맨드 실행 후 | 새 노드가 생김 (paste/create) | 새 노드에 포커스 |
| 데이터 커맨드 실행 후 | 포커스된 노드가 reachable하지 않음 (collapse 등) | fallback 체인 동작 |

상태: 🟢

## 3. 산출물

### 변경 파일

| 파일 | 변경 |
|------|------|
| `focusRecovery.ts` | `isVisible()`, `findFallbackFocus()`, `detectNewVisibleEntities()` — 모두 `isReachable` 파라미터 추가. 기본값 = tree 판정 (현행 로직). `focusRecovery()` 플러그인도 `isReachable` 옵션 수용 |
| `useAriaZone.ts` | `focusRecovery?: boolean` 옵션 삭제. `isReachable?: (store, nodeId) => boolean` 옵션 추가. `runFocusRecovery()`에서 주입된 판정 사용 |
| `CmsCanvas.tsx` | `focusRecovery: false` 제거. `isReachable: (store, nodeId) => !!getEntity(store, nodeId)` 전달 (존재 = 도달 가능) |

### 구조 변경

```
isVisible(store, nodeId)                    ← 현재: expand 하드코딩
isVisible(store, nodeId, isReachable?)      ← 변경: 주입 가능, 기본값 = tree 판정

UseAriaZoneOptions.focusRecovery?: boolean  ← 삭제
UseAriaZoneOptions.isReachable?: (store: NormalizedData, nodeId: string) => boolean  ← 추가
```

상태: 🟢

## 4. 경계

| 조건 | 예상 동작 |
|------|----------|
| 마지막 루트 자식 삭제 시 | CMS: 삭제 가드 유지 (기존 cmsKeyMap). Tree: fallback이 null → 포커스 없음 (기존 동작) |
| 삭제 후 모든 형제/조상이 없음 | fallback 체인 끝까지 탐색 → 첫 루트 자식 → 없으면 null |
| batch 커맨드 (copy+paste 동시) | paste의 새 노드 감지 → 포커스 이동 |
| history:__restore (undo/redo) | focusRecovery 플러그인 미들웨어에서 동일하게 처리 |
| CMS Sidebar (tree 모델) | isReachable 미전달 → 기본 tree 판정 → 현행 동작 유지 |
| isReachable이 모든 노드에 false 반환 | fallback 체인이 어디에도 매치 못함 → 포커스 변경 없음 |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 |
|---|---------------|------|
| F1 | `focusRecovery: false` 옵션 유지 | 포커스 복구는 불변 조건 — 끌 수 있으면 또 끈다. 모듈은 분리(SRP)하되 동작은 보장 |
| F2 | DOM 기반 visibility 판정 | store가 진실의 원천. DOM 조회는 렌더 타이밍 의존성 생김 |
| F3 | isVisible() 내부에서 모델 분기 (if spatial / if tree) | 모델 분기는 호출자(zone)의 책임. isVisible은 범용 |
| F4 | spatial 모델의 fallback 체인을 "공간적 가까움"으로 변경 | 현재 범위 아님. 형제/부모 체인은 범용으로 충분 |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 |
|---|---------|----------|
| V1 | Tree: 중간 노드 삭제 | 다음 형제로 포커스 이동 (기존 동작 유지) |
| V2 | Tree: 마지막 형제 삭제 | 이전 형제로 포커스 이동 |
| V3 | Tree: 유일한 자식 삭제 | 부모로 포커스 이동 |
| V4 | Tree: collapse로 포커스된 자식 숨김 | 부모로 포커스 이동 |
| V5 | CMS Canvas: 노드 삭제 | 다음 형제 → 이전 형제 → 부모 체인으로 포커스 이동 |
| V6 | CMS Canvas: Cmd+V (paste) | 새로 생긴 노드에 포커스 |
| V7 | CMS Canvas: Cmd+Z (undo delete) | 복원된 노드에 포커스 |
| V8 | CMS Canvas: Cmd+D (duplicate) | 복제된 새 노드에 포커스 |
| V9 | CMS Sidebar: 노드 삭제 | 기존 동작 유지 (tree 기본 판정) |
| V10 | isReachable 미전달 시 기존 tree 테스트 전체 통과 | 하위 호환 |

상태: 🟢

---

**전체 상태:** 🟢 6/6

교차 검증:
1. 동기 ↔ 검증: ✅ M1~M4 각각 V5~V10으로 커버
2. 인터페이스 ↔ 산출물: ✅ isReachable 옵션 → focusRecovery.ts + useAriaZone.ts 변경 일치
3. 경계 ↔ 검증: ✅ 마지막 루트 자식, batch, undo 모두 검증 시나리오에 포함
4. 금지 ↔ 산출물: ✅ focusRecovery: false 삭제 = F1 반영, 모델 분기 없음 = F3 반영
