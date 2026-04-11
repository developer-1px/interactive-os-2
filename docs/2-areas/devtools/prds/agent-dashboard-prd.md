# Agent Dashboard — PRD

> Discussion: Skill Kanban을 에이전트 대시보드로 재설계. 스킬 분류(Planning/Running/Done) → 사용자 관심사 분류(Waiting/Active/Done). "각 에이전트가 지금 어디서 뭘 하고 있는지 + 산출물 확인"이 핵심 Job.

## ① 동기

### WHY

- **Impact**: 여러 Claude Code 에이전트를 병렬 실행할 때, 각 세션의 진행 상황과 산출물을 한눈에 파악할 수 없다. 현재 칸반은 스킬 분류(Planning/Running/Done)로 나뉘어 "내가 뭘 해야 하지?"에 답하지 못한다.
- **Forces**: SSE 실시간 이벤트는 이미 수신 중이나, 카드에는 누적 통계만 반영되고 "지금 이 순간" 상태가 없다. TimelineEvent에 에러/대기 전용 필드가 없어 추론 기반 판별이 필요하다.
- **Assets**: useActiveSessions(세션 목록 + active 필드), subscribeTimeline(SSE), TimelineEvent(type/tool/filePath), 기존 UI 부품(StatusIndicator, BadgeIndicator, Panel, PanelHeader, TabList, FilePreview, SplitPane, MarkdownViewer)
- **Decision**: 컬럼을 사용자 관심사 기반(Waiting/Active/Done)으로 재분류. 3명의 기획 전문가(PM/UX/IA) 합의. 기각 대안: 5컬럼(대기/실행/확인필요/완료/빈종료) → 화면 분산으로 기각. 기존 3컬럼 유지+보강 → 분류 축 자체가 틀려서 기각.
- **Non-Goals**: 세션 간 handoff 체인 시각화 (v1 범위 외). 세션 CRUD (생성/삭제/이동). 모바일 반응형 (데스크톱 전용 도구).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 3개 에이전트가 병렬 실행 중 | 대시보드를 연다 | Active 컬럼에 3개 카드, 각각 현재 단계(계획/개발/리뷰)와 마지막 작업이 보인다 | |
| S2 | 에이전트 A가 사용자 질문을 던지고 대기 중 | 대시보드를 본다 | Waiting 컬럼에 에이전트 A 카드, 질문 내용이 primary로 노출된다 | |
| S3 | 에이전트 B가 커밋 후 종료됨 | Done 컬럼을 본다 | 커밋 메시지와 터치 파일이 카드에 보인다 | |
| S4 | 에이전트 C가 /clear만 치고 종료됨 | Done 컬럼을 본다 | 빈 세션은 기본 숨김, 필터로 표시 가능 | |
| S5 | Active 에이전트가 5분간 이벤트 없음 | 카드를 본다 | "무응답" 시각 단서(흐림/경고)가 표시된다 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `SkillKanban.tsx` 재작성 | Waiting/Active/Done 3컬럼. SessionCard에 currentActivity, phase 추가 | |
| `SkillKanban.css` 재작성 | 컬럼별 독립 스크롤, 상태별 시각 단서 | |
| `deriveAgentState()` | TimelineEvent[] → AgentState(waiting/active/done) + phase(planning/developing/reviewing) + currentActivity 판별 순수 함수 | |
| `SessionCard` 인터페이스 확장 | `agentState`, `phase`, `currentActivity`, `hasOutput`(커밋/파일 존재 여부) 필드 추가 | |

### 데이터 모델

```ts
type AgentState = 'waiting' | 'active' | 'done'
type Phase = 'planning' | 'developing' | 'reviewing'

interface SessionCard {
  // 기존
  id: string; label: string; skills: string[]; touchedFiles: string[]
  skillCount: number; toolCount: number; startTs: number; lastTs: number
  allMessages: ChatMessage[]
  // 신규
  agentState: AgentState
  phase: Phase
  currentActivity: string    // "SkillKanban.tsx 편집 중", "테스트 실행 중", "사용자 응답 대기"
  lastEventType: string      // 마지막 TimelineEvent.type
  hasOutput: boolean          // touchedFiles.length > 0 || git commit 존재
  isStale: boolean            // 5분+ 이벤트 없음
}
```

