# Workspace Sync — PRD

> Discussion: Workspace를 보편 데이터 구조로 삼고, syncFromExternal 순수 함수로 외부 데이터 연동. Chat/AgentViewer/Creator를 Workspace 기반으로 통합.

## ① 동기

### WHY

- **Impact**: 3개 페이지(Chat 60줄 양방향 sync, AgentViewer 자체 panes+SplitPane, Creator 중첩 SplitPane+useState)가 split/tab을 제각각 관리. 동일 패턴을 반복 구현하며, 레이아웃 변경·탭 관리·pane 정리 로직이 분산.
- **Forces**: workspace는 CRUD(addTab/removeTab/splitPane/resize)만 제공하고, "외부 데이터 배열 변경 → workspace 레이아웃 반영"의 표준 경로가 없음. 제약: UI 레이아웃(split/sizes/activeTab) = NormalizedData가 진실, 탭 내용(세션/파일) = 외부 데이터가 진실.
- **Decision**: syncFromExternal 순수 함수. 기각 대안: (B) hook 래퍼는 A 위의 편의층이라 A가 먼저. (C) 매번 derive는 사용자 커스터마이징(수동 split/resize) 손실로 탈락.
- **Non-Goals**: CMS tab-group 통합(treegrid 내부, Workspace 대상 아님). os axis 통합(drag/resize 축은 별도 과제). SplitPane/TabGroup 컴포넌트 자체 변경 없음.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Chat에 session 3개, workspace에 tab 2개 | 새 session 생성됨 | workspace에 tab 1개 추가, 기존 layout 보존 | ✅ 일치 |
| S2 | AgentViewer에 active session 2개 | 페이지 로드 | Workspace에 session당 tab 1개, 균등 split | 🔀 균등 split 없이 단일 tabgroup에 tab 추가 (split은 수동 Cmd+D) |
| S3 | Creator 페이지 진입 | 초기 렌더 | 고정 3-pane Workspace (Canvas \| Code \| Chat) | ✅ `PageComponentCreator.tsx::createCreatorWorkspace` |
| S4 | Chat workspace에 tab 3개 (split 상태) | 외부에서 session 삭제 | 해당 tab 제거, split 구조 자동 정리 | ✅ 일치 |
| S5 | AgentViewer에 file pane 열림 | close 버튼 클릭 | tab 제거, 남은 pane에 맞게 layout 조정 | ✅ 일치 |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `syncFromExternal` | workspaceStore.ts에 추가. 순수 함수: (workspace, items, toTab) → NormalizedData. 외부 아이템 배열과 workspace 탭의 contentRef를 diff하여 추가/제거 | ✅ `workspaceStore.ts::syncFromExternal` |
| PageAgentViewer 전환 | 자체 panes/sizes useState → Workspace + syncFromExternal. PaneHeader/PaneBody → renderPanel | ✅ `PageAgentViewer.tsx` |
| PageAgentChat 교체 | 60줄 양방향 useEffect sync → syncFromExternal 호출 1줄로 교체 | ✅ `PageAgentChat.tsx` (useMemo 1줄) |
| PageComponentCreator 전환 | 중첩 SplitPane + useState → Workspace + 고정 초기 레이아웃 (createCreatorWorkspace) | ✅ `PageComponentCreator.tsx::createCreatorWorkspace` |

⚠️ PRD에 없었으나 추가 구현됨:
- `splitAndAddTab` 헬퍼 — /simplify에서 중복 코드 추출
- `collectContentRefs` filter 옵션 — syncFromExternal 내부 재사용 + AgentViewer filter
- `ExternalItem` 인터페이스
- `CodePanel` 분리 — /simplify에서 sourceTab 상태 내부화
- chatStore `createSession` 반환타입 `void → string`

완성도: 🟢

## ③ 인터페이스

### syncFromExternal

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| items에 새 항목 존재 | workspace에 해당 contentRef 없음 | 첫 번째 tabgroup에 addTab | 외부 데이터 추가 = 탭 추가, tabgroup 선택은 findTabgroup으로 단순화 | tab 추가됨, layout 보존 | ✅ 일치 |
| items에서 항목 제거됨 | workspace에 해당 contentRef tab 존재 | removeTab 실행 | 외부 데이터 삭제 = 탭 제거, removeTab이 빈 tabgroup 정리와 split collapse를 이미 처리 | tab 제거됨, 빈 pane 자동 정리 | ✅ 일치 |
| items 순서 변경 | workspace tab 순서와 다름 | 무시 | layout은 workspace가 진실. 외부 순서는 탭 순서에 영향 없음 | 변경 없음 | ✅ 일치 |
| items 빈 배열 | workspace에 tab 존재 | 모든 tab removeTab | 외부 데이터 전부 삭제 = workspace 비움 | 빈 workspace (빈 tabgroup 1개) | ✅ 일치 |
| items 변경 없음 | workspace와 contentRef 일치 | 동일 NormalizedData 반환 | diff 결과 변경 없으면 불필요한 상태 갱신 방지 | 동일 참조 반환 | ✅ 일치 |
| toTab이 label 변경 반환 | 기존 tab의 label과 다름 | label 업데이트 (?) | 외부 메타데이터 변경 반영 — 이건 scope 내인가? | | ❌ 미구현 (scope 밖 확인) |

