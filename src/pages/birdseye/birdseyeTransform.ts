// ② 2026-04-04-birdseye-mermaid-prd.md
import type { TreeNode } from '../viewer/fsClient'

const LAYER_ORDER = ['store', 'engine', 'axis', 'pattern', 'plugins', 'primitives', 'ui']
const LAYER_EDGES = [
  ['store', 'engine'],
  ['engine', 'axis'],
  ['axis', 'pattern'],
  ['engine', 'plugins'],
  ['pattern', 'primitives'],
  ['plugins', 'primitives'],
  ['primitives', 'ui'],
]

function findDir(nodes: TreeNode[], name: string): TreeNode | undefined {
  for (const n of nodes) {
    if (n.type === 'directory' && n.name === name) return n
    if (n.children) {
      const found = findDir(n.children, name)
      if (found) return found
    }
  }
  return undefined
}

function findOsRoot(nodes: TreeNode[]): TreeNode | undefined {
  return findDir(nodes, 'interactive-os')
}

function fileLabel(name: string): string {
  return name.replace(/\.(ts|tsx)$/, '')
}

function safeId(s: string): string {
  // Mermaid ID에 쓸 수 없는 문자 제거
  return s.replace(/[^a-zA-Z0-9_]/g, '_')
}

/** 알파벳 범주 그룹화 — 균등 분할 (그룹당 ~8개 목표) */
function alphabetGroup(sorted: TreeNode[]): { label: string; files: TreeNode[] }[] {
  const targetSize = 8
  const groups: { label: string; files: TreeNode[] }[] = []
  let i = 0
  while (i < sorted.length) {
    const startChar = fileLabel(sorted[i].name)[0].toUpperCase()
    const batch: TreeNode[] = []
    let endChar = startChar
    // targetSize까지 채우되, 같은 첫 글자는 끊지 않음
    while (i < sorted.length && (batch.length < targetSize || fileLabel(sorted[i].name)[0].toUpperCase() === endChar)) {
      endChar = fileLabel(sorted[i].name)[0].toUpperCase()
      batch.push(sorted[i])
      i++
    }
    const label = startChar === endChar ? startChar : `${startChar}–${endChar}`
    groups.push({ label, files: batch })
  }
  return groups
}

/** L1: 레이어 전체 조감 flowchart */
export function buildMermaidL1(tree: TreeNode[], direction: 'TB' | 'LR' = 'TB'): string {
  const os = findOsRoot(tree)
  if (!os?.children) return `flowchart ${direction}\n  empty["No interactive-os found"]`

  const lines: string[] = [`flowchart ${direction}`]

  for (const layerName of LAYER_ORDER) {
    // plugins는 engine/plugins 또는 plugins/ 둘 다 확인
    const dir = layerName === 'plugins'
      ? findDir(os.children, 'plugins') ?? findDir(os.children.find(c => c.name === 'engine')?.children ?? [], 'plugins')
      : os.children.find((c) => c.type === 'directory' && c.name === layerName)
    if (!dir?.children) continue

    lines.push(`  subgraph ${layerName} ["${layerName}"]`)
    lines.push(`    direction LR`)

    const files = dir.children.filter(
      (c) => c.type === 'file' && /\.(ts|tsx)$/.test(c.name) && !c.name.startsWith('_'),
    )
    // L1은 대표 5개만, 나머지는 ...N+ 표시
    const files5 = files.slice(0, 5)
    const ids: string[] = []
    for (const f of files5) {
      const label = fileLabel(f.name)
      const id = safeId(layerName + '_' + label)
      lines.push(`    ${id}["${label}"]`)
      ids.push(id)
    }
    if (files.length > 5) {
      const etcId = safeId(layerName + '_etc')
      lines.push(`    ${etcId}["...${files.length - 5}+"]`)
      ids.push(etcId)
    }
    // 가로 배치를 위한 invisible link chain
    if (ids.length > 1) {
      lines.push(`    ${ids.join(' ~~~ ')}`)
    }
    lines.push(`  end`)
  }

  for (const [from, to] of LAYER_EDGES) {
    lines.push(`  ${from} --> ${to}`)
  }

  return lines.join('\n')
}

