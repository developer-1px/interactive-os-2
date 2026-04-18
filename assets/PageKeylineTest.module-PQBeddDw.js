var e=`/* Key Line Test — last-mile only (ax() 축에 없는 CSS) */
/* Inspector CSS moved to src/styles/inspect.css (global body.inspect) */

/* ── Raw row: 부품 나란히 ── */
.rawRow {
  flex-wrap: wrap;
}

/* 같은 role인데 높이가 다른 요소 — 빨간 outline */
.mismatch {
  outline: 3px solid rgba(255, 40, 40, 0.9);
  outline-offset: 2px;
}

/* ── Vertical keyline ── */

/* vertical mismatch — leading 또는 trailing이 어긋난 요소 */
.vMismatch {
  outline: 2px solid rgba(255, 40, 40, 0.7);
  outline-offset: -1px;
}

/* ── Offscreen: 측정용 숨김 렌더링 ── */
.offscreen {
  max-height: 0;
  visibility: hidden;
}

/* ── Height groups: 그룹 헤더가 줄바꿈 강제 ── */
.groupBreak {
  flex-basis: 100%;
}
`;export{e as default};