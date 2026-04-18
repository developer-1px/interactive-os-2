---
id: 1-projects/chat/prds/chat-perf-prd
title: 'Chat Performance Optimization — PRD'
created: 2026-03-31
updated: 2026-04-08
summary: 'Discussion: 채팅 UI 퍼포먼스 병목 제거 + 스트리밍 줄바꿈 pacing'
legacy:
  status: active
  kind: prd
  topics: [1-projects]
  relates: []
  supersedes: []
---
# Chat Performance Optimization — PRD

> Discussion: 채팅 UI 퍼포먼스 병목 제거 + 스트리밍 줄바꿈 pacing

## ① 동기

### WHY

- **Impact**: 채팅 UI가 스트리밍 중 프레임 드롭, 긴 대화에서 preview 버벅임. 체감 퍼포먼스가 제품 품질을 떨어뜨림
- **Forces**: MarkdownViewer가 매 렌더마다 full AST 파싱 (react-markdown + remark-gfm + rehype-raw). StreamingTextBlock이 200ms마다 플러시할 때마다 파싱 반복. useStreamFeed에 pacing queue 인프라가 이미 존재하지만 미사용
- **Decision**: G1(memo) → G3(pacing) 순서. typewriter 기각(호흡 끊김), 주르륵 기각(날것 느낌) → 줄바꿈 단위 chunk 등장
- **Non-Goals**: 메시지 리스트 가상화(G2)는 이번 범위 밖. 기능 추가 없음. store 구조 변경 없음

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 채팅 대화가 진행 중 | 어시스턴트가 마크다운 텍스트를 스트리밍 | 60fps 유지, 프레임 드롭 없음 | ✅ memo + pacing으로 렌더 부하 감소 |
| S2 | 50+ 메시지가 있는 세션 | 세션을 열어 기존 메시지를 렌더 | 초기 렌더가 버벅임 없이 완료 | ✅ TextBlock/DiffBlock memo로 re-render 방지 |
| S3 | 스트리밍 텍스트가 도착 | 줄바꿈(`\n`) 경계에서 chunk가 완성 | 완성된 줄이 자연스럽게 등장 (한꺼번에 X, 글자씩 X) | ✅ `StreamingTextBlock.tsx::StreamingTextBlock` |
| S4 | 기존 완료된 TextBlock | 부모가 re-render | 마크다운 파싱이 반복되지 않음 (memo hit) | ✅ `TextBlock.tsx::TextBlock` memo |
| S5 | DiffBlock이 큰 diff를 표시 | 부모가 re-render | split 연산이 반복되지 않음 | ✅ `DiffBlock.tsx::DiffBlock` memo + useMemo |

완성도: 🟢

## ② 산출물

> 기존 7개 파일 수정. 새 파일 없음.

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `MarkdownViewer.tsx` (수정) | `React.memo` 래핑 + `components` 객체 `useMemo` 안정화 | ✅ `MarkdownViewer.tsx::MarkdownViewer` |
| `TextBlock.tsx` (수정) | `React.memo` 래핑 | ✅ `TextBlock.tsx::TextBlock` |
| `ThinkingBlock.tsx` (수정) | `React.memo` 래핑 | ✅ `ThinkingBlock.tsx::ThinkingBlock` |
| `DiffBlock.tsx` (수정) | `React.memo` 래핑 + `useMemo`로 `split('\n')` 캐싱 | ✅ `DiffBlock.tsx::DiffBlock` |
| `ToolSummaryBlock.tsx` (수정) | `ToolGroup` 내부 연산 `useMemo` | ✅ `ToolSummaryBlock.tsx::ToolGroup` |
| `StreamingTextBlock.tsx` (수정) | `\n` 단위 pacing queue + chunk 등장 transition | ✅ `StreamingTextBlock.tsx::StreamingTextBlock` |
| `StreamFeed.tsx` (수정) | 디버그 `console.log` 제거 | ✅ `StreamFeed.tsx::StreamFeed` |

완성도: 🟢

## ③ 인터페이스

### G1: MarkdownViewer memo화

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 부모 re-render, content 동일 | MarkdownViewer 렌더됨 | memo props 비교 → 스킵 | content/codeVariant/styles 동일이면 AST 파싱 불필요 | 이전 DOM 유지 | |
| 부모 re-render, content 변경 | MarkdownViewer 렌더됨 | memo miss → re-render | content 변경 = 새 AST 필요 | 새 마크다운 파싱 | |
| MarkdownViewer 내부 | components 객체 매번 신규 생성 | useMemo로 안정화 | 매번 새 참조면 react-markdown 내부 캐시 무효화 | 동일 참조 유지 | |

### G3: StreamingTextBlock pacing

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| content delta 도착 | pending 비어있음 | delta를 pending에 누적 | 즉시 렌더 = 날것 느낌, 줄 단위로 모아야 리듬 | pending에 텍스트 축적 | |
| pending에 `\n` 포함 | 완성된 줄 존재 | `\n` 기준 완성된 줄만 flush, 나머지 pending 잔류 | 줄바꿈 = 마크다운 의미 단위 경계 | 완성 줄 → displayed 합산 | |
| flush 발생 | displayed 갱신 | MarkdownViewer에 전달 + CSS transition 등장 | chunk 단위 등장 = 정제된 느낌 | 새 줄 자연스럽게 나타남 | |
| `\n` 없이 200ms 경과 | pending에 미완성 줄 | 타임아웃 flush | 마지막 줄이 영원히 안 보이면 안 됨 | 미완성 줄도 표시 | |
| 스트리밍 완료 | content 변화 없음 | 최종 flush | 잔여 pending 소진 | 전체 텍스트 완료 | |

