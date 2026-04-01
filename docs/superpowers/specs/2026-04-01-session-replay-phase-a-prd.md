# Session Replay Phase A — PRD

> Discussion: AI 코딩 세션을 웹에서 재생 가능한 인터랙티브 뷰어로 만든다. Phase A는 채팅 패널 재생만.

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: 채팅 애니메이션을 다듬고 싶을 때 매번 live 세션을 돌려야 한다 → 비용+시간+재현 불가. 애니메이션 개발 루프가 막혀있다.
- **Forces**: ChatMessage[]에 내용은 충분하지만 스트리밍 타이밍은 소실. 렌더링 코드는 live/replay 구분 없이 하나여야 한다.
- **Decision**: mock ChatMessage[] → 기존 스트리밍 파이프라인에 합성 이벤트 주입. 렌더링 코드 분기 없음. 기각: 별도 replay 렌더러(코드 분기), 새 데이터 포맷(호환성 비용).
- **Non-Goals**: Phase A에서 Viewer 연동 안 함. 재생 속도 조절/시점 점프 안 함. 실시간 녹화 안 함. Phase B에서 Viewer 확대 예정.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | mock JSON 로드됨 | replay 시작 | 기존 스트리밍 파이프라인에 이벤트 주입, live와 동일 렌더링 | |
| S2 | thinking 블록 | 차례 도달 | live 동일 스트리밍 애니메이션 | |
| S3 | tool_use + tool_result | 차례 도달 | live 동일 ToolGroup 등장 | |
| S4 | assistant 텍스트 | 차례 도달 | live 동일 타이핑 애니메이션 | |
| S5 | 재생 완료 | 마지막 메시지 후 | 처음부터 다시 재생 가능 | |
| S6 | 애니메이션 코드 수정 | HMR 후 replay 재시작 | 수정 즉시 확인 (개발 루프) | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 위치 | 설명 | 역PRD |
|--------|------|------|-------|
| mockSession | `src/pages/replay/mockSession.ts` | mock ChatMessage[] — 한 턴 (user→thinking→Read→Edit→Bash→assistant) | |
| toReplaySequence | `src/pages/replay/toReplaySequence.ts` | `ChatMessage[] → SequenceItem<ChatMessage>[]` 변환. ts 간격→delay 산출, cap/min 적용 | |
| PageReplay | `src/pages/replay/PageReplay.tsx` | `/replay` 라우트. useStreamFeed(sequence) + ChatFeed. chatRenderers 동일 주입 | |

### 구조

```
PageReplay
  └── useStreamFeed({ mode: 'sequence', sequence: toReplaySequence(mockMessages), autoPlay: true })
       └── items (현재까지 재생된 messages)
            └── ChatFeed({ messages: items, blockRenderers: chatRenderers, isStreaming })
```

- ChatFeed 수정 없음. messages prop에 현재까지 재생된 메시지만 전달
- chatRenderers (thinking/tool_summary/tool_use/tool_result/streaming_text) 동일 사용
- WebSocket/chatStore 의존 없음

완성도: 🟢

## ③ 인터페이스

### toReplaySequence

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `ChatMessage[]` | — | ts 간격에서 delay 산출 | 실제 타이밍이 합성 기초, 비정상 간격은 cap | `SequenceItem<ChatMessage>[]` | |
| 간격 > 3초 | — | max 2초로 cap | 서버 대기/네트워크 지연은 시청 해침 | delay: 2000 | |
| 간격 < 200ms | — | min 300ms로 floor | 너무 빠르면 메시지 뭉침 | delay: 300 | |
| 첫 메시지 (user) | — | delay: 500ms | 재생 시작 후 숨 쉬기 | delay: 500 | |

### PageReplay 라이프사이클

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 라우트 진입 | 초기 | autoPlay: true로 즉시 재생 | 라우트 진입 = 즉시 확인 의도 | 재생 중 (isStreaming: true) | |
| 마지막 메시지 재생됨 | 재생 중 | isStreaming: false | useStreamFeed 내장 동작 | 재생 완료 | |
| replay 버튼 클릭 | 재생 완료 | replay() 호출 | 수정 후 재확인 | 처음부터 재생 | |
| HMR | 재생 중/완료 | 리마운트 → autoPlay | Vite HMR 컴포넌트 리마운트 | 처음부터 재생 | |

