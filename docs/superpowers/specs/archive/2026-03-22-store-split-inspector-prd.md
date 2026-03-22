# Store Split Inspector — PRD

> Discussion: Store 쇼케이스가 레퍼런스(정적)에 그쳐 있어 dogfooding 정체성이 부재. Explorer+Operations를 1페이지 Split Inspector로 통합하여 "os로 자기 자신을 들여다보는" 체험형 쇼케이스로 업그레이드.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | Store 쇼케이스(/store)에 방문한 사용자 | Explorer 페이지를 본다 | NormalizedData의 정적 구조만 보이고, 조작해도 내부가 어떻게 변하는지 알 수 없다 | |
| M2 | Store 쇼케이스에 방문한 사용자 | Operations 페이지를 본다 | 함수 시그니처만 나열되어 있고, 실제 동작을 체험할 수 없다 | |
| M3 | os의 아키텍처를 이해하려는 사용자 | Store 레이어의 역할을 파악하고 싶다 | 왼쪽에서 TreeGrid를 조작하면 오른쪽에서 NormalizedData(entities, relationships)가 실시간으로 변하는 것을 보고 store의 존재 이유를 체험한다 | |
| M4 | os의 아키텍처를 이해하려는 사용자 | 조작(create, delete, move 등)을 수행한다 | 하단에 실행된 operation 이름과 store diff가 로그로 표시되어 Operations 레퍼런스를 체험으로 대체한다 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `PageStoreInspector.tsx` | Split Inspector 메인 페이지. useEngine으로 공유 engine 생성. 3패널 레이아웃(좌: editor, 우: inspector, 하: log) | |
| `storeToTree.ts` | NormalizedData → NormalizedData 변환 함수. 실제 store를 "entities/relationships" 트리 구조의 store로 매핑하여 TreeGrid로 렌더링 가능하게 함 | |
| 삭제: `PageStoreExplorer.tsx` | Split Inspector로 대체 | |
| 삭제: `PageStoreOperations.tsx` | operation 로그 패널로 대체 | |
| 변경: `App.tsx` routeConfig | store 그룹 items를 inspector 1개로 변경. basePath → `/store/inspector` | |

### 레이아웃 구조

```
┌─────────────────────────────────────────────┐
│  page-header: Store Inspector               │
│  page-desc + page-keys                      │
├──────────────────────┬──────────────────────┤
│  Editor (zone)       │  Inspector (zone)    │
│  ─────────────       │  ─────────────       │
│  interactive TreeGrid│  readonly TreeGrid   │
│  useAriaZone         │  useAriaZone         │
│  scope='editor'      │  scope='inspector'   │
│  plugins: crud, dnd, │  plugins: core()     │
│   history,           │  behavior: treeview  │
│   focusRecovery      │  (read-only, expand  │
│  behavior: treegrid  │   only)              │
│                      │                      │
│  샘플 데이터:        │  entities/           │
│  파일 트리 등        │    __focus__ → ...   │
│                      │    item-1 → ...      │
│                      │  relationships/      │
│                      │    ROOT → [...]      │
├──────────────────────┴──────────────────────┤
│  Operation Log                              │
│  ─────────────                              │
│  #1 crud:create | addEntity(...) | +item-3  │
│  #2 crud:delete | removeEntity(...)| -item-1│
│  커스텀 Logger → LogEntry[] 상태로 캡처     │
└─────────────────────────────────────────────┘
```

### 데이터 흐름

```
useEngine(sampleData, plugins, { logger: captureLogger })
  ├── Left: useAriaZone({ engine, store, behavior: treegrid, scope: 'editor', plugins: [crud, dnd, history, focusRecovery] })
  ├── Right: storeToTree(store) → inspectorData, useAriaZone({ engine: inspectorEngine, store: inspectorData, behavior: treeview, scope: 'inspector' })
  └── Bottom: LogEntry[] state ← captureLogger가 매 dispatch마다 push
```

> **주의**: 오른쪽 Inspector는 왼쪽과 같은 engine을 공유하지 않는다. storeToTree()로 변환된 별도 NormalizedData를 독립 useAria/useAriaZone으로 렌더링한다. 공유하는 것은 "데이터"이지 "engine"이 아님.

완성도: 🟢

## ③ 인터페이스

> 3개 패널이 독립적. Editor=기존 treegrid behavior, Inspector=treeview(readonly), Log=비인터랙티브.