완성도: 🟢

## ③ 인터페이스

### 상태 판별 (deriveAgentState)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 세션 active=true, 마지막 이벤트=tool_use | — | deriveAgentState | 도구 실행 중 = 자율 진행 | active | |
| 세션 active=true, 마지막 이벤트=assistant, 5분 미만 | — | deriveAgentState | 어시스턴트가 응답했고 아직 기다리는 중 | waiting | |
| 세션 active=true, 마지막 이벤트=assistant, 5분+ | — | deriveAgentState | 오래 대기 = stale 표시 | waiting + isStale | |
| 세션 active=true, 마지막 이벤트=user | — | deriveAgentState | 사용자가 입력한 직후 = 곧 도구 실행 예상 | active | |
| 세션 active=false, hasOutput=true | — | deriveAgentState | 종료 + 산출물 있음 | done | |
| 세션 active=false, hasOutput=false | — | deriveAgentState | 종료 + 산출물 없음 = 빈 세션 | done (숨김 대상) | |

### Phase 판별

| 마지막 스킬 | Phase | 왜 | 역PRD |
|------------|-------|-----|-------|
| discuss, prd, plan, story, ia, wireframe, cast, conflict, ideal | planning | 기획/설계 단계 스킬 | |
| go, do, fix | developing | 구현/수정 단계 스킬 | |
| simplify, improve, use, improve-design, retrospect, close | reviewing | 검증/정리 단계 스킬 | |
| 스킬 없음 | planning | 아직 시작 안 함 | |

### currentActivity 도출

