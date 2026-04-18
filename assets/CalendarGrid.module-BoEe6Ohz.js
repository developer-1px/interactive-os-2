var e=`/* CalendarGrid — last-mile: CSS grid 7열 + subgrid rows (Grid.module.css 패턴) */

.grid {
  display: grid;
  grid-template-columns: repeat(7, var(--control-height));
}

/* row — subgrid span */
/* stylelint-disable-next-line selector-pseudo-class-no-unknown */
.grid > [role="row"] {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: 1 / -1;
}
`;export{e as default};