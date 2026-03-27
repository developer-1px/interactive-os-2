# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # dev server
pnpm typecheck        # type check (tsc --noEmit은 루트 files:[] 때문에 무효)
pnpm test             # vitest run (single: pnpm test -- path/to/file)
pnpm lint             # eslint
pnpm lint:css         # stylelint
pnpm build:lib        # tsup — dist-lib 라이브러리 빌드
pnpm score:design     # 디자인 점수
pnpm check:deps       # 레이어 의존성 위반 확인
```

## 아키텍처

### 레이어 구조 (의존 순서)

```
store → engine → axis → pattern → primitives → ui → pages
```

- **store** (`src/interactive-os/store/`): `NormalizedData` — 노드 플랫 맵 + 루트 ID 배열. Command 패턴으로 불변 업데이트.
- **engine** (`src/interactive-os/engine/`): `createCommandEngine` — Command 실행/undo/redo, Plugin 합성, `getVisibleNodes` 순회. `useEngine` hook.
- **axis** (`src/interactive-os/axis/`): navigate/select/expand/activate/dismiss/tab/value — ARIA 표준 축 7개. 각 축이 `VisibilityFilter` + `keyMap` 소유.
- **pattern** (`src/interactive-os/pattern/`): `composePattern` — axis 조합으로 APG 패턴(listbox, treegrid, tabs…) 생성. `examples/`에 APG 레퍼런스.
- **plugins** (`src/interactive-os/engine/`): `definePlugin` — history/crud/clipboard/rename/dnd/focusRecovery/spatial. Plugin은 keyMap까지 소유.
- **primitives** (`src/interactive-os/primitives/`): `useAria`, `useAriaZone`, `aria.tsx` — React 바인딩. `useAria`가 engine + pattern을 연결.
- **ui** (`src/interactive-os/ui/`): 완성품 컴포넌트 (TreeGrid, ListBox, Combobox, Workspace 등). useAria 기반.

### 앱 라우트 구조

| 경로 | 파일 | 역할 |
|------|------|------|
| `/` | `src/pages/cms/CmsLayout.tsx` | Visual CMS (기본 landing) |
| `/viewer/*` | `src/pages/PageViewer.tsx` | 메타 쇼케이스 + 문서 viewer |
| `/ui/*` | `src/pages/PageUiShowcase.tsx` | UI 완성품 쇼케이스 |
| `/agent/*` | `src/pages/PageAgentViewer.tsx` | Agent viewer |
| `/chat` | `src/pages/chat/PageAgentChat.tsx` | Claude WebSocket 채팅 |

### CMS 핵심 파일

- `src/pages/cms/cms-schema.ts` — Zod 15 노드 타입 SSOT
- `src/pages/cms/cms-store.ts` — 단일 store (하나의 앱 = 하나의 store)
- `src/pages/cms/cms-state.ts` — 파생 상태/셀렉터
- `src/pages/viewer/viewerStore.ts` — Viewer store

### 디자인 시스템

- `src/styles/tokens.css` — 토큰 SSOT
- `DESIGN.md` — 5개 번들 조합 규칙 (surface/shape/type/tone/motion)
- CSS 모든 수치는 토큰 필수. raw 숫자 사용 금지.
- module.css 3블록: `base(형태+--_참조)` → `variant(--_값만)` → `size(번들override)`

## 규칙

- **파일명** = 주 export 식별자 (`useAria.ts` → `export function useAria`). multi-export는 camelCase. kebab-case 금지. rename 시 `git mv`.
- **테스트**: 계산은 unit, 인터랙션은 통합(`user.keyboard()` → DOM/ARIA 상태 검증). mock 호출 검증(`toHaveBeenCalled`) 금지.
- **CSS**: `/design-implement` 필수. `frontend-design` 스킬 금지.
- **커밋 전**: `/simplify` 필수.
- **`docs/3-resources/` 파일명**: `{순번}-[{태그}]{제목}.md`. 순번 = 폴더 마지막 번호 + 1.
- **`docs/PROGRESS.md`**: concept map. 모듈 추가/삭제 시 갱신, Maturity/Gaps는 /retrospect 시.

## 테스트 실패 시 원복 정책

1. `bash scripts/activeSessions.sh $SESSION_ID`로 동시 작업 여부 확인
2. 동시 작업 중(exit 1): `.claude/agent-ops/{session_id}.ndjson`에서 내 수정 파일 추출 → 실패 테스트와 무관하면 무시
3. 나만 작업 중(exit 0): 모든 실패에 책임
4. **`git stash` 전체 원복 금지** — 필요 시 `git checkout -- [내 파일만]`
