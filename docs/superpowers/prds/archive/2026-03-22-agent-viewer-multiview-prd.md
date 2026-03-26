# Agent Viewer Multi-Timeline + Modal File Viewer — PRD

> Discussion: CLI에서 파일 접근이 불편 → 타임라인에서 파일 클릭 시 모달 뷰어, 멀티세션 타임라인 동시 표시, inactive 세션 아카이브

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | tmux split으로 Claude 세션 2~3개를 동시에 돌리고 있다 | Agent Viewer에서 작업한다 | CLI 터미널에서 여러 세션이 나란히 흘러가는 경험이 그대로 유지된다 (세션 전환 없이 동시 타임라인) | |
| M2 | 타임라인에 이벤트 내용이 표시된다 | 스크롤하며 읽는다 | 모든 이벤트의 전체 내용이 잘림 없이 노출된다 (CLI 터미널처럼). 과거 내용은 virtual lazy loading으로 성능 확보 | |
| M3 | 타임라인에서 Read/Edit/Write 이벤트가 보인다 | 파일 경로를 클릭한다 | 해당 파일 내용이 모달로 즉시 표시된다 (CLI에서 직접 못 보는 것을 보완) | |
| M4 | 오래 전(반나절~하루) 또는 /clear된 세션이 있다 | 과거 작업 내용을 확인하려 한다 | 아카이브된 세션 목록에서 선택하여 타임라인을 볼 수 있다 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| 레이아웃 변경 | 4패널(Sessions│Timeline│Content│Modified) → N컬럼(Sessions│Timeline₁│Timeline₂│…). Content·Modified 패널 제거 | `PageAgentViewer.tsx::PageAgentViewer` |
| FileViewerModal | 새 컴포넌트. 파일 클릭 시 모달로 CodeBlock/MarkdownViewer/MdxViewer/ImageViewer 렌더링. ESC/배경 클릭으로 닫기 | `FileViewerModal.tsx::FileViewerModal` |
| TimelineColumn | 단일 세션 타임라인 렌더링 컴포넌트. 기존 타임라인 로직을 추출하여 재사용. 세션 라벨 헤더 포함 | `TimelineColumn.tsx::TimelineColumn` |
| 가상 스크롤 | 타임라인 이벤트에 virtual lazy loading 적용. 전체 내용 잘림 없이 노출하면서 성능 확보 | `useVirtualScroll.ts::useVirtualScroll` |
| 세션 활성 판정 | 서버에서 mtime 기반 active/inactive 분류. active 세션만 자동으로 타임라인 컬럼 생성 | `vite-plugin-agent-ops.ts::agentOpsPlugin` |
| 서버 변경 | text slice(0,200) 제거 (전체 내용 전달). 세션별 SSE 스트림 다중화 지원 | `vite-plugin-agent-ops.ts::agentOpsPlugin` + `timelineSSE.ts` |
| CSS 변경 | line-clamp 제거. 타임라인 컬럼 flex 레이아웃 | `PageAgentViewer.module.css` + `TimelineColumn.module.css` |

완성도: 🟢

## ③ 인터페이��

### 타임라인 컬럼 자동 관리

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 세션이 active 상태가 됨 (SSE 이벤트 수신/mtime 갱신) | 해당 세션의 컬럼 없음 | 타임라인 컬럼 자동 추가 | CLI tmux처럼 활성 세션은 항상 보여야 한다 (M1) | active 세션 수만큼 컬럼이 나란히 표시 | |
| 세션이 inactive가 됨 (mtime 일정 시간 경과) | 해당 세션 컬럼 표시 중 | 타임라인 컬럼 자동 제거, Sessions 패널 아카이브로 이동 | 화면 공간 확보 + 끝난 세션이 계속 차지하면 안 됨 | active 컬럼만 남음 | |

