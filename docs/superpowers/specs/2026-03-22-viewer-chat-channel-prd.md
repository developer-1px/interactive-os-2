# Viewer Chat Channel — PRD

> Discussion: agent viewer에서 실행 중인 Claude Code 세션에 메시지를 보내기 위해 커스텀 MCP Channel 플러그인을 만든다. viewer 입력 → HTTP POST → MCP Channel → 세션에 push, 응답은 기존 JSONL SSE로 수신.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | agent viewer에서 실행 중인 세션의 타임라인을 보고 있다 | 추가 지시를 보내고 싶다 | 터미널로 전환하지 않고 viewer에서 바로 입력하여 세션에 전달된다 | |
| M2 | Claude Code 세션이 작업 중이다 | 방향 수정이나 추가 컨텍스트를 줘야 한다 | viewer 입력창에서 메시지를 보내면 Claude가 `<channel>` 이벤트로 수신하고 반영한다 | |
| M3 | viewer에서 메시지를 보냈다 | Claude가 응답한다 | 기존 타임라인 SSE로 응답이 실시간 표시된다 (별도 응답 채널 불필요) | |

완성도: 🟡

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `viewer-channel.ts` | MCP Channel 서버. stdio transport + localhost HTTP 리스너. POST 받아서 `mcp.notification()` 발행 | |
| `.mcp.json` 항목 | `"viewer-channel"` 서버 등록 | |
| `ChatInput` (컴포넌트) | TimelineColumn 하단 입력창. textarea + submit | |
| `POST /api/viewer-channel/send` | vite 서버 프록시 또는 Channel 서버 직접 HTTP 엔드포인트 | |

완성도: 🟡  ← ① 🟢 후 착수

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 텍스트 입력 + Enter | 입력창에 텍스트 있음 | POST → Channel → 세션에 push | Channel이 `mcp.notification()`으로 세션에 이벤트 전달 | 입력창 비워짐, 타임라인에 user 이벤트 표시 | |
| Shift+Enter | 입력창에 텍스트 있음 | 줄바꿈 삽입 | 멀티라인 입력 지원, Enter와 구분 | 입력창에 개행 추가 | |
| 빈 입력 + Enter | 입력창 비어있음 | 무시 | 빈 메시지 전송은 의미 없음 | 변화 없음 | |
| Escape | 입력창에 포커스 | 입력창 블러 | 키보드 탈출 경로 | 포커스가 타임라인으로 이동 | |
| ↑ | 입력창 비어있음 | N/A (?) | — | — | |
| ↓ | 입력창 | N/A | — | — | |
| 클릭 (입력창) | 타임라인 보는 중 | 입력창 포커스 | 직접 클릭으로 입력 모드 진입 | 커서 활성 | |

완성도: 🟡  ← ② 🟢 후 착수

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| Channel 서버 미기동 | viewer에서 입력 시도 | 서버가 없으면 POST 실패 | 에러 표시 "Channel not connected", 입력 내용 유지 | 입력창에 텍스트 보존 | |
| 세션이 inactive | 비활성 세션 타임라인에서 입력 | inactive 세션에는 Claude 프로세스가 없어 Channel이 전달 불가 | 입력창 비활성화 또는 "세션이 활성 상태가 아닙니다" 표시 | — | |
| 매우 긴 메시지 | 사용자가 긴 텍스트 입력 | Channel notification에 길이 제한 없음 | 그대로 전송 | — | |
| 연속 빠른 전송 | 사용자가 빠르게 여러 메시지 | Claude가 이전 메시지 처리 중일 수 있음 | 순서대로 큐잉 (Channel이 순차 notification) | — | |

완성도: 🟡  ← ③ 🟢 후 착수

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 설계 원칙 > 사용자 요구 (feedback) | 전체 | ✅ 미위반 | Channel은 Claude Code 공식 메커니즘 | |
| P2 | 이벤트 버블링 가드 (feedback) | ③ 인터페이스 | ✅ 미위반 | 입력창은 독립 요소, 타임라인과 중첩 아님 | |
| P3 | 파일명 = 주 export (CLAUDE.md) | ② 산출물 | ✅ 미위반 | `ChatInput.tsx` → `export function ChatInput` | |
| P4 | 테스트: 계산은 unit, 인터랙션은 통합 (CLAUDE.md) | ⑧ 검증 | ✅ 미위반 | Channel 서버는 unit, UI 인터랙션은 통합 | |

완성도: 🟡  ← ①~④ 🟢 후 착수

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | TimelineColumn 레이아웃 | 하단에 입력창 추가로 스크롤 영역 줄어듦 | 낮 | flex 레이아웃으로 자연 대응 | |
| S2 | Claude Code 시작 방식 | `--dangerously-load-development-channels` 플래그 필요 | 중 | 문서화, 스크립트에 반영 | |
| S3 | .mcp.json | 새 서버 항목 추가 | 낮 | 기존 항목과 공존 | |

완성도: 🟡  ← ⑤ 🟢 후 착수

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | TTY write나 stdin 직접 주입 | Discussion 결론 | raw mode TUI라 동작 안 함, 불안정 | |
| F2 | Channel 서버를 외부 네트워크에 노출 | 보안 | localhost only, 127.0.0.1 바인딩 필수 | |
| F3 | 응답을 Channel reply tool로 받아서 별도 표시 | ⑥ S1 | 기존 JSONL SSE 타임라인이 이미 응답을 표시, 이중 경로는 혼란 | |

완성도: 🟡  ← ⑤⑥ 🟢 후 착수

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | Channel 서버 기동 + viewer 입력창에서 "hello" 전송 | Claude 세션에 `<channel source="viewer-channel">hello</channel>` 수신 | |
| V2 | ①M3 | 메시지 전송 후 Claude 응답 대기 | 타임라인 SSE로 assistant 이벤트 표시 | |
| V3 | ④E1 | Channel 서버 미기동 상태에서 전송 시도 | 에러 표시, 입력 내용 보존 | |
| V4 | ④E2 | inactive 세션에서 입력 시도 | 입력 비활성화 또는 안내 메시지 | |
| V5 | ①M2 | Claude 작업 중에 추가 메시지 전송 | Channel이 순차 전달, Claude가 새 지시 반영 | |

완성도: 🟡  ← ①~⑦ 🟢 후 착수

---

**전체 완성도:** 🟡 0/8 (초안 작성 완료, 사용자 확인 필요)
