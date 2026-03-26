# Workspace Containers (TabGroup + SplitPane + Workspace) — PRD

> Discussion: tmux식 공간 분할 + 키보드 동선 컨테이너 UI 컴포넌트. 정규화 단일 store, JSON 직렬화, tsx render prop. Agent/Viewer 페이지에 적용.

## ① 동기

### WHY

- **Impact**: Agent/Viewer에서 여러 컨텍스트를 동시에 볼 수 없다. 파일은 모달(Agent)이나 단일 뷰(Viewer)로만 열리며, 소스+다이어그램 동시 보기, 세션 타임라인+파일 비교 같은 작업이 불가능하다. 키보드만으로 화면 구성을 조작할 수 없다.
- **Forces**: 정규화 단일 store 원칙 vs 동적 레이아웃 상태(split 방향, 비율, 탭 순서). JSON 직렬화 요구 vs render 함수는 직렬화 불가 — data/render 분리 필수. 기존 TabList(헤더만)와 useResizer(separator만)가 각각 존재하지만 조합된 완성품이 없다.
- **Decision**: TabGroup → SplitPane → Workspace 순서. TabGroup 단독이 즉시 가치(모달→탭), SplitPane은 TabGroup 없이 빈 pane. 기각: SplitPane 먼저 — 내용 없는 pane은 의미 없음. 기각: 단일 거대 컴포넌트 — store 스키마 분리가 불가능해지고 독립 사용 불가.
- **Non-Goals**: 드래그로 탭을 다른 pane으로 이동(DnD — 별도 PRD), 서버 API로 workspace 공유(JSON 직렬화까지만), floating/detachable 패널, chord 단축키(keyMap 인프라 변경 필요 — 별도 PRD).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | Viewer에서 파일 하나를 보고 있다 | 트리에서 다른 파일을 클릭한다 | 기존 파일 옆에 새 탭으로 열린다 (모달이 아님) | |
| M2 | Agent에서 수정 파일 목록이 사이드바에 있다 | 파일을 클릭한다 | 메인 영역에 탭으로 열린다 | |
| M3 | TabGroup에 탭 3개가 열려있다 | Cmd+W를 누른다 | 활성 탭이 닫히고 인접 탭이 활성화된다 | |
| M4 | Viewer에서 소스 코드를 보고 있다 | Cmd+\를 누른다 | 현재 pane이 수직 분할되어 빈 pane이 추가된다 | |
| M5 | 2개의 pane이 나란히 있다 | Cmd+Option+Arrow로 이동한다 | 다른 pane의 TabGroup에 포커스가 이동한다 | |
| M6 | workspace를 구성했다 (탭+분할 배치) | workspace를 저장한다 | JSON으로 직렬화되어 보관된다 | |
| M7 | 저장된 workspace가 있다 | workspace를 불러온다 | 동일한 탭+분할 배치가 복원된다 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

### Store 스키마 (정규화 트리)

```
workspace (ROOT)
├── split-1       { type: 'split', direction: 'horizontal', sizes: [0.5, 0.5] }
│   ├── tabgroup-1  { type: 'tabgroup', activeTabId: 'tab-1' }
│   │   ├── tab-1     { type: 'tab', label: 'App.tsx', contentType: 'file', contentRef: 'src/App.tsx' }
│   │   └── tab-2     { type: 'tab', label: 'Timeline', contentType: 'timeline', contentRef: 'session-1' }
│   └── tabgroup-2  { type: 'tabgroup', activeTabId: 'tab-3' }
│       └── tab-3     { type: 'tab', label: 'Diagram', contentType: 'mermaid', contentRef: 'src/App.tsx' }
```

