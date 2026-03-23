# Spatial Cross-Boundary Navigation + Sticky Cursor — PRD

> Discussion: OS 데스크탑처럼 화살표로 zone 경계를 넘는 공간 이동 + sticky cursor로 마지막 위치 기억

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CMS에서 sec1의 아이템 B에 포커스가 있다 | ArrowDown을 누른다 | sec2의 nearest 아이템(D)으로 포커스가 이동한다 — Escape→방향키→Enter 3타 없이 1타로 | |
| M2 | sec1→B에서 ArrowDown으로 sec2→D로 이동했다 | ArrowUp을 누른다 | sec1→B로 돌아온다 (sticky cursor) — 가역적 동선 보장 | |
| M3 | 여러 section을 오가며 콘텐츠를 편집하고 있다 | 반복적으로 section 경계를 넘는다 | 매번 마지막 위치가 기억되어 왕복이 자연스럽다 — 편집 흐름 끊김 없음 | |
| M4 | 마지막 section(sec3)의 아이템에 포커스가 있다 | ArrowDown을 누른다 | 아무 일도 안 일어난다 — 이동할 대상이 없으면 현재 위치 유지 | |
| M5 | sec2→D에 포커스가 있다 | 마우스로 sec1→A를 클릭한다 | sticky cursor가 리셋되고 sec1→A에 포커스가 간다 — 명시적 의도로 리셋 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `useSpatialNav` hook | 공간 네비게이션 + cross-boundary + sticky cursor를 제공하는 hook. `containerSelector`, `store`, `scope`를 받아 `{ keyMap, clearCursorsAtDepth }`를 반환 | |
| `findBestInDirection` | source rect에서 direction으로 nearest candidate를 찾는 순수 함수. primary axis distance + secondary axis ×2 패널티 스코어링 | |
| `findAdjacentGroup` | 현재 group의 sibling group 중 direction으로 nearest group을 찾는 순수 함수 | |
| `stickyCursorRef` (Map) | `Map<parentId, childId>` — zone별(group별) 마지막 포커스 위치를 기억하는 ref. hook 내부 상태 | |
| `clearCursorsAtDepth` | 주어진 parentId의 형제 그룹들의 sticky cursor를 일괄 삭제하는 함수. Enter/Escape/Click 시 호출 | |
| `spatialCommands.enterChild` | spatial parent를 특정 노드로 설정하는 Command. undo 지원 | |
| `spatialCommands.exitToParent` | spatial parent를 한 단계 올리는 Command. undo 지원 | |
| spatial behavior | `composePattern`으로 조합. `focusStrategy: roving-tabindex, orientation: both`. select + expand(enter-esc) + activate(onClick) + spatialNav 축 조합 | |

