var e=`// ② 2026-04-04-command-binding-registry-prd.md

import type { BindingEntry } from '../engine/types'
export type { BindingEntry }

const entries: BindingEntry[] = []

/** Register a binding. Idempotent — duplicate tuples are ignored. */
export function registerBinding(entry: BindingEntry): void {
  const dup = entries.find(
    e => e.command === entry.command && e.nodeId === entry.nodeId && e.input === entry.input,
  )
  if (!dup) entries.push(entry)
}

/** Unregister all bindings for a given nodeId */
export function unregisterBindings(nodeId: string | null): void {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].nodeId === nodeId) entries.splice(i, 1)
  }
}

/** Unregister a specific binding tuple */
export function unregisterBinding(entry: BindingEntry): void {
  const idx = entries.findIndex(
    e => e.command === entry.command && e.nodeId === entry.nodeId && e.input === entry.input,
  )
  if (idx !== -1) entries.splice(idx, 1)
}

/** Query bindings by node — "what commands does this node trigger?" */
export function byNode(nodeId: string | null): readonly BindingEntry[] {
  return entries.filter(e => e.nodeId === nodeId)
}

/** Query bindings by command — "which elements trigger this command?" */
export function byCommand(command: string): readonly BindingEntry[] {
  return entries.filter(e => e.command === command)
}

/** Get all registered bindings (for inspector) */
export function getAllBindings(): readonly BindingEntry[] {
  return entries
}

/** Clear all bindings (for testing) */
export function clearAllBindings(): void {
  entries.length = 0
}
`;export{e as default};