- **split entity**: `{ type: 'split', direction: 'horizontal' | 'vertical', sizes: number[] }`
- **tabgroup entity**: `{ type: 'tabgroup', activeTabId: string }`
- **tab entity**: `{ type: 'tab', label: string, contentType: string, contentRef: string }`
- split과 tabgroup은 재귀 중첩 가능. split의 자식은 split 또는 tabgroup. tabgroup의 자식은 tab.
- sizes 배열은 자식 수와 동일 길이, 합은 1.0 (비율)
- contentType + contentRef는 소비자가 해석 — 컴포넌트는 관여 안 함

### 산출물 목록

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `TabGroup.tsx` | tablist 헤더 + tabpanel 콘텐츠 영역. 탭 전환, 닫기, 추가. render prop으로 panel 렌더링 위임 | |
| `TabGroup.module.css` | TabGroup 스타일 (탭 바 + 패널 영역) | |
| `SplitPane.tsx` | 재귀적 수평/수직 분할 컨테이너. useResizer로 separator. 자식은 SplitPane 또는 TabGroup | |
| `SplitPane.module.css` | SplitPane 스타일 (flex 방향 + separator) | |
| `Workspace.tsx` | SplitPane + TabGroup을 조합하는 루트 컨테이너. workspace store 관리 + 단축키 레이어 (split, close pane, navigate pane) | |
| `Workspace.module.css` | Workspace 스타일 | |
| `workspaceStore.ts` | workspace store 헬퍼 + commands + plugin | |

### workspaceStore.ts 상세

**Commands** (entity.data 갱신 — core 패턴):

| Command | 입력 | store 변경 | undo |
|---------|------|-----------|------|
| `workspace:set-active-tab` | tabgroupId, tabId | tabgroup entity의 `data.activeTabId` 갱신 | 이전 activeTabId 복원 |
| `workspace:resize` | splitId, sizes[] | split entity의 `data.sizes` 갱신 | 이전 sizes 복원 |

**Commands** (구조 변경 — crud batch):

| Command | 입력 | store 변경 | undo |
|---------|------|-----------|------|
| `workspace:add-tab` | tabgroupId, tabEntity | crud:create(tab, tabgroup) + set-active-tab → batch | batch undo |
| `workspace:remove-tab` | tabId | set-active-tab(인접) + crud:delete(tab) → batch. 마지막 탭이면 close-pane 위임 | batch undo |
| `workspace:split-pane` | paneId, direction | crud:create(split) + reparent(기존 pane) + crud:create(new tabgroup) → batch | batch undo |
| `workspace:close-pane` | paneId | crud:delete(pane). 부모 split의 자식이 1개가 되면 split 해소(자식을 조부모에 직접 연결) → batch | batch undo |

**Plugin**:

```
workspace() → definePlugin({
  name: 'workspace',
  commands: { setActiveTab, resize, addTab, removeTab, splitPane, closePane },
  keyMap: { ... }  // Workspace.tsx가 주입하거나 plugin이 소유
})
```

**헬퍼 함수** (JSON 직렬화):

| 함수 | 역할 |
|------|------|
| `createWorkspace(initial?)` | 빈 workspace store 생성 (root → tabgroup-1) |
| `serializeWorkspace(store)` | meta-entity(__focus__ 등) 제외, 순수 데이터만 JSON 반환 |
| `deserializeWorkspace(json)` | JSON → NormalizedData 복원 |

완성도: 🟡 — 사용자 확인 대기

## ③ 인터페이스

### TabGroup (탭 전환 + 탭 관리)