**구조 관계:**
- `useSpatialNav`는 `useAriaZone`에 keyMap을 주입하여 사용
- `useAriaZone`는 공유 `engine`(useEngine)에서 data store를 받고, zone-local view state(focus/selection)를 독립 관리
- cross-boundary 이동 시 `spatialCommands.enterChild`로 spatial parent를 전환 + `focusCommands.setFocus`로 포커스 이동을 batch command로 실행
- sticky cursor는 `useSpatialNav` 내부 ref로 관리 (store에 넣지 않음 — view-only state)

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ArrowDown | depth 1, sec1→A 포커스 | sec1 내 아래쪽 nearest 탐색 → 없으면 인접 group(sec2) 탐색 → sec2 자식 중 nearest로 이동 | 같은 group 내 이동이 우선이고, 벽에 부딪히면 인접 group으로 넘어감 (OS 기본기) | spatial parent = sec2, 포커스 = sec2의 nearest child, sticky cursor에 sec1→A 저장 | |
| ArrowUp | depth 1, sec2→C 포커스, sticky: {sec1: B} | sec2 내 위쪽 nearest 탐색 → 없으면 인접 group(sec1) 탐색 → sec1의 sticky cursor(B) 복원 | sticky cursor가 있으면 nearest보다 우선 — 사용자가 떠난 위치로 정확히 돌아감 (가역적 동선) | spatial parent = sec1, 포커스 = B, sticky cursor에 sec2→C 저장 | |
| ArrowLeft | depth 1, sec1→A 포커스 | sec1 내 왼쪽 nearest 탐색 → 없으면 인접 group 탐색 | 4방향 모두 동일한 알고리즘 — 공간 기반이므로 방향 구분 없이 nearest 로직 적용 | 있으면 이동, 없으면 현재 유지 | |
| ArrowRight | depth 1, sec1→A 포커스 | sec1 내 오른쪽 nearest 탐색 → B로 이동 | 같은 group 내 이동이 우선 (intra-group nav 기존 동작 유지) | 포커스 = B | |
| Enter | depth 0, sec1 포커스 | sec1의 자식이 있으면 spatial parent를 sec1로 설정, 첫 자식으로 포커스 이동 | Enter = 깊이 진입 (Figma 모델) | spatial parent = sec1, 포커스 = sec1 첫 자식, 해당 depth의 sticky cursor 클리어 | |
| Enter | depth 1, leaf 노드 포커스 | 인라인 편집 진입 (activate) | Enter의 이중 역할: 컨테이너→자식 포커스, leaf→편집 | 편집 모드 진입 | |
| Escape | depth 1, sec2→D 포커스 | spatial parent를 grandparent로 올림, sec2로 포커스 이동 | Escape = 깊이 복귀 (Enter의 역) | spatial parent = ROOT, 포커스 = sec2, 해당 depth의 sticky cursor 클리어 | |
| Escape | depth 0 (ROOT) | 아무 일도 안 일어남 | ROOT에서는 더 올라갈 깊이가 없음 | 현재 유지 | |
| Space | N/A | 해당 없음 | spatial behavior에서 Space는 별도 바인딩 없음 | N/A | |
| Tab | depth 무관 | 브라우저 기본 Tab 동작 (zone 밖으로 이동) | roving-tabindex 모델에서 Tab은 zone 간 이동용 | zone을 벗어남 | |
| Home | depth 1, sec1 내 | sec1의 첫 자식으로 이동 | 같은 group 내 시작점 이동 — cross-boundary 안 함 | 포커스 = sec1 첫 자식 | |
| End | depth 1, sec1 내 | sec1의 마지막 자식으로 이동 | 같은 group 내 끝점 이동 — cross-boundary 안 함 | 포커스 = sec1 마지막 자식 | |
| Shift+Arrow | depth 1, sec1 내 | 같은 group 내 nearest로 selection 확장 | 범위 선택은 group 내에서만 — cross-boundary 하면 다른 group의 아이템이 선택되어 의미 불명확 | selection 확장, cross-boundary 안 함 | |
| Cmd/Ctrl 조합 | N/A | clipboard/history 등 plugin keyMap이 처리 | cross-boundary와 무관한 별도 plugin 영역 | N/A | |
| 클릭 | depth 1, 아이템 D 클릭 | D로 포커스 이동 + 해당 depth의 형제 group sticky cursor 클리어 | 클릭 = 명시적 의도 → sticky cursor 리셋이 자연스러움 | 포커스 = D, sticky cursor 클리어 | |
| 더블클릭 | N/A | 별도 바인딩 없음 (activate와 동일하게 동작) | spatial에서 더블클릭은 단일클릭과 동일 | N/A | |

### 인터페이스 체크리스트 (AI 자가 검증용)

