#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'

const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
export const REGISTRY_PATH = path.join(repoRoot, '.claude', 'worktrees.json')

export function readRegistry() {
  if (!existsSync(REGISTRY_PATH)) return []
  try { return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) } catch { return [] }
}

export function writeRegistry(entries) {
  writeFileSync(REGISTRY_PATH, JSON.stringify(entries, null, 2))
}

export function cleanStale() {
  const entries = readRegistry()
  const alive = entries.filter((e) => existsSync(e.path)).map((e) => {
    if (e.dev_pid == null) return e
    try { process.kill(e.dev_pid, 0); return e } catch { return { ...e, dev_pid: null } }
  })
  writeRegistry(alive)
  return alive
}

export function findCurrent() {
  const cwd = process.cwd()
  const toplevel = (() => {
    try { return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim() } catch { return cwd }
  })()
  return readRegistry().find((e) => path.resolve(e.path) === path.resolve(toplevel)) ?? null
}

export function upsert(entry) {
  const entries = readRegistry().filter((e) => e.name !== entry.name)
  entries.push(entry)
  writeRegistry(entries)
}

export function remove(name) {
  writeRegistry(readRegistry().filter((e) => e.name !== name))
}
