var e=`@layer component {
/* Spinbutton — group focus ring, button borders, value sizing */
.spinbutton-group {
  transition: border-color var(--motion-instant-duration) var(--motion-instant-easing),
              outline-color var(--motion-instant-duration) var(--motion-instant-easing);
}

[data-focused] .spinbutton-group {
  border-color: var(--tone-primary-base);
  outline: var(--_ring-spread) solid var(--tone-primary-base);
}

.spinbutton-group[data-invalid] {
  border-color: var(--tone-destructive-base);
  outline: var(--_ring-spread) solid var(--tone-destructive-base);
}

.spinbutton-btn {
  width: var(--_btn-w);

  --_bg: var(--bg-hover);
  --_bg-hover: var(--bg-active);

  background: var(--_bg);
  font-weight: var(--weight-regular);
  transition: background var(--motion-instant-duration) var(--motion-instant-easing);
}
.spinbutton-btn-dec { border-right: var(--border-width) solid var(--border-default); }
.spinbutton-btn-inc { border-left: var(--border-width) solid var(--border-default); }

.spinbutton-value {
  min-width: var(--_value-min-w);
  padding: var(--space-sm) var(--space-md);
}

.spinbutton-input {
  width: var(--_value-min-w);
  padding: var(--space-sm) var(--space-sm);
}
.spinbutton-input::placeholder { color: var(--text-muted); }
}
`;export{e as default};