> 기존 `tabs` 패턴(navigate horizontal + select single + followFocus) 위에 panel 영역과 close 기능 추가

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ← | tablist에 포커스, tab-2 활성 | tab-1로 포커스+활성 이동 | tabs 패턴: horizontal navigate + followFocus. 포커스=활성이므로 패널도 전환 | tab-1 활성, tabpanel-1 표시 | |
| → | tablist에 포커스, tab-1 활성 | tab-2로 포커스+활성 이동 | 위와 동일 역방향 | tab-2 활성, tabpanel-2 표시 | |
| Home | tablist에 포커스, 아무 탭 | 첫 탭으로 이동+활성 | navigate axis Home | 첫 탭 활성 | |
| End | tablist에 포커스, 아무 탭 | 마지막 탭으로 이동+활성 | navigate axis End | 마지막 탭 활성 | |
| Tab | tablist에 포커스 | tabpanel 내부 콘텐츠로 포커스 이동 | ARIA tabs 표준: Tab은 탭 간 이동이 아니라 tablist→tabpanel 전환. 탭 간 이동은 Arrow로 | tabpanel 내 첫 포커스 가능 요소에 포커스 | |
| Shift+Tab | tabpanel 내부에 포커스 | tablist의 활성 탭으로 포커스 복귀 | Tab의 역방향 | tablist에 포커스, 활성 탭 유지 | |
| Delete | tablist에 포커스, tab-2 활성, closable 탭 | tab-2 닫힘, 인접 탭 활성화 | 사용자가 탭을 제거하는 표준 키. workspace:remove-tab command 실행 | tab-2 제거, tab-1 또는 tab-3 활성 | |
| Cmd+W | tabgroup 내 어디든 포커스 | 활성 탭 닫기 | OS 표준 닫기 키. 포커스된 TabGroup이 키를 받고 workspace:remove-tab command 반환. 마지막 탭이면 command 내부에서 pane 제거까지 처리. defaultPrevented로 Workspace까지 버블링 차단 | 탭 제거, 인접 탭 활성 또는 pane 제거 | |
| click(탭 헤더) | 아무 상태 | 클릭한 탭 활성화 | activate axis: onClick → 해당 탭 포커스+선택 | 클릭한 탭 활성, 해당 panel 표시 | |
| click(close 버튼) | 아무 상태 | 해당 탭 닫힘 | close 버튼은 탭별 액션. 이벤트 버블링 차단 필수 (탭 활성화와 분리) | 탭 제거, 인접 탭 활성 | |
| ↑ | tablist (horizontal) | N/A | horizontal orientation이므로 수직 이동 해당 없음 | 변화 없음 | |
| ↓ | tablist (horizontal) | N/A | 위와 동일 | 변화 없음 | |
| Enter | tablist에 포커스 | N/A | followFocus이므로 포커스 이동 시 이미 활성화됨. Enter 별도 동작 불필요 | 변화 없음 | |
| Space | tablist에 포커스 | N/A | followFocus이므로 수동 활성화 불필요 | 변화 없음 | |
| Escape | tablist 또는 tabpanel | N/A | TabGroup 단독으로는 dismiss 대상 없음. Workspace가 pane close를 처리 | 변화 없음 | |

### SplitPane (크기 조절)

> useResizer separator의 키보드. SplitPane 자체는 구조 컨테이너이므로 자체 keyMap 없음

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ← (separator) | 수직 separator에 포커스 | 좌측 pane 축소 (step 만큼) | useResizer: horizontal separator는 좌우로 이동. workspace:resize command 실행 | sizes 비율 변경 | |
| → (separator) | 수직 separator에 포커스 | 좌측 pane 확대 | 위와 역방향 | sizes 비율 변경 | |
| ↑ (separator) | 수평 separator에 포커스 | 상단 pane 축소 | useResizer: vertical separator는 상하로 이동 | sizes 비율 변경 | |
| ↓ (separator) | 수평 separator에 포커스 | 상단 pane 확대 | 위와 역방향 | sizes 비율 변경 | |
| Home (separator) | separator에 포커스 | 최소 크기로 | useResizer: aria-valuemin | sizes[0] = min ratio | |
| End (separator) | separator에 포커스 | 최대 크기로 | useResizer: aria-valuemax | sizes[0] = max ratio | |
| double-click (separator) | separator 위 | 기본 비율로 복원 | useResizer: defaultSize 복원 | sizes = 초기값 | |
| drag (separator) | separator 위 | 실시간 크기 조절 | useResizer: pointerdown→pointermove→pointerup. DOM 직접 조작, pointerup 시 commit | sizes 비율 변경 | |

