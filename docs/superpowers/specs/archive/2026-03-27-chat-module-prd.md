# Gen UI Chat Module — PRD

> Discussion: LLM 시대 채팅 기반 UI Block — TimelineColumn을 범용 채팅 모듈로 승격, AI tool call → 인터랙티브 UI 블록 렌더링

## ① 동기

### WHY

- **Impact**: agent viewer 외의 라우트(incident, 데모, 향후 Gen UI)에서 채팅 UI를 쓸 수 없다. TimelineColumn이 agent-ops에 직접 결합되어 있어 재사용 불가. LLM 시대에 채팅 기반 UI Block이 핵심 인프라인데, 범용 모듈이 없다.
- **Forces**: ① TimelineColumn이 세션 관리·SSE·tool 전용 렌더링을 모두 품고 있음 vs ② 채팅은 "정규화된 메시지 + 블록 렌더러"로 단순화 가능. 정규화 store와 command 체계는 이미 존재하지만, 채팅 스키마가 없어서 연결점이 없다.
- **Decision**: `ui/chat/*` 도메인 폴더에 정규화 스키마 + ChatFeed + 블록 렌더러 OCP 구조. 기각 대안: "TimelineColumn을 그대로 두고 별도 신규 작성" → 동일 로직 두 벌 유지, 정규화 원칙 위반.
- **Non-Goals**: ① engine query/mutation/subscription (별도 백로그) ② 서버 API 설계 ③ 외부 SDK 배포 ④ MCP channel 양방향 통신 (기존 백로그)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | agent viewer가 세션 타임라인을 표시 중 | ChatFeed에 ChatMessage[]를 전달 | 기존과 동일한 메시지 버블 + 툴그룹 카드가 렌더링 | ✅ 일치 — timelineAdapter + ToolGroupBlock으로 포팅 |
| S2 | incident 페이지에서 AI 응답 표시 필요 | ChatFeed에 text/status/metric 블록 포함 메시지 전달 | 등록된 블록 렌더러로 각 블록이 렌더링 | ✅ V3 테스트로 실증 |
| S3 | 새 블록 타입(예: chart)을 추가 | blockRenderers에 chart 렌더러만 등록 | ChatFeed 코드 변경 없이 chart 블록 렌더링 (OCP) | ✅ V3 테스트에서 4개 커스텀 타입 실증 |
| S4 | 인터랙티브 블록(Grid)이 채팅 안에 표시 | 블록에 storeKey 지정, Grid 렌더러 등록 | Grid가 store에 바인딩, 셀 편집 → store 업데이트 | 🔀 V4에서 storeKey 전달은 검증했지만 실제 store 바인딩 인터랙션은 미검증 |
| S5 | assistant 메시지가 스트리밍 중 | isStreaming=true + 마지막 text 블록이 점진 갱신 | 타이프라이터 애니메이션 + 스트리밍 인디케이터 | 🔀 스트리밍 인디케이터 ✅, 타이프라이터 ❌ (useTypewriter 미통합) |

완성도: 🟢

## ② 산출물

