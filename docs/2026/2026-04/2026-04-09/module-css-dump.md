---
id: 2-areas/design/prds/module-css-dump
type: note
slug: moduleCssDump
title: 'module.css 전체 덤프 (2026-04-03)'
tags: [untagged]
created: 2026-04-09
updated: 2026-04-09
legacy:
  status: active
  kind: note
  topics: [2-areas]
  relates: []
  supersedes: []
---
# module.css 전체 덤프 (2026-04-03)

## `src/devtools/inspector/AppInspectorPanel.module.css` (      34줄)

```css
.panel {
  position: fixed;
  top: 48px;
  right: 8px;
  bottom: 8px;
  width: 360px;
  z-index: 99999;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.body {
  flex: 1;
  overflow: auto;
}

.select {
  background: var(--surface-sunken);
  border: 1px solid var(--border-default);
  border-radius: var(--shape-sm-radius);
  padding: 2px 4px;
  color: inherit;
  font-family: var(--mono);
  font-size: var(--type-caption-size);
}

.closeBtn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px 6px;
  font-size: 14px;
  opacity: 0.6;
}
```

## `src/devtools/inspector/PageStoreInspector.module.css` (      38줄)

```css
.splitContainer {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr auto;
  gap: var(--space-md);
  min-height: 400px;
}

.logPanel {
  grid-column: 1 / -1;
  max-height: 200px;
  font-family: var(--mono);
  font-size: var(--type-caption-size);
  line-height: var(--leading-normal);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  background: var(--surface-sunken);
  border-radius: var(--shape-xs-radius);
}

.logEntry {
  opacity: 0.9;
}

.logEntry[data-batch-child] {
  padding-left: var(--space-lg);
  opacity: 0.7;
}

.logDiff {
  color: var(--tone-primary-base);
}

.panelLabel {
  font-size: var(--type-caption-size);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  opacity: 0.5;
  margin-bottom: var(--space-sm);
}
```

## `src/interactive-os/ui/Accordion.module.css` (      18줄)

```css
/* ── Block 1: base ── */
.header {}

.header + .panel {
  border-bottom: 1px solid var(--border-subtle);
}

.chevron {
  transition: transform var(--motion-normal-duration) var(--motion-normal-easing);
}

.chevronExpanded {
  transform: rotate(90deg);
}

.item {
  padding-left: var(--space-2xl);
}
```

## `src/interactive-os/ui/Breadcrumb.module.css` (       8줄)

```css
.breadcrumb {
  gap: var(--border-width);
}

.sep {
  flex-shrink: 0;
  margin: 0 var(--space-xs);
}
```

## `src/interactive-os/ui/Button.module.css` (      16줄)

```css
/* ── Button — last-mile overrides ──
   ax() handles: surface, controlSize, tone, shape, width, weight
   module.css handles: variant-specific borders */

/* ═══ variant — last-mile only ═══ */
.accent {}

.dialog {
  border: 1px solid var(--border-default);
}

.ghost {
  border: 1px solid var(--border-subtle);
}

.destructive {}
```

## `src/interactive-os/ui/CalendarGrid.module.css` (      41줄)

```css
/* ── last-mile: grid layout ── */

.grid {
  border-collapse: collapse;
}

/* ── last-mile: header cell ── */

.dayHeader {
  padding: var(--space-xs);
  font-weight: var(--type-label-weight);
  text-align: center;
  width: 36px;
}

/* ── last-mile: day cell ── */

.day {
  width: 36px;
  height: 36px;
  text-align: center;
  outline: none;
  cursor: default;
  border-radius: var(--shape-xs-radius);
  border: 2px solid transparent;
}

/* ── variant: state ── */

.day:is([data-outside]) {
  color: var(--text-muted);
}

.day:is([data-focused='true']) {
  background: var(--bg-hover);
}

.day:is([data-selected='true']) {
  background: var(--tone-primary-base);
  color: var(--tone-primary-foreground);
}
```

## `src/interactive-os/ui/chat/ChatFeed.module.css` (      42줄)

```css
/* ChatFeed — chat message bubbles
   ② 2026-03-27-chat-module-prd.md */

/* --- Shared indent for icon alignment --- */

:root {
  --chat-indent: calc(var(--icon-sm) + var(--space-sm));
}

/* --- Message wrapper --- */

.chatMessage {
  gap: var(--space-xs);
}

/* --- User bubble --- */

.chatUser {
  width: fit-content;
  max-width: 80%;
  margin-left: auto;
  padding: var(--shape-xs-py) var(--shape-xs-px);
  line-height: var(--leading-relaxed);
  background: var(--tone-primary-dim);
  border-radius: var(--shape-lg-radius) var(--shape-lg-radius) var(--shape-xs-radius) var(--shape-lg-radius);
}

/* --- System (tool use, results, errors) --- */

.chatSystem {
  overflow: hidden;
  gap: var(--space-sm);
  line-height: var(--leading-relaxed);
}

/* --- Assistant bubble --- */

.chatAssistant {
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
  line-height: var(--leading-relaxed);
}
```

## `src/interactive-os/ui/chat/DiffBlock.module.css` (      45줄)

```css
/* DiffBlock — side-by-side diff display
   ② 2026-03-27-chat-module-prd.md */

.diff {
  background: var(--surface-default);
  border-radius: var(--shape-md-radius);
  overflow: hidden;
}

.diffHeader {
  padding: var(--space-xs) var(--space-sm);
  font-family: var(--mono);
  font-size: var(--type-caption-size);
}

.diffBody {
  grid-template-columns: 1fr 1fr;
  gap: 0 1px;
  background: var(--border-subtle);
}

.diffPane {
  background: var(--surface-default);
}

.diffCode {
  margin: 0;
  padding: var(--space-xs) 0;
  font-family: var(--mono);
  font-size: var(--type-caption-size);
  line-height: var(--leading-snug);
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.diffLineOld {
  padding: 0 var(--space-sm);
  background: var(--tone-destructive-dim);
}

.diffLineNew {
  padding: 0 var(--space-sm);
  background: var(--tone-success-dim);
}

```

## `src/interactive-os/ui/chat/FallbackBlock.module.css` (      32줄)

```css
/* FallbackBlock — unknown block type with JSON dump */

.fallback {
  overflow: hidden;
  font-size: var(--type-caption-size);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--shape-md-radius);
}

.fallbackSummary {
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
  user-select: none;
  font-family: var(--mono);
}

.fallbackSummary::marker,
.fallbackSummary::-webkit-details-marker {
  display: none;
}

.fallbackPre {
  overflow-y: auto;
  padding: var(--space-xs) var(--space-sm);
  border-top: 1px dashed var(--border-subtle);
  font-family: var(--mono);
  font-size: var(--type-caption-size);
  line-height: var(--leading-snug);
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
```

## `src/interactive-os/ui/chat/TextBlock.module.css` (     164줄)

```css
/* TextBlock — chat-compact markdown theme
   ② 2026-03-27-chat-module-prd.md
   문서용(MarkdownViewer.module.css)과 동일 키(.markdown),
   채팅 맥락에 맞게 간격 축소·heading 억제. */

.markdown {
  font-size: var(--type-body-size);
  line-height: var(--leading-relaxed);
  color: inherit;
  word-wrap: break-word;
  overflow-wrap: break-word;
  padding: 0 var(--space-sm);
}

.markdown > *:first-child {
  margin-top: 0;
}

.markdown > *:last-child {
  margin-bottom: 0;
}

/* ── Headings: 크기 억제, 간격 축소 ── */

.markdown h1,
.markdown h2 {
  font-weight: var(--weight-semi);
  color: var(--text-bright);
  margin: 1.2em 0 0.4em;
}

.markdown h3,
.markdown h4,
.markdown h5,
.markdown h6 {
  font-weight: var(--weight-semi);
  color: var(--text-bright);
  margin: 1em 0 0.3em;
}

/* ── Text ── */

.markdown p {
  margin: 0.75em 0;
}

.markdown strong {
  font-weight: var(--weight-semi);
  color: var(--text-bright);
}

.markdown em {
  font-style: italic;
}

/* ── Lists ── */

.markdown ul,
.markdown ol {
  padding-left: 1.3em;
  margin: 0.5em 0;
}

.markdown li {
  margin: 0.15em 0;
}

.markdown li::marker {
  color: var(--text-muted);
}

/* ── Code ── */

.markdown pre {
  margin: 0.75em 0;
  padding: var(--space-sm) var(--space-md);
  background: var(--surface-base);
  border-radius: var(--shape-md-radius);
  overflow-x: auto;
  font-family: var(--mono);
  font-size: var(--type-caption-size);
  line-height: var(--leading-snug);
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.markdown pre:has(:global(.shiki)) {
  background: none;
  border: none;
  padding: 0;
}

.markdown code {
  font-family: var(--mono);
  font-size: var(--type-caption-size);
  background: var(--surface-base);
  padding: 0.15em 0.35em;
  border-radius: var(--shape-xs-radius);
  border: 1px solid var(--border-subtle);
}

.markdown pre code {
  color: inherit;
  background: none;
  padding: 0;
  border: none;
}

/* ── Table ── */

.markdown table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  margin: 0.75em 0;
  background: var(--surface-sunken);
  border-radius: var(--shape-md-radius);
  overflow: hidden;
}

.markdown th {
  padding: 0.3em 0.5em;
  border-bottom: 1px solid var(--border-subtle);
  font-weight: var(--weight-semi);
  color: var(--text-bright);
  text-align: left;
}

.markdown td {
  padding: 0.25em 0.5em;
  border-bottom: 1px solid var(--border-subtle);
  text-align: left;
}

/* ── Block elements ── */

.markdown blockquote {
  margin: 0.75em 0;
  padding: var(--shape-xs-py) var(--shape-xs-px);
  background: var(--surface-sunken);
  border-radius: var(--shape-md-radius);
  color: var(--text-secondary);
}

.markdown hr {
  border: none;
  height: 1px;
  background: var(--border-subtle);
  margin: 1.2em 0;
}

.markdown img {
  max-width: 100%;
  border-radius: var(--shape-xs-radius);
}

.markdown a {
  color: var(--tone-primary-base);
}

.markdown input[type="checkbox"] {
  margin-right: 0.4em;
  vertical-align: middle;
}
```

## `src/interactive-os/ui/chat/ThinkingBlock.module.css` (      38줄)

```css
/* ThinkingBlock — collapsible thinking content */

.thinking {
  background: var(--surface-sunken);
  border-radius: var(--shape-md-radius);
}

.thinkingSummary {
  padding: var(--space-sm) var(--space-sm) var(--space-sm) var(--chat-indent);
  cursor: pointer;
  user-select: none;
}

.thinkingSummary > .thinkingChevron {
  left: var(--space-sm);
  width: var(--icon-sm);
}

.thinkingSummary::marker,
.thinkingSummary::-webkit-details-marker {
  display: none;
}

.thinkingPreview {
  text-overflow: ellipsis;
}

.thinkingContent {
  padding: 0 var(--space-sm) var(--space-sm);
  overflow-wrap: break-word;
}

/* Settled: minimal presence after completion */
.settled {
  background: transparent;
  border-radius: 0;
  opacity: 0.6;
}
```

## `src/interactive-os/ui/chat/ToolSummaryBlock.module.css` (     180줄)