| 마지막 이벤트 | currentActivity 값 | 역PRD |
|-------------|-------------------|-------|
| tool_use, tool=Edit/Write, filePath 있음 | "{basename} 편집 중" | |
| tool_use, tool=Bash | "명령 실행 중" | |
| tool_use, tool=Grep/Glob/Read | "코드 탐색 중" | |
| tool_use, tool=Agent | "서브에이전트 실행 중" | |
| tool_use, tool=Skill, text 있음 | "/{text} 실행 중" | |
| assistant (대기) | 마지막 assistant 메시지 첫 60자 | |
| user | "입력 처리 중" | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 세션 0개 | 빈 화면 | 처음 접한 사용자에게 안내 필요 | "세션이 없습니다 — 스킬을 실행하면 여기에 표시됩니다" 빈 상태 메시지 | 빈 상태 | |
| Done 세션 50개+ | 스크롤 길어짐 | 빈 세션이 노이즈, 산출물 있는 것만 의미 | hasOutput=false 기본 숨김, 토글로 표시 | 필터 적용 | |
| SSE 연결 끊김 | 실시간 갱신 중단 | 사용자가 stale 데이터를 실시간으로 착각 | 연결 상태 표시 불필요 — useActiveSessions 10초 폴링이 fallback | 폴링 유지 | |
| 에이전트가 매우 빠르게 상태 전이 | active→waiting 깜빡임 | 빈번한 상태 변경이 시각적 혼란 | 상태 전이에 3초 debounce — 마지막 이벤트 기준 판정 | 안정적 표시 | |
| 동일 세션에서 planning→developing→reviewing 반복 | phase 계속 변경 | 스킬 여정이 길면 phase가 왔다갔다 | 마지막 스킬 기준 판정 (현재 로직 유지) | 최신 phase | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | ui_over_primitives — pages에서 primitives 직접 사용 금지 | ② 전체 | 현재 위반 중 (v2) | SkillKanban은 ui/ 컴포넌트만 사용. KanbanColumn/SessionCardView를 ui/ 레벨로 만들거나 기존 Kanban.tsx 활용 검토. 단, SkillKanban은 devtools 프로토타입이므로 pages 내 자체 구현 허용 | |
| 2 | all_state_normalized_command — useState 금지 | ② SessionCard 상태 | @useState-hatch 주석으로 이미 정당화됨 | SSE 스트림 + 타이머 상태는 OS store 대상이 아님. hatch 유지 | |
| 3 | accent_budget — accent 1채널 | ③ 상태별 시각 단서 | 위반 가능 | Waiting=accent outline (focus 수준), Active=neutral, Done=neutral. accent는 Waiting 컬럼 헤더에만 | |
| 4 | overlay_is_modal — 화면 가리면 modal | ② SessionDetailModal | 준수 | 기존 dialog 유지 | |
| 5 | interactive 축 필수 | ② 카드 클릭 | 현재 미비 | interactive: 'item' + 키보드 핸들러 추가 | |
| 6 | panels/items 사용 규칙 | ② 컬럼/카드 구조 | 현재 위반 | PanelHeader 사용 중. 카드는 devtools 전용이므로 items/ 승격 대신 pages 내 유지 허용 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | SkillKanban.tsx 전면 재작성 | 기존 SSE 구독 로직 깨질 수 있음 | 중 | extractSessionCard + SSE 핸들러는 기존 로직 보존, agentState/phase/currentActivity 필드만 추가 | |
| 2 | SessionCard 인터페이스 변경 | SessionDetailModal이 새 필드에 의존 | 저 | 모달은 기존 allMessages/touchedFiles만 사용, 새 필드는 카드 뷰에만 영향 | |
| 3 | SkillKanban.css 재작성 | kanban-fullscreen-dialog 등 모달 CSS | 저 | 모달 CSS는 유지, 컬럼/카드 CSS만 변경 | |
| 4 | useActiveSessions 공유 | LiveSessionPanel도 사용 | 없음 | useActiveSessions 인터페이스 변경 없음 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | Waiting 컬럼에 accent bg 사용 | ⑤#3 accent_budget | accent bg는 activate 전용. Waiting은 outline만 | |
| 2 | 세션 상태를 useState로 새로 추가 | ⑤#2 all_state_normalized_command | 기존 hatch 범위 내에서만. 새 useState 추가 금지 | |
| 3 | useActiveSessions API 변경 | ⑥#4 공유 의존 | LiveSessionPanel에 영향 | |
| 4 | 빈 세션을 완전 삭제/숨김 | ⑤ | 데이터는 보존, UI 필터만 | |
| 5 | style={} 사용 | ⑤ CLAUDE.md | ax()만 사용 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | 3개 active 세션 로드 | Active 컬럼에 3개 카드, 각각 phase 배지 표시 | |
| V2 | S2 동기 | active 세션의 마지막 이벤트가 assistant | Waiting 컬럼으로 분류, 질문 내용이 카드 primary | |
| V3 | S3 동기 | inactive 세션 + touchedFiles 존재 | Done 컬럼, 파일 목록 표시 | |
| V4 | S4 동기 | inactive 세션 + touchedFiles 비어있음 | Done 컬럼에서 기본 숨김 | |
| V5 | S5 동기 | active 세션 + 5분간 이벤트 없음 | isStale=true, 시각적 경고 표시 | |
| V6 | 경계#1 | 세션 0개 | 빈 상태 메시지 표시 | |
| V7 | 경계#4 | SSE에서 1초 간격 이벤트 | 상태 debounce, 깜빡임 없음 | |
| V8 | ③ Phase | discuss 실행 중 세션 | phase=planning 배지 | |
| V9 | ③ Phase | go 실행 중 세션 | phase=developing 배지 | |
| V10 | ③ currentActivity | Edit tool_use + filePath | "파일명 편집 중" 표시 | |
| V11 | ③ 상태 전이 | active 세션이 비활성화됨 | Waiting/Active → Done으로 이동 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
