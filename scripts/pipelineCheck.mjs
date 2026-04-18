#!/usr/bin/env node
/**
 * Pipeline Check — Stage 3 선언 ↔ Stage 5 실제 코드 정적 게이트
 *
 * Usage:
 *   node scripts/pipelineCheck.mjs todo
 *
 * 검사 항목:
 *   A. Stage 3 (3-components.json) 에 선언된 parts[].component 가 Stage 5 코드
 *      (src/pages/{sample}/*.tsx)에서 import 되었는가.
 *   B. Stage 5 코드에 role="list|listitem|tab|row|cell|option|radio|..." 수동 선언 0건.
 *   C. NormalizedData 우회 패턴: <div>.map() 에 role="list*" 조합.
 *
 * 출력:
 *   docs/research/pipeline/{sample}/5-assembly.check.md
 *   exit 0 = pass, 1 = fail
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const MANUAL_ARIA_ROLES = [
  'list', 'listitem', 'listbox', 'option',
  'tree', 'treeitem', 'treegrid', 'grid',
  'row', 'cell', 'gridcell', 'columnheader', 'rowheader',
  'menu', 'menuitem', 'menubar',
  'tablist', 'tab', 'tabpanel',
  'combobox', 'radiogroup', 'radio',
]

const main = () => {
  const [sample] = process.argv.slice(2)
  if (!sample) {
    console.error('Usage: node scripts/pipelineCheck.mjs <sample>')
    process.exit(1)
  }

  const declPath = resolve(process.cwd(), 'docs/research/pipeline', sample, '3-components.json')
  const srcDir = resolve(process.cwd(), 'src/pages', sample)
  const reportPath = resolve(process.cwd(), 'docs/research/pipeline', sample, '5-assembly.check.md')

  if (!existsSync(declPath)) {
    console.error(`✗ ${declPath} not found`)
    process.exit(1)
  }
  if (!existsSync(srcDir)) {
    console.error(`✗ ${srcDir} not found`)
    process.exit(1)
  }

  const decl = JSON.parse(readFileSync(declPath, 'utf8'))
  const declParts = (decl.parts ?? []).map((p) => ({
    role: p.role,
    component: p.component,
  }))

  // Gather all source content
  const tsxFiles = readdirSync(srcDir)
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => ({ file: f, content: readFileSync(resolve(srcDir, f), 'utf8') }))

  const joined = tsxFiles.map((s) => s.content).join('\n')

  // A. Declared ↔ Imported
  const aViolations = []
  for (const part of declParts) {
    // component can be "Button+CloseIndicator" style; split by non-alpha
    const names = part.component.split(/[^A-Za-z]+/).filter(Boolean)
    for (const name of names) {
      const importRegex = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from`)
      const barrelRegex = new RegExp(`from\\s+['"]@os\\/ui\\/${name}['"]`)
      const indicatorsBarrelRegex = /from\s+['"]@os\/ui\/indicators(?:\/\w+)?['"]/
      const indicatorsNs = name.endsWith('Indicator') && indicatorsBarrelRegex.test(joined) && importRegex.test(joined)
      const used = importRegex.test(joined) || barrelRegex.test(joined) || indicatorsNs
      if (!used) {
        aViolations.push({ role: part.role, component: name })
      }
    }
  }

  // B. Manual role="..."
  const bViolations = []
  const roleRe = new RegExp(`\\brole\\s*=\\s*["'](${MANUAL_ARIA_ROLES.join('|')})["']`, 'g')
  for (const src of tsxFiles) {
    let m
    while ((m = roleRe.exec(src.content)) !== null) {
      bViolations.push({ file: src.file, role: m[1] })
    }
  }

  // C. NormalizedData bypass heuristic: .map() 바로 안에 role="list*" 수동 선언
  const cViolations = []
  const mapBypass = /\.map\s*\(\s*\w+\s*=>\s*[\s\S]{0,200}?role\s*=\s*["'](listitem|option|treeitem|tab|row|gridcell|menuitem|radio)["']/g
  for (const src of tsxFiles) {
    if (mapBypass.test(src.content)) {
      cViolations.push({ file: src.file })
    }
  }

  const pass = aViolations.length === 0 && bViolations.length === 0 && cViolations.length === 0
  const now = new Date().toISOString()

  const lines = [
    `# Pipeline Check — ${sample}`,
    '',
    `- **Timestamp**: ${now}`,
    `- **Declared (Stage 3)**: ${declParts.length} parts`,
    `- **Source files (Stage 5)**: ${tsxFiles.map((s) => s.file).join(', ')}`,
    `- **Verdict**: ${pass ? '✅ PASS' : '❌ FAIL'}`,
    '',
    '## A. 선언 ↔ Import 일치',
    '',
    aViolations.length === 0
      ? '✅ 모든 Stage 3 선언 부품이 Stage 5 코드에 import 됨.'
      : `❌ 미import ${aViolations.length}건:\n\n${aViolations.map((v) => `  - **${v.component}** (role: ${v.role}) — Stage 3에서 선언했으나 import 없음`).join('\n')}`,
    '',
    '## B. 수동 ARIA role 선언',
    '',
    bViolations.length === 0
      ? '✅ role="..." 수동 선언 0건.'
      : `❌ 수동 role ${bViolations.length}건:\n\n${bViolations.map((v) => `  - \`${v.file}\` → role="${v.role}"`).join('\n')}\n\n→ 해당 role에 대응하는 ui/ 컴포넌트를 사용하세요 (ListBox, TreeView, TabList, Grid 등).`,
    '',
    '## C. NormalizedData 우회 패턴 (.map + manual role)',
    '',
    cViolations.length === 0
      ? '✅ .map() 내부 수동 role 선언 0건.'
      : `❌ 우회 패턴 ${cViolations.length}건:\n\n${cViolations.map((v) => `  - \`${v.file}\` — .map() 안에서 수동 role 선언 감지`).join('\n')}\n\n→ NormalizedData를 Aria 컴포넌트의 \`data\` prop에 주입하고 renderItem slot을 사용하세요.`,
    '',
    '## 파이프라인 의미',
    '',
    pass
      ? '이 게이트가 통과했다는 것은 Stage 3 선언과 Stage 5 구현이 **구조적으로 일치**함을 뜻합니다. 부품 누락 · 수동 ARIA · NormalizedData 우회 세 축이 모두 clean.'
      : '이 게이트 실패는 **Stage 3 → Stage 5 전이에서 정보가 손실됐음**을 뜻합니다. 선언한 계획을 구현이 배신했고, 훅이 없던 영역을 정적 검증으로 메꿔야 합니다.',
    '',
  ]

  writeFileSync(reportPath, lines.join('\n'))
  console.log(`  ${pass ? '✓' : '✗'} ${reportPath.replace(resolve(process.cwd()) + '/', '')}`)
  if (!pass) {
    console.log(`    A: ${aViolations.length} · B: ${bViolations.length} · C: ${cViolations.length}`)
  }

  process.exit(pass ? 0 : 1)
}

main()