```css
/* ToolSummaryBlock + ToolResultBlock + ToolGroup
   Standard padding: icon rows use --chat-indent left, all others use --space-sm uniform. */

/* --- Shared: icon row pattern --- */

.iconRow {
  position: relative;
  padding: var(--space-sm) var(--space-sm) var(--space-sm) var(--chat-indent);
  min-height: var(--icon-sm);
}

.iconRow > .rowIcon {
  position: absolute;
  left: var(--space-sm);
  width: var(--icon-sm);
  color: var(--text-muted);
}

.toolDetail {
  overflow: hidden;
  min-width: 0;
  font-family: var(--mono);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.filePathLink {
  cursor: pointer;
  border-radius: var(--shape-xs-radius);
  transition: background var(--motion-instant-duration) var(--motion-instant-easing);
}

.filePathLink:hover {
  color: var(--tone-primary-base);
  background: var(--bg-hover);
}

.filePathLink:focus-visible {
  outline: var(--focus-ring) solid var(--focus);
  outline-offset: var(--focus-ring);
}

/* --- Standalone tool use row --- */

.toolRow {
  composes: iconRow;
}

/* --- Standalone tool result --- */

.toolResult {
  overflow-y: auto;
  padding: var(--space-sm);
  font-family: var(--mono);
  font-size: var(--type-caption-size);
  line-height: var(--leading-snug);
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.toolResultSummary {
  composes: iconRow;
  cursor: pointer;
  font-family: var(--mono);
  user-select: none;
}

.toolResultSummary::marker,
.toolResultSummary::-webkit-details-marker {
  display: none;
}

.toolResultPreview {
  overflow: hidden;
  min-width: 0;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ═══ ToolGroup: bordered card ═══ */

.toolGroup {
  overflow: hidden;
  background: var(--surface-sunken);
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-md-radius);
}

/* Consecutive tool groups: merge borders, remove inter-gap */
.toolGroup + .toolGroup {
  margin-top: calc(-1 * var(--space-sm));
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.toolGroup:has(+ .toolGroup) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

/* Single summary pattern for all tools */

.toolGroupSummary {
  composes: iconRow;
  gap: var(--space-xs);
  cursor: pointer;
  user-select: none;
}

.toolGroupSummary::marker,
.toolGroupSummary::-webkit-details-marker {
  display: none;
}

/* --- Content areas --- */

.toolGroupResult {
  overflow-y: auto;
  padding: var(--space-sm);
  border-top: 1px solid var(--border-subtle);
  font-family: var(--mono);
  font-size: var(--type-caption-size);
  line-height: var(--leading-snug);
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.toolGroupCode {
  overflow: auto;
  border-top: 1px solid var(--border-subtle);
}

.toolGroupCode > div :global(.shiki) {
  border: none;
  border-radius: 0;
}

/* ═══ ToolChainGroup: collapsible group of process tools ═══ */

.toolChain {
  overflow: hidden;
  background: var(--surface-sunken);
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-md-radius);
}

.toolChainSummary {
  composes: iconRow;
  gap: var(--space-xs);
  cursor: pointer;
  user-select: none;
}

.toolChainSummary::marker,
.toolChainSummary::-webkit-details-marker {
  display: none;
}

.toolChainLabel {
  font-family: var(--mono);
  font-size: var(--type-caption-size);
}

.toolChainContent {
  border-top: 1px solid var(--border-subtle);
}

.toolChainRow {
  composes: iconRow;
  gap: var(--space-xs);
}

.toolChainDetails {
  overflow: hidden;
  min-width: 0;
  font-family: var(--mono);
  font-size: var(--type-caption-size);
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

## `src/interactive-os/ui/CodeBlock.module.css` (     101줄)

```css
.codeBlock {
  font-size: var(--type-code-size);
  line-height: var(--leading-code);
}

.codeBlockLoading {
  padding: var(--shape-xl-py) var(--shape-xl-px);
  background: var(--surface-base);
  border-radius: var(--shape-xl-radius);
  font-family: var(--mono);
  font-size: var(--type-code-size);
}

.codeBlock :global(.shiki) {
  margin: 0;
  padding: var(--space-lg) 0;
  counter-reset: line;
  background: var(--surface-base) !important;
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-xl-radius);
}

.codeBlockCompact :global(.shiki) {
  border-radius: var(--shape-md-radius);
  padding: var(--space-md) 0;
}

.codeBlockCompact :global(.shiki .line)::before {
  width: 2.5em;
  padding-right: 0.75em;
}

.codeBlockFlush :global(.shiki) {
  border: none;
  border-radius: 0;
}

.codeBlock :global(.shiki) code {
  display: flex;
  flex-direction: column;
}

.codeBlock :global(.shiki .line) {
  display: block;
  padding: 0 var(--space-lg) 0 0;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

.codeBlock :global(.shiki .line)::before {
  counter-increment: line;
  content: counter(line);
  display: inline-block;
  width: 3.5em;
  padding-right: 1em;
  text-align: right;
  color: var(--text-muted);
  font-size: var(--type-code-size);
  user-select: none;
  opacity: 0.65;
}

:global(.code-token) {
  cursor: pointer;
  border-radius: var(--space-inline-code);
  transition: background 0.1s;
}

:global(.code-token):hover {
  background: var(--tone-primary-dim);
}

:global(.code-token--highlighted) {
  background: var(--tone-primary-mid) !important;
  outline: 1px solid var(--tone-primary-bright);
  border-radius: var(--space-inline-code);
}

:global(.code-line--edited) {
  background: color-mix(in srgb, var(--tone-warning-base) 12%, transparent) !important;
  border-left: 2px solid var(--tone-warning-base);
  padding-left: var(--space-sm) !important;
}

:global(.code-line--selected) {
  background: color-mix(in srgb, var(--tone-primary-base) 15%, transparent) !important;
  border-left: 2px solid var(--tone-primary-base);
  padding-left: var(--space-sm) !important;
}

:global(.code-line--deleted) {
  background: color-mix(in srgb, var(--tone-danger-base) 15%, transparent) !important;
  border-left: 2px solid var(--tone-danger-base);
  padding-left: var(--space-sm) !important;
}

:global(.code-line--inserted) {
  background: color-mix(in srgb, var(--tone-success-base) 15%, transparent) !important;
  border-left: 2px solid var(--tone-success-base);
  padding-left: var(--space-sm) !important;
}
```

## `src/interactive-os/ui/Combobox.module.css` (      14줄)

```css
/* ── Combobox — last-mile only ──
   ax() handles: surface, controlSize, layout, gap, text, width, shape, state
   module.css handles: dropdown positioning, placeholder */

/* ═══ Input — last-mile ═══ */
.comboInput::placeholder {
  color: var(--text-muted);
}

/* ═══ Dropdown — positioning ═══ */
.comboDropdown {
  margin-top: var(--space-xs);
  overflow: hidden;
}
```

## `src/interactive-os/ui/Composer.module.css` (      85줄)

```css
/* Composer — multiline input with Enter-to-submit */

/* --- Input wrapper — last-mile: border-radius, focus ring, disabled --- */

.inputWrap {
  position: relative;
}

.inputWrap[data-disabled] {
  opacity: 0.4;
  pointer-events: none;
}

/* --- Editor wrap (position context for overlay) --- */

.editorWrap {
  position: relative;
}

/* --- Editable content — last-mile: padding, whitespace, min-height --- */

.editor {
  min-height: calc(var(--leading-snug) * 1em + var(--shape-sm-py) * 2);
  padding: var(--space-sm) var(--space-md);
  line-height: var(--leading-snug);
  white-space: pre-wrap;
  word-break: break-word;
  overflow-y: auto;
  outline: none;
}

.editor[data-overlay] {
  color: transparent;
  caret-color: var(--text-primary);
}

/* --- Placeholder via :empty --- */

.editor:empty::before {
  content: attr(data-placeholder);
  color: var(--text-muted);
  pointer-events: none;
}

/* --- Ghost text overlay — last-mile: positioning, text sync --- */

.overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  padding: var(--space-sm) var(--space-md);
  line-height: var(--leading-snug);
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
}

/* --- Suggestion popup (above input, Slack-style) — last-mile --- */

.suggestionList {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin: 0;
  list-style: none;
  overflow-y: auto;
  max-height: calc(var(--type-body-size) * var(--leading-snug) * 8 + var(--space-xs) * 2);
  z-index: 1;
}

.suggestionItem {
  padding: var(--space-xs) var(--space-md);
  line-height: var(--leading-snug);
}

.suggestionItem:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.suggestionItem[data-selected] {
  background: var(--bg-active);
  color: var(--text-bright);
}
```

## `src/interactive-os/ui/DatePicker.module.css` (      56줄)

```css
/* ── DatePicker — last-mile (ax() handles surface/layout/text/controlSize) ── */

/* ── input — border-radius split (last-mile) ── */
.input {
  padding: var(--shape-xs-py) var(--shape-sm-px);
  border-radius: var(--shape-xs-radius) 0 0 var(--shape-xs-radius);
  cursor: default;
  font-family: inherit;
}

/* ── trigger — border-radius split + sizing (last-mile) ── */
.triggerButton {
  padding: var(--shape-xs-py) var(--shape-xs-px);
  border: var(--border-width) solid var(--border-default);
  border-left: none;
  border-radius: 0 var(--shape-xs-radius) var(--shape-xs-radius) 0;
}

/* ── dialog — positioning (last-mile) ── */
.dialog {
  top: 100%;
  left: 0;
  z-index: 10;
  margin-top: var(--space-xs);
  border: var(--border-width) solid var(--border-default);
  border-radius: var(--shape-sm-radius);
}

/* ── nav bar — spacing (last-mile) ── */
.navBar {
  margin-bottom: var(--space-sm);
}

/* ── nav button — fixed sizing (last-mile) ── */
.navButton {
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: var(--shape-xs-radius);
}

/* ── month/year label — text-align (last-mile) ── */
.monthYear {
  text-align: center;
}

/* ── actions — spacing (last-mile) ── */
.actions {
  margin-top: var(--space-sm);
  justify-content: flex-end;
}

/* ── action button — last-mile ── */
.actionButton {
  font-family: inherit;
}
```

## `src/interactive-os/ui/DisclosureGroup.module.css` (       6줄)

```css
/* ── DisclosureGroup — last-mile only ── */

