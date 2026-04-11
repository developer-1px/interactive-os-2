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
| `/` | `src/pages/cms/PageCms.tsx` | Visual CMS (기본 landing) |
| `/viewer/*` | `src/pages/PageViewer.tsx` | 메타 쇼케이스 + 문서 viewer |
| `/ui/*` | `src/pages/PageUiShowcase.tsx` | UI 완성품 쇼케이스 |
| `/agent/*` | `src/pages/PageAgentViewer.tsx` | Agent viewer |
| `/chat` | `src/pages/chat/PageAgentChat.tsx` | Claude WebSocket 채팅 |

### CMS 핵심 파일

- `src/pages/cms/cmsSchema.ts` — Zod 15 노드 타입 SSOT
- `src/pages/cms/cmsStore.ts` — 단일 store (하나의 앱 = 하나의 store)
- `src/pages/cms/cmsState.ts` — 파생 상태/셀렉터
- `src/pages/viewer/viewerStore.ts` — Viewer store

### 디자인 시스템

- `src/styles/ax.ts` — ax() 12축 MECE 디자인 시스템 (시각6+구조6)
- `src/styles/axes.css` — 축별 CSS 클래스
- `DESIGN.md` — 조합 규칙
- **ax()만 사용**. style={} 금지. module.css는 last-mile(축에 없는 CSS)만.

## 규칙

- **타입 import**: `import type { Foo }` 또는 `import { type Foo, bar }` 사용. 함수 시그니처에 `import('...')` 인라인 타입 금지.
- **파일명** = 주 export 식별자 (`useAria.ts` → `export function useAria`). multi-export는 camelCase. kebab-case 금지. rename 시 `git mv`.
- **pages 네이밍 관례**:
  - 진입점: `Page{Domain}.tsx` (예: `PageCms.tsx`, `PageReplay.tsx`). `*Layout` 금지.
  - Store: `{domain}Store.ts`
  - 변환: `{domain}Transform.ts` (Adapter 금지)
  - Fixture: `{domain}Fixtures.ts`
- **테스트**: 계산은 unit, 인터랙션은 통합(`user.keyboard()` → DOM/ARIA 상태 검증). mock 호출 검증(`toHaveBeenCalled`) 금지.
- **CSS**: `ax()`만 사용. `frontend-design` 스킬 금지.
- **커밋 전**: `/simplify` 필수.
- **`docs/3-resources/` 파일명**: `{순번}-[{태그}]{제목}.md`. 순번 = 폴더 마지막 번호 + 1.
- **`docs/PROGRESS.md`**: concept map. 모듈 추가/삭제 시 갱신, Maturity/Gaps는 /retrospect 시.
- **제1원칙: 있는 걸로 만든다** — 새 컴포넌트·훅·유틸을 만들기 전에 `src/interactive-os/CATALOG.md`를 읽고 기존 부품에 없음을 확인한다. 확인 없이 새로 만들지 않는다.
- **os 기반 개발 (필수)**:
  - UI → `src/interactive-os/ui/` 기존 완성품 사용. 없으면 ui/에 먼저 만들고 pages에서 import. pages/에서 useAria/useAriaZone 직접 사용 금지.
  - 키바인딩 → KeyMap 선언. addEventListener('keydown'/'keyup') 금지.
  - 상태/CRUD → store command + plugin. 직접 state 조작 금지.
  - 아이콘/인디케이터 → `src/interactive-os/ui/indicators/` 사용. 이모지(⚠✓✗🟢🔴)·특수기호(▾▸●○★)로 대용 금지.
  - 아이템 렌더링 → `src/interactive-os/ui/items/` 사용. pages에서 renderItem prop 직접 전달 금지. 필요하면 items/에 새 Item 추가.
  - 패널 컨테이너 → `src/interactive-os/ui/panels/` 사용. pages에서 surface+header+scroll 패턴 직접 조립 금지.
  - 셀 렌더링 → 범용 셀은 `src/interactive-os/ui/cells/` 사용. 도메인 셀은 `src/entities/{엔티티}/ui/` 사용. pages에서 renderCell 직접 전달 금지.
  - **renderItem에 ARIA props 전달 필수**: UI 컴포넌트가 renderItem을 호출할 때 `getItemProps(id)`의 결과를 첫 번째 인자로 전달해야 함. 빈 `{}`를 넘기면 ARIA 속성(role, aria-selected, tabindex)과 interactive 클래스가 다른 DOM 요소에 분리되어 CSS 매칭 실패.
  - **interactive 축 필수**: 인터랙티브 아이템은 `interactive: 'item'|'tab'|'check'|'cell'|'input'|'button'` 중 하나를 ax()에 선언. `surface: 'ghost'`는 독립 버튼/컨트롤에서만 사용.

## 테스트 실패 시 원복 정책

1. `bash scripts/activeSessions.sh $SESSION_ID`로 동시 작업 여부 확인
2. 동시 작업 중(exit 1): `.claude/agent-ops/{session_id}.ndjson`에서 내 수정 파일 추출 → 실패 테스트와 무관하면 무시
3. 나만 작업 중(exit 0): 모든 실패에 책임
4. **`git stash` 전체 원복 금지** — 필요 시 `git checkout -- [내 파일만]`
