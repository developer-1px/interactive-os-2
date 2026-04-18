---
id: 2-areas/engine/prds/session-replay-phase-b-prd
type: prd
slug: sessionReplayPhaseB
title: 'Session Replay Phase B — Tool Visualization PRD'
tags: [untagged]
created: 2026-04-02
updated: 2026-04-08
summary: 'Discussion: JSONL 기반 세션 리플레이에서 tool_use 결과를 좌측 뷰어에 시각화한다.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Session Replay Phase B — Tool Visualization PRD

> Discussion: JSONL 기반 세션 리플레이에서 tool_use 결과를 좌측 뷰어에 시각화한다.

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: tool_use 결과(Read/Edit/Bash/Glob)가 채팅 텍스트로만 보임 → 파일 변경 흐름을 머릿속으로 재구성해야 함. 리팩토링 세션 디버깅이 비효율적
- **Forces**: Phase A의 delta/reducer 패턴 존재. Viewer(FilePanel/CodeBlock/DiffBlock/SplitPane) 재활용 가능. JSONL에 tool_result 콘텐츠(파일 내용, bash 출력 등)가 풍부
- **Decision**: SplitPane(뷰어좌, ChatFeed우). 재생 중 tool_use 도달 시 자동 추적, 완료 후 클릭 탐색. JSONL 직접 파싱. 기각: 실제 파일시스템 접근(원격 불가), 별도 뷰어 신규 개발(재활용 위반)
- **Non-Goals**: live 세션 연동(Phase C). 재생 속도 조절. 파일 편집. JSONL 이외 데이터 소스. 파일 트리 전체 재구성

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | JSONL 파싱 완료 | replay 시작 | SplitPane: 좌측 뷰어 + 우측 ChatFeed | |
| S2 | Read tool_use 재생됨 | 해당 스텝 도달 | 좌측에 파일 코드 하이라이팅 (CodeBlock) | |
| S3 | Edit tool_use 재생됨 | 해당 스텝 도달 | 좌측에 old→new diff (DiffBlock) | |
| S4 | Write tool_use 재생됨 | 해당 스텝 도달 | 좌측에 작성된 코드 (CodeBlock) | |
| S5 | Bash tool_use 재생됨 | 해당 스텝 도달 | 좌측에 커맨드+출력 표시 | |
| S6 | Glob/Grep tool_use 재생됨 | 해당 스텝 도달 | 좌측에 매칭 결과 목록 | |
| S7 | tool_use 블록 클릭 | 재생 완료 후 | 좌측 뷰어가 해당 스텝으로 점프 | |
| S8 | public/samples/에 JSONL 복사 | sessions/ 드롭다운 | JSONL 세션도 선택 가능 | |

완성도: 🟢

## ② 산출물

| 산출물 | 위치 | 설명 | 역PRD |
|--------|------|------|-------|
| parseJsonl | `src/pages/replay/parseJsonl.ts` | JSONL text → ChatMessage[] 변환. tool_use/tool_result를 기존 블록 타입으로 매핑 | |
| ToolPreview | `src/pages/replay/ToolPreview.tsx` | tool_use+result 데이터를 받아 CodeBlock/DiffBlock/pre로 시각화. 기존 ui/ 컴포넌트 재활용 | |
| PageReplay 확장 | `src/pages/replay/PageReplay.tsx` | SplitPane 추가. 현재 tool step 추적. JSONL 로드 지원 | |
| 샘플 JSONL | `src/pages/replay/sessions/` | 실제 리팩토링 세션 JSONL (Edit 다수) | |

### 구조

```
PageReplay
  ├── SplitPane (horizontal)
  │   ├── ToolPreview (좌: 현재 선택된 tool_use 시각화)
  │   │   ├── Read → CodeBlock({ code, filename, variant:"flush" })
  │   │   ├── Edit → DiffBlock({ block: { old, new, filePath } })
  │   │   ├── Write → CodeBlock({ code, filename, variant:"flush" })
  │   │   ├── Bash → pre (command + output)
  │   │   └── Glob/Grep → pre (result list)
  │   └── 우측 패널
  │       ├── 세션 선택 toolbar
  │       └── ChatFeed (기존 replay 로직)
```

완성도: 🟢

## ③ 인터페이스

### parseJsonl

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| JSONL 텍스트 | — | 줄별 JSON.parse → role/content 분류 | JSONL = 줄마다 독립 JSON | ChatMessage[] | |
| assistant + tool_use content | — | name/input 추출 → tool_use DataBlock | 기존 ToolSummaryBlock이 이 형식을 렌더링 | system role 메시지 | |
| user + tool_result content | — | tool_use_id로 매칭 → tool_result DataBlock | tool_use와 result를 같은 system 메시지에 쌍으로 | system role 메시지에 추가 | |
| assistant + text content | — | TextBlock으로 변환 | 기존 ChatFeed 렌더링 | assistant role 메시지 | |
| thinking content | — | thinking DataBlock | ThinkingBlock이 렌더링 | assistant role 메시지 | |

### ToolPreview

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Read tool_use + result | — | cat -n 포맷 strip → CodeBlock | Read result는 cat -n 포맷, CodeBlock은 plain code 필요 | 파일 코드 표시 | |
| Edit tool_use | — | input.old_string + new_string → DiffBlock | Edit input에 old/new가 있음 | diff 표시 | |
| Write tool_use | — | input.content → CodeBlock | Write input에 전체 파일 내용 | 코드 표시 | |
| Bash tool_use + result | — | input.command + result → pre | 커맨드+출력은 plain text가 자연스러움 | 터미널 출력 표시 | |
| Glob/Grep tool_use + result | — | result → pre (파일 목록) | 목록 데이터는 plain text | 결과 목록 표시 | |
| null (tool 없음) | — | 빈 상태 표시 | 재생 시작 전 or text-only 구간 | placeholder | |

