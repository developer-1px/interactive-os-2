var e=`/** Key Line 분류 — 타입, 상수, demo 수집, 측정 유틸 */
import { lazy, type ComponentType } from 'react'
import keylineMap from './keylineMap.json'

// ── types ──

export type KeylineEntry = { level: string; role?: string; content?: string | null }
export type KMap = Record<string, KeylineEntry>

export type DemoModule = { Demo: ComponentType; meta: { slug: string; category: string; label: string } }

const demoModules = import.meta.glob<DemoModule>(
  '/src/interactive-os/ui/**/*.demo.tsx',
  { eager: false },
)

export interface DemoEntry {
  path: string
  label: string
  level: string
  role: string | null
  Component: ComponentType
}

// ── 상수 ──

export const ROLE_EXPECTED: Record<string, number> = {
  control: 36,
  'control-group': 36,
  item: 28,
}

export const ROLE_ORDER = ['control', 'control-group', 'item', 'badge'] as const
export const LEVEL_ORDER = ['indicator', 'cell', 'orchestrator', 'composite', 'panel', 'standalone', 'unknown'] as const
export const TOLERANCE = 1

const KEYLINE_LEVELS = new Set(['atom', 'item'])

// ── demo 수집 ──

export function buildDemoEntries(): DemoEntry[] {
  const entries: DemoEntry[] = []
  const kmap = keylineMap as KMap
  for (const [path, loader] of Object.entries(demoModules)) {
    const label = (path.split('/').pop() ?? '').replace('.demo.tsx', '')
    const mapping = kmap[label]
    const LazyDemo = lazy(async () => {
      const mod = await loader()
      return { default: mod.Demo }
    })
    entries.push({
      path,
      label,
      level: mapping?.level ?? 'unknown',
      role: mapping?.role ?? null,
      Component: LazyDemo,
    })
  }
  return entries.sort((a, b) => a.label.localeCompare(b.label))
}

// ── 판정 ──

export function isKeylineTarget(entry: DemoEntry): boolean {
  return KEYLINE_LEVELS.has(entry.level) && entry.role != null
}

// ── 유틸 ──

export function mostCommon(nums: number[]): number {
  const freq = new Map<number, number>()
  for (const n of nums) freq.set(n, (freq.get(n) ?? 0) + 1)
  let best = nums[0]
  let bestCount = 0
  for (const [n, c] of freq) {
    if (c > bestCount) { best = n; bestCount = c }
  }
  return best
}

export function measureLeadingX(container: HTMLElement): number | null {
  const el = container.querySelector('[class*="ia-"]') ?? container.querySelector('[class*="rl-"]')
  if (!el) return null
  const children = el.children
  if (children.length === 0) return Math.round(el.getBoundingClientRect().left)
  return Math.round(children[0].getBoundingClientRect().left)
}
`;export{e as default};