/** L2: 레이어 내부 구조 flowchart — 모든 파일을 가로 배치 */
export function buildMermaidL2(tree: TreeNode[], layerName: string, direction: 'TB' | 'LR' = 'TB'): string | null {
  const os = findOsRoot(tree)
  if (!os?.children) return null

  const dir = layerName === 'plugins'
    ? findDir(os.children, 'plugins') ?? findDir(os.children.find(c => c.name === 'engine')?.children ?? [], 'plugins')
    : os.children.find((c) => c.type === 'directory' && c.name === layerName)
  if (!dir?.children) return null

  const subdirs = dir.children.filter((c) => c.type === 'directory' && !c.name.startsWith('_') && !c.name.startsWith('.'))
  const topFiles = dir.children.filter((c) => c.type === 'file' && /\.(ts|tsx)$/.test(c.name) && !c.name.startsWith('_'))

  if (subdirs.length === 0 && topFiles.length === 0) return null

  // 하위 폴더가 있으면 그룹별 subgraph, 없으면 플랫 그리드
  const lines: string[] = [`flowchart ${direction}`]

  // 서브디렉토리를 subgraph로
  for (const sub of subdirs) {
    const subId = safeId(sub.name)
    lines.push(`  subgraph ${subId} ["${sub.name}"]`)
    lines.push(`    direction LR`)
    const files = (sub.children ?? []).filter(
      (c) => c.type === 'file' && /\.(ts|tsx)$/.test(c.name) && !c.name.startsWith('_'),
    )
    const ids: string[] = []
    for (const f of files.slice(0, 8)) {
      const label = fileLabel(f.name)
      const id = safeId(sub.name + '_' + label)
      lines.push(`    ${id}["${label}"]`)
      ids.push(id)
    }
    if (files.length > 8) {
      const etcId = safeId(sub.name + '_etc')
      lines.push(`    ${etcId}["...${files.length - 8}+"]`)
      ids.push(etcId)
    }
    if (ids.length > 1) {
      lines.push(`    ${ids.join(' ~~~ ')}`)
    }
    lines.push(`  end`)
  }

  // 최상위 파일 — 10개 이하면 플랫, 초과면 알파벳 범주 그룹화
  if (topFiles.length > 0) {
    const sorted = [...topFiles].sort((a, b) => fileLabel(a.name).localeCompare(fileLabel(b.name)))

    if (sorted.length <= 10) {
      if (subdirs.length > 0) {
        lines.push(`  subgraph root_files ["(root)"]`)
        lines.push(`    direction LR`)
      }
      const ids: string[] = []
      for (const f of sorted) {
        const label = fileLabel(f.name)
        const id = safeId('root_' + label)
        lines.push(subdirs.length > 0 ? `    ${id}["${label}"]` : `  ${id}["${label}"]`)
        ids.push(id)
      }
      if (ids.length > 1) {
        for (let i = 0; i < ids.length; i += 4) {
          const row = ids.slice(i, i + 4)
          if (row.length > 1) lines.push(subdirs.length > 0 ? `    ${row.join(' ~~~ ')}` : `  ${row.join(' ~~~ ')}`)
        }
      }
      if (subdirs.length > 0) lines.push(`  end`)
    } else {
      const groups = alphabetGroup(sorted)
      for (const g of groups) {
        const gid = safeId('alpha_' + g.label)
        lines.push(`  subgraph ${gid} ["${g.label}"]`)
        lines.push(`    direction LR`)
        const ids: string[] = []
        for (const f of g.files) {
          const label = fileLabel(f.name)
          const id = safeId('root_' + label)
          lines.push(`    ${id}["${label}"]`)
          ids.push(id)
        }
        if (ids.length > 1) {
          for (let i = 0; i < ids.length; i += 5) {
            const row = ids.slice(i, i + 5)
            if (row.length > 1) lines.push(`    ${row.join(' ~~~ ')}`)
          }
        }
        lines.push(`  end`)
      }
    }
  }

  return lines.join('\n')
}