/* controlSize centers children; disclosure header needs left-align */
.item {
  justify-content: flex-start;
}
```

## `src/interactive-os/ui/FileIcon.module.css` (      14줄)

```css
.icon {
  margin-right: var(--space-xs);
  opacity: 0.55;
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

## `src/interactive-os/ui/FileViewerModal.module.css` (      61줄)

```css
/* ── last-mile: modal positioning ── */

.fvmDialog {
  padding: 0;
  border: none;
  background: transparent;
  max-width: none;
  max-height: none;
  width: 100vw;
  height: 100vh;
}

.fvmDialog[open] {
  display: flex;
  align-items: center;
  justify-content: center;
}

.fvmDialog::backdrop {
  background: var(--dialog-backdrop);
}

/* ── last-mile: modal sizing ── */

.fvmModal {
  width: 85vw;
  max-width: 960px;
  height: 85vh;
  overflow: hidden;
  border-radius: var(--shape-xl-radius);
  box-shadow: var(--shadow-lg);
}

/* ── last-mile: header ── */

/* fvmHeader → PanelHeader */

.fvmMetaSep {
  width: 1px;
  height: 10px;
  background: var(--border-default);
  margin: 0 var(--space-inline-code);
}

/* ── last-mile: close button overrides ── */

.fvmClose {
  border-radius: var(--shape-xl-radius);
}

/* ── last-mile: image ── */

.fvmImage {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  margin: var(--space-xl) auto;
  border-radius: var(--shape-xs-radius);
  box-shadow: var(--shadow-md);
}
```

## `src/interactive-os/ui/Kanban.module.css` (     177줄)

```css
/* --- Kanban Board --- */

.board {
  padding: var(--space-xs);
  overflow-x: auto;
}

/* ── Column panel ── */
.column {
  flex: 1 1 0;
  min-width: calc(var(--space-3xl) * 5);
  max-width: calc(var(--space-3xl) * 8);
  background: var(--surface-sunken);
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-xl-radius);
  padding: var(--shape-xl-py) var(--shape-xl-px);
}

/* ── Column header ── */
.columnHeader {
  padding: var(--shape-xs-py) var(--shape-xs-px);
  border-radius: var(--shape-xs-radius);
}

.columnCount {
  text-transform: none;
  letter-spacing: 0;
}

/* ── Card ── */
.card {
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-xl-radius);
  padding: var(--shape-xl-py) var(--shape-xl-px);
  line-height: var(--leading-snug);
  cursor: default;
}

/* ── Editable card title ── */
.card :global([data-renaming]) {
  outline: 1px solid var(--focus);
  outline-offset: calc(var(--space-xs) / 2);
  border-radius: var(--shape-xs-radius);
  padding: 0 calc(var(--space-xs) / 2);
  min-width: var(--space-3xl);
}

/* ══ Compact variant ══ */

.board[data-compact] {
  gap: var(--space-sm);
  padding: var(--space-sm);
  height: 100%;
  align-items: flex-start;
  overflow: auto hidden;
}

.board[data-compact] .column {
  min-width: var(--space-3xl);
  max-width: none;
  flex: 0 0 auto;
  width: 240px;
  border-radius: var(--shape-sm-radius);
  padding: var(--space-xs) var(--space-sm);
  overflow-y: auto;
  max-height: 100%;
}

.board[data-compact] .columnHeader {
  font-size: var(--type-caption-size);
  text-transform: none;
  letter-spacing: 0;
  padding: var(--space-xs) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
}

.board[data-compact] .columnHeader::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: calc(var(--_loc-ratio, 0) * 100%);
  background: var(--tone-primary-dim);
  border-radius: var(--border-width);
  opacity: 0.6;
}

.board[data-compact] .card {
  display: flex;
  align-items: baseline;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border: none;
  border-radius: var(--shape-xs-radius);
  font-size: var(--type-caption-size);
  line-height: var(--leading-normal);
  flex-shrink: 0;
}

/* ── Card title (truncate) ── */
.cardTitle {
  min-width: 0;
}

/* ── Card subtitle (LOC etc.) ── */
.cardSubtitle {
  flex-shrink: 0;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

/* ── Extension color indicator (inset shadow, border:none 호환) ── */

.board[data-compact] .card[data-ext="ts"] { box-shadow: inset 3px 0 0 var(--tone-primary-base); }
.board[data-compact] .card[data-ext="tsx"] { box-shadow: inset 3px 0 0 var(--focus); }
.board[data-compact] .card[data-ext="css"] { box-shadow: inset 3px 0 0 var(--tone-destructive-base); }
.board[data-compact] .card[data-ext="md"],
.board[data-compact] .card[data-ext="mdx"] { box-shadow: inset 3px 0 0 var(--tone-positive-base); }
.board[data-compact] .card[data-ext="json"],
.board[data-compact] .card[data-ext="yaml"],
.board[data-compact] .card[data-ext="yml"] { box-shadow: inset 3px 0 0 var(--tone-warning-base); }

/* ── Weight hints (LOC-based file size indicator) ── */

.board[data-compact] .card[data-weight="md"] {
  font-weight: var(--weight-medium);
}

.board[data-compact] .card[data-weight="lg"] {
  font-weight: var(--weight-semi);
  color: var(--text-bright);
  background: color-mix(in srgb, var(--tone-warning-base) 12%, var(--surface-default));
}

/* ── Hub indicator (high importedBy — load-bearing files) ── */

.board[data-compact] .card[data-hub] {
  border-inline-start-width: var(--space-xs);
  border-inline-start-color: var(--tone-info-base);
  background: color-mix(in srgb, var(--tone-info-base) 6%, var(--surface-default));
}

/* ── Dependency count colors in subtitle ── */

.depUp {
  color: var(--tone-positive-base);
}

/* ── Dependency highlight — dim unrelated, brighten related ── */

.board[data-compact][data-has-highlight] .card:not([data-highlight]):not([data-focused]) {
  opacity: 0.25;
}

.board[data-compact] .card[data-highlight="up"] {
  box-shadow: inset 3px 0 0 var(--tone-positive-base);
}

.board[data-compact] .card[data-highlight="down"] {
  box-shadow: inset 3px 0 0 var(--tone-primary-base);
}

/* ── Focus/Selection — override .card background ── */

.card[data-focused] {
  background: var(--tone-primary-dim);
  color: var(--text-bright);
}

.card[aria-selected="true"] {
  background: var(--selection);
  color: var(--text-bright);
}
```

## `src/interactive-os/ui/ListBox.module.css` (       6줄)

```css
/* ── ListBox — module.css (ax()로 불가능한 것만) ── */

/* ═══ state — data-attr 기반 ═══ */
.item[data-selected='true'] span {
  font-weight: var(--weight-semi);
}
```

## `src/interactive-os/ui/MarkdownViewer.module.css` (     223줄)

```css
/* ═══════════════════════════════════════════
   Markdown prose — bundle-aligned
   Type/Shape/Surface 번들 완전 준수.
   em margin은 prose 비례 리듬 예외.
   ═══════════════════════════════════════════ */

.markdown {
  max-width: 48rem;
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-3xl);
  font-size: var(--type-prose-size);
  font-weight: var(--type-prose-weight);
  font-family: var(--type-prose-family);
  line-height: var(--type-prose-line-height);
  letter-spacing: var(--type-prose-letter-spacing);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.markdown > *:first-child {
  margin-top: 0;
}

.markdown h1 {
  font-size: var(--type-hero-size);
  font-weight: var(--type-hero-weight);
  font-family: var(--type-hero-family);
  line-height: var(--type-hero-line-height);
  letter-spacing: var(--type-hero-letter-spacing);
  color: var(--text-bright);
  margin: 2.5em 0 0.6em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--border-subtle);
}

.markdown h2 {
  font-size: var(--type-display-size);
  font-weight: var(--type-display-weight);
  font-family: var(--type-display-family);
  line-height: var(--type-display-line-height);
  letter-spacing: var(--type-display-letter-spacing);
  color: var(--text-bright);
  margin: 2em 0 0.5em;
  padding-bottom: 0.25em;
  border-bottom: 1px solid var(--border-subtle);
}

.markdown h3 {
  font-size: var(--type-page-size);
  font-weight: var(--type-page-weight);
  font-family: var(--type-page-family);
  line-height: var(--type-page-line-height);
  letter-spacing: var(--type-page-letter-spacing);
  color: var(--text-bright);
  margin: 1.6em 0 0.4em;
}

.markdown h4 {
  font-size: var(--type-section-size);
  font-weight: var(--type-section-weight);
  font-family: var(--type-section-family);
  line-height: var(--type-section-line-height);
  letter-spacing: var(--type-section-letter-spacing);
  color: var(--text-secondary);
  margin: 1.2em 0 0.3em;
}

.markdown p {
  margin: 0.8em 0;
}

.markdown code {
  font-family: var(--mono);
  background: var(--surface-base);
  padding: 0.15em 0.35em;
  border-radius: var(--shape-xs-radius);
  border: 1px solid var(--border-subtle);
}

.markdown pre {
  background: var(--surface-base);
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-lg-radius);
  padding: var(--shape-lg-py) var(--shape-lg-px);
  white-space: pre-wrap;
  overflow-wrap: break-word;
  margin: 1.5em 0;
}

/* CodeBlock이 들어있으면 wrapper pre 스타일 리셋 */
.markdown pre:has(:global(.shiki)) {
  background: none;
  border: none;
  padding: 0;
}

.markdown pre code {
  background: none;
  border: none;
  padding: 0;
  line-height: var(--leading-code);
}

.markdown ul,
.markdown ol {
  margin: 0.6em 0;
  padding-left: 1.6em;
}

.markdown li {
  margin: 0.25em 0;
}

.markdown li > p {
  margin: 0.3em 0;
}

.markdown ul ul,
.markdown ol ol,
.markdown ul ol,
.markdown ol ul {
  margin: 0.15em 0;
}

.markdown blockquote {
  margin: 1.2em 0;
  padding: var(--shape-lg-py) var(--shape-lg-px);
  background: var(--surface-sunken);
  border-radius: var(--shape-lg-radius);
  color: var(--text-secondary);
}

.markdown blockquote > *:first-child {
  margin-top: 0;
}

.markdown blockquote > *:last-child {
  margin-bottom: 0;
}

.markdown table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.2em 0;
  overflow-wrap: break-word;
  font-size: var(--type-body-size);
  line-height: var(--type-body-line-height);
}

.markdown th,
.markdown td {
  border: 1px solid var(--border-subtle);
  padding: var(--space-sm) var(--space-md);
  text-align: left;
}

.markdown th {
  background: var(--surface-base);
  font-weight: var(--weight-semi);
  color: var(--text-bright);
}

.markdown tr:nth-child(even) {
  background: var(--surface-sunken);
}

.markdown a {
  color: var(--tone-primary-base);
  text-decoration: none;
}

.markdown a:hover {
  text-decoration: underline;
}

.markdown img {
  max-width: 100%;
  border-radius: var(--shape-lg-radius);
}

/* Mermaid diagrams: full width */
.markdown svg {
  max-width: 100%;
  height: auto;
}

.markdown hr {
  border: none;
  border-top: 1px solid var(--border-subtle);
  margin: 2em 0;
}

.markdown strong {
  font-weight: var(--weight-semi);
  color: var(--text-bright);
}

/* ── Clickable file path in inline code ── */

.fileLink {
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 0.15em; /* prose 비례 리듬 예외 */
  transition:
    text-decoration-color var(--motion-instant-duration) var(--motion-instant-easing),
    background var(--motion-instant-duration) var(--motion-instant-easing);
}

.fileLink:hover {
  text-decoration-color: var(--tone-primary-base);
  background: var(--bg-hover);
}

.fileLink:focus-visible {
  outline: var(--focus-ring) solid var(--focus);
  outline-offset: var(--focus-ring);
}

.markdown input[type="checkbox"] {
  margin-right: 0.4em;
  vertical-align: middle;
}
```

## `src/interactive-os/ui/Menubar.module.css` (      49줄)

```css
/* ── Menubar — last-mile (ax() handles surface/controlSize/text) ── */

/* ═══ link — gap + whitespace (ax() owns display/align/font/color/cursor) ═══ */
.link {
  gap: var(--space-xs);
  text-decoration: none;
  white-space: nowrap;
}

/* ── submenu panel (positioning = last-mile) ── */

.submenu {
  padding: var(--space-xs) 0;
  margin: 0;
  min-width: 180px;
  background: var(--surface-overlay);
  border: var(--border-width) solid var(--border-default);
  border-radius: var(--shape-xs-radius);
  box-shadow: var(--shadow-md);
  z-index: 1;
}

.submenuRoot {
  composes: submenu;
  top: 100%;
  left: 0;
}

.submenuNested {
  composes: submenu;
  top: calc(var(--space-xs) * -1);
  left: 100%;
}

/* ═══ variant — focused/expanded state (last-mile) ═══ */

.link:is([data-focused='true']) {
  background: var(--bg-hover);
}

.link:is([aria-expanded='true']) {
  background: var(--bg-hover);
}

/* ── hidden submenu ── */

[data-hidden] {
  display: none;
}
```

## `src/interactive-os/ui/NavList.module.css` (      11줄)

```css
/* --- NavList --- */

.group { /* anchor for sibling selector */ }

.group + .group {
  padding-top: var(--space-lg);
}

.groupLabel {
  padding: var(--space-xs) var(--space-md);
}
```

## `src/interactive-os/ui/PanelHeader.module.css` (       7줄)

```css
/* PanelHeader — last-mile only */
/* ax() handles: layout:bar, flex:none, textStyle:overline, text:muted, padding:md */

.panelHeader {
  height: 36px;
  border-bottom: 1px solid var(--border-subtle);
}
```

## `src/interactive-os/ui/PatternDemo.module.css` (      63줄)

```css
.container {
  border: var(--border-width) solid var(--border-default);
  border-radius: var(--shape-md-radius);
  padding: var(--space-sm);
  background: var(--surface-sunken);
  max-width: 360px;
}

.item {
  padding: var(--shape-xs-py) var(--shape-xs-px);
  border-radius: var(--shape-xs-radius);
  gap: var(--space-sm);
  cursor: default;
}

.itemFocused {
  background: var(--bg-hover);
}

.itemSelected {
  background: var(--selection);
}

.itemFocusedSelected {
  background: var(--selection);
  outline: var(--focus-ring) solid var(--focus);
}

.badge {
  margin-left: auto;
}

.header {
  padding: var(--space-xs) var(--shape-xs-px);
}

.nested {
  padding-left: var(--space-lg);
}

.valueTrack {
  height: var(--space-sm);
  background: var(--surface-raised);
  border-radius: var(--shape-pill-radius);
}

.valueThumb {
  top: 50%;
  transform: translate(-50%, -50%);
  width: var(--space-lg);
  height: var(--space-lg);
  background: var(--tone-primary-base);
  border-radius: var(--shape-pill-radius);
}

.valueThumbFocused {
  outline: var(--focus-ring) solid var(--focus);
  outline-offset: 2px;
}

.valueLabel {
  padding-top: var(--space-xs);
}
```

## `src/interactive-os/ui/QuickOpen.module.css` (      70줄)

```css
/* ═══════════════════════════════════════════
   QuickOpen — file search overlay
   ax() handles: surface, layout, shape, gap, padding, text, textStyle, controlSize, flex, clamp, state, weight
   last-mile: positioning, animation, border, shadow, caret-color
   ═══════════════════════════════════════════ */

/* --- last-mile: positioning & animation --- */

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  justify-content: center;
  padding-top: 12vh;
  animation: fade-in var(--motion-enter-duration) var(--motion-enter-easing);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dialog {
  width: 560px;
  max-height: 520px;
  overflow: hidden;
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-lg);
  animation: slide-in var(--motion-enter-duration) var(--motion-enter-easing);
}

@keyframes slide-in {
  from { transform: translateY(-8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.inputRow {
  border-bottom: 1px solid var(--border-subtle);
}

.input {
  background: none;
  border: none;
  outline: none;
  caret-color: var(--tone-primary-base);
}

.input::placeholder {
  color: var(--text-muted);
  font-weight: var(--type-body-weight);
}

.shortcut {
  background: var(--surface-base);
  border: 1px solid var(--border-subtle);
  padding: var(--shape-xs-py) var(--shape-xs-px);
}

.results {
  padding: var(--space-xs) var(--space-sm);
}

.item {
  cursor: default;
  transition: background var(--motion-instant-duration) var(--motion-instant-easing);
}

.itemText {
  min-width: 0;
}
```

## `src/interactive-os/ui/SearchResults.module.css` (      42줄)

```css
.root {
  font-family: var(--font-mono);
}

.matchLine {
  display: flex;
  gap: 0.5em;
  padding: 2px 12px;
  cursor: pointer;
}

.matchLine:hover {
  background: var(--color-primary-base-15);
}

.lineNo {
  flex: none;
  min-width: 3ch;
  text-align: right;
  opacity: 0.5;
}

.matchText {
  flex: 1;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fileGroup {
  margin-top: 4px;
}

.fileHeader {
  padding: 4px 12px;
  font-weight: 600;
  opacity: 0.8;
  position: sticky;
  top: 0;
  background: var(--color-surface-base);
  z-index: 1;
}
```

## `src/interactive-os/ui/SelectionOverlay.module.css` (      46줄)

```css
/* ── base ── */

.rect {
  border-radius: var(--shape-xs-radius);
  transition: opacity var(--motion-instant-duration);
}

.label {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--shape-xs-radius);
}

/* ── variant: kind ── */

.focus {
  --_border: var(--focus);
  --_bg: transparent;
  --_label-bg: var(--focus);
  --_label-color: var(--tone-primary-foreground);
}

.selection {
  --_border: var(--focus);
  --_bg: transparent;
  --_label-bg: var(--focus);
  --_label-color: var(--tone-primary-foreground);
}

.hover {
  --_border: var(--tone-neutral-base);
  --_bg: transparent;
  --_label-bg: var(--tone-neutral-dim);
  --_label-color: var(--text-secondary);
}

/* ── apply variants ── */

.rect {
  border: var(--focus-ring) solid var(--_border);
  background: var(--_bg);
}

.label {
  background: var(--_label-bg);
  color: var(--_label-color);
}
```

## `src/interactive-os/ui/Slider.module.css` (      46줄)

```css
/* --- Slider --- */

.sliderItem {
  padding: var(--shape-xs-py) var(--shape-xs-px);
}

.sliderLabel {
  min-width: calc(var(--space-2xl) * 2);
}

.sliderTrack {
  --slider-track-height: var(--shape-xs-radius);

  height: var(--slider-track-height);
  background: var(--border-default);
  border-radius: calc(var(--slider-track-height) / 2);
}

.sliderFill {
  left: 0;
  top: 0;
  background: var(--tone-primary-base);
  border-radius: calc(var(--slider-track-height) / 2);
}

.sliderThumb {
  --slider-thumb-size: var(--icon-md);

  top: 50%;
  width: var(--slider-thumb-size);
  height: var(--slider-thumb-size);
  border-radius: 50%;
  background: var(--tone-primary-base);
  transform: translate(-50%, -50%);
  transition: box-shadow var(--motion-instant-duration) var(--motion-instant-easing);
}

[data-focused] .sliderThumb {
  box-shadow: 0 0 0 calc(var(--slider-track-height) / 2) var(--tone-primary-base);
  outline: none;
}

.sliderValue {
  min-width: var(--space-2xl);
  font-variant-numeric: tabular-nums;
}
```

## `src/interactive-os/ui/Spinbutton.module.css` (      74줄)

```css
/* --- Spinbutton --- */
/* ax() handles: layout, gap, text, surface, controlSize, center */
/* module.css: component tokens, focus ring, borders, sizing, input */

/* ── Component tokens ── */
.spinbuttonItem {
  --_label-min-w: calc(var(--space-lg) * 4);      /* 64px */
  --_btn-w: var(--switch-width);                     /* 36px */
  --_value-min-w: calc(var(--space-lg) * 3);       /* 48px */
  --_ring-spread: 2px;

  padding: var(--space-sm) var(--space-md);
}

.spinbuttonLabel {
  min-width: var(--_label-min-w);
}

/* Unified group: − [value] + with single focus ring */
.spinbuttonGroup {
  border: 1px solid var(--border-default);
  border-radius: var(--shape-md-radius);
  transition: border-color var(--motion-instant-duration) var(--motion-instant-easing), box-shadow var(--motion-instant-duration) var(--motion-instant-easing);
}

[data-focused] .spinbuttonGroup {
  border-color: var(--tone-primary-base);
  box-shadow: 0 0 0 var(--_ring-spread) var(--tone-primary-base);
  outline: none;
}

.spinbuttonBtn {
  width: var(--_btn-w);
  --_bg: var(--bg-hover);
  --_bg-hover: var(--bg-active);
  background: var(--_bg);
  font-weight: var(--weight-regular);
  transition: background var(--motion-instant-duration) var(--motion-instant-easing);
  -webkit-user-select: none;
  user-select: none;
}


.spinbuttonBtnDec {
  border-right: 1px solid var(--border-default);
}

.spinbuttonBtnInc {
  border-left: 1px solid var(--border-default);
}

.spinbuttonValue {
  min-width: var(--_value-min-w);
  padding: var(--space-sm) var(--space-md);
  font-variant-numeric: tabular-nums;
  cursor: text;
}

.spinbuttonInput {
  width: var(--_value-min-w);
  padding: var(--space-sm) var(--space-sm);
  background: transparent;
  font-variant-numeric: tabular-nums;
}

.spinbuttonInput::placeholder {
  color: var(--text-muted);
}

/* Error state */
.spinbuttonGroup[data-invalid] {
  border-color: var(--tone-destructive-base);
  box-shadow: 0 0 0 var(--_ring-spread) var(--tone-destructive-base);
}
```

## `src/interactive-os/ui/SplitPane.module.css` (      30줄)

```css
/* SplitPane — ratio-based resizable split container
   // ② 2026-03-26-component-styling-rules-prd.md */

.separator {
  background: transparent;
}

.separatorH {
  width: 1px;
  border-left: 1px solid var(--border-default);
  cursor: col-resize;
  position: relative;
}
.separatorH::before {
  content: '';
  position: absolute;
  inset: 0 -4px;
}

.separatorV {
  height: 1px;
  border-top: 1px solid var(--border-default);
  cursor: row-resize;
  position: relative;
}
.separatorV::before {
  content: '';
  position: absolute;
  inset: -4px 0;
}
```

## `src/interactive-os/ui/SpreadReader.module.css` (      69줄)

```css
/* SpreadReader — column-based spread layout for reading long content */

.root {
  --_col-width: 400px;
  --_col-gap: var(--space-3xl);
  --_padding-x: var(--space-5xl);
  --_padding-y: var(--space-5xl);

  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.inset {
  flex: 1;
  overflow: hidden;
  padding: var(--_padding-y) var(--_padding-x);
}

.viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  outline: none;
}

.columns {
  height: 100%;
  column-count: 2;
  column-width: var(--_col-width);
  column-gap: var(--_col-gap);
  column-fill: balance;
  transform: translateX(calc(-1 * var(--_spread, 0) * (100% + var(--_col-gap))));
}

/* Prevent content from breaking across spreads */
.columns :global(pre),
.columns :global(table),
.columns :global(blockquote),
.columns :global(figure),
.columns :global(ul),
.columns :global(ol) {
  break-inside: avoid;
  max-width: 100%;
  overflow-x: auto;
}

.columns :global(th) {
  background: var(--surface-sunken);
}

/* No padding — viewport owns spacing */
.columns > div {
  padding: 0;
  max-width: none;
}

/* Spread indicator */
.indicator {
  position: absolute;
  bottom: var(--space-sm);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  opacity: 0.5;
}
```

## `src/interactive-os/ui/StreamFeed.module.css` (      91줄)

```css
/* StreamFeed — streaming feed container
   ② 2026-03-25-stream-feed-prd.md */

/* --- Wrapper: relative anchor for FAB --- */

.wrapper {
  min-height: 0;
  position: relative;
}

/* --- Container: :where() for specificity 0 defaults --- */

:where(.feed) {
  min-height: 0;
  gap: var(--space-xl);
}

/* --- Entry animation --- */

.entry {
  min-width: 0;
  animation: fadeSlideIn var(--motion-enter-duration) var(--motion-enter-easing) both;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(var(--space-sm));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Streaming indicator --- */

.streaming {
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  animation: fadeSlideIn var(--motion-enter-duration) var(--motion-enter-easing) both;
}

.streamingDot {
  width: 6px;
  height: 6px;
  background: var(--tone-primary-base);
  border-radius: var(--shape-pill-radius);
  animation: pulse var(--motion-pulse-period) ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* --- Scroll to bottom FAB --- */

.scrollFab {
  bottom: var(--space-md);
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  --_bg: var(--surface-overlay);
  --_bg-hover: var(--bg-hover);
  background: var(--_bg);
  border: 1px solid var(--border-default);
  border-radius: var(--shape-pill-radius);
  box-shadow: var(--shadow-md);
  transition:
    background var(--motion-instant-duration) var(--motion-instant-easing),
    color var(--motion-instant-duration) var(--motion-instant-easing);
  animation: fadeSlideIn var(--motion-enter-duration) var(--motion-enter-easing) both;
  z-index: 1;
}

/* --- Stream cursor (blinking caret) --- */

.cursor {
  width: 2px;
  height: 1em;
  background: var(--tone-primary-base);
  margin-left: 1px;
  vertical-align: text-bottom;
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}
```

## `src/interactive-os/ui/TabGroup.module.css` (      38줄)

```css
/* ── TabGroup — JetBrains Islands style ──
   // ② 2026-03-26-component-styling-rules-prd.md */

/* last-mile: tabBar background (sunken surface not in ax) */
.tabBar {
  overflow-x: auto;
  flex-shrink: 0;
  background: var(--surface-sunken);
}

/* ── Tab — last-mile: selected state colors, preview italic ── */
.tab {
  white-space: nowrap;
  --_fg: var(--text-muted);
  color: var(--_fg);
}

.tab[aria-selected="true"] {
  --_bg: var(--surface-raised);
  --_fg: var(--text-primary);
}

.tabPreview {
  font-style: italic;
}

/* ── Close button — last-mile: opacity reveal on hover ── */
.tabClose {
  border-radius: var(--shape-xs-radius);
  padding: var(--space-2xs);
  opacity: 0;
  transition: opacity var(--motion-instant-duration) var(--motion-instant-easing);
}

.tab:hover .tabClose,
.tab[aria-selected="true"] .tabClose {
  opacity: 0.6;
}
```

## `src/interactive-os/ui/TerminalOutput.module.css` (      34줄)

```css
.root {
  background: #1a1a1a;
  color: #e0e0e0;
  font-family: var(--font-mono);
}

.prompt {
  display: flex;
  align-items: baseline;
  gap: 0.5em;
  padding: 8px 12px 4px;
  position: sticky;
  top: 0;
  background: #1a1a1a;
  z-index: 1;
}

.promptSymbol {
  color: #4ec970;
  flex: none;
}

.command {
  font-weight: 600;
  white-space: pre-wrap;
  word-break: break-all;
}

.output {
  padding: 4px 12px 12px;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.4;
}
```

## `src/interactive-os/ui/TextInput.module.css` (      16줄)

```css
/* ── TextInput — 3-block recipe ──
   // ② 2026-03-26-component-styling-rules-prd.md */

/* ═══ Block 1: base ═══ */
.input {
  background: var(--_bg, var(--surface-base));
  height: var(--input-height);
  border-radius: var(--shape-md-radius);
  padding: var(--shape-md-py) var(--shape-md-px);
  transition: border-color var(--motion-instant-duration) var(--motion-instant-easing);
}
/* :focus → data-surface="input" provides via interactive.css */

.input::placeholder {
  color: var(--text-muted);
}
```

## `src/interactive-os/ui/Toaster.module.css` (      47줄)

```css
/* ── Toaster — last-mile overrides ──
   ax() handles: layout, gap, padding, surface, tone, textStyle, text, controlSize
   module.css handles: positioning, animation, variant border colors */

.container {
  position: fixed;
  bottom: var(--space-lg);
  right: var(--space-lg);
  z-index: 9999;
  flex-direction: column-reverse;
  max-width: var(--overlay-width);
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  align-items: flex-start;
  border-radius: var(--shape-xl-radius);
  animation: slideIn 150ms ease-out;
}

.toast[data-variant='success'] {
  border-color: var(--tone-success-base);
}

.toast[data-variant='error'] {
  border-color: var(--tone-destructive-base);
}

.description {
  /* textStyle + text handled by ax() */
}

.dismiss {
  flex-shrink: 0;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## `src/interactive-os/ui/Tooltip.module.css` (      26줄)

```css
.tooltip {
  position-area: bottom span-all;
  position-try-fallbacks: flip-block;
  margin: 0;
  margin-top: var(--space-xs);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  max-width: calc(var(--space-3xl) * 6);

  background: var(--surface-raised);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-xs-radius);

  line-height: var(--leading-snug);
  white-space: normal;
  word-wrap: break-word;

  transition:
    opacity var(--motion-enter-duration) var(--motion-enter-easing),
    transform var(--motion-enter-duration) var(--motion-enter-easing);

  /* popover reset */
  inset: unset;

  pointer-events: none;
}
```

## `src/interactive-os/ui/Treemap.module.css` (      53줄)

```css
/* --- Treemap --- */

