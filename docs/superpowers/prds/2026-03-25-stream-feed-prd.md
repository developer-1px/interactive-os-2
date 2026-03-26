# StreamFeed — PRD

> Discussion: LLM 스트리밍 UI의 공통 패턴(typewriter, auto-scroll, typing indicator, entry animation)을 하나의 os 모듈로 응집. Push 모드(SSE)와 Sequence 모드(스크립트 재생) 양쪽 지원.

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: 새 스트리밍 UI 페이지를 만들 때마다 typewriter·auto-scroll·typing indicator를 처음부터 구현해야 한다. Incident에 인라인 구현, Agent Viewer에는 아예 없음 → 일관성 없는 스트리밍 경험.
- **Forces**: os UI SDK는 "표준 UI 어휘 + 용도별 완성품 + hook-first" 원칙. virtual scroll은 별도 모듈로 분리 예정 → StreamFeed는 시간축 노출만 전담.
- **Decision**: `StreamFeed` (ARIA `role="feed"` + Stream 접두어). 기각: `MessageList`(채팅 한정), `Feed`(정적 피드와 구분 불가), `Conversation`(대화 한정).
- **Non-Goals**: virtual scroll 통합, SSE/WebSocket 연결 관리, 메시지 렌더링(renderItem으로 위임), 메시지 그룹핑 로직.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Agent Viewer에서 SSE로 새 이벤트 수신 | addItem 호출 | 아이템이 fadeSlideIn으로 등장 + 컨테이너가 바닥으로 smooth scroll | |
| S2 | Incident 데모에서 스크립트 시퀀스 설정 | autoPlay=true로 useStreamFeed 초기화 | 각 메시지가 delay 간격으로 순차 등장 + auto-scroll | |
| S3 | agent 메시지가 스트리밍 중 | useTypewriter로 글자 단위 노출 | 글자가 하나씩 나타나고 커서가 깜빡임, 완료 시 커서 소멸 | |
| S4 | 스트리밍 진행 중 (isStreaming=true) | 마지막 아이템 아래 | TypingIndicator(3-dot bounce) 표시 | |
| S5 | 사용자가 위로 스크롤하여 이전 내용 열람 중 | 새 아이템 도착 | auto-scroll 하지 않음 (사용자 스크롤 존중) | |

완성도: 🟡

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `useStreamFeed.ts` | 상태 관리 hook. push 모드(addItem) + sequence 모드(sequence/autoPlay). items, isStreaming, feedRef 반환 | |
| `useTypewriter.ts` | 글자 단위 스트리밍 hook. text, active, speed → displayed, done 반환. StreamFeed와 독립 사용 가능 | |
| `StreamFeed.tsx` | 컨테이너 컴포넌트. auto-scroll + entry animation + TypingIndicator 내장. renderItem으로 렌더링 위임 | |
| `StreamFeed.module.css` | fadeSlideIn, typingDot, cursor blink, entry 애니메이션. 디자인 토큰 기반 | |

### 의존 관계

```
useStreamFeed (상태)
    ↓ items, isStreaming, feedRef
StreamFeed (렌더링)
    ↓ renderItem 콜백
호출 측 (Agent Viewer, Incident)

useTypewriter (독립)
    ↓ displayed, done
호출 측의 renderItem 내부
```

완성도: 🟡

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `addItem(data)` | items=N개, 사용자 바닥 근처 | 아이템 추가 + auto-scroll | 새 콘텐츠가 도착하면 사용자가 놓치지 않도록 따라가야 한다 | items=N+1, 스크롤 바닥 | |
| `addItem(data)` | items=N개, 사용자 위로 스크롤 중 | 아이템 추가, auto-scroll 안 함 | 사용자가 이전 내용을 열람 중이면 강제 스크롤은 방해다 | items=N+1, 스크롤 위치 유지 | |
| `replay()` | sequence 모드, 재생 완료 상태 | 처음부터 다시 재생 | 데모 반복 시연 용도 | items=0→순차 추가 | |
| `useTypewriter(text, true)` | displayed='', done=false | 글자 하나씩 추가 | 스트리밍 체감을 주기 위해 한 번에 보여주지 않는다 | displayed 증가, done=false→true | |
| `useTypewriter(text, false)` | 비활성 | 아무것도 안 함 | 아직 이 메시지 차례가 아니다 | displayed='', done=false | |

### 키보드/마우스 (StreamFeed 자체)

StreamFeed는 **비-인터랙티브 컨테이너**다. ARIA `role="feed"`는 article 탐색을 정의하지만, 이 모듈의 핵심은 **시간축 노출**이므로 키보드 네비게이션은 호출 측 책임이다.

