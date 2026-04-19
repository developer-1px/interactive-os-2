/** Key Line — demo 수집 (role은 DOM rl-* 클래스가 SSOT) */
import { lazy, type ComponentType } from 'react'

export type DemoModule = { Demo: ComponentType; meta: { slug: string; category: string; label: string } }

export interface DemoEntry {
  path: string
  label: string
  Component: ComponentType
}

export const ROLE_ORDER = ['control', 'control-group', 'item', 'badge', 'utility'] as const
export type RoleKey = typeof ROLE_ORDER[number]

const demoModules = import.meta.glob<DemoModule>(
  '/src/interactive-os/ui/**/*.demo.tsx',
  { eager: false },
)

export function buildDemoEntries(): DemoEntry[] {
  const entries: DemoEntry[] = []
  for (const [path, loader] of Object.entries(demoModules)) {
    const label = (path.split('/').pop() ?? '').replace('.demo.tsx', '')
    const LazyDemo = lazy(async () => ({ default: (await loader()).Demo }))
    entries.push({ path, label, Component: LazyDemo })
  }
  return entries.sort((a, b) => a.label.localeCompare(b.label))
}

export function extractRole(root: Element): RoleKey {
  const el = root.querySelector('[class*="rl-"]')
  if (!el) return 'utility'
  const m = el.className.match(/\brl-(control-group|control|item|badge)\b/)
  return (m?.[1] as RoleKey | undefined) ?? 'utility'
}