### Editor 패널 (왼쪽)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↑↓ | 포커스가 노드 N에 있음 | 이전/다음 visible 노드로 포커스 이동 | treegrid behavior의 navigate 축 | 포커스가 N±1로 이동. Inspector에 __focus__.focusedId 변화 반영. Log에 core:focus 기록 | |
| →  | 포커스가 접힌 부모 노드에 있음 | 노드 확장 | treegrid behavior의 expand 축 | 자식 노드 visible. Inspector에 __expanded__.expandedIds 변화 반영 | |
| ← | 포커스가 펼쳐진 부모 노드에 있음 | 노드 접기 | treegrid behavior의 expand 축 | 자식 숨김. Inspector의 expandedIds 갱신 | |
| ← | 포커스가 자식 노드에 있음 | 부모 노드로 포커스 이동 | treegrid behavior — 자식에서 ←는 부모로 이동 | 포커스 부모로 이동 | |
| Enter | 포커스가 노드 N에 있음 | 새 노드를 N의 형제로 생성 | crud 플러그인의 create 커맨드 | 새 엔티티 추가. Inspector entities에 새 항목, relationships 갱신. Log에 crud:create 기록 | |
| Del | 포커스가 노드 N에 있음 | N 삭제 (서브트리 포함) | crud 플러그인의 remove 커맨드 | 엔티티 삭제. Inspector에서 사라짐. Log에 crud:delete 기록. focusRecovery가 인접 노드로 포커스 복구 | |
| Alt+↑↓ | 포커스가 노드 N에 있음 | N을 형제 내에서 위/아래로 이동 | dnd 플러그인의 moveUp/moveDown | relationships 순서 변경. Inspector의 해당 부모 children 배열 갱신. Log에 dnd:move-up/down 기록 | |
| ⌘Z | 직전 조작을 수행한 상태 | 마지막 데이터 커맨드 undo | history 플러그인 | store가 이전 상태로 복원. Inspector 전체 갱신. Log에 history:undo 기록 | |
| ⌘⇧Z | undo 후 | redo | history 플러그인 | store 재적용. Inspector 갱신 | |
| Tab | 페이지에 포커스 있음 | Editor 패널로 포커스 진입 (또는 다음 패널로 이동) | 자연 탭 순서 — Editor container가 첫 tabstop | Editor 내 focusedId 노드에 포커스 | |
| Home | 포커스가 트리 중간에 있음 | 첫 번째 visible 노드로 이동 | treegrid behavior의 navigate 축 | 포커스 첫 노드로 | |
| End | 포커스가 트리 중간에 있음 | 마지막 visible 노드로 이동 | treegrid behavior의 navigate 축 | 포커스 마지막 노드로 | |
| Space | N/A | — | treegrid에서 Space는 select 축이나, 이 데모에서 multiselect 불필요 | N/A | |
| Escape | N/A | — | trap 축 없음 (단일 위젯, 모달 없음) | N/A | |
| 클릭 | 노드를 클릭 | 해당 노드로 포커스 이동 | onClick → core:focus dispatch | 포커스 이동 | |

### Inspector 패널 (오른쪽)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↑↓ | 포커스가 Inspector 내 노드에 있음 | 이전/다음 visible 노드로 이동 | treeview behavior의 navigate 축 | Inspector 내 포커스 이동 (Editor에 영향 없음) | |
| →← | 접힌/펼쳐진 그룹 노드(entities/, relationships/) | 확장/접기 | treeview behavior의 expand 축 | 그룹 하위 항목 표시/숨김 | |
| Tab | Editor에서 Tab | Inspector container로 포커스 이동 | 탭 순서: Editor → Inspector → Log(없으면 다음) | Inspector 내 focusedId에 포커스 | |
| Home/End | Inspector 내 포커스 있음 | 첫/마지막 visible 노드 | navigate 축 | 포커스 이동 | |
| Enter/Del/Alt+↑↓ | N/A | — | Inspector는 읽기 전용. 편집 플러그인 없음 | N/A | |

### Log 패널 (하단)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| (자동) | Editor에서 커맨드 dispatch | 새 LogEntry가 로그 목록 하단에 추가, 자동 스크롤 | 커스텀 Logger가 LogEntry를 state에 push | 최신 로그가 보임 | |

