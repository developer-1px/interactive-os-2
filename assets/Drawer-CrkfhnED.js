var e=`/* Drawer — last-mile CSS (directional slide transforms that ax() motion can't express) */

.drawer-backdrop {
  z-index: 50;
}

.drawer-panel {
  z-index: 51;
  outline: none;
  overflow-y: auto;
}

/* Placement transforms */
.drawer-panel[data-placement="left"] {
  inset-block: 0;
  inset-inline-start: 0;
}

.drawer-panel[data-placement="right"] {
  inset-block: 0;
  inset-inline-end: 0;
}

.drawer-panel[data-placement="bottom"] {
  inset-inline: 0;
  inset-block-end: 0;
}

/* Size defaults (inline for left/right, block for bottom) */
.drawer-panel[data-placement="left"],
.drawer-panel[data-placement="right"] {
  width: var(--drawer-size, 20rem);
  max-width: 100vw;
}

.drawer-panel[data-placement="bottom"] {
  height: var(--drawer-size, 20rem);
  max-height: 100vh;
}

/* Size variants */
.drawer-panel[data-size="sm"] { --drawer-size: 16rem; }
.drawer-panel[data-size="md"] { --drawer-size: 24rem; }
.drawer-panel[data-size="lg"] { --drawer-size: 32rem; }
.drawer-panel[data-size="xl"] { --drawer-size: 48rem; }

/* Slide animations — ax() motion only has translateY; directional slides are last-mile */
@keyframes drawer-slide-from-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes drawer-slide-from-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes drawer-slide-from-bottom {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.drawer-panel[data-placement="left"]   { animation: drawer-slide-from-left 200ms ease-out both; }
.drawer-panel[data-placement="right"]  { animation: drawer-slide-from-right 200ms ease-out both; }
.drawer-panel[data-placement="bottom"] { animation: drawer-slide-from-bottom 200ms ease-out both; }
`;export{e as default};