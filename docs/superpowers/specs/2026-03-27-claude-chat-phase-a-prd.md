# Claude Code Web Chat (Phase A) — PRD

> Discussion: 브라우저에서 Claude Code 세션을 시작/종료/채팅. Agent SDK + WebSocket으로 Vite dev server가 claude subprocess를 관리. Monitor(기존 뷰어)와 별도 Chat 모드.

## ① 동기

### WHY

- **Impact**: Agent Viewer에서 세션을 모니터링하다가 지시를 보내려면 터미널로 전환해야 한다. 브라우저와 터미널 사이 컨텍스트 스위칭이 작업 흐름을 끊는다.
- **Forces**: Claude Code는 TUI 전용 → 웹에서 직접 사용 불가. MCP Channel 단방향은 응답 수신이 불안정. Agent SDK가 subprocess를 추상화하여 해결.
- **Decision**: Agent SDK(`@anthropic-ai/claude-agent-sdk`) V2 API 사용. CLI를 subprocess로 spawn하므로 인증/설정/hooks 전부 상속. 기각: MCP Channel 양방향(공식 미지원), raw CLI spawn(문서 부족, 멀티턴 불안정), HTTP 서버 모드(미존재).
- **Non-Goals**: Phase A에서는 채팅 텍스트 송수신만. tool use 시각화, permission 승인/거부 UI, file diff viewer는 Phase B/C.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | Chat 모드 진입 | "새 세션" 버튼 클릭 | Vite가 Agent SDK로 claude 프로세스 spawn, 세션 생성되고 입력창 활성화 | |
| M2 | 세션이 활성 상태 | 메시지 입력 + Enter | WebSocket으로 Vite에 전송 → SDK session.send() → Claude 응답이 스트리밍으로 표시 | |
| M3 | Claude가 응답 중 | 토큰이 생성됨 | 실시간 스트리밍으로 타임라인에 텍스트가 점진적 표시 | |
| M4 | 세션이 활성 상태 | "세션 종료" 클릭 | claude 프로세스 kill, 세션 비활성 전환, 입력창 비활성화 | |
| M5 | 여러 세션 존재 | 세션 목록에서 선택 | 해당 세션의 채팅 타임라인으로 전환 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `vite-plugin-agent-ops.ts` 확장 | WebSocket 엔드포인트 추가 + Agent SDK session 관리 (spawn/send/kill) | |
| `PageAgentChat.tsx` | Chat 모드 페이지. 세션 목록 + 채팅 영역. Monitor(PageAgentViewer)와 별도 라우트 | |
| `chatStore.ts` | Chat 모드 상태 관리 — 활성 세션 목록, 메시지, 연결 상태 | |
| `ChatTimeline.tsx` | 채팅 메시지 렌더링. 기존 ChatFeed 재사용, WebSocket 스트리밍 수신 | |
| 라우트 등록 | `/chat` 또는 `/agent-chat` 라우트 추가 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| "새 세션" 버튼 클릭 | Chat 모드, 세션 없거나 있음 | WS로 `create-session` 전송 → Vite가 SDK createSession() → 세션 ID 반환 | SDK가 claude subprocess를 spawn하고 세션 객체 생성 | 새 세션 활성, 입력창 포커스 | |
| 텍스트 입력 + Enter | 세션 활성, 입력창에 텍스트 | WS로 `send-message` 전송 → SDK session.send() | SDK가 subprocess stdin으로 메시지 전달 | 입력창 비움, 타임라인에 user 메시지 표시, 스트리밍 시작 | |
| Shift+Enter | 입력창에 텍스트 | 줄바꿈 삽입 | Enter와 전송 구분 | 입력창에 개행 추가 | |
| Escape | 입력창 포커스 | 입력창 블러 | 키보드 탈출 경로 | 포커스가 타임라인으로 이동 | |
| "세션 종료" 클릭 | 세션 활성 | WS로 `close-session` 전송 → SDK session 종료 → subprocess kill | 프로세스 정리 | 세션 비활성, 입력창 disabled | |
| 세션 목록 항목 클릭 | 다른 세션 보는 중 | 해당 세션으로 전환 | 멀티 세션 지원 | 선택 세션의 타임라인 표시 | |
| ↑ | 입력창 비어있음 | N/A (Phase A) | 히스토리 탐색은 Phase B | — | |
| ↓ | 입력창 | N/A | — | — | |
| Tab | 페이지 내 | 표준 tab 순서 | 브라우저 기본 | 다음 focusable 요소 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| WebSocket 연결 끊김 | 채팅 중 | 네트워크 불안정 시 메시지 유실 방지 | 재연결 시도 + "연결 끊김" 표시, 입력 비활성화 | 재연결 성공 시 복구 | |
| Claude 프로세스 crash | 세션 활성 | subprocess가 예기치 않게 종료될 수 있음 | 에러 메시지 표시 "세션이 종료되었습니다", 입력 비활성화 | 세션 비활성 전환 | |
| 빈 메시지 전송 | 입력창 비어있음 | 빈 메시지는 의미 없음 | 전송 무시 | 변화 없음 | |
| 매우 긴 메시지 | 사용자가 긴 텍스트 입력 | SDK가 길이 제한 없이 전달 | 그대로 전송 | — | |
| 응답 중 새 메시지 | Claude 스트리밍 중 | Claude Code는 응답 완료 후 다음 입력 처리 | 큐잉 또는 "응답 완료 후 전송 가능" 표시 (?) | — | |
| dev server 재시작 | 세션 활성 상태였음 | Vite 재시작 시 subprocess도 종료됨 | 브라우저에서 재연결, 이전 세션은 종료됨을 표시 | 새 세션 시작 필요 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 파일명 = 주 export (CLAUDE.md) | ② 산출물 | ✅ 미위반 | `PageAgentChat.tsx` → `export default function PageAgentChat` | |
| P2 | Monitor와 Chat 별도 모드 (discuss) | ② 산출물 | ✅ 미위반 | 별도 라우트 + 별도 페이지 컴포넌트 | |
| P3 | 설계 원칙 > 사용자 요구 (feedback) | 전체 | ✅ 미위반 | SDK 공식 경로 사용, engine 우회 없음 | |
| P4 | 이벤트 버블링 가드 (feedback) | ③ 인터페이스 | ✅ 미위반 | ChatInput은 독립 요소, 타임라인과 중첩 아님 | |
| P5 | CSS는 /design-implement 필수 (CLAUDE.md) | 구현 시 | ✅ 미위반 | 구현 시 준수 | |
| P6 | 하나의 앱 = 하나의 store (feedback) | ② chatStore | ⚠️ 확인 필요 | Chat 모드가 독립 store를 가지는 것이 맞는지 — Monitor와 다른 앱이므로 별도 store 허용 (?) | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `vite-plugin-agent-ops.ts` | WebSocket + SDK 의존성 추가로 플러그인 복잡도 증가 | 중 | chat 관련 로직을 별도 함수로 분리 | |
| S2 | `package.json` | `@anthropic-ai/claude-agent-sdk` 의존성 추가 | 낮 | devDependencies에 추가 | |
| S3 | 라우트 설정 | 새 라우트 추가 | 낮 | 기존 라우트와 공존 | |
| S4 | `viewer-channel.mjs` | SDK 경로 채택 시 폐기 대상 | 낮 | Phase A 완료 후 삭제 검토 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | Anthropic API 직접 호출 | ⑤ P3 | SDK가 CLI subprocess를 통해 모든 설정 상속. 직접 API 호출은 hooks/MCP/CLAUDE.md 무시 | |
| F2 | Monitor 페이지(PageAgentViewer)에 Chat 기능 합치기 | discuss 결론 | 역할이 다르므로 별도 모드 유지 | |
| F3 | Phase A에서 tool use UI 구현 | ① Non-Goals | 텍스트 채팅만. tool 시각화는 Phase B | |
| F4 | WebSocket 서버를 외부 네트워크 노출 | 보안 | localhost only | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | Chat 모드에서 "새 세션" 클릭 | claude 프로세스 spawn, 세션 ID 반환, 입력창 활성화 | |
| V2 | ①M2 | 메시지 입력 + Enter | WS로 전송, 타임라인에 user 메시지 표시 | |
| V3 | ①M3 | Claude 응답 대기 | 토큰 단위 스트리밍으로 텍스트 점진 표시 | |
| V4 | ①M4 | "세션 종료" 클릭 | 프로세스 종료, 입력 비활성화 | |
| V5 | ①M5 | 세션 목록에서 다른 세션 선택 | 해당 세션 타임라인으로 전환 | |
| V6 | ④E1 | WS 연결 강제 끊기 | "연결 끊김" 표시, 재연결 시도 | |
| V7 | ④E2 | claude 프로세스 강제 종료 | 에러 메시지 표시, 세션 비활성 전환 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
