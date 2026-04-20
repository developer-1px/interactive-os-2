#!/usr/bin/env node
import { readRegistry } from './worktreeRegistry.mjs'

export function allocPort() {
  const used = new Set(readRegistry().map((e) => e.port))
  let p = 5173
  while (used.has(p)) p++
  return p
}
