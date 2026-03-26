/**
 * 레이어 의존 방향 검증 스크립트
 *
 * interactive-os/ 내 import를 파싱하여
 * "위로 가는 import" (낮은 레이어 → 높은 레이어)를 감지한다.
 *
 * Usage: node scripts/checkLayerDeps.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const OS_DIR = join(ROOT, 'src/interactive-os')

// L1→L7 순서. 숫자가 낮을수록 하위 레이어.
const LAYER_ORDER = {
  store: 1,
  engine: 2,
  axis: 3,
  pattern: 4,
  plugins: 5,
  primitives: 6,
  ui: 7,
  misc: 5,       // misc = plugins 동급
  __tests__: 99,  // 테스트는 모든 레이어 접근 허용
}

function getLayer(filePath) {
  const rel = relative(OS_DIR, filePath)
  const top = rel.split('/')[0]
  return LAYER_ORDER[top] ?? null
}

function getLayerName(filePath) {
  const rel = relative(OS_DIR, filePath)
  return rel.split('/')[0]
}

// 재귀적으로 .ts/.tsx 파일 수집
function collectFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectFiles(full))
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      results.push(full)
    }
  }
  return results
}

// import 구문 파싱 (정적 import만)
const IMPORT_RE = /(?:import|from)\s+['"]([^'"]+)['"]/g

function extractImports(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const imports = []
  let match
  while ((match = IMPORT_RE.exec(content)) !== null) {
    const specifier = match[1]
    // 상대 경로 import만 관심
    if (specifier.startsWith('.')) {
      imports.push(specifier)
    }
  }
  return imports
}

function resolveImportLayer(fromFile, importSpec) {
  const dir = dirname(fromFile)
  // import 대상의 절대 경로 추정
  let target = join(dir, importSpec)
  // OS_DIR 밖으로 나가면 무시
  if (!target.startsWith(OS_DIR)) return null
  return getLayer(target)
}

function resolveImportLayerName(fromFile, importSpec) {
  const dir = dirname(fromFile)
  let target = join(dir, importSpec)
  if (!target.startsWith(OS_DIR)) return null
  return getLayerName(target)
}

// 허용된 역참조 (구조적으로 필요한 것)
// 형식: "fromLayer→toLayer" 또는 구체적 "fromDir→toDir"
const ALLOWED = new Set([
  // engine이 plugin 타입 인터페이스를 알아야 함
  'engine→plugins/types',
  // getVisibleNodes가 expand 상태를 읽어야 함
  'engine→axis',
  // createPatternContext가 선택적 plugin의 commands 사용
  'pattern→plugins/spatial',
  'pattern→plugins/rename',
  // APG examples가 선택적 plugin 사용 (edit, combobox)
  'pattern/examples→plugins',
  // getVisibleNodes가 search 필터 사용
  'engine→plugins/search',
])

function isAllowed(fromFile, toSpec) {
  const fromRel = relative(OS_DIR, fromFile)
  const fromDir = fromRel.split('/').slice(0, fromRel.includes('examples') ? 2 : 1).join('/')
  const toDir = toSpec.replace(/^(\.\.\/)+/, '').replace(/\/[^/]+$/, '')
  const key1 = `${fromDir}→${toDir}`
  const key2 = `${fromDir.split('/')[0]}→${toDir}`
  return ALLOWED.has(key1) || ALLOWED.has(key2)
}

// --- Main ---
const files = collectFiles(OS_DIR)
const violations = []

for (const file of files) {
  const fromLayer = getLayer(file)
  if (fromLayer === null || fromLayer === 99) continue // 테스트 스킵

  const imports = extractImports(file)
  for (const spec of imports) {
    const toLayer = resolveImportLayer(file, spec)
    if (toLayer === null || toLayer === 99) continue

    if (toLayer > fromLayer) {
      const fromName = getLayerName(file)
      const toName = resolveImportLayerName(file, spec)
      violations.push({
        file: relative(ROOT, file),
        from: `L${fromLayer} ${fromName}`,
        to: `L${toLayer} ${toName}`,
        import: spec,
      })
    }
  }
}

if (violations.length === 0) {
  console.log('✅ 레이어 의존 방향 정상 — 역참조 0개')
  process.exit(0)
} else {
  console.log(`❌ 역참조 ${violations.length}개 발견:\n`)
  for (const v of violations) {
    console.log(`  ${v.file}`)
    console.log(`    ${v.from} → ${v.to}  (import '${v.import}')`)
    console.log()
  }
  process.exit(1)
}
