# module.css 전면 제거 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 61개 module.css 중 CmsLanding 1개를 제외한 60개를 제거하고, ax() 축 시스템만으로 모든 스타일링을 표현한다.

**Architecture:** motion 축 확장(5개 animation 추가), scroll 축 신설, z-index를 surface/placement에 내포, pointer-events를 opacity에 번들. 각 module.css의 CSS를 ax() 호출 + ax.css 유틸리티 클래스로 마이그레이션한 뒤 파일 삭제.

**Tech Stack:** TypeScript (ax.ts 타입), CSS (ax.css 클래스), React (TSX className 교체)

**예외:** `src/pages/cms/CmsLanding.module.css` — 독립 디자인 토큰(`--landing-*`) 체계, 제외.

---

### Task 1: ax.ts 타입 확장 — motion + scroll 축

**Files:**
- Modify: `src/styles/ax.ts:24` (Motion type)
- Modify: `src/styles/ax.ts:75-101` (Axes interface)
- Modify: `src/styles/ax.ts:105-128` (prefixes)

- [ ] **Step 1: Motion 타입 확장**

```typescript
// ax.ts:24 — 기존 Motion 라인 교체
type Motion = 'pulse' | 'spin' | 'fade-in' | 'slide-up'
  | 'fade-slide-in' | 'slide-in' | 'scale-in' | 'blink' | 'shimmer'
```

- [ ] **Step 2: Scroll 타입 추가**

```typescript
// ax.ts — Motion 아래에 추가
// scroll: overflow 제어 — 컨테이너 경계 클리핑 또는 스크롤 방향
type Scroll = 'hidden' | 'y' | 'x' | 'auto'
```

- [ ] **Step 3: Axes interface에 scroll 추가**

```typescript
// Axes interface 구조 축 섹션에 추가
scroll?: Scroll
```

- [ ] **Step 4: prefixes에 scroll 추가**

```typescript
// prefixes 객체에 추가
scroll: 'sc',
```