### 아카이브 세션

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Sessions 패널에서 아카이브 세션 클릭/Enter | 아카이브 세션 목록 | 해당 세션 타임라인 컬럼 열림 (active 옆에 추가) | 과거 작업을 확인하려는 의도 (M4) | active 컬럼들 + 아카이브 컬럼 1개 표시 | |
| 아카이브 컬럼의 닫기 버튼 클릭 | 아카이브 컬럼 열려 있음 | 해당 컬럼 닫힘 | 수동 열기 = 수동 닫기, active와 달리 사용자가 관리 | 아카이브 컬럼 제거 | |
| ↑↓ | Sessions 패널 포커스 | 아카이브 세션 목록 탐색 | 기존 Aria listbox 동작 유지 | 포커스 이동 | |

### 파일 뷰어 모달

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 타임라인에서 파일 참조 이벤트 클릭 | 모달 닫힘 | 모달 열림, 해당 파일 내용 표시 (CodeBlock/Markdown/Mdx/Image) | 파일 즉시 접근이 핵심 (M3) | 모달에 Breadcrumb + 파일 메타 + 내용 | |
| ESC | 모달 열림 | 모달 닫힘 | 표준 모달 패턴 | 타임라인으로 복귀 | |
| 모달 배경 클릭 | 모달 열림 | 모달 닫힘 | 표준 모달 패턴 | 타임라인으로 복귀 | |
| 모달 열린 상태에서 다른 파일 이벤트 클릭 | 모달에 파일A 표시 중 | 모달 내용이 파일B로 교체 | 모달을 닫고 다시 열 필요 없이 빠르게 전환 | 모달에 파일B 표시 | |

### 타임라인 스크롤

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 스크롤 (마우스/터치) | 타임라인 컬럼 | 해당 컬럼만 독립 스크롤 | 각 세션은 독립 맥락 | 다른 컬럼 영향 없음 | |
| user 타입 이벤트 도착 (live) | 타임라인 스크롤 아무 위치 | 해당 user 이벤트를 뷰포트 최상단으로 스크롤 + 하단에 충분한 여백(min-height: 뷰포트 높이) 확보 | 사용자 입력 = 새 작업 단위의 시작, 터미널 clear처럼 시야를 리셋해야 후속 이벤트가 펼쳐지는 걸 추적할 수 있다 | user 이벤트가 최상단, 아래로 assistant/tool 이벤트가 쌓임 | |
| assistant/tool 이벤트 도착 (live) | 스크롤이 하단 근처 (마지막 user 이벤트 이후 자동추적 중) | 자동 스크롤 to bottom | CLI 터미널처럼 최신 내용 추적 (M1) | 최신 이벤트 보임 | |
| assistant/tool 이벤트 도착 (live) | 사용자가 위로 스크롤해서 과거 내용 읽는 중 | 자동 스크롤 안 함 | 읽고 있는 내용을 방해하면 안 됨 | 스크롤 위치 유지 | |

### N/A 키 검토

| 키 | 해당 여부 | 이유 |
|----|----------|------|
| ←→ | N/A | 컬럼 간 포커스 이동은 불필요 — 마우스/터치로 독립 조작 |
| Tab | N/A | 타임라인 아이템은 포커서블 위젯이 아님, 클릭만 |
| Space | N/A | 선택 동작 없음 |
| Home/End | N/A | 가상 스크롤에서 브라우저 기본 동작으로 충분 |
| Cmd/Ctrl 조합 | N/A | 해당 없음 |
| 더블클릭 | N/A | 단일 클릭으로 충분 |
| 이벤트 버블링 | 모달 내부 클릭이 배경 닫기로 전파되면 안 됨 | stopPropagation 필요 |

완성도: 🟢

## ④ 경계

