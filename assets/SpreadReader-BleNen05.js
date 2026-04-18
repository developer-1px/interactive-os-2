var e=`@layer component {
/* SpreadReader — last-mile: column layout, transform, break-inside */

.spread-root {
  --_col-width: var(--overlay-width);
  --_col-gap: var(--space-3xl);
  --_padding-x: var(--space-5xl);
  --_padding-y: var(--space-5xl);
}

.spread-inset {
  padding: var(--_padding-y) var(--_padding-x);
}

.spread-columns {
  height: 100%;
  columns: var(--_col-width) 2;
  column-gap: var(--_col-gap);
  column-fill: balance;
  transform: translateX(calc(-1 * var(--_spread, 0) * (100% + var(--_col-gap))));
}

.spread-columns :is(pre, table, blockquote, figure, ul, ol) {
  break-inside: avoid;
}

.spread-columns :is(th) {
  background: var(--surface-sunken);
}

.spread-columns > div {
  padding: 0;
  max-width: none;
}

.spread-indicator {
  z-index: 20;
}
}
`;export{e as default};