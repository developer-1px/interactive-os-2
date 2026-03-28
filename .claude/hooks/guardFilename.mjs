#!/usr/bin/env node

/**
 * PreToolUse:Write hook — kebab-case 파일명 차단
 *
 * 규칙: 파일명 = 주 export 식별자 (camelCase 또는 PascalCase)
 * kebab-case (예: my-component.tsx) 금지
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

// kebab-case 감지: 소문자-소문자 패턴 (예: my-component)
// 단, .test., .config. 등 관례적 접미사는 제외
const baseName = name.replace(/\.(test|spec|config|integration|regression|module|stories)$/, '')

if (/^[a-z][a-z0-9]*-[a-z]/.test(baseName)) {
  const output = JSON.stringify({
    decision: 'block',
    reason: `kebab-case 파일명 금지: "${basename(filePath)}". 파일명은 주 export 식별자와 일치해야 한다 (camelCase 또는 PascalCase). 예: myComponent.ts, TreeGrid.tsx`,
  })
  process.stdout.write(output)
  process.exit(0)
}