/* ── base ── */

.treemap {
  border-radius: var(--shape-sm-radius);
}

.block {
  border: 1px solid var(--border-subtle);
  background: var(--surface-default);
  padding: var(--space-xs);
  transition: background var(--motion-duration-fast) var(--motion-easing-default);
}

.block:hover {
  background: var(--surface-hover);
}

.block:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: -2px;
  z-index: 1;
}

/* ── ext color bar (top edge) ── */

.block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--space-xs);
  background: var(--_bar, var(--tone-neutral-subtle));
}

.block[data-ext="ts"] { --_bar: var(--tone-primary-base); }
.block[data-ext="tsx"] { --_bar: var(--focus); }
.block[data-ext="css"] { --_bar: var(--tone-destructive-base); }
.block[data-ext="md"],
.block[data-ext="mdx"] { --_bar: var(--tone-positive-base); }
.block[data-ext="json"],
.block[data-ext="yaml"],
.block[data-ext="yml"] { --_bar: var(--tone-warning-base); }

/* ── label ── */

.blockLabel {
  line-height: var(--type-caption-leading);
  text-overflow: ellipsis;
  max-width: 100%;
}
```

## `src/interactive-os/ui/Workspace.module.css` (      11줄)

```css
/* ② 2026-03-26-component-styling-rules-prd.md */
/* ax() handles: layout(fill/center), flex, text */
/* last-mile: height:100% (flex parent에서 초기 높이 확보) */

