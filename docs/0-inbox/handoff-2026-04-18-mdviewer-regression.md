---
created_at: 2026-04-18
session_id: mdviewer-regression
---

# Handoff: MarkdownViewer 회귀 복구 — `/viewer/docs/*` 스타일·머메이드·스크롤

> `/viewer/docs/2-areas/styles/prds/ax-liquid-glass-prd.md` 에서 mermaid 미렌더 + prose typography 무시 + 스크롤 끊김 3건을 추적·복구하고 main 에 push.

## 완료

| 커밋 | 내용 |
|------|------|
| `384d7698` | fix(viewer): MarkdownViewer 회귀 3건 복구 — mermaid·prose 색·@layer 순서 |

핵심 변경:
- `pages/showcase/registerMdRenderer.tsx` 신규 — `.md` 렌더러를 pages 레이어에서 `showcaseMdConfig` 주입하며 등록 (ui→pages dep 차단 유지)
- `src/main.tsx` 첫 import 를 `./styles/layers.css` 로 변경 — `@layer` 순서 역전 차단
- `MarkdownViewer.css` `.markdown { color: var(--text-primary) }` 자기 색 owning
- `guardOsPatterns.mjs` 규칙 34 추가 — `main.tsx` 첫 import 검증

## 남은 것

없음. 작업 self-contained.

## 컨텍스트

- **근본 원인 1 (mermaid)**: 커밋 `69004846` (ui→pages dep 차단) 이후 `ui/FilePreview` 의 `.md` 렌더러가 `showcaseMdConfig` 를 import 못해 `mermaidComponent` undefined → CodeViewer fallback. `/viewer` normal mode 만 영향, spread mode (`Cmd+B`) 와 `/book` 은 직접 config 전달이라 정상이었음.
- **근본 원인 2 (prose 색)**: 커밋 `bebea737` (Bundle D-3) 에서 `MarkdownViewer.tsx:165` 의 `text: 'primary'` 제거. 컨테이너 부모 chain 에 surface 선언 없어 자동 파생 발동 못 함.
- **근본 원인 3 (스크롤·typography)**: AppShell 의 React component imports → 그 안의 `.css` (`@layer component`) 가 `layers.css` 의 `@layer` statement 보다 먼저 로드 → component 레이어가 reset 보다 먼저 등록 → reset 이 후순위 = 더 높은 우선순위 → reset 의 `* { font: inherit }` 가 `.markdown { font-size }` 를 이김. main.tsx 첫 import 로 layers.css 강제하여 해결.
- **관련 PRD**: 없음 (회귀 수정).
- **회귀 방지**: 훅 규칙 34 (정적 차단). main.tsx 의 첫 import 가 `./styles/layers.css` 가 아니면 즉시 block.

## 이어받는 법

작업 종료. 다음 세션은 새 주제로 시작.