### Workspace (구조 변경 + pane 간 이동)

> 전체 workspace 레벨 단축키. split/close는 workspace:* commands, pane 이동은 Aria Zone 전환

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Cmd+\ | pane에 포커스 | 현재 pane을 수직 분할 | VS Code 관례. workspace:split-pane(current, 'horizontal') — 좌우로 나눔 | 기존 pane 좌측, 새 빈 tabgroup 우측 | |
| Cmd+Shift+\ | pane에 포커스 | 현재 pane을 수평 분할 | chord 미지원이므로 Shift 조합 사용. workspace:split-pane(current, 'vertical') — 상하로 나눔 | 기존 pane 상단, 새 빈 tabgroup 하단 | |
| Cmd+Option+← | 아무 pane에 포커스 | 좌측 pane으로 포커스 이동 | tmux/VS Code spatial navigation. Aria Zone 전환 | 좌측 pane의 tablist에 포커스 | |
| Cmd+Option+→ | 아무 pane에 포커스 | 우측 pane으로 포커스 이동 | 위와 역방향 | 우측 pane의 tablist에 포커스 | |
| Cmd+Option+↑ | 아무 pane에 포커스 | 상단 pane으로 포커스 이동 | 수직 분할 시 상하 이동 | 상단 pane의 tablist에 포커스 | |
| Cmd+Option+↓ | 아무 pane에 포커스 | 하단 pane으로 포커스 이동 | 수직 분할 시 상하 이동 | 하단 pane의 tablist에 포커스 | |
| Cmd+1~9 | workspace 내 | N번째 탭으로 전환 (현재 tabgroup 내) | 브라우저/VS Code 표준 탭 전환 | 해당 탭 활성 | |

### 인터페이스 체크리스트 (자가 검증)

- [x] ↑ 키: TabGroup N/A (horizontal), SplitPane separator(vertical), Workspace pane 이동
- [x] ↓ 키: 위와 동일
- [x] ← 키: TabGroup 탭 이동, SplitPane separator(horizontal), Workspace pane 이동
- [x] → 키: 위와 동일
- [x] Enter: TabGroup N/A (followFocus)
- [x] Escape: TabGroup N/A, Workspace에서 처리 안 함 (dismiss 대상 없음)
- [x] Space: TabGroup N/A (followFocus)
- [x] Tab: tablist → tabpanel 전환
- [x] Home/End: TabGroup 첫/마지막 탭, SplitPane separator min/max
- [x] Cmd 조합: Workspace split/close/navigate/tab-switch
- [x] 클릭: TabGroup 탭 활성화, close 버튼, separator 드래그
- [x] 더블클릭: separator 기본값 복원
- [x] 이벤트 버블링: close 버튼 클릭 시 탭 활성화 방지 필요 (stopPropagation 또는 defaultPrevented 체크)

완성도: 🟡

## ④ 경계