.root {
  height: 100%;
}

.empty {
  height: 100%;
}
```

## `src/pages/birdseye/BirdseyeLayout.module.css` (     244줄)

```css
/* Birdseye — SplitPane + NavList + Kanban layout */

.sidebar {
  background: var(--surface-sunken);
}

/* sidebarHeader → PanelHeader 컴포넌트로 교체 */

.sidebarBody {
  overflow: hidden auto;
  padding: var(--space-xs) 0;
}

.board {
  background: var(--surface-default);
}

/* boardHeader → PanelHeader 컴포넌트로 교체 */

.breadcrumb {
  gap: 0;
}

.breadcrumbSep {
  padding: 0 var(--space-xs);
}

.breadcrumbLink {
  all: unset;
}

.breadcrumbLink:hover {
  color: var(--text-bright);
}

.legend {
  gap: var(--space-sm);
  margin-left: auto;
}

.legend > span {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
  opacity: 0.6;
  padding: var(--space-xs) var(--space-xs);
  border-radius: var(--shape-xs-radius);
}

.legend > span:hover {
  opacity: 1;
}

.legend > span[data-active] {
  opacity: 1;
  color: var(--text-bright);
  background: var(--surface-sunken);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--shape-xs-radius);
}

.legend > span::before {
  content: '';
  width: 3px;
  height: 12px;
  border-radius: var(--border-width);
}

.legend > span[data-ext="ts"]::before { background: var(--tone-primary-base); }
.legend > span[data-ext="tsx"]::before { background: var(--focus); }
.legend > span[data-ext="css"]::before { background: var(--tone-destructive-base); }
.legend > span[data-ext="md"]::before { background: var(--tone-positive-base); }
.legend > span[data-ext="yaml"]::before { background: var(--tone-warning-base); }

.legendHint {
  border-left: 1px solid var(--border-subtle);
  padding-left: var(--space-sm);
  cursor: default;
}

.legendHint[data-weight-legend]::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: var(--space-inline-code);
  background: color-mix(in srgb, var(--tone-warning-base) 12%, var(--surface-default));
  border: 1px solid var(--tone-warning-base);
  margin-right: var(--space-xs);
}

.viewToggle {
  all: unset;
  width: var(--space-xl);
  height: var(--space-xl);
  border-radius: var(--shape-xs-radius);
  border-left: 1px solid var(--border-subtle);
  margin-left: var(--space-xs);
  padding-left: var(--space-sm);
}

.viewToggle:hover {
  color: var(--text-bright);
  background: var(--surface-sunken);
}



/* --- floating overlay viewer --- */

.overlay {
  top: var(--space-lg);
  right: var(--space-lg);
  max-height: calc(100vh - 2 * var(--space-lg));
  width: min(560px, 45vw);
  background: color-mix(in srgb, var(--surface-base) 85%, transparent);
  backdrop-filter: blur(16px) saturate(1.2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-md-radius);
  box-shadow: var(--shadow-lg);
  z-index: 10;
  pointer-events: auto;
}

/* overlayHeader → PanelHeader axes={{ textStyle: 'code' }}로 교체 */


.viewerEmpty {
  font-size: var(--type-caption-size);
}

/* --- dep list --- */

.depList {
  padding: var(--space-sm) var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
  font-size: var(--type-caption-size);
  font-family: var(--type-mono);
}

.depList details + details {
  margin-top: var(--space-xs);
}

.depSummary {
  gap: var(--space-xs);
  font-size: var(--type-caption-size);
  padding: var(--space-xs) 0;
}

.depSummary::-webkit-details-marker {
  display: none;
}

.depSummary::before {
  content: '▸';
  font-size: 10px;
  transition: transform 0.15s;
}

details[open] > .depSummary::before {
  transform: rotate(90deg);
}

.depDot {
  width: 3px;
  height: 10px;
  border-radius: var(--border-width);
}

.depDot[data-dir="up"] {
  background: var(--tone-positive-base);
}

.depDot[data-dir="down"] {
  background: var(--tone-primary-base);
}

.depGroups {
  padding: var(--space-xs) 0;
}

.depGroup {
  margin-left: var(--space-sm);
}

.depGroup + .depGroup {
  margin-top: var(--space-xs);
}

.depGroupSummary {
  font-size: var(--type-caption-size);
  padding: var(--space-xs) 0;
  font-weight: var(--weight-medium);
}

.depGroupSummary::-webkit-details-marker {
  display: none;
}

.depGroupSummary::before {
  content: '▸ ';
  font-size: 9px;
  display: inline-block;
  transition: transform 0.15s;
}

details[open] > .depGroupSummary::before {
  transform: rotate(90deg);
}

.depGroupCount {
  font-weight: var(--weight-normal);
}

.depFiles {
  margin: 0;
  padding: 0 0 0 var(--space-lg);
}

.depFiles li {
  padding: 0;
}

.depJump {
  all: unset;
  padding: var(--border-width) 0;
  text-overflow: ellipsis;
  border-radius: var(--shape-xs-radius);
}

.depJump:hover,
.depJump:focus-visible {
  color: var(--text-bright);
  background: var(--surface-sunken);
  padding: var(--border-width) var(--space-xs);
  margin: 0 calc(-1 * var(--space-xs));
}

/* --- loading --- */

.loading {
  font-size: var(--type-body-size);
}
```

## `src/pages/book/PageBookViewer.module.css` (     246줄)

```css
/* ═══════════════════════════════════════════
   Book Viewer — content-first reading experience
   Floating chrome: pill (top-left) + badge (bottom-right)
   ═══════════════════════════════════════════ */

/* ── base ── */

.book {
  --_page-col-width: 400px;
  --_page-padding-x: var(--space-5xl);
  --_page-padding-y: var(--space-5xl);
  --_page-col-gap: var(--space-3xl);
  --_progress-height: 2px;
  --_chrome-duration: 600ms;
  --_chrome-easing: cubic-bezier(0.4, 0, 0.2, 1);

  display: grid;
  grid-template-columns: 1fr;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--surface-base);
}

/* ── Floating pill — top-left ── */

.pill {
  position: absolute;
  top: var(--space-md);
  left: var(--space-md);
  z-index: 20;
  max-width: 50%;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--_chrome-duration) var(--_chrome-easing);
}

.pill[data-visible="true"] {
  opacity: 1;
  pointer-events: auto;
}

.pillBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--shape-pill-radius);
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.pillBtn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.pillBtn:focus-visible {
  outline: var(--focus-ring) solid var(--focus);
  outline-offset: var(--focus-ring);
}

/* ── Page number — always visible, bottom-center ── */

.pageNumber {
  position: absolute;
  bottom: var(--space-sm);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  opacity: 0.5;
}

/* ── Progress bar — bottom edge ── */

.progressBar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  height: var(--_progress-height);
  background: var(--surface-sunken);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--_chrome-duration) var(--_chrome-easing);
}

.progressBar[data-visible="true"] {
  opacity: 1;
}

.progressFill {
  height: 100%;
  background: var(--tone-primary-base);
  transition: width var(--motion-normal-duration) var(--motion-normal-easing);
}

/* ── Overlay TOC ── */

.tocOverlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--dialog-backdrop);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--motion-enter-duration) var(--motion-enter-easing);
}

.tocOverlay[data-open="true"] {
  opacity: 1;
  pointer-events: auto;
}

.tocOverlayPanel {
  width: min(480px, 90%);
  max-height: 80%;
  background: var(--surface-default);
  border-radius: var(--shape-xl-radius);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  transition: transform var(--motion-enter-duration) var(--motion-enter-easing);
}

.tocOverlay[data-open="true"] .tocOverlayPanel {
  transform: scale(1);
}

.tocOverlayHeader {
  border-bottom: 1px solid var(--border-subtle);
}

/* ── TOC item indent ── */

.tocOverlayPanel [data-indent] {
  padding-left: var(--space-xl);
}

/* ── Page area ── */

.pageArea {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  position: relative;
}

/* Aria wrapper becomes a flex child — must stretch */
.pageArea [data-aria-container] {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.pageInset {
  flex: 1;
  overflow: hidden;
  padding: var(--_page-padding-y) var(--_page-padding-x);
}

.pageViewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  outline: none;
}

.page {
  height: 100%;
  column-count: 2;
  column-width: var(--_page-col-width);
  column-gap: var(--_page-col-gap);
  column-fill: balance;
  transform: translateX(calc(-1 * var(--_spread, 0) * (100% + var(--_page-col-gap))));
}

/* Prevent content from breaking across spreads */
.page :global(pre),
.page :global(table),
.page :global(blockquote),
.page :global(figure),
.page :global(ul),
.page :global(ol) {
  break-inside: avoid;
  max-width: 100%;
  overflow-x: auto;
}

.page :global(th) {
  background: var(--surface-sunken);
}

/* ── Page floating nav ── */

.pageNav {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  justify-content: space-between;
  padding: var(--space-lg);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--_chrome-duration) var(--_chrome-easing);
}

.pageNav[data-visible="true"] {
  opacity: 1;
  pointer-events: auto;
}


/* ── Book markdown — no padding (viewport owns spacing) ── */

.page > div {
  padding: 0;
  max-width: none;
}

/* ── Empty state ── */

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--space-lg);
}

.emptyIcon {
  opacity: 0.3;
}
```

## `src/pages/chat/PageAgentChat.module.css` (     122줄)

```css
/* ═══════════════════════════════════════════
   Agent Chat — last-mile only (ax 축 외 CSS)
   ═══════════════════════════════════════════ */

/* --- Layout --- */

