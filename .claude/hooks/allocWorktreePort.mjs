#!/usr/bin/env node
import { readRegistry } from './worktreeRegistry.mjs'

const BASE = 5174
const RANGE = 30

function hashBranch(branch) {
  let h = 2166136261
  for (let i = 0; i < branch.length; i++) {
    h ^= branch.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % RANGE
}

export function allocPort(branch) {
  const used = new Set(readRegistry().map((e) => e.port))
  if (branch) {
    const preferred = BASE + hashBranch(branch)
    if (!used.has(preferred)) return preferred
  }
  let p = BASE
  while (used.has(p)) p++
  return p
}
