var e=`@layer component {
/* DatePicker — border-radius splits, positioning */
.dp-input {
  padding-block: var(--shape-xs-py);
  padding-inline: var(--shape-sm-px);
  border-start-start-radius: var(--shape-xs-radius);
  border-end-start-radius: var(--shape-xs-radius);
  border-start-end-radius: 0;
  border-end-end-radius: 0;
  font-family: inherit;
}

.dp-trigger {
  padding-block: var(--shape-xs-py);
  padding-inline: var(--shape-xs-px);
  border-left: none;
  border-start-end-radius: var(--shape-xs-radius);
  border-end-end-radius: var(--shape-xs-radius);
  border-start-start-radius: 0;
  border-end-start-radius: 0;
}
.dp-dialog {
  padding-block-start: var(--space-xs);
}
.dp-nav-bar { padding-block-end: var(--space-sm); }

.dp-nav-btn {
  width: var(--icon-lg);
  height: var(--icon-lg);
  padding: 0;
}

.dp-actions {
  padding-block-start: var(--space-sm);
}
.dp-action-btn { font-family: inherit; }
}
`;export{e as default};