.chat {
  grid-column: 2 / -1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* --- Sidebar --- */

.chatSidebar {
  width: 200px;
  background: var(--surface-sunken);
  border-right: 1px solid var(--border-subtle);
}

/* chatSidebarHeader → PanelHeader */

.chatNewBtn {
  width: 24px;
  height: 24px;
}

/* --- Session list --- */

.chatSessionItem {
  padding-inline: var(--space-md);
  cursor: pointer;
}

.chatSessionItem:hover {
  background: var(--bg-hover);
}

.chatSessionActive {
  background: var(--bg-active);
  color: var(--text-bright);
}

.chatCloseBtn {
  margin-left: auto;
  width: 20px;
  height: 20px;
  opacity: 0;
}

.chatSessionItem:hover .chatCloseBtn {
  opacity: 1;
}

/* --- File list per session --- */

.chatFileList {
  padding-left: calc(8px + var(--space-xs));
}

/* --- Main chat area --- */

.chatMain {
  width: 100%;
  max-width: 860px;
  margin-inline: auto;
}

.chatFeed {
  padding: var(--space-xl) var(--space-lg);
}

/* --- Composer --- */

.chatComposer {
  padding: 0 var(--space-lg) var(--space-md);
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

.chatDot {
  width: 6px;
  height: 6px;
  border-radius: var(--shape-pill-radius);
  background: var(--tone-primary-base);
  animation: pulse var(--motion-pulse-period) ease-in-out infinite;
}

.chatActivityBar {
  font-variant-numeric: tabular-nums;
}

.chatInputRow > :first-child {
  flex: 1;
  min-width: 0;
}

/* --- Status bar --- */

.chatStatusBar {
  font-variant-numeric: tabular-nums;
}

.chatHint {
  margin-left: auto;
}

/* --- Welcome --- */

.chatStartBtn {
  border: 1px solid var(--border-subtle);
  background: var(--surface-raised);
}

.chatStartBtn:hover {
  background: var(--bg-hover);
  border-color: var(--border-default);
}
```

## `src/pages/creator/PageComponentCreator.module.css` (     107줄)

```css
/* ── Component Creator ──
   // ② 2026-03-27-component-creator-prd.md

   Layout: Canvas(primary) | Code(secondary) / Chat(tertiary)
   Pane = 동시에 봐야 하는 것, Tab = 배타적 전환 */

/* paneHeader → PanelHeader 컴포넌트로 교체 */

/* ── Primary: Canvas ── */

.canvas {
  padding: var(--space-lg);
}

.canvasError {
  padding: var(--space-md);
}

/* ── Right pane container ── */
.rightPane {
  border-left: 1px solid var(--border-subtle);
}

/* ── Secondary: Code [TSX | CSS] ── */

.sourceTab {
  padding: var(--shape-xs-py) var(--shape-xs-px);
  border-radius: var(--shape-xs-radius);
  font-weight: var(--type-caption-weight);
  --_bg: transparent;
  --_bg-hover: var(--surface-default);
  background: var(--_bg);
  transition: background var(--motion-instant-duration) var(--motion-instant-easing),
              color var(--motion-instant-duration) var(--motion-instant-easing);
}

.sourceTabActive {
  --_bg: var(--surface-raised);
  color: var(--text-primary);
}

/* ── Tertiary: Chat ── */
.chat {
  border-left: 1px solid var(--border-subtle);
}

.chatContext {
  padding: var(--shape-xs-py) var(--shape-sm-px);
  background: var(--surface-sunken);
  border-bottom: 1px solid var(--border-subtle);
}

.chatContextMeta {
  margin-left: var(--space-sm);
}

.chatMessages {
  padding: var(--space-md);
}

.chatEmpty {
  padding: var(--space-xl);
}

.chatBubble {
  padding: var(--shape-xs-py) var(--shape-sm-px);
  border-radius: var(--shape-sm-radius);
  line-height: var(--leading-snug);
  white-space: pre-wrap;
  max-width: 85%;
}

.chatBubbleUser {
  align-self: flex-end;
  background: var(--tone-primary-dim);
}

.chatBubbleAssistant {
  align-self: flex-start;
  background: var(--surface-sunken);
}

.chatInputWrap {
  padding: var(--space-sm);
  border-top: 1px solid var(--border-subtle);
}

.chatInput {
  padding: var(--shape-xs-py) var(--shape-sm-px);
  border-radius: var(--shape-sm-radius);
  background: var(--surface-default);
  resize: none;
  transition: border-color var(--motion-instant-duration) var(--motion-instant-easing);
}

/* ── Nav bar (bottom) ── */
.navBar {
  padding: var(--shape-xs-py) var(--shape-sm-px);
  background: var(--surface-sunken);
  overflow-x: auto;
}

.navBar [role="tablist"] {
  display: flex;
  flex-wrap: nowrap;
  white-space: nowrap;
}
```

## `src/pages/incident/PageIncidentInterface.module.css` (     515줄)

```css
/* ═══════════════════════════════════════════
   AI Incident Interface v5 — design system native
   surface 계층감 + tone 차별화 + 밀도
   ═══════════════════════════════════════════ */

/* --- Page: 2-row grid (monitor bar + workspace) --- */

.page {
  grid-template-rows: auto 1fr;
  grid-column: 2 / -1;
  background: var(--surface-base);
}

/* ═══════════════════════════════════════════
   Zone 1: Monitoring Bar (top)
   surface-base (deepest) — 조연, 후퇴
   ═══════════════════════════════════════════ */

.monitorBar {
  gap: var(--space-md);
  padding: var(--space-xs) var(--space-lg);
  background: var(--surface-base);
}

.monitorLabel {
  gap: var(--space-xs);
}

.monitorServices {
  gap: var(--space-inline-code);
}

.monitorItem {
  gap: var(--space-sm);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--shape-xs-radius);
  transition:
    background var(--motion-instant-duration) var(--motion-instant-easing),
    color var(--motion-instant-duration) var(--motion-instant-easing);
}

.monitorItem:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.monitorItemActive {
  background: var(--surface-sunken);
  color: var(--text-primary);
}

.indicator {
  width: var(--space-sm);
  height: var(--space-sm);
  border-radius: var(--shape-pill-radius);
}

.indicatorCritical {
  background: var(--tone-destructive-base);
  box-shadow: 0 0 var(--space-sm) var(--tone-destructive-base);
  animation: pulse 1.5s ease-in-out infinite;
}

.indicatorWarning { background: var(--tone-warning-base); }
.indicatorHealthy { background: var(--tone-success-base); opacity: 0.6; }

.monitorMeta {
  gap: var(--space-sm);
}

.monitorMetaItem {
  padding: var(--shape-xs-py) var(--shape-xs-px);
  background: var(--surface-sunken);
  border-radius: var(--shape-xs-radius);
}

.monitorMetaLive {
  color: var(--tone-destructive-hover);
  background: var(--tone-destructive-dim);
}

/* ═══════════════════════════════════════════
   Zone 2: Workspace (Chat + Timeline + Capture)
   ═══════════════════════════════════════════ */

/* --- Chat zone (left) --- surface-sunken */

.chatZone {
  width: 340px;
  background: var(--surface-sunken);
  order: 3;
}

.chatHeader {
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
}

.chatElapsed {
  margin-left: auto;
  gap: var(--space-xs);
}

.messages {
  padding: var(--space-sm) var(--space-md);
  gap: var(--space-sm);
}

/* --- Input bar --- */

.inputBar {
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--surface-base);
}

.input {
  height: 36px;
  padding: 0 var(--shape-md-px);
  border-radius: var(--shape-md-radius);
}

.input:focus { border-color: var(--tone-primary-base); }
.input:disabled { opacity: 0.5; }
.input::placeholder { color: var(--text-muted); }

.sendBtn {
  width: 36px;
  height: 36px;
  background: var(--tone-primary-base);
  border-radius: var(--shape-md-radius);
  color: var(--tone-primary-foreground);
  transition: background var(--motion-instant-duration) var(--motion-instant-easing);
}

.sendBtn:hover:not(:disabled) { background: var(--tone-primary-hover); }
.sendBtn:disabled { background: var(--surface-overlay); color: var(--text-muted); cursor: default; }

/* --- Timeline panel (center) --- surface-default */

.timelinePanel {
  width: 320px;
  background: var(--surface-default);
}

.panelHeader {
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
}

.panelCount {
  margin-left: auto;
}

.panelEmpty {
  padding: var(--space-xl);
}

/* --- Timeline list items --- */

.timelineItem {
  gap: var(--space-sm);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  transition: background var(--motion-instant-duration) var(--motion-instant-easing);
  animation: fadeSlideIn var(--motion-enter-duration) var(--motion-enter-easing) both;
}

.timelineItem:hover {
  background: var(--bg-hover);
}

.timelineItemFocused {
  background: var(--tone-primary-dim);
}

.timelineItemSelected {
  background: var(--tone-primary-dim);
  box-shadow: inset 3px 0 0 var(--tone-primary-base);
}

.timelineTime {
  width: 36px;
  padding-top: 2px;
}

.timelineDot {
  padding-top: var(--space-xs);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: var(--shape-pill-radius);
}

.dot.evCritical { background: var(--tone-destructive-base); box-shadow: 0 0 4px var(--tone-destructive-base); }
.dot.evWarning { background: var(--tone-warning-base); }
.dot.evInfo { background: var(--text-muted); opacity: 0.5; }

.dotLine {
  width: 1px;
  min-height: var(--space-md);
  background: var(--border-subtle);
}

.timelineContent {
  gap: var(--space-sm);
}

.timelineIcon {
  padding-top: 1px;
}

.evCritical .timelineIcon { color: var(--tone-destructive-base); }
.evWarning .timelineIcon { color: var(--tone-warning-base); }

.timelineTitle {
  line-height: var(--leading-snug);
}

.evCritical .timelineTitle { color: var(--tone-destructive-hover); }

.timelineDetail {
  margin-top: 1px;
}

/* --- Capture panel (right) --- surface-sunken (stage) */

.capturePanel {
  background: var(--surface-sunken);
}

.captureBody {
  gap: var(--space-md);
  padding: var(--space-md);
}

.captureComparison {
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.captureCard {
  gap: var(--space-xs);
}

.capturePreview {
  gap: var(--space-sm);
  background: var(--surface-default);
  border-radius: var(--shape-sm-radius);
  padding: var(--shape-sm-py) var(--shape-sm-px);
  min-height: 100px;
  transition:
    background var(--motion-normal-duration) var(--motion-normal-easing),
    box-shadow var(--motion-normal-duration) var(--motion-normal-easing);
}

.captureChanged {
  background: var(--tone-destructive-dim);
  box-shadow: inset 0 0 0 1px var(--tone-destructive-mid);
}

.captureChanged .captureText {
  color: var(--tone-destructive-hover);
}

.captureAi {
  gap: var(--space-sm);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  background: var(--tone-primary-dim);
  border-radius: var(--shape-xs-radius);
  color: var(--tone-primary-hover);
  line-height: var(--leading-normal);
}

.captureAi svg { margin-top: 2px; }

.captureEmpty {
  gap: var(--space-md);
}

.captureEmpty kbd {
  color: var(--text-muted);
  background: var(--surface-default);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  border-radius: var(--shape-xs-radius);
}

/* ═══════════════════════════════════════════
   Message types (chat zone)
   ═══════════════════════════════════════════ */

/* --- System message (alert) --- */

.systemMsg .bubble {
  background: var(--tone-destructive-dim);
  border-radius: var(--shape-xs-radius);
  padding: var(--shape-xs-py) var(--shape-xs-px);
}

.systemLabel {
  color: var(--tone-destructive-hover);
}

/* --- Agent message --- */

.agentMsg {
  gap: var(--space-sm);
}

.avatar {
  width: 20px;
  height: 20px;
  background: var(--tone-primary-dim);
  border-radius: var(--shape-pill-radius);
}

.agentLabel {
  line-height: var(--leading-normal);
}

/* --- Rich block (shared container) --- */

.block {
  background: var(--surface-raised);
  border-radius: var(--shape-xs-radius);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  margin-top: var(--space-xs);
}

/* --- Log lines --- */

.logLines {
  gap: var(--border-width);
  line-height: var(--leading-snug);
}

.logLine { gap: var(--space-sm); }

/* --- Metric grid --- */

.metricGrid {
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-sm);
}

.stat { gap: var(--space-inline-code); }

.barTrack {
  height: 3px;
  background: var(--surface-base);
  border-radius: var(--shape-pill-radius);
}

.barFillBad {
  background: var(--tone-destructive-base);
  border-radius: var(--shape-pill-radius);
  animation: barGrow 0.6s var(--motion-enter-easing) both;
}

.barFillWarn {
  background: var(--tone-warning-base);
  border-radius: var(--shape-pill-radius);
  animation: barGrow 0.6s var(--motion-enter-easing) both;
}

