var e=`/* ═══════════════════════════════════════════
   Book Viewer — last-mile CSS only
   ═══════════════════════════════════════════ */

.book {
  --_page-col-width: var(--overlay-width);
  --_page-col-gap: var(--space-3xl);
  --_progress-height: var(--indicator-width);
  --_chrome-duration: 600ms;
  --_chrome-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Floating pill — chrome visibility ── */

.book-pill {
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--_chrome-duration) var(--_chrome-easing);
}

.book-pill[data-visible="true"] {
  opacity: 1;
  pointer-events: auto;
}

/* ── Progress bar ── */

.book-progress-bar {
  height: var(--_progress-height);
  background: var(--surface-sunken);
}

.book-progress-fill {
  width: var(--progress, 0%);
  height: 100%;
  background: var(--tone-primary-base);
  transition: width var(--motion-normal-duration) var(--motion-normal-easing);
}

/* ── TOC item indent ── */

.book-toc-panel [data-indent] {
  padding-left: var(--space-xl);
}

/* ── Page spread layout ── */

.book-page-area {
  min-width: 0;
}

.book-page {
  height: 100%;
  columns: var(--_page-col-width) 2;
  column-gap: var(--_page-col-gap);
  column-fill: balance;
  transform: translateX(calc(-1 * var(--_spread, 0) * (100% + var(--_page-col-gap))));
}

.book-page pre,
.book-page table,
.book-page blockquote,
.book-page figure,
.book-page ul,
.book-page ol {
  break-inside: avoid;
  max-width: 100%;
  overflow-x: auto;
}

.book-page th {
  background: var(--surface-sunken);
}

.book-page > div {
  padding: 0;
  max-width: none;
}

`;export{e as default};