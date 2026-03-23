# Viewer Parts Extraction (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move FileIcon, CodeBlock, Breadcrumb from `src/pages/viewer/` to `interactive-os/ui/` with self-contained CSS modules, updating all import paths. Zero behavior change.

**Architecture:** Pure refactoring — `git mv` each component, extract its CSS block from PageViewer.module.css into a dedicated CSS module, update all import paths. No API changes, no new abstractions.

**Tech Stack:** React, CSS Modules, Shiki (CodeBlock), Lucide icons (FileIcon, Breadcrumb)

**PRD:** `docs/superpowers/specs/2026-03-23-viewer-parts-extraction-prd.md`

---

### File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/interactive-os/ui/FileIcon.tsx` | Move from `src/pages/viewer/FileIcon.tsx` | File type icon by extension |
| `src/interactive-os/ui/FileIcon.module.css` | Create (extract from PageViewer.module.css) | Icon base + per-type colors |
| `src/interactive-os/ui/CodeBlock.tsx` | Move from `src/pages/viewer/CodeBlock.tsx` | Shiki syntax highlighting |
| `src/interactive-os/ui/CodeBlock.module.css` | Create (extract from PageViewer.module.css) | Code block + token + line styles |
| `src/interactive-os/ui/Breadcrumb.tsx` | Move from `src/pages/viewer/Breadcrumb.tsx` | Path breadcrumb display |
| `src/interactive-os/ui/Breadcrumb.module.css` | Create (extract from PageViewer.module.css) | Breadcrumb layout + segment styles |
| `src/pages/PageViewer.module.css` | Modify | Remove extracted style blocks |
| `src/pages/PageViewer.tsx` | Modify imports | Point to new locations |
| `src/pages/viewer/FileViewerModal.tsx` | Modify imports | Point to new locations |
| `src/pages/viewer/MarkdownViewer.tsx` | Modify imports | Point to new locations |
| `src/pages/viewer/QuickOpen.tsx` | Modify imports | Point to new locations |

---

### Task 1: Move FileIcon

**Files:**
- Move: `src/pages/viewer/FileIcon.tsx` → `src/interactive-os/ui/FileIcon.tsx`
- Create: `src/interactive-os/ui/FileIcon.module.css`
- Modify: `src/pages/PageViewer.module.css` (remove icon styles)
- Modify: `src/pages/PageViewer.tsx` (update import)
- Modify: `src/pages/viewer/QuickOpen.tsx` (update import)
- Modify: `src/pages/viewer/FileViewerModal.tsx` (update import)

- [ ] **Step 1: git mv the component**

```bash
git mv src/pages/viewer/FileIcon.tsx src/interactive-os/ui/FileIcon.tsx
```

- [ ] **Step 2: Create FileIcon.module.css**

Extract from `src/pages/PageViewer.module.css` lines 167-184 (the `/* --- File icons --- */` section). **NOTE:** Source uses BEM kebab-case (`.vw-icon`, `.vw-icon--folder`). Rename to short camelCase (`.icon`, `.iconFolder`) in the new file since the `vw-` prefix is no longer needed:

```css
.icon {
  flex-shrink: 0;
  margin-right: 4px;
  opacity: 0.55;
  color: var(--text-secondary);
}

.iconFolder { color: var(--file-folder); }
.iconTs { color: var(--file-ts); }
.iconJs { color: var(--file-js); }
.iconJson { color: var(--file-json); }
.iconMd { color: var(--file-md); }
.iconCss { color: var(--file-css); }
.iconSh { color: var(--file-sh); }
.iconImg { color: var(--file-img); }
.iconConfig { color: var(--file-config); }
```

- [ ] **Step 3: Update FileIcon.tsx to use own CSS module**

Change import from `import styles from '../PageViewer.module.css'` to `import styles from './FileIcon.module.css'`.