| 입력 | 해당 | 비고 |
|------|------|------|
| ↑↓←→ | N/A | 컨테이너 자체는 스크롤만, 아이템 내 인터랙션은 renderItem 책임 |
| Tab | N/A | 포커스 가능 요소는 renderItem 내부 |
| 스크롤 (wheel/touch) | 해당 | 사용자가 위로 스크롤하면 auto-scroll 비활성, 바닥 근처로 돌아오면 재활성 |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 빈 시퀀스 (sequence=[]) | items=[] | 빈 데이터는 빈 UI. 오류가 아니다 | 빈 컨테이너, TypingIndicator 없음 | items=[] | |
| 매우 빠른 연속 addItem (rAF 내 여러 호출) | items=N | 매 rAF마다 scroll을 쏘면 성능 저하. 배치 처리 필요 | 한 rAF 안의 addItem들을 모아서 한 번만 scroll | items=N+batch, 1회 scroll | |
| typewriter 진행 중 text 변경 | displayed 진행 중 | 새 텍스트로 교체돼야 한다 (SSE에서 토큰 누적 시) | 이전 interval 정리, 새 text로 재시작 | displayed 리셋→새 text 진행 | |
| sequence 모드에서 컴포넌트 unmount | 타이머 진행 중 | 메모리 릭 방지 | 모든 setTimeout 정리 | 타이머 없음 | |
| 사용자가 바닥에서 1px 위에 있을 때 | 거의 바닥 | "바닥 근처" 판정에 threshold 필요 | threshold 이내면 바닥으로 간주 → auto-scroll 작동 | 스크롤 바닥 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② 모듈명 | ✅ 준수 | `role="feed"` ARIA 표준 + Stream 접두어 | |
| P2 | UI SDK = 표준 UI 어휘, 용도별 완성품 (feedback_ui_sdk_principles) | ② 전체 | ✅ 준수 | StreamFeed는 "스트리밍 피드"라는 하나의 완성품 | |
| P3 | hook-first (project_ui_sdk_plan) | ② useStreamFeed | ✅ 준수 | 로직은 hook, 렌더링은 컴포넌트 분리 | |
| P4 | CSS 모든 수치는 토큰 (feedback_all_values_must_be_tokens) | ④ CSS | ✅ 준수 | motion 토큰(instant/normal/enter) 사용 | |
| P5 | 가역적 동선 (feedback_reversible_motion) | ③ auto-scroll | ✅ 준수 | 위로 스크롤하면 auto-scroll 비활성, 바닥으로 돌아오면 재활성 | |
| P6 | margin 금지, gap으로 간격 (feedback_gap_over_margin) | ④ CSS | ✅ 준수 | flex column + gap | |
| P7 | :where() ARIA 기본 스타일 (feedback_where_for_aria_defaults) | ④ CSS | ✅ 준수 | StreamFeed 기본 스타일은 :where()로 specificity 0 | |
| P8 | 테스트 = 데모 = showcase (feedback_test_equals_demo) | ⑧ 검증 | 주의 | Incident 데모가 곧 StreamFeed showcase가 될 수 있음 | |
| P9 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② 파일명 | ✅ 준수 | StreamFeed.tsx → export StreamFeed, useStreamFeed.ts → export useStreamFeed | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | PageIncidentInterface — useTypewriter, scrollTo, CSS 키프레임 추출 | Incident 페이지가 StreamFeed 모듈을 import하도록 변경 필요. 동작은 동일해야 함 | 중 | Incident을 StreamFeed 소비자로 리팩터 | |
| E2 | TimelineColumn — useVirtualScroll 제거 | 현재 virtual scroll 의존 코드 전부 제거. plain DOM 렌더링으로 전환 | 중 | StreamFeed 적용과 동시에 useVirtualScroll import·사용 코드 삭제. virtual 시리즈는 추후 별도 모듈로 재도입 | |
| E3 | tokens.css — motion 토큰 | 이미 정의된 토큰 사용, 새 토큰 불필요 | 낮 | 허용 | |
| E4 | components.css — fadeSlideIn이 현재 Incident에만 있음 | StreamFeed.module.css로 이동하면 Incident CSS에서 중복 제거 필요 | 낮 | Incident CSS에서 @keyframes 삭제, StreamFeed CSS로 이관 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | StreamFeed 안에 virtual scroll 로직 내장 | ⑤ 관심사 분리, Non-Goals | virtual 시리즈는 별도 모듈. 결합하면 양쪽 모듈의 독립성 상실 | |
| F2 | StreamFeed가 SSE/WebSocket 연결을 직접 관리 | Non-Goals | 데이터 소스는 호출 측 책임. StreamFeed는 "받은 아이템을 보여주는" 역할만 | |
| F3 | auto-scroll 시 사용자 스크롤 위치 강제 덮어쓰기 | ⑤ P5 가역적 동선 | 사용자가 위로 스크롤해서 이전 내용을 보는 건 의도적 행위 | |
| F4 | useTypewriter에서 raw 숫자 duration 사용 | ⑤ P4 토큰 필수 | CSS 애니메이션은 motion 토큰, JS speed는 prop으로 외부 제어 | |
| F5 | StreamFeed가 메시지 타입별 렌더링 로직을 가짐 | ⑤ P2 완성품 원칙 | 메시지 렌더링은 renderItem으로 위임. StreamFeed는 시간축 노출만 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | push 모드: addItem 호출 시 아이템 등장 + auto-scroll | 새 아이템이 fadeSlideIn으로 나타나고 컨테이너 바닥으로 스크롤 | |
| V2 | S2 | sequence 모드: delay 배열로 순차 재생 | 각 아이템이 지정 delay 후 등장 | |
| V3 | S3 | useTypewriter: 글자 단위 노출 + 완료 감지 | displayed가 점진 증가, done=true 시 전체 텍스트 표시 | |
| V4 | S4 | isStreaming=true 시 TypingIndicator 표시 | 3-dot bounce 애니메이션이 마지막 아이템 아래 표시 | |
| V5 | S5 + 경계5 | 사용자 상향 스크롤 중 addItem | 스크롤 위치 유지, 강제 이동 없음 | |
| V6 | 경계3 | typewriter 진행 중 text prop 변경 | 이전 애니메이션 정리, 새 텍스트로 재시작 | |
| V7 | 경계4 | sequence 진행 중 unmount | 타이머 정리, 메모리 릭 없음 | |
| V8 | 경계2 | 빠른 연속 addItem | rAF 배치로 scroll 1회만 실행 | |

완성도: 🟡

---

**전체 완성도:** 🟢 8/8 (교차 검증 통과, 구현 착수 가능)