| # | 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|---|----------|----------|------------------------|----------|----------|-------|
| E1 | active 세션이 0개 (모두 idle/아카이브) | 타임라인 컬럼 없음 | 빈 화면이면 도구 자체가 쓸모없어 보임 | Sessions 패널만 표시 + "세션을 선택하세요" 안내 | 아카이브에서 수동 열기 가능 | |
| E2 | active 세션이 4개 이상 (폭 부족) | 컬럼 3개 표시 중 | 컬럼이 너무 좁으면 내용 읽기 불가, active 자동 숨김은 M1 위반 | 컬럼 최소 폭(360px) 유지, 초과 시 가로 스크롤 | 읽을 수 있는 폭 보장 | |
| E3 | 타임라인 이벤트가 수천 개 (장시간 세션) | 가상 스크롤 적용 중 | 전체 DOM 렌더링하면 브라우저 멈춤 | 가상 스크롤이 뷰포트 근처만 렌더링, 나머지는 lazy | 스크롤 성능 유지 | |
| E4 | 이벤트 텍스트가 매우 긴 경우 (assistant 긴 응답) | 잘림 없이 전체 노출 | M2 동기: 전체 내용 노출이 원칙 | 그대로 전체 표시, 가상 스크롤이 가변 높이 처리 | 긴 이벤트도 읽을 수 있음 | |
| E5 | SSE 연결 끊김 (네트워크 오류) | live 스트리밍 중 | 연결 끊겨도 기존 내용은 보존해야 함 | 자동 재연결 + 재연결 시 전체 타임라인 refetch로 갭 없이 복구 | 기존 내용 유지 + 누락분 보충 | |
| E6 | 모달에서 보는 파일이 삭제됨/존재하지 않음 | 모달 열림 | 에러로 모달이 깨지면 안 됨 | "File not found" 메시지 표시 | 모달 정상 유지, 닫기 가능 | |
| E7 | 아카이브 컬럼 + active 컬럼 동시 표시 시 폭 | active 2개 + 아카이브 1개 열림 | E2와 동일한 폭 제한 적용 | 최소 폭 규칙 동일 적용 | 읽을 수 있는 폭 보장 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 파일명 = 주 export 식별자 (CLAUDE.md, feedback_naming_convention) | ② FileViewerModal, TimelineColumn | ✅ 준수 | — | |
| P2 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② 산출물 이름 | ✅ 준수 | modal은 ARIA dialog role, listbox는 기존 유지 | |
| P3 | 중첩 이벤트 버블링 가드: defaultPrevented 우선 (feedback_nested_bubbling_guard) | ③ 모달 내부 클릭 격리 | ✅ 준수 | 모달 내부에서 defaultPrevented 가드 적용 | |
| P4 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | 전체 | ✅ 준수 | Content/Modified 제거는 engine 우회가 아닌 레이아웃 변경 | |
| P5 | 테스트: 계산은 unit, 인터랙션은 통합 (CLAUDE.md, feedback_test_strategy) | ⑧ 검증 | ✅ 준수 | 세션 판정 로직 = unit, 모달 열기/닫기 = 통합 테스트 | |
| P6 | barrel export 금지 (CLAUDE.md) | ② 새 컴포넌트 | ✅ 준수 | 직접 import 사용 | |
| P7 | never mock 호출 검증 (CLAUDE.md) | ⑧ 검증 | ✅ 준수 | DOM/ARIA 상태로 검증 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | PageAgentViewer.tsx — Content 패널 제거 | 기존 CodeBlock/Breadcrumb/FileIcon/editedLines 로직이 모달로 이동해야 함 | 중 | FileViewerModal로 추출, 기존 viewer 컴포넌트는 그대로 재사용 | |
| S2 | PageAgentViewer.tsx — Modified 패널 제거 | modifiedStore, buildModifiedStore, followMode 로직 불필요 | 낮 | 삭제. followMode 제거 | |
| S3 | vite-plugin-agent-ops.ts — text slice 제거 | SSE 메시지 크기 증가, 네트워크 부하 상승 | 중 | 가상 스크롤로 렌더 부하 상쇄. SSE 전송은 스트리밍이라 단건 크기 증가는 감당 가능 | |
| S4 | vite-plugin-agent-ops.ts — SSE 다중화 | 현재 단일 스트림(최신 세션만 watch). 다중 세션 watch 필요 | 중 | 세션별 SSE 엔드포인트 또는 단일 스트림에 sessionId 태깅 | |
| S5 | CSS module — avContent, avModified 클래스 제거 | 사용처 없어짐 | 낮 | 삭제 | |
| S6 | Aria listbox (Sessions 패널) | Sessions 패널 역할 변경: 전체 선택 → 아카이브만 표시 (active는 자동) | 중 | Sessions 패널을 아카이브 전용으로 재구성. active 세션은 컬럼 헤더에 라벨 표시 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | 이벤트 텍스트 잘림 (slice, line-clamp) | M2 동기 위반 | CLI 경험 보존 = 전체 내용 노출 | |
| X2 | active 세션 자동 숨김/제거 (폭 부족 시) | M1 동기 위반, E2 경계 | 가로 스크롤로 해결, active는 항상 보여야 함 | |
| X3 | 모달 내부 클릭이 배경 닫기로 전파 | P3 원칙 위반 | defaultPrevented 가드 또는 stopPropagation 필수 | |
| X4 | barrel export 사용 | P6 원칙 위반 | CLAUDE.md 규칙 | |
| X5 | mock 호출 검증 테스트 | P7 원칙 위반 | DOM/ARIA 상태 검증만 허용 | |
| X6 | Content/Modified 패널 잔존 코드 | S1, S2 부작용 | 사용처 없는 코드 제거 필수, 점진적 마이그레이션 아님 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | M1 | active 세션 2개 실행 중 → Agent Viewer 열기 | 타임라인 컬럼 2개가 나란히 표시, 각각 SSE로 실시간 이벤트 수신 | ❌ 테스트 없음 |
| V2 | M1 | active 세션 1개 추가 (3번째 터미널에서 claude 실행) | 새 타임라인 컬럼이 자동으로 추가됨 | ❌ 테스트 없음 |
| V3 | M2 | 타임라인에서 assistant 긴 응답 이벤트 확인 | 전체 텍스트가 잘림 없이 표시됨 | ❌ 테스트 없음 |
| V4 | M2 | 장시간 세션 (이벤트 1000개+)에서 위로 빠르게 스크롤 | 가상 스크롤로 버벅임 없이 과거 이벤트 로딩 | ❌ 테스트 없음 |
| V5 | M3 | 타임라인에서 Edit 이벤트의 파일 경로 클릭 | 모달 열림, CodeBlock에 파일 내용 + edit highlight 표시 | ❌ 테스트 없음 |
| V6 | M3 | 모달 열린 상태에서 다른 Read 이벤트 클릭 | 모달 내용이 새 파일로 교체 (닫고 다시 열지 않음) | ❌ 테스트 없음 |
| V7 | M3 | 모달에서 ESC 누름 | 모달 닫힘, 타임라인으로 복귀 | ❌ 테스트 없음 |
| V8 | M4 | Sessions 패널에서 아카이브 세션 클릭 | 해당 세션의 타임라인 컬럼이 닫기 버튼과 함께 추가 | ❌ 테스트 없음 |
| V9 | M4 | 아카이브 컬럼의 닫기 버튼 클릭 | 해당 컬럼만 제거, active 컬럼 영향 없음 | ❌ 테스트 없음 |
| V10 | E1 | active 세션 0개, 아카이브만 존재 | Sessions 패널 + "세션을 선택하세요" 안내 표시 | ❌ 테스트 없음 |
| V11 | E2 | active 4개 + 아카이브 1개 열림 | 컬럼 최소 폭 360px 유지, 가로 스크롤 가능 | ❌ 테스트 없음 |
| V12 | E5 | SSE 연결 끊김 후 복구 | 기존 이벤트 유지 + refetch로 누락분 보충 | ❌ 테스트 없음 |
| V13 | E6 | 삭제된 파일의 이벤트 클릭 | 모달에 "File not found" 메시지, 정상 닫기 가능 | ❌ 테스트 없음 |
| V14 | ③ 스크롤 | live 세션에서 user 메시지 도착 | user 메시지가 뷰포트 최상단으로 스크롤 + 하단 여백 확보 | ❌ 테스트 없음 |
| V15 | ③ 스크롤 | 사용자가 위로 스크롤 후 assistant 이벤트 도착 | 자동 스크롤 안 함, 스크롤 위치 유지 | ❌ 테스트 없음 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