@keyframes barGrow { from { width: 0; } }

/* --- Cause chain --- */

.causeChain { gap: var(--space-xs); }

.causeNode {
  gap: var(--space-sm);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  background: var(--surface-base);
  border-radius: var(--shape-xs-radius);
}

.causeIcon {
  width: 20px;
  height: 20px;
  border-radius: var(--shape-pill-radius);
}

.causeIconBad { background: var(--tone-destructive-dim); color: var(--tone-destructive-hover); }
.causeIconWarn { background: var(--tone-warning-dim); color: var(--tone-warning-hover); }

.causeBadge {
  color: var(--tone-destructive-hover);
  background: var(--tone-destructive-dim);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  border-radius: var(--shape-xs-radius);
}

.causeArrow { padding-left: 20px; }

/* --- Similar incident --- */

.similarCard {
  background: var(--surface-base);
  border-radius: var(--shape-xs-radius);
  padding: var(--shape-xs-py) var(--shape-xs-px);
}

.similarHeader { gap: var(--space-sm); margin-bottom: var(--space-xs); }

.matchBadge {
  background: var(--tone-primary-dim);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  border-radius: var(--shape-xs-radius);
}

.similarTime { margin-left: auto; }
.similarBody { margin-bottom: var(--space-xs); }

.similarResolution {
  gap: var(--space-xs);
  color: var(--tone-success-hover);
  background: var(--tone-success-dim);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  border-radius: var(--shape-xs-radius);
}

/* --- Service list --- */

.svcList { gap: var(--space-xs); }

.svcItem {
  gap: var(--space-sm);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  border-radius: var(--shape-xs-radius);
  background: var(--surface-base);
}

.svcBad { background: var(--tone-destructive-dim); color: var(--tone-destructive-hover); }
.svcWarn { background: var(--tone-warning-dim); color: var(--tone-warning-hover); }

.svcStatus { opacity: 0.5; }

/* --- Action buttons --- */

.actionList { gap: var(--space-xs); margin-top: var(--space-xs); }

.action {
  gap: var(--space-xs);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  background: var(--surface-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--shape-xs-radius);
  transition:
    background var(--motion-instant-duration) var(--motion-instant-easing),
    border-color var(--motion-instant-duration) var(--motion-instant-easing);
}

.action:hover { background: var(--bg-hover); border-color: var(--border-strong); }

.actionPrimary {
  background: var(--tone-primary-dim);
  border-color: var(--tone-primary-mid);
  color: var(--tone-primary-hover);
}

.actionPrimary:hover { background: var(--tone-primary-mid); border-color: var(--tone-primary-base); }

.action kbd {
  color: var(--text-muted);
  background: var(--surface-base);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  border-radius: var(--shape-xs-radius);
}

/* --- User message (right-aligned) --- */

.userMsg {
  gap: var(--space-sm);
}

.userMsg .bubble {
  background: var(--tone-primary-dim);
  border-radius: var(--shape-xs-radius);
  padding: var(--shape-xs-py) var(--shape-xs-px);
}

.userAvatar {
  width: 20px;
  height: 20px;
  background: var(--surface-overlay);
  border-radius: var(--shape-pill-radius);
}

/* --- Tool call indicator --- */

.toolMsg {
  gap: var(--space-xs);
  padding: var(--space-inline-code) var(--space-sm);
  margin-left: calc(20px + var(--space-sm));
}

/* --- Utilities --- */

.spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(var(--space-sm)); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

## `src/pages/replay/ReplayCursor.module.css` (      13줄)

```css
.cursor {
  position: absolute;
  width: 2px;
  height: calc(var(--leading-code) * 1em);
  background: var(--tone-primary-base);
  animation: blink 0.8s step-end infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes blink {
  50% { opacity: 0; }
}
```

## `src/pages/showcase/IndicatorsDemo.module.css` (      76줄)

```css
/* ── Block 1: base ── */
.root {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.sectionTitle {
  padding-bottom: var(--space-xs);
  border-bottom: 1px solid var(--border-subtle);
  margin: 0;
}

.row {
  display: grid;
  grid-template-columns: 16ch 1fr;
  align-items: center;
  min-height: var(--space-2xl);
  gap: var(--space-md);
}

.label {
  white-space: nowrap;
}

.value {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.interactiveTarget {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--shape-sm-radius);
  cursor: pointer;
  transition: background var(--motion-instant-duration);
  user-select: none;
}

.interactiveTarget:hover {
  background: var(--selection);
}

/* interactive.css [aria-checked="true"] 배경 차단 — 데모에서는 indicator 자체만 상태 표현 */
.interactiveTarget[aria-checked] {
  background: transparent;
}

.interactiveTarget[aria-checked]:hover {
  background: var(--selection);
}

.stateLabel {
  font-size: var(--type-code-size);
  font-family: var(--type-code-family);
}

.separatorFill { flex: 1; }

.ariaCheckedWrapper { display: inline-flex; }

.verticalSeparatorDemo {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  height: var(--space-3xl);
}
```

## `src/pages/showcase/PageUiShowcase.module.css` (      30줄)

```css
/* ═══════════════════════════════════════════
   UI Showcase — component docs page
   ═══════════════════════════════════════════ */

.uiPage { grid-column: 2 / -1; }

/* --- Sidebar --- */

.uiSidebar {
  width: 240px;
  min-width: 200px;
  background: var(--surface-sunken);
  border-right: 1px solid var(--border-subtle);
}

/* uiSidebarHeader → PanelHeader */

.uiSidebarBody {
  padding: var(--space-sm) 0;
}

/* --- Content area --- */

.uiContent {
  background: var(--surface-default);
}

.uiContentBody {
  padding: var(--space-2xl) 48px;
}
```

## `src/pages/storymap/PageStoryMap.module.css` (     206줄)

```css
/* ═══════════════════════════════════════════
   StoryMap — Jeff Patton 2D subgrid layout
   Story-per-column, aligned rows, horizontal scroll
   ═══════════════════════════════════════════ */

/* --- base --- */

.sm {
  --_col-width: var(--storymap-col-width);

  background: var(--surface-base);
}

.smHeader {
  height: var(--toolbar-height);
  padding: 0 var(--space-lg);
  border-bottom: var(--border-width) solid var(--border-subtle);
}

.smHeaderLeft {
  gap: var(--space-xl);
}

.smBody {
  padding: var(--space-xl);
}

/* --- flat grid: spacer rows로 위계별 간격 분리 ---
   N→S: --space-lg (16)  |  S→F: --space-md (12)  |  F↔F: --space-sm (8)
   content rows = odd (1,3,5...), gap rows = even (2,4,6...)              */

.smMap {
  grid-template-rows:
    auto var(--space-lg)                    /* need header + N→S gap */
    auto var(--space-md)                    /* story + S→F gap */
    auto var(--space-sm)                    /* f1 + F↔F gap */
    auto var(--space-sm)                    /* f2 + F↔F gap */
    auto var(--space-sm)                    /* f3 + F↔F gap */
    auto var(--space-sm)                    /* f4 + F↔F gap */
    auto;                                   /* f5 */

  gap: 0 var(--space-sm);
  width: max-content;
}

/* --- need header: spans its story columns, row 1 --- */

.smNeedHeader {
  grid-row: 1;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--tone-primary-dim);
}

.smNeedHeaderTop {
  gap: var(--space-sm);
}

.smPersonaBadge {
  width: var(--icon-lg);
  height: var(--icon-lg);
  border-radius: 50%;
  background: var(--surface-base);
}

/* --- story column: spans row 3..end, subgrid + nth-child skips gap rows --- */

.smStoryCol {
  grid-row: 3 / -1;
  grid-template-rows: subgrid;
  row-gap: 0;
  align-content: start;
}

/* content rows are odd in subgrid (1,3,5,7,9,11), gap rows are even */
.smStoryCol > :nth-child(1) { grid-row: 1; }
.smStoryCol > :nth-child(2) { grid-row: 3; }
.smStoryCol > :nth-child(3) { grid-row: 5; }
.smStoryCol > :nth-child(4) { grid-row: 7; }
.smStoryCol > :nth-child(5) { grid-row: 9; }
.smStoryCol > :nth-child(6) { grid-row: 11; }

/* --- story card (post-it) --- */

.smStory {
  gap: var(--space-xs);
  padding: var(--space-md);
  aspect-ratio: 1;
  background: var(--tone-warning-dim);
  box-shadow: var(--shadow-xs);
  cursor: default;
  transition: box-shadow var(--motion-normal-duration) var(--motion-normal-easing);
}

.smStory:hover {
  box-shadow: var(--shadow-sm);
}

/* blocked dot — destructive, S 카드 ID 옆 */
.smStoryBlocked {
  width: var(--space-sm);
  height: var(--space-sm);
  border-radius: 50%;
  background: var(--tone-destructive-base);
}

/* --- status variants: 배경색 + 좌측 bar로 상태 구분 --- */

.smStory[data-status="active"] {
  background: var(--tone-primary-dim);
  box-shadow: inset var(--indicator-width) 0 0 var(--tone-primary-base), var(--shadow-xs);
}

.smStory[data-status="done"] {
  background: var(--tone-success-dim);
}

.smStory[data-status="done"] .smStoryText {
  text-decoration: line-through;
  text-decoration-color: var(--text-muted);
}

.smStoryCol[data-status="done"] {
  opacity: 0.4;
}

.smStory[data-status="blocked"] {
  background: var(--tone-destructive-dim);
  box-shadow: inset var(--indicator-width) 0 0 var(--tone-destructive-base), var(--shadow-xs);
}

.smStoryText {
  line-height: var(--leading-snug);
}

/* --- feature card (post-it, 작은) --- */

.smFeature {
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--surface-raised);
  box-shadow: var(--shadow-xs);
  line-height: var(--leading-snug);
}

.smFeatureScreens {
  gap: var(--space-xs);
}

.smFeatureScreenTag {
  padding: var(--space-inline-code) var(--space-xs);
  background: var(--tone-neutral-dim);
  border-radius: 0;
}

/* --- links --- */

.smLinks {
  gap: var(--space-xs);
}

.smLinksItem {
  padding: var(--space-inline-code) var(--space-sm);
  background: var(--tone-primary-dim);
  border-radius: 0;
}

.smLinksItem:hover {
  background: var(--tone-primary-mid);
}

/* --- feature cards inherit column status color --- */
.smStoryCol[data-status="active"] .smFeature  { background: var(--tone-primary-dim); }
.smStoryCol[data-status="blocked"] .smFeature { background: var(--tone-destructive-dim); }

/* --- focus: bg highlight for spatial nav --- */

.smStory[data-focused] {
  box-shadow: 0 0 0 var(--indicator-width) var(--tone-primary-base), var(--shadow-xs);
}

.smFeature[data-focused] {
  box-shadow: 0 0 0 var(--indicator-width) var(--tone-primary-base), var(--shadow-xs);
}

/* --- legend --- */

.smLegend {
  gap: var(--space-md);
}

.smLegendItem {
  gap: var(--space-xs);
}

.smLegendSwatch {
  width: var(--icon-sm);
  height: var(--icon-sm);
  border-radius: var(--shape-xs-radius);
  border: var(--border-width) solid var(--border-subtle);
}

.smLegendSwatch[data-status="pending"]  { background: var(--tone-warning-dim); }
.smLegendSwatch[data-status="active"]   { background: var(--tone-primary-base); }
.smLegendSwatch[data-status="done"]     { background: var(--tone-success-base); opacity: 0.55; }
.smLegendSwatch[data-status="blocked"]  { background: var(--tone-destructive-base); }
```

## `src/pages/theme/PageThemeCreator.module.css` (     110줄)