- [ ] **Step 5: typecheck 확인**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/styles/ax.ts
git commit -m "feat(ax): motion 5종 확장 + scroll 축 신설"
```

---

### Task 2: ax.css — motion keyframes + scroll 클래스 + z-index 내포

**Files:**
- Modify: `src/styles/ax.css:426-449` (Motion section)
- Modify: `src/styles/ax.css:512-521` (Placement section — z-index 추가)
- Modify: `src/styles/ax.css:303-305` (Opacity section — pointer-events 번들)

- [ ] **Step 1: motion keyframes + 클래스 추가**

ax.css Motion 섹션 `.mo-slide-up` 뒤에 추가:

```css
@keyframes ax-fade-slide-in {
  from { opacity: 0; transform: translateY(var(--space-sm)); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes ax-slide-in {
  from { opacity: 0; transform: translateY(calc(-1 * var(--space-sm))); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes ax-scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes ax-blink {
  50% { opacity: 0; }
}

@keyframes ax-shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.mo-fade-slide-in { animation: ax-fade-slide-in var(--motion-enter-duration) var(--motion-enter-easing) both; }
.mo-slide-in      { animation: ax-slide-in var(--motion-enter-duration) var(--motion-enter-easing) both; }
.mo-scale-in      { animation: ax-scale-in var(--motion-enter-duration) var(--motion-enter-easing) both; }
.mo-blink         { animation: ax-blink 0.8s step-end infinite; }
.mo-shimmer       { animation: ax-shimmer 1.5s ease-in-out infinite; }
```

- [ ] **Step 2: scroll 축 클래스 추가**

ax.css에 새 섹션 추가 (Motion 뒤):

```css
/* ════════════════════════════════════════════
 * Scroll — overflow 제어
 * layout:scroll/scroll-x와 독립 — 순수 overflow만
 * ════════════════════════════════════════════ */

.sc-hidden { overflow: hidden; }
.sc-y      { overflow-y: auto; overflow-x: hidden; }
.sc-x      { overflow-x: auto; overflow-y: hidden; }
.sc-auto   { overflow: auto; }
```

- [ ] **Step 3: placement에 z-index 내포**

ax.css placement 섹션 수정:

```css
.pl-viewport      { position: fixed; inset: 0; z-index: 100; }
```

`pl-sticky`는 이미 `z-index: 1`. `sf-overlay`에 z-index 추가:

```css
/* sf-overlay에 추가 */
.sf-overlay {
  /* 기존 속성 유지 + */
  z-index: 10;
}
```

- [ ] **Step 4: opacity hidden에 pointer-events 번들**

```css
.op-hidden { opacity: 0; pointer-events: none; }
```

- [ ] **Step 5: lint:css 확인**

Run: `pnpm lint:css`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/styles/ax.css
git commit -m "feat(ax.css): motion 5종, scroll 축, z-index 내포, op-hidden pointer-events"
```

---

### Task 3: ui/ 소형 module.css 제거 (15파일 이하 30줄)

**Files:** 아래 module.css 파일들과 대응하는 TSX 파일

대상 (각각 30줄 이하):
- `ui/Accordion.module.css`
- `ui/CalendarGrid.module.css`
- `ui/DatePicker.module.css`
- `ui/FileIcon.module.css`
- `ui/FileViewerModal.module.css`
- `ui/ListBox.module.css`
- `ui/Menubar.module.css`
- `ui/NavList.module.css`
- `ui/PatternDemo.module.css`
- `ui/SelectionOverlay.module.css`
- `ui/Slider.module.css`
- `ui/Spinbutton.module.css`
- `ui/TabGroup.module.css`
- `ui/TextInput.module.css`
- `ui/Tooltip.module.css`
- `ui/Toaster.module.css`
- `ui/SplitPane.module.css`

마이그레이션 패턴:
- `overflow: hidden` → `scroll: 'hidden'` 또는 ax.css `.sc-hidden`
- `z-index: N` → surface/placement가 이미 내포 (제거)
- `animation: ...` → `motion: 'fade-in'` 등
- `transition: ...` → surface가 이미 소유 (제거)
- `pointer-events: none` → `opacity: 'hidden'` 또는 `.pointer-none`
- `caret-color` → surface:'input' 번들에 추가
- padding/layout/gap 등 → ax() 호출로 교체

- [ ] **Step 1: 각 module.css 읽고 TSX에서 className 교체**

각 파일에 대해:
1. module.css 읽기
2. 대응 TSX에서 `styles.xxx` → `ax({...})` 또는 ax.css 유틸리티 클래스
3. module.css 파일 삭제
4. TSX에서 module.css import 제거

- [ ] **Step 2: typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: ui/ 소형 module.css 17개 제거 → ax() 마이그레이션"
```

---

### Task 4: ui/ 중형 module.css 제거 (Composer, QuickOpen, CodeBlock, SpreadReader)

**Files:**
- `ui/Composer.module.css` (62줄) + `ui/Composer.tsx`
- `ui/QuickOpen.module.css` (51줄) + `ui/QuickOpen.tsx`
- `ui/CodeBlock.module.css` (88줄) + `ui/CodeViewer.tsx`
- `ui/SpreadReader.module.css` (62줄) + `ui/SpreadReader.tsx`

특수 처리:
- Composer `::before` placeholder → DOM 요소로 대체
- QuickOpen `@keyframes` → `motion: 'fade-in'`, `motion: 'slide-in'`
- CodeBlock syntax highlight 색상 → 기존 토큰 사용, 구조는 ax()
- SpreadReader column-count → layout 축 확장 또는 인라인 CSS variable

- [ ] **Step 1: 각 파일 마이그레이션**
- [ ] **Step 2: typecheck + test**

Run: `pnpm typecheck && pnpm test -- src/interactive-os/ui/`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: ui/ 중형 module.css 4개 제거 (Composer, QuickOpen, CodeBlock, SpreadReader)"
```

---

### Task 5: ui/ 대형 module.css 제거 (StreamFeed, Kanban, MarkdownViewer, chat/)

**Files:**
- `ui/StreamFeed.module.css` (77줄) + TSX
- `ui/Kanban.module.css` (137줄) + TSX
- `ui/MarkdownViewer.module.css` (200줄) + TSX
- `ui/chat/ChatFeed.module.css` + TSX
- `ui/chat/DiffBlock.module.css` + TSX
- `ui/chat/FallbackBlock.module.css` + TSX
- `ui/chat/ThinkingBlock.module.css` + TSX
- `ui/chat/ToolSummaryBlock.module.css` (125줄) + TSX

특수 처리:
- StreamFeed `@keyframes fadeSlideIn` → `motion: 'fade-slide-in'`, `blink` → `motion: 'blink'`
- Kanban compact variant `[data-compact]` → data-attribute 셀렉터를 ax.css 유틸리티로 (또는 컴포넌트 내 조건부 ax())
- Kanban `::after` progress bar → DOM indicator로 대체
- Kanban `box-shadow: inset` extension colors → data-attribute + CSS variable (ax.css 유틸리티 또는 컴포넌트)
- MarkdownViewer — prose 스타일링은 글로벌 prose 클래스로 분리 검토

- [ ] **Step 1: StreamFeed + chat/ 마이그레이션**
- [ ] **Step 2: Kanban 마이그레이션**
- [ ] **Step 3: MarkdownViewer 마이그레이션**
- [ ] **Step 4: typecheck + test**

Run: `pnpm typecheck && pnpm test -- src/interactive-os/ui/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor: ui/ 대형 module.css 8개 제거 (StreamFeed, Kanban, MarkdownViewer, chat/)"
```

---

### Task 6: pages/ module.css 제거 (CmsLanding 제외)

**Files:**
- `pages/book/PageBookViewer.module.css` (188줄) + TSX
- `pages/theme/PageThemeCreator.module.css` (151줄) + TSX
- `pages/storymap/PageStoryMap.module.css` (201줄) + TSX — 별도 디자인 맥락 확인 필요
- `pages/incident/PageIncidentInterface.module.css` (62줄) + TSX
- `pages/chat/PageAgentChat.module.css` (56줄) + TSX
- `pages/birdseye/PageBirdseye.module.css` (50줄) + TSX
- `pages/writer/PageWriter.module.css` (25줄) + TSX
- `pages/creator/PageComponentCreator.module.css` (22줄) + TSX
- `pages/showcase/PageUiShowcase.module.css` (16줄) + TSX
- `pages/showcase/IndicatorsDemo.module.css` (14줄) + TSX

특수 처리:
- PageBookViewer: 가장 복잡. floating chrome(pill, progress, TOC overlay)의 opacity+pointer-events 토글 → `op-hidden` + data-visible로 `opacity:1; pointer-events:auto` 복원. `column-count` → CSS variable + 컴포넌트. `scale(0.95)` → `motion: 'scale-in'`.
- PageStoryMap: Kanban과 유사한 구조 — Task 5 Kanban 패턴 재사용.
- PageThemeCreator: 테마 프리뷰 관련 — 읽어서 판단.

- [ ] **Step 1: 소형 pages 먼저 (writer, creator, showcase, indicators)**
- [ ] **Step 2: 중형 pages (incident, chat, birdseye)**
- [ ] **Step 3: 대형 pages (book, theme, storymap)**
- [ ] **Step 4: typecheck + test**

Run: `pnpm typecheck && pnpm test -- src/pages/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor: pages/ module.css 10개 제거 (CmsLanding 제외)"
```

---

### Task 7: pattern/examples/ module.css 제거 (22파일)

**Files:** `src/interactive-os/pattern/examples/*.module.css` 22개 전부 + 대응 TSX

이 파일들은 APG 데모 컴포넌트. 구조가 비교적 단순하고 반복적.

대상: accordion, alertDialog, carousel, checkbox, combobox, disclosure, feed, grid, link, listbox, menu, menubar, meter, radiogroup, switch, tabs, toolbar, tree, treegrid, windowSplitter

- [ ] **Step 1: 각 example module.css → ax() 마이그레이션**

대부분 padding/layout/gap/surface/shape + 소수 transition(surface 소유로 제거)

- [ ] **Step 2: typecheck + test**

Run: `pnpm typecheck && pnpm test -- src/interactive-os/pattern/`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: pattern/examples/ module.css 22개 제거"
```

---

### Task 8: devtools/ module.css 제거

**Files:**
- `devtools/inspector/InspectorWindow.module.css` (70줄) + TSX
- `devtools/inspector/PageStoreInspector.module.css` (30줄) + TSX

- [ ] **Step 1: 마이그레이션**
- [ ] **Step 2: typecheck**
- [ ] **Step 3: Commit**

```bash
git commit -m "refactor: devtools/ module.css 2개 제거"
```

---

### Task 9: layout:scroll/scroll-x 폐기 검토 + 정리

scroll 축 신설 후, 기존 `layout: 'scroll'`과 `layout: 'scroll-x'`는 역할이 중복될 수 있다. layout은 `display:flex + overflow` 번들이고, scroll은 순수 overflow만.

- [ ] **Step 1: layout:scroll 사용처 검색**

Run: `pnpm grep "layout.*scroll" src/` 또는 Grep

- [ ] **Step 2: 판단 — layout:scroll은 flex+scroll 번들로 유지할지, scroll 축으로 분리할지**

layout:scroll = `display:flex; flex-direction:column; overflow-y:auto` → 이것은 **레이아웃 역할**이므로 유지가 타당. scroll 축은 layout 없이 overflow만 필요한 경우.

- [ ] **Step 3: DESIGN.md에 scroll 축과 layout:scroll의 구분 문서화**
- [ ] **Step 4: Commit**

```bash
git commit -m "docs: scroll 축 vs layout:scroll 구분 문서화"
```

---

### Task 10: 최종 검증 + 정리

- [ ] **Step 1: module.css 0개 확인 (CmsLanding 제외)**

Run: `find src -name '*.module.css' | grep -v CmsLanding | wc -l`
Expected: 0

- [ ] **Step 2: 전체 테스트**

Run: `pnpm typecheck && pnpm test && pnpm lint && pnpm lint:css`
Expected: ALL PASS

- [ ] **Step 3: design score**

Run: `pnpm score:design`
Expected: 유지 또는 상승

- [ ] **Step 4: 불필요한 CSS Modules 관련 설정 정리**

vite.config에서 CSS Modules 설정이 있다면 CmsLanding 1개만 남으므로 유지.

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: module.css 전면 제거 완료 검증"
```