### 부차: DiffBlock/ToolSummaryBlock memo

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| DiffBlock 부모 re-render, block 동일 | split 실행됨 | memo 스킵 + useMemo split 캐싱 | block.old/new 불변이면 재연산 불필요 | 이전 DOM 유지 | |
| ToolGroup 부모 re-render | stripLineNumbers/extractResultText 실행 | useMemo 캐싱 | 결과 불변이면 regex/JSON 불필요 | 캐싱된 값 반환 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 코드펜스(```)안 다수 `\n` | pending에 코드 축적 | 줄마다 flush하면 syntax highlighting 파편화 | 펜스 닫힐 때까지 flush 보류, 닫히면 통째로 등장 | 완성 코드블록 한 번에 나타남 | |
| `\n` 없이 500자+ 긴 줄 | pending 계속 축적 | 200ms 타임아웃이 safety net, 무한 대기 방지 | 200ms 후 미완성 줄 flush | 긴 줄도 표시됨 | |
| 빈 content 스트리밍 | displayed 빈 문자열 | 빈 마크다운 파싱 낭비 방지 | `if (!displayed) return null` 유지 | 아무것도 렌더 안 함 | |
| 스트리밍 중 사용자 위로 스크롤 | auto-scroll 활성 | 사용자 읽기 위치 존중 | auto-scroll 중단, 하단 버튼 표시 | 스크롤 위치 유지 | |
| MarkdownViewer styles undefined | 기본값 defaultStyles | memo 비교 시 동일 참조 보장 | memo hit 정상 | 안정적 | |
| DiffBlock 빈 old/new | split('') = [''] | 빈 diff도 유효 | 빈 패널 렌더 | 정상 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | os 기반 개발: ui/ 완성품 사용 (CLAUDE.md) | ②전체 | ✅ 준수 | ui/ 내부 수정만 | |
| 2 | 속도가 아니라 리듬, 큐 기반 페이싱 (feedback_animation_buys_time) | ③G3 | ✅ 준수 | `\n` 단위 chunk 등장 | |
| 3 | CSS 모든 수치는 토큰 필수 (CLAUDE.md) | ④ transition | ✅ 준수 | motion 토큰 사용 | |
| 4 | mock 호출 검증 금지 (CLAUDE.md) | ⑧검증 | ✅ 준수 | DOM 상태 검증만 | |
| 5 | 테스트: 인터랙션은 통합 (CLAUDE.md) | ⑧검증 | ✅ 준수 | 렌더 결과 검증 | |
| 6 | module.css 3블록 (feedback_module_css_3block_recipe) | transition CSS | ✅ 준수 | 기존 module.css variant 추가 | |
| 7 | 선언적 OCP (feedback_declarative_ocp) | ④코드펜스 보류 | ✅ 준수 | fence 카운터 = 단순 상태 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | MarkdownViewer 소비자 전체 | 비파괴적 — 렌더 스킵만 추가 | 낮 | 허용 | |
| 2 | StreamingTextBlock flush 타이밍 | 코드펜스 보류로 등장 약간 지연 | 낮 | 200ms 타임아웃 safety net | |
| 3 | DiffBlock/ToolSummaryBlock | memo 비교 비용 추가 | 낮 | shallow 비교 O(1) | |
| 4 | StreamFeed console.log 제거 | 디버깅 로그 없어짐 | 낮 | devtools breakpoint | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | MarkdownViewer 내부에서 content 가공(trim/slice) | ⑥-1 비파괴 | memo 비교 대상 ≠ 파싱 대상 → 캐시 무효화 버그 | |
| 2 | pacing 중 displayed 직접 조작 | ⑤-7 선언적 OCP | flush만이 갱신 경로, 우회 시 동기화 깨짐 | |
| 3 | transition에 raw duration 값 | ⑤-3 토큰 필수 | motion 토큰만 사용 | |
| 4 | 코드펜스 보류에 마크다운 full parse | ⑥-2 지연 최소화 | ``` 카운터면 충분, AST 파싱 과잉 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 스트리밍 fps | 마크다운 텍스트 스트리밍 중 렌더 | 프레임 드롭 없이 부드러운 출력 | ✅ Profiler 수동 검증 (memo + pacing) |
| V2 | S3 줄바꿈 pacing | `\n` 포함 텍스트 스트리밍 | 완성된 줄 단위로 등장, 글자씩/주르륵 아님 | ✅ 코드 구현 확인 |
| V3 | S4 memo hit | 동일 content로 부모 re-render 유발 | MarkdownViewer 렌더 스킵 (React DevTools Profiler 확인) | ✅ Profiler 수동 검증 |
| V4 | S5 DiffBlock memo | 동일 block으로 부모 re-render | split 재실행 없음 | ✅ Profiler 수동 검증 |
| V5 | E1 코드펜스 | 코드블록 포함 텍스트 스트리밍 | 펜스 닫힐 때까지 보류, 닫히면 통째로 등장 | ✅ 코드 구현 확인 |
| V6 | E2 긴 줄 | `\n` 없이 500자+ 스트리밍 | 200ms 후 표시 | ✅ 코드 구현 확인 |
| V7 | E4 사용자 스크롤 | 스트리밍 중 위로 스크롤 | auto-scroll 중단, 위치 유지 | ✅ 기존 구현 유지 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

#kind/prd #topic/chat
