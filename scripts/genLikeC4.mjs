#!/usr/bin/env node
/**
 * 폴더 구조 → LikeC4 (.c4) 자동 생성
 *
 * Usage: node scripts/genLikeC4.mjs [rootDir] [outFile]
 *   rootDir  — 스캔 대상 (기본: src/interactive-os)
 *   outFile  — 출력 파일 (기본: architecture.c4)
 */

import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'

const ROOT = process.argv[2] || 'src/interactive-os'
const OUT = process.argv[3] || 'architecture.c4'
const PROJECT_ROOT = new URL('..', import.meta.url).pathname

const abs = (p) => join(PROJECT_ROOT, p)

// ── 설정 ──────────────────────────────────────────────
const LAYER_ORDER = ['store', 'engine', 'axis', 'pattern', 'plugins', 'primitives', 'ui']
const LAYER_DESC = {
  store: 'NormalizedData + Command 불변 업데이트',
  engine: 'Command 실행/undo/redo, Plugin 합성',
  axis: 'ARIA 표준 축 (navigate/select/expand/…)',
  pattern: 'APG 패턴 합성 (composePattern)',
  plugins: 'definePlugin — history/crud/clipboard/…',
  primitives: 'React 바인딩 (useAria, useAriaZone)',
  ui: '완성품 컴포넌트 (TreeGrid, ListBox, …)',
}

// 레이어 의존 방향 (하위 → 상위)
const LAYER_DEPS = [
  ['ui', 'primitives'],
  ['primitives', 'pattern'],
  ['primitives', 'engine'],
  ['pattern', 'axis'],
  ['axis', 'engine'],
  ['engine', 'store'],
  ['plugins', 'engine'],
]

// ── 헬퍼 ──────────────────────────────────────────────
function scanModules(dir) {
  try {
    return readdirSync(dir)
      .filter((f) => {
        const full = join(dir, f)
        const stat = statSync(full)
        // .ts/.tsx 파일 → 모듈, 디렉토리 → 하위 그룹
        if (stat.isDirectory()) return !f.startsWith('_') && !f.startsWith('.')
        return /\.(ts|tsx)$/.test(f) && !f.startsWith('_') && f !== 'types.ts' && f !== 'index.ts'
      })
      .map((f) => {
        const full = join(dir, f)
        const isDir = statSync(full).isDirectory()
        const name = isDir ? f : f.replace(/\.(ts|tsx|css)$/, '')
        return { name, isDir, path: relative(PROJECT_ROOT, full) }
      })
  } catch {
    return []
  }
}

function toId(str) {
  // LikeC4 식별자: 알파벳/숫자/_만
  return str.replace(/[^a-zA-Z0-9]/g, '_').replace(/^(\d)/, '_$1')
}

function indent(n) {
  return '  '.repeat(n)
}

// ── 생성 ──────────────────────────────────────────────
const lines = []
const push = (depth, text) => lines.push(`${indent(depth)}${text}`)

// specification
push(0, 'specification {')
push(1, "element system {")
push(2, "style {")
push(3, "shape: rectangle")
push(3, "color: slate")
push(2, "}")
push(1, "}")
push(1, "element layer {")
push(2, "style {")
push(3, "shape: rectangle")
push(3, "color: blue")
push(2, "}")
push(1, "}")
push(1, "element module {")
push(2, "style {")
push(3, "shape: rectangle")
push(3, "color: sky")
push(2, "}")
push(1, "}")
push(1, "element component {")
push(2, "style {")
push(3, "shape: rectangle")
push(3, "color: muted")
push(2, "}")
push(1, "}")
push(0, '}')
push(0, '')

// model
push(0, 'model {')
push(1, `interactiveOS = system 'Interactive OS' {`)

for (const layer of LAYER_ORDER) {
  const dir = abs(join(ROOT, layer))
  const modules = scanModules(dir)
  const desc = LAYER_DESC[layer] || layer

  push(2, '')
  push(2, `${toId(layer)} = layer '${layer}' {`)
  push(3, `description '${desc}'`)

  // 모듈이 너무 많으면 (ui/) 디렉토리만 표시하거나 상위 n개만
  const MAX_CHILDREN = 30
  const shown = modules.slice(0, MAX_CHILDREN)

  for (const mod of shown) {
    if (mod.isDir) {
      const children = scanModules(join(dir, mod.name))
      if (children.length > 0) {
        push(3, `${toId(layer)}_${toId(mod.name)} = module '${mod.name}/' {`)
        push(4, `description '${children.length} files'`)
        for (const child of children.slice(0, 10)) {
          push(4, `${toId(layer)}_${toId(mod.name)}_${toId(child.name)} = component '${child.name}'`)
        }
        if (children.length > 10) {
          push(4, `// ... +${children.length - 10} more`)
        }
        push(3, '}')
      } else {
        push(3, `${toId(layer)}_${toId(mod.name)} = module '${mod.name}/'`)
      }
    } else {
      push(3, `${toId(layer)}_${toId(mod.name)} = component '${mod.name}'`)
    }
  }

  if (modules.length > MAX_CHILDREN) {
    push(3, `// ... +${modules.length - MAX_CHILDREN} more components`)
  }

  push(2, '}')
}

push(2, '')
push(2, '// ── 레이어 의존 관계 ──')
for (const [from, to] of LAYER_DEPS) {
  push(2, `${toId(from)} -> ${toId(to)}`)
}

push(1, '}')

// pages (별도 시스템으로)
const pagesDir = abs('src/pages')
const pageFolders = scanModules(pagesDir).filter((m) => m.isDir)

push(1, '')
push(1, `pages = system 'Pages' {`)
for (const folder of pageFolders) {
  push(2, `page_${toId(folder.name)} = layer '${folder.name}'`)
}
push(1, '}')
push(1, '')
push(1, 'pages -> interactiveOS')

push(0, '}')
push(0, '')

// views
push(0, 'views {')
push(1, '')
push(1, "view overview of interactiveOS {")
push(2, "title 'Interactive OS — Architecture'")
push(2, "include *")
push(1, "}")
push(1, '')

// 레이어별 상세 뷰
for (const layer of LAYER_ORDER) {
  push(1, `view ${toId(layer)}Detail of ${toId(layer)} {`)
  push(2, `title '${layer} layer'`)
  push(2, `include *`)
  push(1, '}')
  push(1, '')
}

push(0, '}')

// ── 출력 ──────────────────────────────────────────────
const outPath = abs(OUT)
writeFileSync(outPath, lines.join('\n') + '\n')
console.log(`✓ Generated ${OUT} (${lines.length} lines)`)
