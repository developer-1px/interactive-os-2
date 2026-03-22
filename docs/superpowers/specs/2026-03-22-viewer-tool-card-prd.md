# Viewer Tool Card Grouping — PRD

> Discussion: agent viewer에서 Bot 아이콘 제거, 연속 tool call을 rounded border 카드로 그룹핑하여 LLM 응답과 구조적으로 분리

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | agent viewer 타임라인에서 assistant 텍스트와 tool call이 flat list로 섞여 있다 | 사용자가 세션을 리뷰한다 | tool call 구간과 LLM 응답 구간이 시각적으로 즉시 구분되어야 한다 | |
| M2 | assistant 이벤트에 Bot 아이콘이 붙어있다 | 사용자가 타임라인을 스캔한다 | 아이콘 없이도 구조만으로 assistant/tool 구분이 가능해야 한다 | |
| M3 | viewer는 읽기 전용 리뷰 도구다 | 사용자가 타임라인을 본다 | 인터랙티브 기능(collapse 등)은 불필요하고, 정적으로 정돈된 형태면 충분하다 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ToolGroup` 타입 | `{ type: 'tool_group'; events: TimelineEvent[] }` — 연속 tool_use 이벤트를 묶는 단위 | |
| `DisplayItem` 유니온 | `TimelineEvent \| ToolGroup` — virtual scroll 아이템 단위 | |
| `groupEvents()` 함수 | `TimelineEvent[]` → `DisplayItem[]` 전처리. 연속 tool_use를 ToolGroup으로 묶음 | |
| `ToolGroupCard` 컴포넌트 | rounded border 카드. 내부에 tool별 행을 divider로 구분하여 렌더링 | |
| CSS: `.tcToolGroup` | 카드 외곽 스타일 (border, radius, background) | |
| CSS: `.tcToolRow` | 카드 내부 개별 tool 행 스타일 | |
| CSS: `.tcToolDivider` | 카드 내 행 간 구분선 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| SSE로 tool_use 이벤트 도착 | 직전 아이템이 tool_use 또는 ToolGroup | groupEvents가 마지막 ToolGroup에 추가 | 연속 tool_use는 하나의 작업 단위이므로 시각적으로 묶어야 의미 전달 | 기존 카드가 행 하나 늘어남 | |
| SSE로 assistant 이벤트 도착 | 직전 아이템이 ToolGroup | groupEvents가 새 DisplayItem으로 분리 | assistant 텍스트는 카드 밖 일반 흐름이어야 LLM 응답이 구분됨 | 카드 닫히고 assistant 텍스트 표시 | |
| SSE로 tool_use 도착 | 직전이 assistant | groupEvents가 새 ToolGroup 생성 | 새로운 도구 작업 단위 시작 | 새 카드 시작 | |
| 클릭 | 카드 내 파일 경로가 있는 tool 행 | 기존 handleTimelineClick 동작 | 파일 모달 열기는 기존 기능 유지 | FileViewerModal 열림 | |
| tool_result 이벤트 | 타임라인에 tool_result 존재 | tool_result는 렌더링에서 제외 (기존과 동일) | tool_result는 내부 데이터, 사용자에게 보여줄 가치 없음 | 변화 없음 | |

### 인터페이스 체크리스트 (AI 자가 검증)

읽기 전용 뷰이므로 키보드/마우스 인터랙션은 최소:

- ↑↓←→ 키: N/A (스크롤은 브라우저 기본)
- Enter/Space: N/A
- Escape/Tab: N/A
- Home/End: N/A
- 클릭: 파일 경로 있는 tool 행 → 파일 모달 (기존 동작 유지)
- 이벤트 버블링: 카드 내부 클릭이 카드 전체 이벤트로 전파되지 않도록 — 각 행이 개별 onClick 핸들러

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| tool_use가 1개만 연속 | assistant → tool_use(1개) → assistant | 1개여도 카드로 감싸야 시각적 일관성 유지 | 1행짜리 카드 표시 | 카드에 행 1개, divider 없음 | |
| tool_use가 20개+ 연속 | 대량 파일 수정 작업 | 카드 높이가 커져도 virtual scroll이 처리 | 긴 카드, estimatedItemHeight = 40 × count | 스크롤 추정 오차 있지만 읽기 전용이라 허용 | |
| user 이벤트 사이에 tool_use만 존재 | user → tool_use × N → user | tool call은 항상 카드로 묶임, user 이벤트는 카드 밖 | ToolGroup 카드가 두 user 버블 사이에 위치 | |
| assistant 텍스트 없이 바로 tool_use | 세션 시작 직후 | assistant 없어도 tool_use 연속이면 카드 생성 | 카드가 타임라인 최상단에 올 수 있음 | |
| tool_result가 tool_use 사이에 끼어있음 | tool_use → tool_result → tool_use | tool_result는 렌더링 제외이므로 연속성 판단에서도 무시 | 두 tool_use가 하나의 카드에 묶임 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | barrel export 금지 (CLAUDE.md) | ② ToolGroupCard | ✅ 위반 없음 — TimelineColumn.tsx 내부에 정의 | — | |
| P2 | 파일명 = 주 export (CLAUDE.md) | ② 산출물 | ✅ 위반 없음 — 기존 TimelineColumn.tsx에 추가, 새 파일 불필요 | — | |
| P3 | 테스트: 계산은 unit (CLAUDE.md) | ② groupEvents | ✅ — groupEvents는 순수 계산이므로 unit 테스트 대상 | — | |
| P4 | mock 호출 검증 금지 (CLAUDE.md) | ⑧ 검증 | ✅ — DOM 결과로 검증 | — | |
| P5 | 설계 원칙 > 사용자 요구 (memory) | ③ 인터페이스 | ✅ — 기존 engine 우회 없음, 읽기 전용 뷰 변경만 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | virtual scroll의 estimatedItemHeight | ToolGroup 높이가 가변(40 × N)으로 추정 오차 증가 | 낮 | estimatedItemHeight를 동적으로 계산하거나, measureItem이 실측하므로 허용 | |
| S2 | SSE 실시간 업데이트 시 그룹핑 | 새 이벤트 도착마다 groupEvents 재계산 | 낮 | useMemo로 캐싱, 이벤트 배열 변경 시에만 재계산 | |
| S3 | Bot import 제거 | lucide-react에서 Bot 미사용 | 없음 | import 정리만 | |
| S4 | TimelineItem의 showIcon 분기 | assistant에서 showIcon 제거 | 낮 | assistant는 아이콘 열 없이 텍스트만 표시 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | collapse/expand 인터랙션 추가 | M3 (읽기 전용) | 과도한 인터랙티브 기능은 읽기 용도에 불필요 | |
| F2 | tool_result를 카드에 포함 | ③ 인터페이스 | tool_result는 내부 데이터, 표시 가치 없음 | |
| F3 | 새 파일 분리 | P2 (파일명=주export) | TimelineColumn.tsx 내에서 해결, 파일 분리 불필요 | |
| F4 | assistant 이벤트에 새 아이콘 부여 | M2 (구조로 구분) | 아이콘 의존을 제거하는 것이 목적 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | M1 | assistant + tool_use × 3 + assistant 시퀀스 렌더링 | tool_use 3개가 하나의 rounded border 카드 안에, assistant 텍스트는 카드 밖 | |
| V2 | M2 | assistant 이벤트 렌더링 | Bot 아이콘 없음, 텍스트만 표시 | |
| V3 | 경계: 1개 tool | assistant → tool_use(1개) → assistant | 1행짜리 카드, divider 없음 | |
| V4 | 경계: tool_result 사이 | tool_use → tool_result → tool_use | tool_result 무시, 두 tool_use가 한 카드 | |
| V5 | M1 + S2 | SSE로 실시간 이벤트 도착 | 카드가 점진적으로 커지며 그룹핑 유지 | |
| V6 | 경계: 20+ tool | tool_use × 25 연속 | 긴 카드 렌더링, 스크롤 정상 동작 | |
| V7 | S1 | virtual scroll에서 ToolGroup 높이 측정 | measureItem으로 실측 후 스크롤 위치 보정 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