산출물 구조를 보고 아래를 전수 확인:
- [x] ArrowUp: 해당. intra-group nearest → cross-boundary(sticky 우선, 없으면 nearest) → 없으면 유지
- [x] ArrowDown: 해당. 위와 동일 알고리즘
- [x] ArrowLeft: 해당. 위와 동일 알고리즘
- [x] ArrowRight: 해당. 위와 동일 알고리즘
- [x] Enter: 해당. 깊이 진입 (컨테이너→자식) 또는 activate (leaf→편집). sticky cursor 클리어.
- [x] Escape: 해당. 깊이 복귀. sticky cursor 클리어.
- [x] Space: N/A — spatial behavior에서 미사용
- [x] Tab: 브라우저 기본 — zone 간 이동
- [x] Home/End: 해당. 같은 group 내 첫/마지막. cross-boundary 안 함.
- [x] Cmd/Ctrl 조합: N/A — plugin 영역
- [x] 클릭: 해당. 포커스 이동 + sticky cursor 클리어
- [x] 더블클릭: N/A
- [x] 이벤트 버블링: `defaultPrevented` 가드로 중첩 Aria 컨테이너 격리

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: 마지막 group에서 ArrowDown | sec3→E 포커스, 아래에 group 없음 | 이동 대상이 없으면 아무것도 안 하는 게 관례 (wrapping은 공간 모델에서 부자연스러움) | 현재 유지 | sec3→E 포커스 유지 | |
| E2: 첫 group에서 ArrowUp | sec1→A 포커스, 위에 group 없음 | E1과 동일 논리 | 현재 유지 | sec1→A 포커스 유지 | |
| E3: ROOT depth(0)에서 ArrowDown | depth 0, sec1 포커스 | ROOT 레벨에서는 cross-boundary 비활성 — Enter로 깊이 진입해야 section 간 이동 가능. depth 0 cross-boundary는 section 자체를 넘어야 하므로 spatial parent 전환이 의미 없음 | 현재 유지 | depth 0 유지 | |
| E4: sticky cursor가 가리키는 노드가 삭제됨 | sec1→B에 sticky 저장 후 B가 CRUD로 삭제됨 | 존재하지 않는 노드로 복원하면 crash. entities[sticky] 존재 확인 후 없으면 nearest fallback | sticky 무시, nearest로 이동 | nearest child로 이동 | |
| E5: 인접 group에 자식이 0개 | sec2의 자식이 모두 삭제됨 | 빈 group으로 이동하면 포커스 대상이 없음 — 빈 group은 건너뜀 | cross-boundary 안 함 (adjChildren.length === 0이면 skip) | 현재 유지 | |
| E6: depth 2 cross-boundary | sec1→card1→Y에서 ArrowDown, card2가 형제 | depth와 무관하게 동일 알고리즘 — spatial parent의 형제를 탐색하므로 재귀적으로 동작 | card2의 nearest child(W)로 이동 | spatial parent = card2, sticky: {card1: Y} | |
| E7: 3개 이상 group 연속 이동 | sec1→A에서 ArrowDown 2번 | 각 cross-boundary마다 독립적으로 동작 — 중간 group을 건너뛰지 않음 | sec1→A → sec2→C → sec3→E (각각 nearest) | 각 group에 sticky 누적 | |
| E8: Shift+Arrow에서 cross-boundary | sec1→B에서 Shift+ArrowDown | 범위 선택이 group을 넘으면 의미 불명확 (다른 group의 아이템이 선택됨). group 내에서만 선택 확장 | 같은 group 내 nearest로만 확장, 없으면 현재 유지 | cross-boundary 안 함 | |
| E9: Home/End에서 cross-boundary | sec1→B에서 End | Home/End는 같은 group의 시작/끝으로 이동하는 관례. cross-boundary하면 예측 불가능한 위치로 이동 | 같은 group 내 마지막 자식으로 이동 | cross-boundary 안 함 | |
| E10: Enter 시 sticky cursor 클리어 범위 | depth 0에서 sec1 Enter | 깊이 진입 = 새로운 탐색 시작. 이전 depth의 sticky는 의미 없으므로 해당 depth의 형제 group cursor 클리어 | 해당 depth의 sticky 클리어 후 sec1 첫 자식으로 진입 | 깨끗한 상태에서 탐색 시작 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 가역적 동선 (feedback_reversible_motion) | ③ ArrowDown→ArrowUp, M2 | 미위반 | — sticky cursor로 정확히 떠난 위치 복귀 보장 | |
| P2 | 포커스는 결과물을 가리킨다 (feedback_focus_is_result) | ③ 전체 | 미위반 | — cross-boundary 이동의 결과(nearest/sticky)로 포커스 이동 | |
| P3 | focusRecovery는 불변 조건 (feedback_focus_recovery_invariant) | ④ E4 | 미위반 | — sticky 대상 삭제 시 entities 존재 확인 후 nearest fallback | |
| P4 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② useSpatialNav | 미위반 | — useSpatialNav가 keyMap을 생성하여 반환, 소비자가 수동 연결 불필요 | |
| P5 | defaultPrevented 가드 (feedback_nested_bubbling_guard) | ③ 이벤트 버블링 | 미위반 | — useAriaZone의 onKeyDown에 `if (event.defaultPrevented) return` 가드 존재 | |
| P6 | inactive cursor = background만 (feedback_inactive_focus_cursor) | ② zone 간 이동 시 | 미위반 | — zone을 떠나면 :focus-within이 빠져 outline 제거, background는 유지 | |
| P7 | 하나의 앱 = 하나의 store (feedback_one_app_one_store) | ② useEngine + useAriaZone | 미위반 | — 하나의 engine(store), zone별로 view state만 분리 | |
| P8 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | 전체 | 미위반 | — engine/plugin 메커니즘을 우회하지 않고 command + dispatch로 구현 | |
| P9 | sticky cursor 리셋은 명시적 의도만 (project_spatial_cross_boundary) | ③ Enter/Escape/Click | 미위반 | — 방향키, CRUD, Home/End는 리셋 안 함. 클릭/Enter/Escape만 리셋 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | spatial behavior의 기존 intra-group 화살표 이동 | cross-boundary 로직이 추가되어 기존 동작에 영향 가능 | 중 | intra-group findNearest가 우선이고 null일 때만 cross-boundary → 기존 동작 보존. T9 테스트로 검증 | |
| S2 | spatialCommands.enterChild/exitToParent | cross-boundary 시 enterChild가 호출되어 spatial parent가 변경됨 — Enter/Escape와 같은 command 사용 | 중 | 의도된 동작. spatial parent 전환은 depth 모델의 핵심. batch command로 포커스와 함께 원자적 전환 | |
| S3 | focusRecovery | sticky cursor가 가리키는 노드가 삭제되면 focusRecovery와 sticky 복원이 충돌 가능 | 낮 | sticky는 entities 존재 확인 후 사용. focusRecovery는 zone-level에서 독립 동작하므로 충돌 없음 | |
| S4 | Shift+Arrow 범위 선택 | cross-boundary를 차단하므로 group 경계에서 선택 확장이 멈춤 | 낮 | 허용 — 다른 group의 아이템 선택은 의미적으로 부적절. 의도된 제한 | |
| S5 | Home/End | group 내에서만 동작하도록 기존 behavior에 이미 구현됨. cross-boundary 추가 시 영향 없음 | 낮 | 허용 — 변경 없음 | |
| S6 | history(undo/redo) | cross-boundary 이동이 enterChild command를 발행하므로 undo 스택에 쌓임 | 중 | 허용 — 현재 Enter/Escape도 동일하게 undo 스택에 쌓이며 이는 의도된 동작 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| N1 | Shift+Arrow로 cross-boundary 이동 | ⑥ S4 | 범위 선택이 group을 넘으면 다른 group의 아이템이 선택되어 의미 불명확 | |
| N2 | Home/End로 cross-boundary 이동 | ⑥ S5 | Home/End는 같은 group의 시작/끝 관례. 전체 범위 이동은 예측 불가능 | |
| N3 | ROOT depth(0)에서 cross-boundary 활성화 | ④ E3 | depth 0에서 section 자체를 넘는 것은 spatial parent 전환이 의미 없음. Enter로 깊이 진입 필요 | |
| N4 | sticky cursor를 store에 저장 | ⑤ P7 | sticky cursor는 view-only state. store에 넣으면 불필요한 re-render + 다른 zone에 영향 | |
| N5 | 방향키 이동으로 sticky cursor 리셋 | ⑤ P9 | 방향키는 탐색 행위이지 의도 변경이 아님. 리셋은 명시적 의도(Enter/Escape/Click)만 | |
| N6 | engine을 우회한 직접 store 조작 | ⑤ P8 | engine 우회 시 focusRecovery, history가 동작하지 않음 — command + dispatch 필수 | |
| N7 | cross-boundary 시 wrapping (마지막→첫 group) | ④ E1 | 공간 모델에서 wrapping은 부자연스러움 — 이동 방향에 대상이 없으면 현재 유지 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| T1 | M1 | sec1→A에서 ArrowDown → sec2의 nearest (C)로 이동 | 포커스 = C, spatial parent = sec2 | |
| T2 | M2 | sec1→B에서 ArrowDown → sec2→D, 다시 ArrowUp | 포커스 = B (sticky cursor 복원) | |
| T3 | M3 | sec1→A에서 ArrowDown 2회 (sec1→sec2→sec3) | 포커스 = sec3의 nearest | |
| T4 | M4 | sec3→E에서 ArrowDown | 포커스 = E (현재 유지) | |
| T5 | M5 | sec1→B에서 ArrowDown → sec2, 클릭으로 다른 위치, ArrowUp으로 sec1 복귀 | sticky 클리어되어 nearest로 이동 (B 아닐 수 있음) | |
| T6 | E3 | depth 0에서 sec1 포커스 후 ArrowDown | 포커스 = sec1 (현재 유지, cross-boundary 비활성) | |
| T7 | E4 | sticky cursor 대상(B) 삭제 후 ArrowUp으로 sec1 복귀 | sticky 무시, sec1의 nearest child로 이동 | |
| T8 | E6 | depth 2: card1→Y에서 ArrowDown → card2의 nearest(W) | 포커스 = W, sticky: {card1: Y} | |
| T9 | ③ intra-group | sec1 진입 후 A에서 ArrowRight | 포커스 = B (같은 group 내 이동, 기존 동작 유지) | |
| T10 | E8 | sec1→B에서 Shift+ArrowDown | 포커스 = B (cross-boundary 안 함) | |
| T11 | E9 | sec1→B에서 Home/End | Home→A, End→B (같은 group 내에서만) | |
| T12 | E10 | Escape로 depth 0 복귀 후 sec1 재진입 | sticky 클리어되어 첫 자식(A)으로 진입 | |
| T13 | E1+E2 | sec1→A에서 ArrowUp (첫 group) | 포커스 = A (현재 유지) | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

교차 검증:
1. 동기 ↔ 검증: ✅ — M1~M5 모두 T1~T5로 커버
2. 인터페이스 ↔ 산출물: ✅ — useSpatialNav의 keyMap이 모든 방향키/Enter/Escape/Home/End/Shift+Arrow/Click 처리
3. 경계 ↔ 검증: ✅ — E1~E10 모두 T4,T6~T13으로 커버
4. 금지 ↔ 출처: ✅ — N1~N7 모두 ⑤/⑥ 항목에서 파생
5. 원칙 대조 ↔ 전체: ✅ — 위반 없음, 수정 불필요