### 패널 간 연동 (핵심)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Editor에서 아무 데이터 커맨드 | store가 변경됨 | Inspector가 storeToTree(newStore)로 재렌더링 | Editor의 engine.onChange → setData → storeToTree 재계산 → Inspector 갱신 | Inspector 트리가 새 store 상태를 반영 | |
| Editor에서 아무 커맨드 | Log가 N개 항목 | Log에 N+1번째 항목 추가 | captureLogger가 LogEntry를 state에 push | 새 로그 행 표시 | |
| Editor에서 포커스 이동 | Inspector에 __focus__ 노드 표시 중 | Inspector의 __focus__ 노드 값이 갱신됨 | storeToTree가 메타 엔티티 값을 포함하여 변환 | __focus__.focusedId 값이 새 ID로 바뀌어 보임 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1. Editor에서 모든 노드 삭제 | entities가 비어감 | 빈 store도 유효한 NormalizedData — entities:{}, relationships:{ROOT:[]} | Inspector에 entities/(비어있음), relationships/ROOT→[] 표시. Editor는 focusRecovery가 fallback 실패 → 포커스 없음 | Inspector는 빈 트리, Editor는 빈 상태 | |
| E2. 대량 undo(연속 ⌘Z) | history 스택에 N개 항목 | history 플러그인이 스택 바닥까지 되돌림 | 초기 상태까지 복원. Inspector가 매 undo마다 갱신. Log에 history:undo가 N개 쌓임 | 초기 store 상태 | |
| E3. storeToTree 입력이 메타 엔티티만 있는 store | 사용자 엔티티 전부 삭제됨 | 메타 엔티티(__focus__ 등)도 store의 일부 — 빠짐없이 보여야 함 | Inspector에 entities/__focus__, __selection__, __expanded__ 등 메타 엔티티만 표시 | 메타 엔티티 트리 | |
| E4. Editor와 Inspector에 동시 포커스 시도 | Editor에 포커스 있음 | 독립 zone(scope 분리)이므로 DOM 포커스는 하나만 가능. 한쪽에 포커스하면 다른 쪽은 inactive cursor | Tab으로 패널 전환 시 이전 패널 포커스 해제, 새 패널 포커스 획득 | 활성 패널만 outline, 비활성은 background만 유지 | |
| E5. Log가 수백 개로 누적 | 사용자가 오래 조작 | 무한 증가하면 메모리/렌더 비용 증가 | 최근 N개(예: 50)만 표시. 오래된 것은 자동 제거 | Log 목록이 sliding window | |
| E6. batch command (예: crud:delete가 서브트리 재귀 삭제) | 여러 operation이 하나의 dispatch로 실행 | dispatchLogger가 이미 batch를 parent→children으로 분해하여 로깅 | Log에 부모 커맨드 1개 + 들여쓰기된 자식 커맨드들 표시 | batch 구조가 시각적으로 드러남 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② PageStoreInspector.tsx, storeToTree.ts | ✅ 준수 | — | |
| P2 | engine 우회 금지 (feedback_design_over_request) | ② Inspector가 os로 렌더링 | ✅ 준수 — Inspector도 useAria 사용, 날코딩 없음 | — | |
| P3 | 하나의 앱 = 하나의 store, 뷰만 분리 (feedback_one_app_one_store) | ② Editor와 Inspector 관계 | ⚠️ 검토 필요 — Editor의 engine store와 Inspector의 store가 별개. 하지만 Inspector는 "Editor의 store를 보여주는 별도 앱"이므로 각각 1 store 원칙은 준수 | — | |
| P4 | focusRecovery는 불변 조건 (feedback_focus_recovery_invariant) | ③ Editor에서 CRUD 시 | ✅ 준수 — Editor zone에 focusRecovery 플러그인 포함 | — | |
| P5 | inactive cursor: background만, outline은 :focus-within (feedback_inactive_focus_cursor) | ④ E4 두 패널 포커스 | ✅ 준수 — Tab으로 패널 전환 시 비활성 패널은 background만 | — | |
| P6 | 이벤트 버블링 가드 (feedback_nested_bubbling_guard) | ③ 패널 간 키보드 | ✅ 준수 — 독립 zone(scope 분리)이므로 이벤트 격리됨. defaultPrevented 가드는 각 zone 내부에서 동작 | — | |
| P7 | 테스트: 계산→unit, 인터랙션→통합 (feedback_test_strategy) | ⑧ 검증 | ✅ 적용 예정 — storeToTree는 unit, 패널 연동은 통합 테스트 | — | |
| P8 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② 컴포넌트/scope 이름 | ✅ 준수 — 'editor', 'inspector'는 도메인 용어, ARIA role은 treegrid/treeitem 그대로 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | App.tsx routeConfig — store 그룹 items 변경 | 기존 `/store/explorer`, `/store/operations` URL이 깨짐 | 낮 | `/store/inspector`로 변경. 외부 링크 없는 내부 쇼케이스이므로 redirect 불필요 | |
| S2 | PageStoreExplorer.tsx, PageStoreOperations.tsx 삭제 | import 참조 깨짐 (App.tsx) | 낮 | App.tsx에서 import 교체: PageStoreInspector로 변경 | |
| S3 | 사이드바 UI — store 그룹 항목이 2개→1개 | 사이드바에 항목 1개만 표시 | 낮 | 허용 (feedback_single_page_route_ok 원칙) | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | Inspector를 날코딩(직접 DOM/React)으로 렌더링 | ⑤ P2 engine 우회 금지 | dogfooding이 존재 이유. JSON.stringify나 커스텀 트리 렌더링은 Area에서 할 일 | |
| X2 | Editor와 Inspector가 같은 engine을 공유 | ⑤ P3 1앱=1store | Inspector는 storeToTree 변환 결과를 보여주는 별도 앱. Editor engine에 Inspector의 메타 엔티티가 섞이면 안 됨 | |
| X3 | Log 패널에 무제한 항목 누적 | ④ E5 | 메모리/렌더 비용 증가. sliding window(최근 50개)로 제한 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M3 실시간 반영 | Editor에서 Enter로 노드 생성 | Inspector entities/에 새 엔티티 출현 + relationships/ 해당 부모 children 배열에 새 ID 추가 | |
| V2 | ①M3 실시간 반영 | Editor에서 Del로 노드 삭제 | Inspector entities/에서 해당 엔티티 사라짐 + relationships/ 정리 | |
| V3 | ①M3 실시간 반영 | Editor에서 Alt+↓로 노드 이동 | Inspector relationships/ 해당 부모 children 배열 순서 변경 | |
| V4 | ①M3 메타 엔티티 | Editor에서 ↑↓로 포커스 이동 | Inspector __focus__.focusedId 값이 새 ID로 변경 | |
| V5 | ①M4 operation 로그 | Editor에서 Enter(create) | Log 패널에 crud:create 항목 추가 + addEntity diff 표시 | |
| V6 | ①M4 operation 로그 | Editor에서 ⌘Z(undo) | Log 패널에 history:undo 항목 추가 | 🔀 실제로는 history:__restore가 로그됨 — history 미들웨어가 undo를 인터셉트하여 __restore로 변환 후 dispatch |
| V7 | ④E1 빈 store | Editor에서 모든 노드 삭제 | Inspector entities/ 비어있음, relationships/ROOT→[] 표시. Editor 포커스 없음 | |
| V8 | ④E4 패널 전환 | Tab으로 Editor→Inspector 이동 | Editor inactive cursor(background만), Inspector 포커스 활성(outline) | |
| V9 | ④E5 로그 제한 | 50개 이상 조작 수행 | Log에 최근 50개만 표시, 오래된 항목 제거됨 | |
| V10 | ④E6 batch | Editor에서 서브트리 있는 노드 삭제 | Log에 부모 커맨드 + 들여쓰기된 자식 커맨드 표시 | |

### 테스트 분류

| 종류 | 대상 | 방법 |
|------|------|------|
| unit | storeToTree 변환 함수 | 입력 NormalizedData → 출력 NormalizedData 구조 검증 |
| 통합 | V1~V4 패널 연동 | userEvent로 Editor 키보드 조작 → Inspector DOM 상태 검증 |
| 통합 | V5~V6 로그 | userEvent로 Editor 조작 → Log 영역 텍스트 검증 |
| 통합 | V8 패널 전환 | userEvent.tab() → data-focused 속성 확인 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

**교차 검증:**
1. 동기 ↔ 검증: M1~M4 → V1~V10 커버 ✅
2. 인터페이스 ↔ 산출물: 3패널 구조 일치 ✅
3. 경계 ↔ 검증: E1~E6 → V7~V10 커버 ✅
4. 금지 ↔ 출처: X1←P2, X2←P3, X3←E5 ✅
5. 원칙 대조 ↔ 전체: 위반 없음 ✅
