# FE × AI UI Layer 전략 — 2026-03-25

## 배경

클라우드팀(인프라/백엔드 중심) 소속 FE로서 전사 임팩트 성과 아이템을 탐색하는 논의에서 도출. "FE에게 장애란?" → "터미널 LLM이 못하는 건?" → "LLM 시대 UI의 모양은?" → "채팅 블록 UI" → "AI→UI 변환 레이어"로 수렴.

## 논의 흐름

### 1단계: FE의 가치 — pull vs push

- 터미널 LLM은 "물어봐야 답하는"(pull) 구조
- FE가 만드는 인터페이스는 "물어보지 않아도 보이는"(push) 구조
- 기술적으로 터미널이 못하는 건 "비-개발자 접근성" 하나뿐
- 하지만 FE 전문가로서 **다른 직군이 못 보는 가능성을 제안**하는 것이 가치

### 2단계: LLM 시대 UI 패러다임

3가지 패러다임 조사 (→ 25-[design]llmEraUiParadigms.md):
- **Generative UI** — LLM이 텍스트 대신 컴포넌트 출력 (Vercel AI SDK, Google A2UI)
- **Agentic UI** — 에이전트가 상황에 따라 UI 구성 (CopilotKit CoAgents)
- **Ambient UI** — AI가 맥락에서 자동 시각화 (Claude Interactive Visuals)

CopilotKit의 "Chatless" 표면이 핵심 — 채팅 없이 에이전트가 네이티브 UI를 구성

### 3단계: 채팅 블록 UI = 미래

- 대시보드(고정) vs 채팅(직렬) → 결국 **채팅 블록(리치 컴포넌트 스트리밍)**으로 수렴
- 프로토타입 3버전으로 검증:
  - v1: 전통 대시보드 (고정 레이아웃)
  - v2: 에이전트 스트리밍 (단계별 블록)
  - v3: 채팅 어포던스 + 컨텍스트 패널 (왼쪽 대화 + 오른쪽 상시 메트릭)

### 4단계: 컴포넌트 갭 발견

AI 제품 전수 조사 (Claude, ChatGPT, Cursor, v0, Copilot, Perplexity, Gemini, Replit, Windsurf):
- interactive-os에 "채팅 블록 레이어"가 통째로 없음
- 메트릭, 실행(bash), 코드, diff, 에이전트 스텝 등 전무

### 5단계: Thesys가 증명한 시장 수요

- Thesys C1 = LLM이 아닌 미들웨어 (LLM 출력 → UI 컴포넌트 변환)
- 300개 팀이 사용 중 = "AI→UI 변환" 작업에 시장 수요 실증
- 기술적 참신함이 아니라 **FE 작업의 제거**가 어필 포인트
- interactive-os가 같은 포지션 가능: `Aria primitives → interactive-os UI → AI→UI 레이어 → Agent`

## 결론: 성과 아이템

> "우리 팀의 AI 에이전트 출력을 사람이 쓸 수 있는 UI로 바꾸는 레이어를 만들겠다"

구체적 산출물:
1. **채팅 블록 컴포넌트 카탈로그** — 에이전트가 골라 쓰는 리치 블록 라이브러리
2. **인시던트 코파일럿** — 장애 감지 → 에이전트 분석 → 리치 블록 스트리밍 → 행동 연결
3. **AG-UI 어댑터** — 내부 AI 에이전트 ↔ 프론트엔드 표준 연결

## 산출물 목록

### 프로토타입
- `/incident` 라우트 — 3버전 진화 (현재 v3: 채팅 + 컨텍스트 패널)
  - `src/pages/PageIncidentInterface.tsx`
  - `src/pages/PageIncidentInterface.module.css`

### 리서치 문서
- `docs/3-resources/25-[design]llmEraUiParadigms.md` — LLM 시대 UI 3가지 패러다임
- `docs/3-resources/26-[design]generativeInteractiveUi.md` — Generative Interactive UI 사례와 기술

### 백로그 (BACKLOGS.md)
- [P0] 채팅 블록 필수 7개 (CodeBlock, MarkdownBlock, ProgressStep, Terminal, DiffView, AgentStep, StatCard)
- [P1] 채팅 블록 확장 4개 (ThinkingBlock, FileRef, Citation, ConfirmAction)
- [P2] Ops 특화 3개 (CausalChain, ServiceMap, LogViewer)

### Memory
- `project_metric_component_gap.md` — UI SDK 메트릭 컴포넌트 갭
- `project_fe_value_ai_ui_layer.md` — FE 성과 아이템 전략

## 다음 행동

1. Thesys Playground / CopilotKit Demo 직접 체험하여 인터랙션 수준 확인
2. P0 채팅 블록 7개 설계 → interactive-os 확장
3. AG-UI 프로토콜 스펙 정독하여 어댑터 설계