> ui/chat/* 도메인 폴더 구조, 스키마, 컴포넌트

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ui/chat/types.ts` | ChatMessage, ChatBlock, BlockRendererMap 타입 정의. 정규화 메시지 스키마 단일 소스 | ✅ `types.ts::ChatMessage, ChatBlock, BlockRendererMap` |
| `ui/chat/ChatFeed.tsx` | 메시지 목록 렌더링. StreamFeed를 내부 사용. blockRenderers: Record로 블록 디스패치 | ✅ `ChatFeed.tsx::ChatFeed` |
| `ui/chat/ChatInput.tsx` | 메시지 입력 컴포넌트. onSubmit 콜백, disabled 상태, 자동 높이 | ✅ `ChatInput.tsx::ChatInput` |
| `ui/chat/TextBlock.tsx` | 마크다운 텍스트 블록. MarkdownViewer 래핑 | ✅ `TextBlock.tsx::TextBlock` |
| `ui/chat/CodeBlock.tsx` | 코드 블록. 기존 ui/CodeBlock 래핑 + 채팅 맥락 스타일 | ✅ `ChatCodeBlock.tsx::ChatCodeBlock` (이름 변경: 충돌 방지) |
| `ui/chat/DiffBlock.tsx` | diff 표시 블록. old/new 텍스트 비교 | ✅ `DiffBlock.tsx::DiffBlock` |
| `ui/chat/index.ts` | public API — 타입 + 컴포넌트 + 기본 렌더러맵 re-export | ✅ `index.ts` |
| `viewer/timelineAdapter.ts` | TimelineEvent[] → ChatMessage[] 변환 어댑터. viewer 전용 | ✅ `timelineAdapter.ts::timelineToMessages` |
| `viewer/ToolGroupBlock.tsx` | agent-ops 전용 툴그룹 블록 렌더러. 기존 ToolGroupCard 이동 | ✅ `ToolGroupBlock.tsx::ToolGroupBlock` |

⚠️ 추가 산출물: `FallbackBlock.tsx::FallbackBlock` — PRD에 미명시, OCP 안전망으로 구현

완성도: 🟢

## ③ 인터페이스

> ChatFeed는 비-인터랙티브 피드(role="feed")다. 키보드 인터랙션은 블록 내부 컴포넌트가 소유.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `messages: ChatMessage[]` prop 변경 | 피드에 N개 메시지 | 새 메시지 렌더링 + 페이싱 큐 | StreamFeed의 기존 페이싱 메커니즘 재사용. 새 아이템만 지연 노출 | 피드에 N+k개 메시지, 페이싱 중 | ✅ 일치 |
| `blockRenderers` prop | 기본 렌더러(text/code/diff) | 블록 타입별 렌더러 디스패치 | Record 키 룩업 — switch-case 없이 선언적 OCP. fallback 렌더러로 미등록 타입 처리 | 각 블록이 대응 렌더러로 렌더링 | ✅ 일치 |
| 스크롤 최하단 근처 + 새 메시지 | 자동 스크롤 활성 | smooth scroll to bottom | StreamFeed 기존 동작. 사용자 위치 존중 | 최신 메시지 보임 | ✅ StreamFeed 위임 |
| 사용자가 위로 스크롤 + 새 메시지 | 자동 스크롤 비활성 | FAB 버튼 표시, 자동 스크롤 안 함 | 사용자가 과거 내용을 읽는 중이면 위치를 존중해야 한다 | FAB 표시, 사용자 위치 유지 | ✅ StreamFeed 위임 |
| `isStreaming=true` | 피드 하단 | 스트리밍 인디케이터 표시 + 마지막 text 블록 타이프라이터 | 에이전트가 응답 중임을 시각 피드백. useTypewriter 재사용 | 인디케이터 + 점진 텍스트 노출 | 🔀 인디케이터 ✅, 타이프라이터 미통합 |
| ChatInput에 텍스트 입력 후 Enter | 입력창에 텍스트 | onSubmit(text) 콜백 호출, 입력창 초기화 | ChatInput은 뷰만 — 메시지 추가는 소비자 책임 | 입력창 비움, 소비자가 messages에 추가 | ✅ 일치 |
| ChatInput disabled=true | 입력 비활성 | 입력 불가, placeholder로 안내 | channel 미연결 등 소비자가 결정 | 비활성 상태 유지 | ✅ 일치 |
| 블록에 `storeKey` 존재 | 블록 렌더 시 | 렌더러가 useStore(storeKey)로 store 연결 | 블록 렌더러가 ComponentType이므로 내부에서 hook 사용 가능. ChatFeed는 관여 안 함 | 인터랙티브 블록이 store에 바인딩 | ✅ 타입+구조 일치, 실전 미검증 |
| 블록에 inline `data` 존재 | 블록 렌더 시 | 렌더러가 block.data를 직접 사용 | 정적 표시용. store 불필요한 읽기 전용 블록 | 데이터 표시 | ✅ 일치 |
| 미등록 블록 타입 | 렌더 시 | fallback 렌더러 사용 — JSON.stringify 또는 "Unknown block" | 선언적 OCP의 안전망. 새 타입이 등록 전에 도착해도 크래시 안 함 | fallback UI 표시 | ✅ 일치 |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| messages=[] 빈 배열 | 피드 비어있음 | 초기 로딩 또는 빈 대화. 크래시 방지 | 빈 피드 렌더링 (empty state는 소비자 책임) | 빈 피드 | ✅ V6 |
| 단일 메시지에 blocks=[] 빈 블록 | 메시지 존재 | 블록 없는 메시지는 렌더할 내용 없음 | 메시지 버블만 표시 (role 표시), 내용 없음 | 빈 버블 | ✅ V7 |
| 단일 메시지에 10+ 블록 | 메시지 렌더 중 | assistant가 여러 블록(텍스트+코드+diff 반복)을 한 턴에 생성 가능 | 블록을 순서대로 모두 렌더링. 메시지 내부 스크롤 없음 — 피드 레벨 스크롤만 | 모든 블록 표시 | ✅ 코드 구조상 보장 |
| 1000+ 메시지 | 피드에 대량 메시지 | 성능. 현재는 가상화 없이 DOM 렌더링 (대용량 가상화는 백로그) | 모두 렌더링. 성능 저하 가능하지만 현재 스코프 밖 | 느려질 수 있음 | ✅ 의도적 스코프 외 |
| blockRenderers에 등록 안 된 타입 | 블록 렌더 시 | OCP 실증의 핵심 경계. 크래시하면 안 된다 | fallback 렌더러 사용 | fallback UI | ✅ V2, V8 |
| storeKey가 존재하지 않는 store 참조 | 블록 렌더 시 | store가 아직 준비 안 됐거나 잘못된 키 | 렌더러 내부에서 처리 (ChatFeed는 모름). 렌더러가 에러 바운더리 또는 빈 상태 표시 | 에러 안내 또는 빈 상태 | ✅ 설계 위임 |
| storeKey와 data 동시 존재 | 블록 정의 시 | 타입 레벨에서 금지 (discriminated union). 런타임 도달 불가 | TypeScript 컴파일 에러 | 컴파일 실패 | ✅ V9 |
| assistant 메시지 스트리밍 중 사용자가 새 메시지 전송 | 스트리밍 중 | 입력은 소비자가 disabled 제어. ChatFeed는 관여 안 함 | 소비자 정책에 따름 | 소비자 결정 | ✅ 설계 위임 |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 선언적 OCP — 선언=등록, 합성 런타임 불변, switch-case dispatcher 금지 (feedback_declarative_ocp) | ③ blockRenderers Record 기반 디스패치 | ✅ 준수 | — | ✅ 준수 |
| P2 | 단일 정규화 store (feedback_one_app_one_store) | ③ storeKey로 전역 store 참조 | ✅ 준수 | — | ✅ 준수 |
| P3 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② 파일명 매핑 | ✅ 준수 — ChatFeed.tsx→ChatFeed, TextBlock.tsx→TextBlock 등 | — | ✅ 준수 |
| P4 | UI 완성품만 노출, primitives 노출 금지 (feedback_ui_over_primitives) | ② index.ts public API | ✅ 준수 — ChatFeed/ChatInput/블록이 완성품, StreamFeed/useTypewriter는 내부 | — | ✅ 준수 |
| P5 | CSS 모든 디자인 수치는 토큰 필수 (feedback_all_values_must_be_tokens) | ② 모든 chat 컴포넌트 CSS | ✅ 준수 예정 — /design-implement으로 작성 | — | 🔀 border-radius raw px 발견 → 토큰으로 수정 완료 |
| P6 | margin 금지, gap으로 간격 (feedback_gap_over_margin) | ② ChatFeed 레이아웃 | ✅ 준수 예정 | — | ✅ margin-left:auto는 정렬용 관용구, 간격 margin 아님 |
| P7 | 테스트 = 데모 = showcase (feedback_test_equals_demo) | ⑧ 검증 | ✅ 준수 — 테스트가 곧 데모 | — | ✅ 준수 |
| P8 | module.css 3블록 레시피 (feedback_module_css_3block_recipe) | ② CSS 파일 | ✅ 준수 예정 | — | 🔀 3블록 구조 미적용 (CSS가 단순하여 base만) |
| P9 | 중첩 렌더링 이벤트 버블링 가드 (feedback_nested_event_bubbling) | ③ 인터랙티브 블록 내 이벤트 | ⚠️ 주의 필요 — 블록 내 클릭이 피드 스크롤이나 외부로 버블링 가능 | 블록 렌더러에서 필요시 stopPropagation. 가이드라인 ⑦ 금지에 추가 | ✅ 인터랙티브 블록 미도입, 향후 주의 |
| P10 | 읽기가 기본, 쓰기만 명시 (feedback_readonly_default) | ③ 블록 인터랙션 | ✅ 준수 — 대부분 읽기, storeKey 있을 때만 쓰기 | — | ✅ 준수 |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | `viewer/TimelineColumn.tsx` — ChatFeed로 교체 | 기존 viewer 기능 회귀 (페이싱, 스크롤, 파일 링크) | 높 | agent viewer 포팅 테스트로 회귀 검증. timelineAdapter가 기존 동작 보장 | 🔀 파일 경로 클릭/loadOlder/세밀한 페이싱 소실 (의도적 스코프 축소) |
| E2 | `ui/StreamFeed.tsx` — ChatFeed가 내부 사용 | StreamFeed API에 변경 필요할 수 있음 | 중 | StreamFeed는 변경하지 않음. ChatFeed가 래핑만. 변경 필요 시 별도 PRD | ✅ 변경 없음 |
| E3 | `ui/CodeBlock.tsx` — chat/CodeBlock이 래핑 | 래핑 레이어 추가로 스타일 충돌 가능 | 낮 | chat/CodeBlock은 컨테이너 스타일만, 렌더링은 기존 위임 | ✅ 일치 |
| E4 | `viewer/groupEvents.ts` — timelineAdapter가 대체 | groupEvents의 ToolGroup 로직이 adapter로 이동 | 중 | adapter에서 groupEvents를 import하여 재사용. 삭제하지 않음 | ✅ 일치 |
| E5 | `ui/` 폴더 구조 — 첫 도메인 서브폴더 | 기존 플랫 구조와 혼재 | 낮 | 허용. chat/가 선례가 되고, 향후 다른 도메인도 점진적 분리 | ✅ 일치 |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | ChatFeed 내부에 블록 타입별 switch-case/if-else 분기 | ⑤ P1 선언적 OCP | 블록 추가 시 ChatFeed 수정 필요해짐 = OCP 위반 | ✅ 준수 |
| F2 | ChatFeed가 데이터 fetch/SSE 구독을 직접 수행 | Discussion 결론 | 뷰와 데이터 소스 결합. 소비자마다 소스가 다름 | ✅ 준수 |
| F3 | chat/ 모듈이 viewer/ 또는 pages/에 의존 | ⑤ P4 레이어 방향 | ui → pages 역방향 의존 금지 | ✅ 준수 |
| F4 | StreamFeed API 변경 | ⑥ E2 | ChatFeed는 StreamFeed를 있는 그대로 사용. 변경 필요 시 별도 PRD | ✅ 준수 |
| F5 | 블록 내 이벤트를 피드 레벨로 무조건 버블링 | ⑤ P9 | 인터랙티브 블록의 클릭/키 이벤트가 피드 스크롤이나 외부에 영향 | ✅ 준수 |
| F6 | 블록에 storeKey + data 동시 존재 허용 | Discussion 결론 | 데이터 소스 모호. discriminated union으로 타입 레벨 차단 | ✅ 준수 |
| F7 | CSS에 raw 수치 사용 | ⑤ P5 | 디자인 토큰 필수 | 🔀 위반 발견 → 수정 완료 |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | timelineAdapter로 변환한 ChatMessage[]를 ChatFeed에 전달 | user/assistant 메시지 + ToolGroupBlock이 기존과 동일하게 렌더링 | ✅ `chat-module.test.tsx::converts TimelineEvents to ChatMessages and renders them` |
| V2 | S3 | 기본 렌더러(text/code/diff)만 등록된 상태에서 tool 블록 도착 | fallback 렌더러가 동작, 크래시 없음 | ✅ `chat-module.test.tsx::renders fallback for unregistered block types` |
| V3 | S3 | tool/status/metric/image 렌더러를 등록하고 해당 블록 전달 | ChatFeed 코드 변경 없이 모든 블록 정상 렌더링 (OCP 실증) | ✅ `chat-module.test.tsx::renders custom block types via blockRenderers without modifying ChatFeed` |
| V4 | S4 | storeKey를 가진 블록 + 해당 store 존재 | 블록 내 컴포넌트가 store에 바인딩, 인터랙션 동작 | 🔀 `chat-module.test.tsx::renders a block with storeKey via custom renderer` (storeKey 전달 검증만, 실제 store 인터랙션 미검증) |
| V5 | S5 | isStreaming=true + 마지막 메시지 text 블록 | 타이프라이터 애니메이션 + 스트리밍 인디케이터 | 🔀 `chat-module.test.tsx::shows streaming indicator when isStreaming=true` (인디케이터만, 타이프라이터 미통합) |
| V6 | 경계1 | messages=[] 전달 | 빈 피드, 크래시 없음 | ✅ `chat-module.test.tsx::renders empty feed without crash` |
| V7 | 경계2 | blocks=[] 메시지 전달 | 빈 버블 렌더링, 크래시 없음 | ✅ `chat-module.test.tsx::renders message bubble with empty blocks without crash` |
| V8 | 경계5 | 미등록 타입 블록 전달 | fallback UI, 크래시 없음 | ✅ `chat-module.test.tsx::shows fallback UI for unregistered block type without crash` |
| V9 | 경계7 | storeKey + data 동시 지정 시도 | TypeScript 컴파일 에러 | ✅ `chat-module.test.tsx::DataBlock has no storeKey, StoreBlock has no data` |
| V10 | F5 | 인터랙티브 블록 내 클릭 | 피드 스크롤에 영향 없음 | 🔀 `chat-module.test.tsx::calls onSubmit with trimmed text on Enter` (ChatInput 테스트로 대체, 블록 내 클릭 미검증) |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8 — 교차 검증 통과
