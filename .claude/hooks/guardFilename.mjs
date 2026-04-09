#!/usr/bin/env node

/**
 * PreToolUse:Write hook — 파일명 관례 검증
 *
 * 규칙 1: kebab-case 금지 (camelCase 또는 PascalCase)
 * 규칙 2: pages/ 네이밍 관례
 *   - 진입점(라우트 컴포넌트): Page{Domain}.tsx (*Layout 금지)
 *   - Store: {domain}Store.ts
 *   - 변환: {domain}Transform.ts (Adapter 금지)
 *
 * 제외: 설정 파일, dotfile, node_modules, docs/, .css 파일(BEM 허용)
 */

import { readFileSync } from 'fs'
import { basename, extname } from 'path'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const filePath = input.tool_input?.file_path ?? ''

// 제외 대상
if (
  filePath.includes('node_modules') ||
  filePath.includes('/docs/') ||
  filePath.includes('/.') ||
  filePath.includes('/__tests__/') ||
  filePath.includes('.test.') ||
  filePath.includes('.spec.') ||
  filePath.includes('/package') ||
  filePath.includes('/tsconfig') ||
  filePath.includes('/vite.config') ||
  filePath.includes('/vitest.config') ||
  filePath.includes('_meta.yaml') ||
  filePath.includes('/scripts/')
) {
  process.exit(0)
}

const ext = extname(filePath)

// CSS, JSON, YAML, MD 등 비-코드 파일은 제외
if (['.css', '.json', '.yaml', '.yml', '.md', '.mdx', '.html', '.svg'].includes(ext)) {
  process.exit(0)
}

const name = basename(filePath, ext)
const violations = []

// 규칙 1: kebab-case 감지
const baseName = name.replace(/\.(test|spec|config|integration|regression|module|stories)$/, '')

if (/^[a-z][a-z0-9]*-[a-z]/.test(baseName)) {
  violations.push(`kebab-case 파일명 금지: "${basename(filePath)}". camelCase 또는 PascalCase 사용.`)
}

// 규칙 2: pages/ 네이밍 관례
if (filePath.includes('/pages/') && ['.ts', '.tsx'].includes(ext)) {
  // *Layout.tsx → Page*.tsx 여야 한다
  if (/Layout$/.test(name) && ext === '.tsx') {
    violations.push(`"${name}${ext}": 진입점은 Page{Domain}.tsx 형식. *Layout 금
  }
  // *Adapter.ts → *Transform.ts 여야 한다
  if (/Adapter$/.test(name) || /adapter$/i.test(name)) {
    violations.push(`"${name}${ext}": 변환 파일은 {domain}Transform.ts 형식. *Adapter 금지.`)
  }
}

if (violations.length > 0) {
  const output = JSON.stringify({
    decision: 'block',
    reason: `파일명 관례 위반 ${violations.length}건:\n${violations.map((v, i) => `  ${i + 1}. ${v}`).join('\n')}`,
  })
  process.stdout.write(output)
  process.exit(0)
}