Update all `styles.vwIcon` → `styles.icon`, `styles.vwIconFolder` → `styles.iconFolder`, etc. (drop the `vw` prefix since it's now self-contained).

- [ ] **Step 4: Remove icon styles from PageViewer.module.css**

Delete lines 167-184 (`/* --- File icons --- */` through `.vw-icon--config`).

Also handle the orphan cross-reference at line 265-268:
```css
.vw-content__meta .vw-icon {
  margin-right: 2px;
  opacity: 0.45;
}
```
This rule targets `.vw-icon` which no longer exists after the move. Replace it with inline style or a local class. Since the meta area applies icon overrides for spacing only, convert to a local `.vw-content__meta-icon` class in PageViewer.module.css that the PageViewer.tsx applies directly, or simply remove it if the default FileIcon spacing (4px margin-right from `.icon`) is sufficient. Read the rendered result to decide.

- [ ] **Step 5: Update all import paths**

In these files, change the FileIcon import:

`src/pages/PageViewer.tsx`:
```
- import { FileIcon } from './viewer/FileIcon'
+ import { FileIcon } from '../interactive-os/ui/FileIcon'
```

`src/pages/viewer/QuickOpen.tsx`:
```
- import { FileIcon } from './FileIcon'
+ import { FileIcon } from '../../interactive-os/ui/FileIcon'
```

`src/pages/viewer/FileViewerModal.tsx`:
```
- import { FileIcon } from './FileIcon'
+ import { FileIcon } from '../../interactive-os/ui/FileIcon'
```

- [ ] **Step 6: Verify build**

Run: `npx vitest run 2>&1 | tail -5`
Expected: All tests pass. No import errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: move FileIcon to interactive-os/ui with self-contained CSS"
```

---

### Task 2: Move CodeBlock

**Files:**
- Move: `src/pages/viewer/CodeBlock.tsx` → `src/interactive-os/ui/CodeBlock.tsx`
- Create: `src/interactive-os/ui/CodeBlock.module.css`
- Modify: `src/pages/PageViewer.module.css` (remove code block styles)
- Modify: `src/pages/PageViewer.tsx` (update import)
- Modify: `src/pages/viewer/MarkdownViewer.tsx` (update import)
- Modify: `src/pages/viewer/FileViewerModal.tsx` (update import)

- [ ] **Step 1: git mv the component**

```bash
git mv src/pages/viewer/CodeBlock.tsx src/interactive-os/ui/CodeBlock.tsx
```

- [ ] **Step 2: Create CodeBlock.module.css**

Extract from `src/pages/PageViewer.module.css` lines 517-587 (the `/* ═══ Code block ═══ */` section header through `:global(.code-line--edited)`). **NOTE:** Source uses kebab-case (`.code-block`, `.code-block--loading`). Rename to camelCase (`.codeBlock`, `.codeBlockLoading`) in the new file — CSS Modules auto-converts kebab to camelCase for JS access, so `styles.codeBlock` will work with either naming. IMPORTANT: `:global()` styles must be preserved as-is since Shiki generates non-module class names.

```css
.codeBlock {
  overflow: auto;
  font-size: 13px;
  line-height: 1.6;
}

.codeBlockLoading {
  padding: 16px 20px;
  background: var(--surface-base);
  border-radius: 8px;
  font-family: var(--mono);
  font-size: 13px;
}

.codeBlock :global(.shiki) {
  margin: 0;
  padding: 16px 0;
  counter-reset: line;
  background: var(--surface-base) !important;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.codeBlock :global(.shiki) code {
  display: block;
}

.codeBlock :global(.shiki .line) {
  display: inline-block;
  width: 100%;
  padding: 0 16px 0 0;
}

.codeBlock :global(.shiki .line)::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 3.5em;
  padding-right: 1em;
  text-align: right;
  color: var(--text-muted);
  font-size: 12px;
  user-select: none;
  opacity: 0.5;
}

:global(.code-token) {
  cursor: pointer;
  border-radius: 2px;
  transition: background 0.1s;
}

:global(.code-token):hover {
  background: var(--primary-dim);
}

:global(.code-token--highlighted) {
  background: var(--primary-mid) !important;
  outline: 1px solid var(--primary-bright);
  border-radius: 2px;
}

:global(.code-line--edited) {
  background: rgba(229, 163, 58, 0.08) !important;
  border-left: 2px solid #e5a33a;
  padding-left: 6px !important;
}
```

- [ ] **Step 3: Update CodeBlock.tsx to use own CSS module**

Change import from `import styles from '../PageViewer.module.css'` to `import styles from './CodeBlock.module.css'`.

The class names in code: `styles.codeBlock` and `styles.codeBlockLoading` — verify these match the CSS module class names (camelCase conversion from kebab-case).

- [ ] **Step 4: Remove code block styles from PageViewer.module.css**

Delete lines 517-587 (from the `/* ═══ Code block ═══ */` section header through `:global(.code-line--edited)`).

- [ ] **Step 5: Update all import paths**

`src/pages/PageViewer.tsx`:
```
- import { CodeBlock } from './viewer/CodeBlock'
+ import { CodeBlock } from '../interactive-os/ui/CodeBlock'
```

`src/pages/viewer/MarkdownViewer.tsx`:
```
- import { CodeBlock } from './CodeBlock'
+ import { CodeBlock } from '../../interactive-os/ui/CodeBlock'
```

`src/pages/viewer/FileViewerModal.tsx`:
```
- import { CodeBlock } from './CodeBlock'
+ import { CodeBlock } from '../../interactive-os/ui/CodeBlock'
```

- [ ] **Step 6: Verify build**

Run: `npx vitest run 2>&1 | tail -5`
Expected: All tests pass.

- [ ] **Step 7: Verify in browser**

Navigate to `http://localhost:5173/viewer`, select a `.ts` file.
Check: Syntax highlighting renders, line numbers show, token click highlighting works, theme switch works.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: move CodeBlock to interactive-os/ui with self-contained CSS"
```

---

### Task 3: Move Breadcrumb

**Files:**
- Move: `src/pages/viewer/Breadcrumb.tsx` → `src/interactive-os/ui/Breadcrumb.tsx`
- Create: `src/interactive-os/ui/Breadcrumb.module.css`
- Modify: `src/pages/PageViewer.module.css` (remove breadcrumb styles)
- Modify: `src/pages/PageViewer.tsx` (update import)
- Modify: `src/pages/viewer/FileViewerModal.tsx` (update import)

- [ ] **Step 1: git mv the component**

```bash
git mv src/pages/viewer/Breadcrumb.tsx src/interactive-os/ui/Breadcrumb.tsx
```

- [ ] **Step 2: Create Breadcrumb.module.css**

Extract from `src/pages/PageViewer.module.css` lines 277-304 (the `/* --- Breadcrumb --- */` section). **NOTE:** Source uses BEM kebab-case (`.vw-breadcrumb`, `.vw-breadcrumb__sep`). Rename to short names (`.breadcrumb`, `.sep`) in the new file:

```css
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 1px;
  font-family: var(--sans);
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sep {
  margin: 0 2px;
  opacity: 0.4;
  flex-shrink: 0;
}

.segment {
  color: var(--text-muted);
}

.current {
  color: var(--text-primary);
  font-weight: 500;
}
```

- [ ] **Step 3: Update Breadcrumb.tsx to use own CSS module**

Change import from `import styles from '../PageViewer.module.css'` to `import styles from './Breadcrumb.module.css'`.

Update class references: `styles.vwBreadcrumb` → `styles.breadcrumb`, `styles.vwBreadcrumbSep` → `styles.sep`, `styles.vwBreadcrumbSegment` → `styles.segment`, `styles.vwBreadcrumbCurrent` → `styles.current`.

- [ ] **Step 4: Remove breadcrumb styles from PageViewer.module.css**

Delete lines 277-304 (`/* --- Breadcrumb --- */` through `.vw-breadcrumb__current`).

- [ ] **Step 5: Update all import paths**

`src/pages/PageViewer.tsx`:
```
- import { Breadcrumb } from './viewer/Breadcrumb'
+ import { Breadcrumb } from '../interactive-os/ui/Breadcrumb'
```

`src/pages/viewer/FileViewerModal.tsx`:
```
- import { Breadcrumb } from './Breadcrumb'
+ import { Breadcrumb } from '../../interactive-os/ui/Breadcrumb'
```

- [ ] **Step 6: Verify build**

Run: `npx vitest run 2>&1 | tail -5`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: move Breadcrumb to interactive-os/ui with self-contained CSS"
```

---

### Task 4: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run 2>&1 | tail -5`
Expected: All tests pass.

- [ ] **Step 2: Browser verification — Viewer**

Navigate to `http://localhost:5173/viewer`:
- [ ] File tree renders with correct FileIcon colors per type
- [ ] Select a .ts file → CodeBlock renders with syntax highlighting
- [ ] Breadcrumb shows file path with segments
- [ ] Token click highlights all matching tokens
- [ ] Select a .md file → MarkdownViewer renders (uses CodeBlock internally)
- [ ] Cmd+P → QuickOpen shows FileIcon next to results
- [ ] Theme toggle (dark↔light) → CodeBlock re-highlights

- [ ] **Step 3: Browser verification — Agent Viewer**

Navigate to `http://localhost:5173/agent`:
- [ ] Click a file reference in timeline → FileViewerModal opens
- [ ] Modal shows Breadcrumb, CodeBlock, FileIcon correctly

- [ ] **Step 4: Verify PageViewer.module.css is thinner**

Run: `wc -l src/pages/PageViewer.module.css`
Expected: ~80 lines fewer than before (~820 lines vs original ~900).

- [ ] **Step 5: Verify no orphan styles**

Run: `grep -c 'vw-icon\|vw-breadcrumb\|code-block' src/pages/PageViewer.module.css`
Expected: 0 matches — all extracted styles are gone.
