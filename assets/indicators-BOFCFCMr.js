var e=`@layer component {
/* ═══════════════════════════════════════════
   Indicator part classes (item-indicator--* convention)
   ARIA attributes drive state — no JS class toggle needed.
   Root-level visual axes (surface/border/shape/size/motion) live on the
   TSX via ax(). This file holds only:
     - last-mile properties (transition, transform, pseudo-elements)
     - ARIA state-driven color overrides (aria-checked, aria-sort, etc.)
     - token-referenced structural values (all via var())
   Specificity 0 via :where() — ax() overrides freely.
   ═══════════════════════════════════════════ */

/* ── Chevron ── */

:where(.ax-interactive .item-chevron),
:where(details .item-chevron) {
  color: var(--text-muted);
  opacity: 0.65;
  transition: transform var(--motion-normal-duration) var(--motion-normal-easing);
}

:where(.ax-interactive .item-chevron--expand),
:where(details .item-chevron--expand) {
  min-width: var(--indicator-icon);
  width: var(--indicator-icon);
}

:where(.ax-interactive .item-chevron--tree) {
  min-width: var(--indicator-icon-lg);
  width: var(--indicator-icon-lg);
}

/* Expanded state: ARIA parent, data-expanded self, or details[open] drives rotation */
:where([aria-expanded="true"] > .item-chevron),
:where(.item-chevron[data-expanded]),
:where(details[open] > summary .item-chevron) {
  transform: rotate(90deg);
}

/* ── Checked indicators — shared checked-state color ──
   aria-checked="true" on parent drives all three variants.
   Concept: border → primary on check, inner marker appears. */

:where(.ax-interactive [aria-checked="true"]) :where(
  .item-indicator--checkbox,
  .item-indicator--radio,
  .item-indicator--switch
) {
  border-color: var(--tone-primary-base);
}

/* Checkbox + switch fill background on check */
:where(.ax-interactive [aria-checked="true"]) :where(
  .item-indicator--checkbox,
  .item-indicator--switch
) {
  background: var(--tone-primary-base);
}

/* ── Box sizes ── */

:where(.item-indicator--checkbox),
:where(.item-indicator--radio) {
  width: var(--indicator-box);
  height: var(--indicator-box);
}

:where(.item-indicator--switch) {
  width: var(--switch-width);
  height: var(--switch-height);
}

/* ── Inner markers — appear on check via scale(0→1) ── */

:where(.ax-interactive .item-indicator--checkbox-icon),
:where(.ax-interactive .item-indicator--radio-dot) {
  transform: scale(0);
  transition: transform var(--motion-instant-duration);
}

:where(.ax-interactive [aria-checked="true"] .item-indicator--checkbox-icon),
:where(.ax-interactive [aria-checked="true"] .item-indicator--radio-dot) {
  transform: scale(1);
}

/* Checkbox icon size + color */
:where(.ax-interactive .item-indicator--checkbox-icon) {
  width: var(--indicator-icon);
  height: var(--indicator-icon);
  color: var(--tone-primary-foreground);
}

/* Radio dot size + shape */
:where(.ax-interactive .item-indicator--radio-dot) {
  width: var(--space-sm);
  height: var(--space-sm);
  border-radius: 50%;
  background: var(--tone-primary-base);
}

/* ── Switch thumb — translateX instead of scale ── */

:where(.ax-interactive .item-indicator--switch-thumb) {
  top: var(--switch-thumb-inset);
  left: var(--switch-thumb-inset);
  width: calc(var(--switch-height) - 8px);
  height: calc(var(--switch-height) - 8px);
  border-radius: 50%;
  background: var(--text-secondary);
  transition: transform var(--motion-normal-duration) var(--motion-normal-easing),
              background var(--motion-normal-duration) var(--motion-normal-easing);
}

:where(.ax-interactive [aria-checked="true"] .item-indicator--switch-thumb) {
  background: var(--tone-primary-foreground);
  transform: translateX(calc(var(--switch-width) - var(--switch-height) + 2px));
}

/* ── Toggle text indicator (On/Off) ── */

:where(.ax-interactive .item-indicator--toggle) {
  color: var(--text-muted);
}

:where(.ax-interactive [aria-checked="true"] .item-indicator--toggle) {
  color: var(--tone-success-base);
}

/* ── ToggleGroup text indicator ── */

:where(.ax-interactive .item-indicator--toggle-group) {
  color: var(--text-muted);
}

/* selected override 제거: accent 미사용, 기본 muted 유지 */

/* ── Sort indicator ── */

:where(.ax-interactive .item-indicator--sort) {
  color: var(--text-muted);
}

:where(.ax-interactive [aria-sort="ascending"] .item-indicator--sort),
:where(.ax-interactive [aria-sort="descending"] .item-indicator--sort) {
  color: var(--text-primary);
}

/* ── Spinner indicator ──
   Animation via ax({ motion: 'spin' }).
   Size feeds SVG via font-size (Loader2 uses size="1em"). */

:where(.item-indicator--spinner) {
  color: var(--tone-primary-base);
}

:where(.item-indicator--spinner-sm) { font-size: var(--icon-sm); }
:where(.item-indicator--spinner-md) { font-size: var(--icon-md); }
:where(.item-indicator--spinner-lg) { font-size: var(--icon-lg, var(--space-2xl)); }

/* ── Progress indicator ──
   Shape/background ← ax() on TSX wrapper. Height is a bar thickness token. */

:where(.item-indicator--progress) {
  height: var(--space-xs);
  background: var(--surface-overlay);
}

:where(.item-indicator--progress-fill) {
  background: var(--tone-primary-base);
  border-radius: var(--shape-pill-radius);
  transition: width var(--motion-normal-duration) var(--motion-normal-easing);
}

/* ── Skeleton indicator ──
   Shape/background ← ax() on TSX wrapper (bg override via --_bg). */

@keyframes indicator-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

:where(.item-indicator--skeleton) {
  background: var(--indicator-skeleton-bg);
  background-size: 200% 100%;
  animation: var(--motion-indicator-shimmer, indicator-shimmer 1.5s ease-in-out infinite);
}

/* ── Status indicator ──
   Size/shape ← ax() on TSX. Tone-based color applied here. */

:where(.item-indicator--status-success) { background: var(--tone-success-base); }
:where(.item-indicator--status-error) { background: var(--tone-destructive-base); }
:where(.item-indicator--status-warning) { background: var(--tone-warning-base, #f59e0b); }
:where(.item-indicator--status-info) { background: var(--tone-primary-base); }

/* ── Page indicator (pagination dots) ──
   Dot size/shape ← ax() on TSX. */

:where(.item-indicator--page-dot) {
  background: var(--border-default);
  transition: background var(--motion-instant-duration);
}

:where(.item-indicator--page-dot-active) {
  background: var(--tone-primary-base);
}

/* ── Direction indicator ── */

:where(.item-indicator--direction) {
  color: var(--text-muted);
}

/* ── Step indicator ──
   Size/border/shape ← ax() on TSX wrapper. */

:where(.item-indicator--step) {
  width: var(--indicator-box);
  height: var(--indicator-box);
  font-weight: var(--weight-semi);
  color: var(--text-secondary);
}

:where(.item-indicator--step-completed) {
  background: var(--tone-primary-base);
  border-color: var(--tone-primary-base);
  color: var(--tone-primary-foreground);
}

/* ── Badge indicator ──
   Size/shape/padding/background ← ax() on TSX wrapper. */

:where(.item-indicator--badge) {
  color: var(--tone-primary-foreground);
  font-weight: var(--weight-semi);
  line-height: 1;
}

/* ── Overflow indicator ── */

:where(.item-indicator--overflow) {
  color: var(--text-muted);
}

/* ── Grip indicator ── */

:where(.item-indicator--grip) {
  color: var(--text-muted);
}

/* ── Tree connector ──
   Uses ::before/::after pseudo-elements (cannot carry ax() classes).
   Position/size via var()-wrapped tokens so guardCssAxes accepts them. */

:where(.item-indicator--tree-connector) {
  width: var(--space-lg);
}

:where(.item-indicator--tree-connector)::before {
  content: '';
  position: var(--pos-absolute);
  left: 50%;
  top: 0;
  bottom: 0;
  width: var(--indicator-hairline);
  background: var(--border-subtle);
}

:where(.item-indicator--tree-connector)::after {
  content: '';
  position: var(--pos-absolute);
  left: 50%;
  top: 50%;
  width: 50%;
  height: var(--indicator-hairline);
  background: var(--border-subtle);
}

:where(.item-indicator--tree-connector-last)::before {
  bottom: 50%;
}

/* ── Separator indicator ── */

:where(.item-indicator--separator) {
  background: var(--border-subtle);
}

:where(.item-indicator--separator[aria-orientation="horizontal"]),
:where(.item-indicator--separator:not([aria-orientation])) {
  height: var(--indicator-hairline);
}

:where(.item-indicator--separator[aria-orientation="vertical"]) {
  width: var(--indicator-hairline);
  align-self: stretch;
}

/* ── Active rail indicator (nav sidebar) ──
   Tokenized structural values so guardCssAxes accepts the var() forms. */

:where(.item-indicator--active-rail) {
  position: var(--pos-absolute);
  left: var(--indicator-active-rail-offset);
  top: 50%;
  transform: translateY(-50%);
  width: var(--indicator-active-rail-width);
  height: var(--indicator-active-rail-height);
  background: var(--tone-primary-base);
  border-radius: var(--indicator-active-rail-radius);
}
} /* @layer component */
`;export{e as default};