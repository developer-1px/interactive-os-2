import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`# StreamingTextBlock — PRD

> Discussion: streamingText가 매 토큰마다 MarkdownViewer 전체 재파싱 → 끊김 발생.
> 줄 단위(\\n) flush + 200ms timeout fallback. 완료 후 MarkdownViewer 1회 파싱.

## ① 동기

### WHY

- **Impact**: 스트리밍 중 글자가 툭툭 끊기는 느낌. UI로 만들었는데 터미널보다 어색함 → UI 계약 미이행
- **Forces**: MarkdownViewer(react-markdown + remark 플러그인)는 전체 텍스트를 매번 파싱. 토큰 수신 속도(제어 불가) ≠ 렌더 속도(제어 가능)
- **Decision**: 스트리밍 중 plain text + 줄 단위 flush(200ms fallback), 완료 후 MarkdownViewer 1회 파싱. 기각: rAF 루프(복잡도 대비 효과 미미), 토큰 큐만(Markdown 재파싱 비용 미제거)
- **Non-Goals**: 토큰 수신 속도 제어 / chatStore 구조 변경 / MarkdownViewer 내부 최적화

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| 1 | 스트리밍 시작 | 토큰 수신 중 | 버퍼에 쌓이고 \\n 또는 200ms마다 화면에 반영 | |
| 2 | 스트리밍 중 | 화면에 반영될 때 | plain text 렌더, Markdown 파싱 없음 | |
| 3 | 스트리밍 완료 | assistant 이벤트 도착 | MarkdownViewer로 1회 전환 | |
| 4 | 전환 시 | 레이아웃 변경 가능성 | 시각적 점프 최소화 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| \`StreamingTextBlock.tsx\` | \`ui/chat/\` 안. \`streaming_text\` 블록 타입 렌더. 내부에 flush 로직 소유 | |
| \`types.ts\` 추가 | \`StreamingTextBlock\` 타입 (\`type: 'streaming_text', content: string\`) | |
| \`ChatPane.tsx\` 수정 | 스트리밍 중 synthetic message의 block type을 \`streaming_text\`로 변경 | |
| \`ChatPane.tsx\` 수정 | \`chatRenderers\`에 \`streaming_text: StreamingTextBlock\` 추가 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| \`content\` prop 변경 (토큰 도착) | 버퍼 ref에 쌓임 | 화면 업데이트 없음 | state가 아닌 ref → React re-render 없음 | 버퍼에 누적 | |
| \`\\n\` 감지 | 버퍼에 내용 있음 | flush → state 업데이트 | 줄 완성 시점이 의미 있는 단위 | 화면에 반영 | |
| 200ms 경과 (timeout) | 버퍼에 내용 있음 | flush → state 업데이트 | \\n 없는 긴 prose도 200ms 안에 반영 보장 | 화면에 반영 | |
| \`content\` prop이 빠르게 바뀜 | timeout 중 | timeout reset (debounce 아님, 독립 타이머) | 각 flush 주기는 독립적 | 누적 유지 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 스트리밍 완료 시 버퍼에 잔여 텍스트 | 마지막 \\n 없는 줄 남음 | 완료 이벤트에서 강제 flush 필요, 안 하면 마지막 줄 누락 | unmount/완료 시 잔여 버퍼 flush | 화면에 반영 후 MarkdownViewer 전환 | |
| 미완성 코드 펜스 (\`\`\` 열렸는데 닫힘 없음) | 스트리밍 중 | plain text이므로 파싱 없음, 그냥 텍스트로 표시 | 코드 펜스 기호가 그대로 보임 | 완료 후 MarkdownViewer가 처리 | |
| 빈 streamingText | content="" | 렌더할 것 없음 | 아무것도 표시 안 함 | 유지 | |
| 완료 후 전환 시 레이아웃 점프 | plain text → markdown 파싱 결과 | 폰트/간격이 달라질 수 있음 | CSS로 최소화 (동일 폰트 크기, line-height 유지) | 전환 완료 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | UI 완성품은 ui/에 먼저 만들고 pages에서 import (CLAUDE.md) | ② StreamingTextBlock | ✅ 준수 — ui/chat/ 안에 생성 | — | |
| 2 | addEventListener 금지, KeyMap 선언 (CLAUDE.md) | ③ 인터페이스 | ✅ 해당 없음 — 키 인터랙션 없음 | — | |
| 3 | 직접 state 조작 금지, store command + plugin (CLAUDE.md) | ② chatStore | ✅ chatStore 변경 없음 | — | |
| 4 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② StreamingTextBlock.tsx | ✅ 준수 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|----------------|-----------|--------|------|-------|
| 1 | \`ChatPane.tsx\` synthetic message | \`streaming_text\` 타입을 모르는 렌더러는 FallbackBlock으로 fallback | 낮음 | chatRenderers에 \`streaming_text\` 등록으로 해결 | |
| 2 | \`types.ts\` ChatBlock union | 타입 추가로 기존 switch/record 패턴 영향 없음 (record lookup, OCP 준수) | 없음 | — | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | 스트리밍 중 MarkdownViewer 사용 | ① Decision | 매 토큰 재파싱 = 끊김 원인 | |
| 2 | chatStore의 streamingText 구조 변경 | ① Non-Goals | 스토어 변경 없이 렌더 레이어만 교체 | |
| 3 | content prop을 직접 state로 받아 flush 없이 렌더 | ③ 인터페이스 | 현재와 동일한 문제 재발 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| 1 | ①-1 | 토큰 10개가 빠르게 도착, \\n 없음 | 200ms 후 한 번에 화면 반영 | |
| 2 | ①-1 | 토큰 중 \\n 포함 | \\n 즉시 flush, 이후 토큰은 다음 줄로 | |
| 3 | ①-3 | 스트리밍 완료 이벤트 | 잔여 버퍼 flush 후 MarkdownViewer 전환 | |
| 4 | ④ 미완성 코드 펜스 | 스트리밍 중 \`\`\` 열리고 완료 전 | 텍스트 그대로 표시, 완료 후 MarkdownViewer가 코드블록으로 렌더 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

**교차 검증:**
- ①↔⑧: 시나리오 1~4 전부 검증에 매핑 ✅
- ②↔③: StreamingTextBlock이 content prop으로 flush 로직 소유 ✅
- ④↔⑧: 미완성 코드 펜스, 잔여 버퍼 모두 검증에 포함 ✅
- ⑦↔⑤⑥: 금지 출처 전부 유효 ✅
`;export{t};