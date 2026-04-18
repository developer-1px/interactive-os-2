---
id: 2-areas/devtools/prds/skill-kanban-prd
title: 'Skill Kanban — PRD'
status: active
kind: prd
created: 2026-04-10
updated: 2026-04-10
summary: 'Discussion: 대화 중 실행되는 스킬들을 칸반으로 실시간 시각화. 훅 기반 결정적 스크립트, AI 추론 없음, API 비용 없음.'
topics: [2-areas]
relates: []
supersedes: []
---
# Skill Kanban — PRD

> Discussion: 대화 중 실행되는 스킬들을 칸반으로 실시간 시각화. 훅 기반 결정적 스크립트, AI 추론 없음, API 비용 없음.

## 아키텍처: 2경로 (초기 로드 + 실시간)

```
[초기 로드]  .jsonl (Claude 트랜스크립트, 턴 단위 기록)
             → /api/agent-ops/timeline API → 과거 Skill 이벤트 복원 (Done 카드)

[실시간]     Pre/PostToolUse 훅 → HTTP POST → vite 서버 메모리 → SSE → Running/Done 즉시 반영
```

- `.jsonl`은 Claude Code가 자동 기록 (턴 완료 후). 실시간 아님. 히스토리 소스.
- 훅 → POST는 tool call 즉시 발동. 실시간 소스. 파일 I/O 없이 메모리 직행.

## ① 동기

### WHY

- **Impact**: 에이전트가 무엇을 하고 있는지 보이지 않는다. 스킬이 실행 중인지, 몇 개의 tool을 소비했는지, 어디까지 진행됐는지 대화 창 밖에서는 알 수 없다.
- **Forces**: (1) 실시간이어야 함 — 완료 후 보여주면 의미 없음. (2) 결정적이어야 함 — AI 추론/LLM 호출 없이 훅 스크립트만으로 작동. (3) .jsonl은 턴 단위 기록이라 실시간 불가 → 훅 POST가 실시간 경로.
- **Decision**: 2경로 구조. 실시간은 훅 → HTTP POST → vite 서버 → SSE. 히스토리는 .jsonl → timeline API. 기각: (a) TaskCreate 연동 — 불필요한 복잡도. (b) tool 이름 기반 자동 추론 — 결정적이지 않음. (c) NDJSON 파일 경유 — POST 직행이 더 단순.
- **Non-Goals**: 세부 태스크 추적 안 함. 스킬 단위만. 에이전트 간 통신/조율 안 함.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 브라우저에서 칸반 페이지가 열려 있다 | 사용자가 /discuss를 실행한다 | Running 컬럼에 "discuss" 카드가 나타난다 | |
| S2 | discuss 카드가 Running에 있다 | discuss 안에서 /prd를 실행한다 | Running에 "prd" 카드가 추가된다 (discuss도 여전히 Running) | |
| S3 | prd 카드가 Running에 있다 | prd가 완료된다 | "prd" 카드가 Done 컬럼으로 이동한다 | |
| S4 | discuss 카드가 Running에 있다 | 에이전트가 Edit, Read, Bash를 호출한다 | discuss 카드의 tool count가 실시간으로 증가한다 | |
| S5 | 칸반 페이지가 열려 있지 않다 | 스킬이 실행되고 종료된다 | 나중에 칸반을 열면 Done에 완료된 카드가 보인다 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `.claude/hooks/skillEvent.mjs` | Pre/PostToolUse 훅. Skill matcher. curl로 vite 서버에 `POST /api/agent-ops/skill-event` 전송 | |
| `.claude/settings.json` 훅 항목 | PreToolUse + PostToolUse에 Skill matcher 추가 | |
| `vite-plugin-agent-ops.ts` 확장 | POST 핸들러(`/api/agent-ops/skill-event`) 추가. 받으면 즉시 SSE 브로드캐스트 | |
| `src/pages/replay/SkillKanban.tsx` | 새 페이지. 초기 로드(.jsonl → timeline API)로 과거 카드 복원 + SSE로 실시간 카드 갱신. NormalizedData 구성 → 기존 Kanban 컴포넌트에 전달 | |
| `src/router.tsx` 라우트 | `/kanban` 경로 추가 | |

