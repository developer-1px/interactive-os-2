var e=`/* ── Session detail dialog ── */

.kanban-detail-dialog {
  width: min(480px, 90vw);
  height: min(85vh, 900px);
}

.kanban-detail-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

/* ── Agent state visual cues ── */

/* Active card: left accent border */
.kanban-card[data-agent-state="active"] {
  border-inline-start: 2px solid var(--focus);
}

/* Waiting card: accent outline */
.kanban-card[data-agent-state="waiting"] {
  outline: 1.5px solid var(--focus);
  outline-offset: -1.5px;
}

/* Done card: dimmed */
.kanban-card[data-agent-state="done"] {
  opacity: 0.6;
}

/* Stale card: warning tone */
.kanban-card[data-stale] {
  border-inline-start: 2px solid var(--tone-warning-base);
}
`;export{e as default};