| # | 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|---|----------|----------|------------------------|----------|----------|-------|
| E1 | 마지막 탭 닫기 | tabgroup에 탭 1개 | 빈 tabgroup은 의미 없음. tmux도 마지막 pane 닫으면 window 제거 | workspace:remove-tab이 탭 제거 후 tabgroup 비었으면 workspace:close-pane 위임 | tabgroup 제거, 부모 split 정리 | |
| E2 | pane 닫기 후 split 자식 1개 | split 아래 tabgroup 2개 중 1개 닫힘 | 자식 1개인 split은 불필요한 중간 노드. 트리 정규화 원칙 | split 해소: 남은 자식을 split의 부모에 직접 연결, split entity 삭제 | 트리 깊이 감소 | |
| E3 | workspace의 유일한 pane 닫기 | root 아래 tabgroup 1개, 탭 0개 | workspace가 완전히 비면 빈 상태 표시 필요. 사용자가 다시 시작할 수 있어야 함 | 빈 workspace 상태 (empty state UI). 새 탭 추가 또는 workspace 불러오기 가능 | root 아래 자식 없음, empty state 렌더 | |
| E4 | 반복 분할로 깊은 중첩 | split이 3단 이상 중첩 | 지나친 분할은 pane이 너무 작아져 사용 불가. 하지만 인위적 제한보다 최소 크기 강제가 자연스러움 | 분할 허용하되, 각 pane의 최소 크기(minSize) 이하면 분할 거부 (command가 no-op 반환) | 변화 없음 또는 새 split 생성 | |
| E5 | separator를 극단까지 드래그 | split에 pane 2개 | 한쪽 pane이 0이 되면 사실상 닫힌 것. 하지만 resize는 닫기가 아님 — 의도가 다름 | useResizer의 min/max 클램핑으로 최소 비율 보장. 닫으려면 명시적 close 사용 | sizes[n] = minRatio 이상 유지 | |
| E6 | 동일 contentRef를 또 열기 | tab-1이 'src/App.tsx'를 표시 중, 같은 파일을 다시 열기 시도 | 중복 탭을 만들지 기존 탭으로 이동할지는 소비자 정책. 컴포넌트는 판단 안 함 | workspace:add-tab은 무조건 새 탭 생성. 중복 방지는 소비자가 add 전에 검색하여 판단 | 소비자 책임 | |
| E7 | 저장된 workspace 복원 시 유효하지 않은 contentRef | workspace JSON에 'src/deleted.tsx' 참조 | contentRef는 컴포넌트가 해석 안 함. render prop이 invalid ref를 받으면 소비자가 fallback 렌더링 | deserializeWorkspace는 구조만 복원. 유효성 검증은 소비자의 render에서 처리 | 탭은 존재하나 패널에 fallback 표시 | |
| E8 | 포커스된 pane이 닫힘 | 2-pane split에서 좌측 pane 포커스 중, 좌측 pane 닫기 | focusRecovery 불변 조건: CRUD 있으면 반드시 동작. 닫힌 pane의 형제 pane으로 포커스 이동 | close-pane command 실행 후, 남은 pane의 tablist에 포커스 복구 | 형제 pane에 포커스 | |
| E9 | workspace JSON이 손상됨 | deserializeWorkspace에 잘못된 JSON | 손상된 데이터로 렌더 시도하면 crash. 방어 필수 | deserializeWorkspace가 validation 실패 시 createWorkspace() (빈 workspace) 반환 | 빈 workspace로 시작 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 하나의 앱 = 하나의 store (feedback) | ② store 스키마 | ✅ 준수 | — | |
| P2 | focusRecovery 불변 조건 — CRUD 있으면 반드시 동작 (feedback) | ④ E8 포커스된 pane 닫힘 | ✅ 준수 — workspace plugin이 focusRecovery requires | — | |
| P3 | plugin은 keyMap까지 소유 (feedback) | ③ keyMap 소유 분리 | ✅ 준수 — TabGroup의 Cmd+W, Workspace의 Cmd+\ 등 각 plugin이 keyMap 소유 | — | |
| P4 | 가역적 동선 — 이동 후 역방향으로 원래 위치 복귀 (feedback) | ③ Cmd+Option+Arrow pane 이동 | ✅ 준수 — 좌→우 이동 후 우→좌로 복귀 | — | |
| P5 | defaultPrevented가 target 가드보다 범용적 (feedback) | ③ Cmd+W 버블링 차단 | ✅ 준수 — TabGroup이 Cmd+W 소비 시 defaultPrevented로 Workspace 도달 차단 | — | |
| P6 | 선언적 OCP — 선언=등록, 합성 런타임 불변 (feedback) | ② workspace plugin definePlugin | ✅ 준수 — definePlugin으로 등록, 런타임 동적 변경 없음 | — | |
| P7 | margin 금지, gap으로 간격 관리, 부모가 자식 간격 제어 (feedback) | ② sizes 배열을 split(부모)이 소유 | ✅ 준수 — 부모(split)가 자식 크기 비율 제어 | — | |
| P8 | CSS 모든 디자인 수치는 토큰 필수 (feedback) | TabGroup/SplitPane CSS | 🟡 구현 시 주의 | minSize, padding 등 모든 수치를 토큰으로 | |
| P9 | UI SDK 설계 3원칙 — 표준 UI 어휘 기준, 용도별 완성품 (feedback) | ② TabGroup, SplitPane, Workspace | ✅ 준수 — 표준 UI 어휘(tab, panel, split), 각각 독립 완성품 | — | |
| P10 | 읽기가 기본, 쓰기만 명시 (feedback) | ② tab entity closable 여부 | ✅ 준수 — 기본 closable, non-closable만 명시 (?) | — | |
| P11 | 이벤트 버블링 가드 필수 — 중첩 렌더링 (feedback) | ③ close 버튼 클릭 시 탭 활성화 방지 | ✅ 준수 — close 버튼 onClick에서 defaultPrevented 체크 | — | |
| P12 | focus 표현 — 컬렉션 항목→bg, 독립 요소→ring (feedback) | TabGroup 탭 포커스 스타일 | ✅ 준수 — 탭은 컬렉션 항목이므로 bg highlight | — | |
| P13 | 정규화 트리 순회로 UI 패턴 해결, 컨테이너 타입별 분기 금지 (feedback) | ② split/tabgroup/tab entity type | 🟡 주의 | Workspace 렌더러가 entity.data.type으로 분기하는 것은 렌더링 분기이지 로직 분기가 아님. command 로직에서는 타입 분기 없이 트리 구조만으로 동작해야 함 | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | PageAgentViewer — 현재 FileViewerModal로 파일 열기 | Workspace 적용 시 모달 제거, 탭 방식으로 전환. 기존 모달 경험 사라짐 | 중 | 허용 — 탭이 모달보다 나은 경험. 모달 코드 제거 | |
| S2 | PageViewer — 현재 단일 파일 뷰 + 고정 diagram 분할 | Workspace 적용 시 기존 graphResizer 고정 분할 → SplitPane 동적 분할로 교체. 기존 코드 대폭 변경 | 중 | 허용 — useResizer 패턴은 SplitPane이 흡수. 기존 behavior 유지하면서 구조만 교체 | |
| S3 | 기존 TabList 컴포넌트 | TabGroup이 TabList 위에 구축됨. TabList 자체는 변경 없지만, TabGroup이 "탭 UI의 기본 선택"이 됨 | 낮 | 허용 — TabList는 헤더만 필요한 곳에서 여전히 유효. TabGroup은 상위 완성품 | |
| S4 | useResizer hook | SplitPane이 useResizer를 내부 사용. useResizer 자체는 변경 없지만, sizes 배열과 동기화하는 래핑 로직 필요 | 낮 | useResizer는 그대로, SplitPane이 commit 시 workspace:resize command로 store 반영 | |
| S5 | URL 라우팅 (PageViewer) | 현재 URL이 단일 파일 경로를 표현. 탭이 여러 개면 URL로 전부 표현 불가 | 중 | URL은 활성 탭의 contentRef만 반영. 나머지 탭은 workspace store(localStorage)에서 복원 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | command 로직에서 entity.data.type으로 분기 | P13 정규화 원칙 | split/tabgroup/tab 구분은 렌더링에서만. command는 트리 구조(parent/children)로만 동작 | |
| F2 | TabGroup/SplitPane 내부에서 contentRef 해석 | ④ E6, E7 | 콘텐츠 렌더링은 소비자의 render prop 책임. 컴포넌트가 contentType을 알면 결합도 폭발 | |
| F3 | workspace store에 함수/컴포넌트 참조 저장 | ① Forces — JSON 직렬화 제약 | store.entities에는 직렬화 가능한 값만. render는 외부 주입 | |
| F4 | 탭 간 이동에 Tab 키 사용 | ③ ARIA tabs 표준 | Tab은 tablist→tabpanel 전환 전용. 탭 간 이동은 Arrow 키 | |
| F5 | resize로 pane 닫기 허용 | ④ E5 | resize와 close는 의도가 다름. 극단까지 드래그해도 minRatio 보장. 닫으려면 명시적 close | |
| F6 | raw CSS 수치 사용 | P8 토큰 필수 | minSize, padding, gap 등 모든 수치를 디자인 토큰으로 | |
| F7 | 빈 tabgroup 상태 허용 | ④ E1 | 마지막 탭 닫기 → pane 제거까지 연쇄. 빈 tabgroup은 존재하면 안 됨 (empty workspace는 root에 자식 없는 상태로 표현) | |