완성도: 🟢

## ③ 인터페이스

### 훅 → POST → vite 서버 (실시간 경로)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| PreToolUse(Skill, {skill: "discuss"}) | 스킬 미실행 | `curl POST /api/agent-ops/skill-event` body: `{skill:"discuss", event:"start", ts}` | PreToolUse는 tool 실행 직전에 발동. 시작 시점을 즉시 포착 | vite 서버 메모리에 이벤트 도착 → SSE 브로드캐스트 | |
| PostToolUse(Skill, {skill: "discuss"}) | 스킬 실행 중 | `curl POST /api/agent-ops/skill-event` body: `{skill:"discuss", event:"end", ts}` | PostToolUse는 tool 실행 완료 후 발동. 종료 시점을 즉시 포착 | vite 서버 메모리에 이벤트 도착 → SSE 브로드캐스트 | |

### .jsonl → timeline API (초기 로드 경로)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 브라우저에서 /kanban 열림 | .jsonl에 과거 Skill tool_use 기록 있음 | `/api/agent-ops/timeline` API 호출 → tool_use 중 tool==="Skill" 필터링 → 짝 매칭(start/end 추론) | .jsonl의 parseToolUse가 이미 Skill 이벤트를 `{tool:"Skill", text:skillName}`으로 파싱 (85행) | 과거 완료된 스킬이 Done 카드로 복원 | |