### 재생 중 자동 추적

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| tool_use 메시지 재생됨 | 재생 중 | currentTool 자동 갱신 | 최신 도구 결과가 가장 관련성 높음 | ToolPreview 갱신 | |
| text 메시지 재생됨 | 재생 중 | currentTool 유지 | text는 뷰어 변경 불필요 | ToolPreview 유지 | |
| tool_use 블록 클릭 | 재생 완료 | currentTool을 클릭한 것으로 변경 | 수동 탐색 | ToolPreview 갱신 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| JSONL 파싱 실패 (잘못된 JSON) | 로드 중 | 한 줄 실패가 전체를 막으면 안 됨 | 해당 줄 skip, 나머지 파싱 | 부분 데이터 표시 | |
| tool_result 없는 tool_use | 재생 중 | 중단된 세션에서 발생 가능 | tool_use만 표시 (input 기반) | ToolPreview: input만 | |
| 매우 긴 tool_result (>10000줄) | 재생 중 | 브라우저 성능 보호 | 앞 200줄 + "truncated" 표시 | 잘린 콘텐츠 | |
| tool_use 0개 세션 | 재생 완료 | text-only 대화도 유효 | 좌측 빈 상태, 우측 정상 재생 | placeholder 유지 | |
| JSONL 파일 크기 >5MB | 로드 중 | 큰 세션도 처리 가능해야 함 | 정상 파싱 (줄 단위라 메모리 효율적) | 전체 로드 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | UI → ui/ 완성품 사용 (CLAUDE.md) | ② ToolPreview가 CodeBlock/DiffBlock 재활용 | ✅ 준수 | — | |
| 2 | 파일명 = 주 export (CLAUDE.md) | ② parseJsonl.ts, ToolPreview.tsx | ✅ 준수 | — | |
| 3 | ax()만 사용, style={} 금지 (CLAUDE.md) | ② PageReplay의 style={} | ❌ 위반 | Phase A의 style={}도 ax()로 전환 | |
| 4 | 렌더링 코드 분기 없음 (Phase A ⑤#4) | ② ChatFeed 수정 없음 | ✅ 준수 | — | |
| 5 | chatStore import 금지 (Phase A ⑦#2) | ② WebSocket 의존 없음 | ✅ 준수 | — | |
| 6 | 선언=등록 (feedback_declarative_ocp) | ② tool→뷰어 매핑은 선언적 맵 | ✅ 준수 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | PageReplay.tsx | 레이아웃 변경 (ChatFeed only → SplitPane) | 중 | Phase A 동작 유지하면서 확장 | |
| 2 | sessions/ 폴더 | JSONL 파일 추가로 번들 크기 증가 | 낮 | import.meta.glob lazy 로드 | |
| 3 | chatRenderers 중복 | Phase A에서 이미 존재, 변경 없음 | 낮 | 허용 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | ChatFeed/CodeBlock/DiffBlock 수정 | ⑤#4 렌더링 분기 없음 | 기존 컴포넌트 오염 방지 | |
| 2 | chatStore/viewerStore import | ⑤#5 store 독립 | replay는 자체 상태만 | |
| 3 | style={} 사용 | ⑤#3 ax() 전용 | 디자인 시스템 준수 | |
| 4 | 실제 파일시스템 fetch | ① Non-Goals | JSONL 데이터만 사용 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | `/replay` 진입, JSONL 세션 선택 | SplitPane 렌더링, 좌측 뷰어 + 우측 ChatFeed | |
| V2 | ①S2 | Read tool_use 스텝 도달 | 좌측에 CodeBlock으로 파일 내용 표시 | |
| V3 | ①S3 | Edit tool_use 스텝 도달 | 좌측에 DiffBlock으로 old→new 표시 | |
| V4 | ①S4 | Write tool_use 스텝 도달 | 좌측에 CodeBlock으로 작성 내용 표시 | |
| V5 | ①S5 | Bash tool_use 스텝 도달 | 좌측에 command + output 표시 | |
| V6 | ①S7 | 재생 완료 후 tool_use 블록 클릭 | 좌측 뷰어가 해당 tool로 전환 | |
| V7 | ④E1 | 잘못된 JSONL 줄 포함 | skip하고 나머지 정상 표시 | |
| V8 | ④E4 | tool_use 0개 세션 | 좌측 placeholder, 우측 정상 재생 | |

완성도: 🟢

---

### 교차 검증

1. **동기 ↔ 검증**: S1~S7 → V1~V6 매핑 ✅ (S8은 V1에 포함)
2. **인터페이스 ↔ 산출물**: parseJsonl→ChatMessage[], ToolPreview→CodeBlock/DiffBlock 일치 ✅
3. **경계 ↔ 검증**: E1→V7, E4→V8 커버 ✅
4. **금지 ↔ 출처**: 4개 모두 ⑤/① 파생 ✅
5. **원칙 대조 ↔ 전체**: ⑤#3 위반 → ⑦#3에 반영 ✅

**전체 완성도:** 🟢 8/8

#kind/prd #topic/engine