```css
/* ── Last-mile: ax()로 표현 불가능한 것만 ── */

.root {
  grid-column: 2 / -1;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 80px;
  overflow-y: auto;
}

/* ── Page layout: 3-column grid ── */

.pageGrid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-xl);
}

/* ── Grid helpers (column counts) ── */

.grid5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-xs); }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-xs); align-items: center; }

/* ── Section label ── */

.sectionLabel {
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Mono font for token names ── */

.mono { font-family: var(--mono); }

/* ── Swatches (dynamic token color — ax()로 불가) ── */

.swatch {
  aspect-ratio: 1.4;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}
.swatch[data-surface="action"]  { background: var(--bg-hover); cursor: pointer; }
.swatch[data-surface="input"]   { background: var(--surface-default); border-color: var(--border-default); }
.swatch[data-surface="display"] { background: var(--surface-default); }
.swatch[data-surface="overlay"] { background: var(--surface-overlay); box-shadow: var(--shadow-lg); }
.swatch[data-surface="ghost"]   { background: transparent; }

.toneSwatch {
  aspect-ratio: 1.4;
  border-radius: 8px;
}
.toneSwatch[data-tone="accent"]  { background: var(--tone-primary-base); }
.toneSwatch[data-tone="danger"]  { background: var(--tone-destructive-base); }
.toneSwatch[data-tone="success"] { background: var(--tone-success-base); }
.toneSwatch[data-tone="warning"] { background: var(--tone-warning-base); }
.toneSwatch[data-tone="neutral"] { background: var(--bg-hover); }

/* ── Spacing bars ── */

.spacingLabel { min-width: 36px; text-align: right; }
.spacingBar {
  height: 12px;
  background: var(--tone-primary-base);
  border-radius: 4px;
}
.spacingBar[data-size="xs"] { width: var(--space-xs); }
.spacingBar[data-size="sm"] { width: var(--space-sm); }
.spacingBar[data-size="md"] { width: var(--space-md); }
.spacingBar[data-size="lg"] { width: var(--space-lg); }
.spacingBar[data-size="xl"] { width: var(--space-xl); }

/* ── Typography rows ── */

.typeRow { padding: var(--space-md) 0; border-bottom: 1px solid var(--border-subtle); }
.typeRow:first-child { padding-top: 0; }

/* ── Buttons hover state (pseudo-class, ax() 불가) ── */

.hovered { background: var(--_bg-hover, var(--bg-hover)) !important; }

/* ── Alerts tone border (동적 tone 참조) ── */

.alert { border-radius: 8px; }
.alert[data-tone="success"] { border-left: 3px solid var(--tone-success-base); }
.alert[data-tone="accent"]  { border-left: 3px solid var(--tone-primary-base); }
.alert[data-tone="warning"] { border-left: 3px solid var(--tone-warning-base); }
.alert[data-tone="danger"]  { border-left: 3px solid var(--tone-destructive-base); }

/* ── Card image placeholder ── */

.cardImage {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, var(--surface-raised), var(--surface-overlay));
  border-radius: 8px;
}

/* ── Layout showcase ── */

.layoutBox {
  min-height: 80px;
  border: 1px dashed var(--border-default);
  border-radius: 8px;
}
.layoutChild {
  width: 24px;
  height: 24px;
  background: var(--tone-primary-base);
  border-radius: 4px;
  flex-shrink: 0;
}
```

## `src/pages/viewer/PageViewer.module.css` (     116줄)

```css
/* ═══════════════════════════════════════════
   Viewer — refined-documentation style
   Design Spec: docs/superpowers/specs/2026-03-19-viewer-app-design.md
   ═══════════════════════════════════════════ */

/* --- Viewer layout --- */

.vw-loading {
  gap: var(--space-sm);
  height: 100svh;
}

.vw-loading__spinner {
  animation: vw-spin 1.2s linear infinite;
  opacity: 0.4;
}

@keyframes vw-spin {
  to { transform: rotate(360deg); }
}

/* --- Shared header bar --- */


/* --- Rec button --- */

.vw-rec {
  gap: var(--space-xs);
  background: var(--surface-base);
  border: 1px solid var(--border-default);
  border-radius: var(--shape-xs-radius);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  transition: all 0.15s;
}

.vw-rec:hover {
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.vw-rec__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: background 0.15s;
}

.vw-rec--active {
  background: var(--tone-destructive-base);
  border-color: var(--tone-destructive-base);
  color: var(--text-bright);
}

.vw-rec--active .vw-rec__dot {
  background: var(--text-bright);
  animation: vw-pulse 1s ease-in-out infinite;
}

@keyframes vw-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* --- Tree panel (sidebar) --- */

.vw-tree {
  background: var(--surface-sunken);
}

/* vw-tree__header — orphan, PanelHeader 사용 */


.vw-tree__body {
  padding: var(--space-xs) 0;
}

.vw-tree__chevron {
  width: var(--icon-xs);
}


/* --- Content panel --- */

.vw-content {
  background: var(--surface-default);
}

/* vw-content__header — orphan, PanelHeader 사용 */

.vw-content__meta {
  gap: var(--space-xs);
}

.vw-content__meta svg {
  margin-right: var(--space-xs);
  opacity: 0.45;
}

.vw-content__meta-sep {
  width: 1px;
  height: 10px;
  background: var(--border-default);
  margin: 0 var(--space-xs);
}


/* --- Empty state --- */

.vw-empty {
  gap: var(--space-md);
}

.vw-empty__icon {
  opacity: 0.2;
}
```

## `src/pages/viewer/TimelineColumn.module.css` (     328줄)

```css
/* TimelineColumn */

.tc {
  min-width: 280px;
  background: var(--surface-default);
  border-right: 1px solid var(--border-subtle);
}

/* Header */

.tcHeader {
  gap: var(--space-sm);
  height: 32px;
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
}

.tcLabel {
  color: var(--text-muted);
}

.tcHeaderIdle {
  background: color-mix(in srgb, var(--tone-success-base) 12%, transparent);
}

.tcHeaderStatus {
  color: var(--text-muted);
}

.tcHeaderIdle .tcHeaderStatus {
  color: var(--tone-success-base);
}

.tcLive {
  color: var(--tone-success-base);
  font-size: 6px;
  animation: pulse 2s ease-in-out infinite;
}

.tcIdle {
  color: var(--tone-success-base);
  font-size: 6px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.tcClose {
  margin-left: auto;
  width: var(--icon-lg);
  height: var(--icon-lg);
  background: none;
  border-radius: var(--shape-xs-radius);
  color: var(--text-muted);
}

.tcClose:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Body */

.tcBody {
  padding-bottom: 80px;
}

.tcEmpty {
  padding: var(--space-xl) var(--space-lg);
  color: var(--text-muted);
}

.tcLoading {
  gap: var(--space-sm);
  padding: var(--space-2xl) var(--space-lg);
  color: var(--text-muted);
}

.tcLoadingSpinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Items — grid: icon | text */

.tcItem {
  grid-template-columns: var(--icon-sm) 1fr;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  max-width: 720px;
}

.tcIcon {
  width: var(--icon-sm);
  height: var(--icon-sm);
  color: var(--text-muted);
}

.tcText {
  word-break: break-word;
}

/* File (clickable) */

.tcFile:hover { background: var(--bg-hover); }

/* ─── Event types ─── */

/* User */
.tcUserWrap { padding-top: var(--space-xl); padding-left: 48px; }
.tcUser {
  width: fit-content;
  margin: 0 var(--space-sm) var(--space-sm) auto;
  padding: var(--shape-sm-py) var(--shape-sm-px);
  max-width: 720px;
  color: var(--text-primary);
  background: var(--tone-primary-dim);
  border-radius: var(--space-lg) var(--space-lg) var(--space-xs) var(--space-lg);
}

/* Assistant — no icon, text only */
.tcAssistant {
  display: block;
  padding: var(--space-xs) var(--space-md);
  line-height: var(--leading-relaxed);
  color: var(--text-primary);
  max-width: 720px;
}
.tcAssistant .tcText { white-space: normal; }

/* ─── Tool Group Card ─── */

.tcToolGroup {
  margin: var(--space-xs) var(--space-md);
  max-width: 696px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-xl-radius);
  background: var(--surface-base);
}

.tcToolRow {
  grid-template-columns: var(--icon-sm) 1fr;
  gap: var(--space-sm);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  line-height: var(--leading-snug);
  color: var(--text-secondary);
}

.tcToolDivider {
  border-bottom: 1px solid var(--border-subtle);
}

.tcToolRow.tcFile:hover { background: var(--bg-hover); }

/* Tools — icon color */
.tcEdit .tcIcon, .tcWrite .tcIcon { color: var(--tone-warning-base); }
.tcRead { color: var(--text-muted); }
.tcBash { font-family: var(--mono); }
.tcBash .tcIcon { color: var(--tone-success-base); }
.tcGrep, .tcGlob { color: var(--text-muted); }

/* ─── Code preview (Edit/Write rich preview) ─── */

.tcCodePreview {
  padding: var(--space-xs) var(--space-md);
  background: var(--surface-sunken);
  border-radius: 0 0 var(--shape-xl-radius) var(--shape-xl-radius);
  max-height: 160px;
}

.tcCodePreview pre {
  margin: 0;
  font-family: var(--mono);
  font-size: 11px;
  line-height: var(--leading-snug);
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
}

.tcCodeFade {
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-xs) var(--space-md);
  background: linear-gradient(transparent, var(--surface-sunken));
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-muted);
}

/* ─── Markdown reset ─── */

.tcText :global(*) {
  margin: 0;
  padding: 0;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  color: inherit;
}

/* ─── Markdown theme ─── */

/* Headings */
.tcText :global(h1),
.tcText :global(h2) {
  font-weight: var(--weight-semi);
  color: var(--text-bright);
  margin: 0.8em 0 0.3em;
  padding-bottom: 0.2em;
  border-bottom: 1px solid var(--border-subtle);
}
.tcText :global(h3),
.tcText :global(h4),
.tcText :global(h5),
.tcText :global(h6) {
  font-weight: var(--weight-semi);
  color: var(--text-bright);
  margin: 0.6em 0 0.2em;
}
.tcText :global(h1):first-child,
.tcText :global(h2):first-child,
.tcText :global(h3):first-child {
  margin-top: 0;
}

/* Text */
.tcText :global(p) + :global(p) { margin-top: 0.5em; }
.tcText :global(strong) { font-weight: var(--weight-semi); color: var(--text-bright); }
.tcText :global(em) { font-style: italic; }

/* Lists */
.tcText :global(ul), .tcText :global(ol) { padding-left: 1.3em; margin: 0.3em 0; }
.tcText :global(li) { margin: 0.15em 0; }
.tcText :global(li)::marker { color: var(--text-muted); }

/* Code block */
.tcText :global(pre) {
  margin: 0.5em 0;
  padding: 0.5em 0.7em;
  background: var(--surface-base);
  border: 1px solid var(--border-subtle);
  border-radius: var(--shape-md-radius);
  overflow-x: auto;
  font-family: var(--mono);
  font-size: 0.85em;
  line-height: var(--leading-snug);
  white-space: pre;
}

/* Inline code */
.tcText :global(code) {
  font-family: var(--mono);
  font-size: var(--type-caption-size);
  color: var(--tone-primary-hover);
  background: var(--tone-primary-dim);
  padding: var(--shape-xs-py) var(--shape-xs-px);
  border-radius: var(--shape-xs-radius);
}
.tcText :global(pre) :global(code) {
  color: inherit;
  background: none;
  padding: 0;
}

/* Table */
.tcText :global(table) { border-collapse: collapse; width: 100%; margin: 0.4em 0; }
.tcText :global(th) { padding: 0.3em 0.5em; border-bottom: 2px solid var(--border-default); font-weight: var(--weight-semi); color: var(--text-bright); text-align: left; }
.tcText :global(td) { padding: 0.25em 0.5em; border-bottom: 1px solid var(--border-subtle); text-align: left; }

/* Block elements */
.tcText :global(blockquote) { margin: 0.3em 0; padding-left: 0.7em; border-left: 3px solid var(--tone-primary-base); color: var(--text-secondary); }
.tcText :global(hr) { margin: 0.5em 0; border: none; border-top: 1px solid var(--border-default); }
.tcText :global(img) { max-width: 100%; border-radius: var(--shape-xs-radius); }
.tcText :global(a) { color: var(--tone-primary-base); }

/* File path link */
.tcFilePath {
  color: var(--tone-primary-base);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 2px;
  transition: text-decoration-color 0.15s;
}
.tcFilePath:hover {
  text-decoration-color: var(--tone-primary-base);
}

/* Chat input */

.tcInput {
  gap: 0;
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--border-subtle);
}

.tcInput textarea {
  flex: 1;
  resize: none;
  border: 1px solid var(--border-default);
  border-radius: var(--shape-xl-radius);
  padding: var(--shape-xl-py) var(--shape-xl-px);
  font-size: var(--type-body-size);
  line-height: var(--leading-snug);
  font-family: inherit;
  background: var(--surface-base);
  color: var(--text-primary);
  outline: none;
  max-height: 120px;
}

.tcInput textarea:focus {
  border-color: var(--tone-primary-base);
}

.tcInput textarea::placeholder {
  color: var(--text-muted);
}
```

---

**총 53파일, 4335줄**

#kind/note #topic/design