### SSE/API → 칸반 store

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| skill start 이벤트 | 칸반 store에 해당 스킬 없음 | Running 컬럼에 카드 엔티티 추가 (id=skill+ts, data: {title, startTs, toolCount:0}) | skill+ts가 고유 식별자. 동일 스킬 중복 실행도 구분 | 카드가 Running 컬럼에 렌더링 | |
| skill end 이벤트 | Running에 해당 스킬 카드 있음 | 카드를 Done 컬럼으로 이동 (relationship 변경) | skill 이름으로 Running 카드를 결정적 매칭 (LIFO — 가장 최근 start) | 카드가 Done 컬럼에 렌더링 | |
| tool_use 이벤트 (Edit/Bash 등) | Running에 스킬 카드 있음 | 가장 최근 시작된 Running 카드의 toolCount++ 및 lastMessage 갱신 | tool call은 스킬에 직접 연결되지 않으므로, 시간 순서로 가장 최근 Running 스킬에 귀속. 결정적: LIFO 스택 | 카드의 subtitle 갱신 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 페이지 새로고침 | Running에 카드 2개 | .jsonl이 영속 저장소. 새로고침 시 timeline API에서 과거 Skill 이벤트 복원 + SSE 재연결로 실시간 복원 | Running/Done 상태가 복원됨 | |
| 스킬 중첩 (discuss 안에서 prd) | discuss가 Running | 각 스킬은 독립 카드. 부모-자식 관계 불필요 | 두 카드 모두 Running에 표시 | |
| 브라우저가 닫혀있을 때 스킬 실행/종료 | 칸반 미연결 | POST는 vite 서버에 도착하지만 SSE 클라이언트 없어 드롭. .jsonl에는 턴 완료 후 기록됨. 나중에 열면 timeline API로 복원 | Done 카드로 복원 (Running 중간 상태는 유실 — 허용) | |
| SSE 연결 끊김 | 이벤트 유실 가능 | 재연결 시 timeline API로 현재 상태 재구성 | 재연결 시 복원 | |
| vite 서버 미실행 | 훅이 POST 전송 | curl이 connection refused → 무시 (exit 0). 스킬 실행에 영향 없음 | 실시간 이벤트 유실. .jsonl로 나중에 복원 | |
| 같은 스킬 연속 실행 (discuss → discuss) | Done에 discuss 카드 1개 | 두 번째 실행은 새 카드 (id에 timestamp suffix) | Done에 1개, Running에 1개 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | NormalizedData + Command 필수 (feedback_all_state_normalized_command) | ③ 칸반 store | ✅ 준수 | — | |
| 2 | OS UI 컴포넌트만 사용 (CLAUDE.md os 기반 개발) | ② SkillKanban | ✅ 준수 — 기존 Kanban 컴포넌트 사용 | — | |
| 3 | ax()만 사용, style={} 금지 (feedback_style_is_hatch) | ② SkillKanban | ✅ 준수 | — | |
| 4 | 선언적 OCP (feedback_declarative_ocp) | ③ SSE→store 매핑 | ✅ 준수 — skill_start/skill_end → command 매핑이 딕셔너리 패턴 | — | |
| 5 | 기존 부품 재사용 (feedback_reuse_existing_impl) | ② 전체 | ✅ 준수 — Kanban.tsx, timelineSSE.ts, vite plugin 모두 재사용 | — | |
| 6 | pages에서 useAria 직접 사용 금지 (CLAUDE.md) | ② SkillKanban | ✅ 준수 — Kanban 컴포넌트가 내부에서 useAria 사용 | — | |
| 7 | ARIA props 전달 필수 (CLAUDE.md renderItem) | ② Kanban 카드 | ✅ 준수 — 기존 Kanban.tsx가 getNodeProps 전달 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | vite-plugin-agent-ops.ts (라우트 추가) | POST 핸들러 + SSE 브로드캐스트 로직 추가. 기존 파일 watcher 로직과 독립 | 낮음 | 새 라우트(`/api/agent-ops/skill-event`)만 추가. 기존 라우트/watcher 변경 없음 | |
| 2 | .claude/settings.json (hooks) | PreToolUse + PostToolUse에 Skill matcher 추가 | 낮음 | async: true로 비동기 실행. curl 실패해도 exit 0. 기존 훅과 독립 | |
| 3 | 훅 실행 오버헤드 | Skill 호출마다 curl 1회 | 낮음 | Skill 호출 빈도 낮음 (대화당 수 회). curl은 수 ms | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | Kanban.tsx 자체를 수정하지 않는다 | ⑤ 기존 부품 재사용 | 기존 사용처(showcase, DndDemo)에 영향. 데이터만 다르게 넣으면 됨 | |
| 2 | tool_use → 스킬 귀속 로직을 서버/훅에 넣지 않는다 | ⑥-1 서버 복잡도 | 귀속은 브라우저 측에서 시간 기반 LIFO로 처리. 훅은 skill 이벤트만 POST | |
| 3 | LLM 호출이나 패턴 매칭으로 스킬 상태를 추론하지 않는다 | discuss 제약 | 결정적 스크립트만. Skill tool_input.skill 필드가 유일한 소스 | |
| 4 | 새 store를 만들지 않는다 | ⑤-1 NormalizedData 패턴 | SkillKanban 페이지 내에서 로컬 NormalizedData를 구성하여 Kanban에 전달 | |
| 5 | NDJSON 경로를 추가하지 않는다 | discuss 결론 | POST 직행이 더 단순. .jsonl이 히스토리 역할 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | 브라우저에서 /kanban 열고, /discuss 실행 | Running 컬럼에 "discuss" 카드 출현. tool count 0 → 증가 | |
| V2 | S2 | discuss 중 /prd 실행 | Running에 "discuss"와 "prd" 카드 2개 | |
| V3 | S3 | prd 완료 | "prd" 카드가 Done으로 이동. "discuss"는 Running 유지 | |
| V4 | S4 | 에이전트가 Read, Edit, Bash 10회 호출 | 가장 최근 Running 카드의 tool count가 10으로 증가 | |
| V5 | S5 + 경계3 | 칸반 닫은 상태에서 /go 실행→완료. 이후 /kanban 열기 | Done 컬럼에 "go" 카드가 보임 | |
| V6 | 경계5 | /discuss 완료 후 다시 /discuss 실행 | Done에 이전 discuss, Running에 새 discuss | |
| V7 | 경계4 | SSE 연결 끊김 후 재연결 | 누락된 이벤트가 초기 로드 fallback으로 복원 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