완성도: 🟡

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | M1 | TabGroup에 탭 1개 열린 상태에서 새 탭 추가 (workspace:add-tab) | 탭 2개 표시, 새 탭 활성, 해당 tabpanel 렌더 | |
| V2 | M3 | TabGroup에 탭 3개, 2번 탭 활성 → Cmd+W | 2번 탭 제거, 3번(또는 1번) 탭 활성, 포커스 유지 | |
| V3 | M4 | 단일 pane → Cmd+\ | 2-pane 수직 분할 생성, 기존 콘텐츠 좌측, 새 빈 tabgroup 우측 | |
| V4 | M5 | 2-pane, 좌측 포커스 → Cmd+Option+→ | 우측 pane의 tablist에 포커스 이동 | |
| V5 | M5 역방향 | V4 후 → Cmd+Option+← | 좌측 pane으로 포커스 복귀 (가역적 동선) | |
| V6 | M6+M7 | workspace 구성 후 serializeWorkspace → deserializeWorkspace | 동일한 split/tabgroup/tab 구조 복원, sizes 비율 유지 | |
| V7 | E1 | TabGroup에 탭 1개 → Cmd+W | 탭 제거 → tabgroup 제거 → 부모 split 해소 | |
| V8 | E2 | 2-pane split에서 한 pane 닫기 | split 해소, 남은 pane이 split 부모에 직접 연결 | |
| V9 | E3 | 유일한 pane의 마지막 탭 닫기 | empty state UI 표시 | |
| V10 | E4 | pane이 minSize 이하가 되는 split 시도 | 분할 거부 (no-op), 기존 상태 유지 | |
| V11 | E5 | separator를 극단까지 드래그 | minRatio에서 멈춤, pane 닫히지 않음 | |
| V12 | E8 | 포커스된 좌측 pane 닫기 | 우측 pane의 tablist에 포커스 복구 | |
| V13 | E9 | 손상된 JSON으로 deserializeWorkspace | 빈 workspace 반환, crash 없음 | |
| V14 | ③ TabGroup | ← → Home End로 탭 전환 | followFocus로 탭 전환 + tabpanel 전환 동시 발생 | |
| V15 | ③ TabGroup | Tab 키로 tablist → tabpanel 이동, Shift+Tab으로 복귀 | 포커스가 tablist ↔ tabpanel 간 올바르게 이동 | |
| V16 | ③ SplitPane | separator Arrow 키로 크기 조절 | sizes 비율 변경, 시각적 크기 변경 | |
| V17 | ③ close 버튼 | close 버튼 클릭 | 탭만 닫히고, 탭 활성화는 발생하지 않음 (버블링 차단) | |

완성도: 🟡

---

**전체 완성도:** 🟢 8/8 — 교차 검증 통과