### Workspace 사용 페이지 공통

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Workspace onChange | tab 삭제됨 | 외부에 알림 (onTabRemoved 콜백 또는 diff 감지) | workspace에서 탭 닫기 = 외부 데이터 정리 필요 (Chat: closeSession) | 외부 데이터 동기화됨 | ✅ collectContentRefs diff로 구현 |
| Cmd+D (splitH) | 현재 workspace | splitPane + 새 tab/session 생성 | layout 키바인딩은 useLayoutKeys가 이미 처리, 외부 데이터 생성만 추가 | split 생성 + 새 tab | ✅ splitAndAddTab 헬퍼로 구현 |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: 동시에 여러 항목 추가 | workspace에 tabgroup 1개 | 한 번의 sync 호출로 batch 처리해야 루프 중간 상태 방지 | 모든 새 항목 addTab, 마지막 항목이 activeTab | 모든 tab 추가됨 | ✅ findTabgroup 1회 + loop |
| E2: split 상태에서 마지막 tab 제거 | split 2개 tabgroup, 한쪽에 tab 1개 | removeTab이 빈 tabgroup 정리 + split collapse 처리 (기존 로직) | split collapse, 남은 tabgroup만 존재 | 단일 tabgroup | ✅ 테스트 V4 통과 |
| E3: 외부 항목 0개 + workspace 비어있음 | 빈 workspace | createWorkspace 초기 상태 유지 | 빈 tabgroup 1개 유지 | 변경 없음 | ✅ 테스트 V5 통과 |
| E4: Creator 고정 레이아웃에서 사용자가 resize | sizes 변경됨 | resize는 workspace가 진실이므로 보존 | 다음 렌더에서 사용자 sizes 유지 | 레이아웃 보존 | ✅ Workspace onChange=setWsData |
| E5: AgentViewer polling으로 동일 sessions 반복 수신 | workspace와 contentRef 동일 | syncFromExternal이 동일 참조 반환 → setState no-op | 불필요한 리렌더 없음 | 변경 없음 | ✅ 테스트 V6 통과 |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 하나의 앱 = 하나의 store (feedback) | ② 각 페이지가 자체 workspace state | ⚠️ 주의 | 각 페이지는 자체 workspace useState를 갖되, 이는 "하나의 앱"이 아니라 "하나의 workspace 인스턴스"임. 위반 아님 — 각 라우트가 독립 앱 | ✅ 일치 |
| P2 | os 기반 개발 필수: UI 완성품 사용 (feedback) | ② AgentViewer/Creator가 SplitPane 직접 사용 | ✅ 위반 | 이번 PRD의 목적 자체가 이 위반 해소 | ✅ 해소됨 |
| P3 | 정규화 트리 순회로 UI 패턴 해결 (feedback) | ③ syncFromExternal이 NormalizedData 순회 | ✅ 준수 | — | ✅ 준수 |
| P4 | focusRecovery 불변 조건 (feedback) | ② Workspace 전환 시 focus 관리 | ⚠️ 확인 필요 | workspace plugin이 focusRecovery를 requires하므로 자동 보장 | ✅ Workspace 위임 |
| P5 | 이벤트 버블링 가드 (feedback) | ③ Workspace 내 중첩 키바인딩 | ✅ 준수 | useLayoutKeys + TabGroup의 기존 가드 유지 | ✅ 일치 |
| P6 | pages에서 useAria/useAriaZone 직접 사용 금지 (CLAUDE.md) | ② 전환 후 모든 페이지가 Workspace 컴포넌트만 사용 | ✅ 준수 | — | ✅ 준수 |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| B1 | PageAgentViewer의 PaneHeader/PaneBody 렌더링 | renderPanel으로 통합 시 PaneHeader(close 버튼)가 TabGroup 탭바로 이동 — 기존 pane 헤더 디자인 변경 | 중 | TabGroup이 이미 close 버튼 제공하므로 PaneHeader 삭제. PaneBody만 renderPanel로 매핑 | ✅ PaneHeader/PaneBody 삭제, renderPanel로 통합 |
| B2 | PageAgentViewer의 focusedIdx 기반 포커스 추적 | Workspace 전환 시 focusedIdx 제거 — split 키바인딩의 "어떤 pane이 활성인가" 판단 방식 변경 | 중 | findTabgroup(workspace data)로 활성 tabgroup 탐색, 또는 focus-within 기반 | ✅ findTabgroup + getEntityData로 activeTabId 탐색 |
| B3 | PageAgentChat의 chatStore 양방향 sync | sync 로직 교체 시 기존 동작(세션 삭제→탭 제거→split collapse) 회귀 가능 | 중 | syncFromExternal이 removeTab을 호출하므로 기존 collapse 로직 그대로. 테스트로 검증 | ✅ V2/V4 테스트 통과 |
| B4 | PageComponentCreator의 고정 레이아웃 | Workspace 트리 구조로 변환 시 초기 데이터 생성 필요. 사용자가 동적으로 pane 추가/제거 가능해짐 | 낮 | 의도적 허용 — Creator도 pane 분할/닫기가 유용. 초기 레이아웃만 createCreatorWorkspace로 고정 | ✅ 일치 |
| B5 | 기존 workspace.integration.test.tsx | syncFromExternal 추가로 기존 테스트 영향 없음 (새 함수 추가) | 낮 | 허용 | ✅ 865 테스트 전체 통과 |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | syncFromExternal에서 split/sizes 변경 | ⑤ P3 정규화 원칙 | 레이아웃은 workspace가 진실. sync는 탭만 diff | ✅ 준수 |
| F2 | 외부 아이템 순서로 탭 재정렬 | ① WHY Forces | 탭 순서는 사용자 조작의 결과, 외부 순서와 독립 | ✅ 준수 |
| F3 | AgentViewer에서 useAria/useAriaZone 직접 사용 | ⑤ P6 CLAUDE.md 규칙 | Workspace UI 완성품만 사용 | ✅ 준수 |
| F4 | syncFromExternal 내부에서 side effect | 순수 함수 설계 원칙 | 입력 → 출력, 외부 상태 변경 없음 | ✅ 준수 |
| F5 | Chat의 chatStore를 workspace 내부로 이동 | ① WHY Non-Goals | 외부 데이터는 외부가 진실. workspace는 레이아웃만 | ✅ 준수 |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | syncFromExternal에 새 item 추가 → workspace에 tab 생성됨 | addTab 호출, contentRef 일치 | ✅ `syncFromExternal.test.ts::V1: adds tabs for new external items` |
| V2 | S4 | syncFromExternal에서 item 제거 → workspace에서 tab 삭제됨 | removeTab 호출, split collapse 동작 | ✅ `syncFromExternal.test.ts::V2: removes tabs for items no longer in external list` |
| V3 | E1 | 동시 3개 항목 추가 → 3개 tab 한 번에 생성 | batch 처리, 마지막이 active | ✅ `syncFromExternal.test.ts::V3: batch adds multiple items, last becomes active` |
| V4 | E2 | split 상태에서 마지막 tab 제거 → split collapse | 단일 tabgroup으로 복귀 | ✅ `syncFromExternal.test.ts::V4: split collapses when last tab removed from one side` |
| V5 | E3 | 빈 items + 빈 workspace → 변경 없음 | 동일 참조 반환 | ✅ `syncFromExternal.test.ts::V5: empty items on empty workspace returns same reference` |
| V6 | E5 | 동일 items 반복 호출 → 동일 참조 반환 | referential equality | ✅ `syncFromExternal.test.ts::V6: no-change sync returns same reference` |
| V7 | S2 | AgentViewer: Workspace로 session 렌더링 | renderPanel에서 TimelineColumn 표시 | ⚠️ 통합 테스트 없음 (시각 검증 필요) |
| V8 | S5 | AgentViewer: tab close → pane 제거 | Workspace onChange → layout 조정 | ⚠️ 통합 테스트 없음 |
| V9 | S3 | Creator: 초기 3-pane workspace 렌더링 | 고정 split+tabgroup 구조 | ⚠️ 통합 테스트 없음 |
| V10 | B3 | Chat: session 삭제 → tab 제거 → chatStore 정리 | 회귀 없음, split collapse 동작 | ⚠️ 통합 테스트 없음 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

**교차 검증:** ✅ 통과 (동기↔검증, 인터페이스↔산출물, 경계↔검증, 금지↔출처, 원칙↔전체)