> cap/floor 수치(3s→2s, 200ms→300ms, 첫 500ms)는 초기값. 재생하면서 조정.

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| mock 메시지 0개 | 초기 | 빈 데이터에 크래시 방지 | 빈 피드, isStreaming: false | 재생 완료 | |
| 모든 ts가 같다 (0) | 초기 | mock 작성 시 ts 생략 가능 | 모든 delay에 min floor(300ms) 적용 | 순차 재생 | |
| thinking이 매우 긴 텍스트 | 재생 중 | 한 번에 전체 등장 | 블록 등장 + auto-scroll | 다음 메시지 대기 | |
| HMR 중 타이머 | 재생 중 | useStreamFeed clearTimers cleanup | 기존 타이머 정리 | 깨끗한 리마운트 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 레이어 = 라우트 그룹 (feedback) | ② `src/pages/replay/` | ✅ 준수 | — | |
| 2 | UI → ui/ 완성품 사용 (CLAUDE.md) | ② ChatFeed, ToolGroup 등 재사용 | ✅ 준수 | — | |
| 3 | 하나의 앱 = 하나의 store (feedback) | ② chatStore 의존 없음 | ✅ 준수 | — | |
| 4 | 렌더링 코드 분기 없음 (① Decision) | ② chatRenderers 동일 | ✅ 준수 | — | |
| 5 | 파일명 = 주 export (CLAUDE.md) | ② 파일명 일치 | ✅ 준수 | — | |
| 6 | 데이터 확장 금지 (① Non-Goals) | ② ChatMessage[] 그대로 | ✅ 준수 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | 라우트 테이블 | `/replay` 추가 필요 | 낮 | routeConfig에 한 줄 추가 | |
| 2 | chatRenderers 정의 (ChatPane 내부) | PageReplay에서도 필요 → 중복 | 낮 | 공유 파일로 추출 또는 동일 정의 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | ChatFeed/StreamFeed 수정 | ⑤#4 렌더링 분기 없음 | live 경로 오염 방지 | |
| 2 | chatStore import | ⑤#3 store 독립 | WebSocket 의존 끊기가 목적 | |
| 3 | 새 ChatBlock 타입 추가 | ⑤#6 데이터 확장 금지 | 기존 포맷 그대로 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①S1 | `/replay` 진입 | mock 메시지가 순차 등장, ChatFeed로 렌더링 | |
| V2 | ①S2 | thinking 블록 차례 | ThinkingBlock 렌더링 (live 동일) | |
| V3 | ①S3 | tool_use+tool_result 차례 | ToolGroup 카드 렌더링 (live 동일) | |
| V4 | ①S4 | assistant 텍스트 차례 | TextBlock 렌더링 (live 동일) | |
| V5 | ①S5 | 마지막 메시지 재생 후 | isStreaming: false, replay 버튼으로 재시작 | |
| V6 | ①S6 | CSS 수정 → HMR | 리마운트 후 autoPlay로 수정 결과 즉시 확인 | |
| V7 | ④E1 | 빈 mock 데이터 | 크래시 없이 빈 피드 | |
| V8 | ④E2 | ts 전부 0 | 300ms 간격으로 순차 재생 | |

완성도: 🟢

---

### 교차 검증

1. **동기 ↔ 검증**: S1~S6 → V1~V6 전수 매핑 ✅
2. **인터페이스 ↔ 산출물**: toReplaySequence → SequenceItem[], PageReplay → ChatFeed 일치 ✅
3. **경계 ↔ 검증**: E1→V7, E2→V8 커버 ✅
4. **금지 ↔ 출처**: 3개 모두 ⑤에서 파생 ✅
5. **원칙 대조 ↔ 전체**: 위반 없음 ✅

**전체 완성도:** 🟢 8/8
