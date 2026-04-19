// Playground 카탈로그 — src/interactive-os/ui/ 의 모든 *.demo.tsx 를 자동 수집.
// 그룹은 파일의 ui/ 하위 폴더명으로 파생 (indicators/, items/, cells/, panels/, composites/ 등).
// 폴더 없이 ui/ 바로 밑에 있는 데모는 'Components' 그룹.
import { demoRegistry, type DemoEntry } from '../creator/demoRegistry'

export interface CatalogEntry {
  widget: string
  label: string
  category: string
}

const FOLDER_PATTERN = /\/ui\/([^/]+)\/[^/]+\.demo\.tsx$/

const CATEGORY_LABEL: Record<string, string> = {
  indicators: 'Indicators',
  items:      'Items',
  cells:      'Cells',
  panels:     'Panels',
  composites: 'Composites',
  JsonEditor: 'Json Editor',
}

function categoryOf(path: string): string {
  const match = FOLDER_PATTERN.exec(path)
  const folder = match?.[1]
  if (!folder) return 'Components'
  return CATEGORY_LABEL[folder] ?? folder
}

export const PLAYGROUND_CATALOG: readonly CatalogEntry[] = demoRegistry.map((e: DemoEntry) => ({
  widget: e.name,
  label: e.name,
  category: categoryOf(e.path),
}))

/** 카테고리 표기 순서 — Components(root)를 앞에, 서브 폴더는 뒤로. */
const CATEGORY_ORDER = ['Components', 'Composites', 'Panels', 'Items', 'Cells', 'Indicators', 'Json Editor']

export function groupCatalog(entries: readonly CatalogEntry[]): Array<[string, CatalogEntry[]]> {
  const map = new Map<string, CatalogEntry[]>()
  for (const e of entries) {
    const arr = map.get(e.category) ?? []
    arr.push(e)
    map.set(e.category, arr)
  }
  return [...map.entries()].sort(([a], [b]) => {
    const ia = CATEGORY_ORDER.indexOf(a)
    const ib = CATEGORY_ORDER.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}
