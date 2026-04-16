#!/usr/bin/env node
/**
 * shadcn/ui 소스를 다운로드하고 import 경로를 로컬용으로 패치
 */
import fs from 'fs'
import path from 'path'

const BASE = 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui'
const OUT = 'scripts/shadcn-ref'

const FILES = [
  'button.tsx', 'badge.tsx', 'input.tsx', 'textarea.tsx',
  'card.tsx', 'alert.tsx', 'avatar.tsx', 'skeleton.tsx',
  'progress.tsx', 'tooltip.tsx', 'select.tsx', 'tabs.tsx',
  'accordion.tsx', 'checkbox.tsx', 'radio-group.tsx',
  'switch.tsx', 'slider.tsx', 'toggle.tsx',
  'dialog.tsx', 'popover.tsx', 'table.tsx',
  'separator.tsx', 'scroll-area.tsx', 'breadcrumb.tsx',
  'kbd.tsx', 'toggle-group.tsx', 'label.tsx',
]

// cn() 유틸리티 — shadcn이 의존
const CN_UTIL = `
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
`

async function main() {
  // cn 유틸 생성
  fs.writeFileSync(path.join(OUT, 'utils.ts'), CN_UTIL.trim())

  for (const file of FILES) {
    const url = `${BASE}/${file}`
    try {
      const res = await fetch(url)
      if (!res.ok) { console.log(`⚠ ${file}: ${res.status}`); continue }
      let code = await res.text()

      // import 패치
      code = code.replace(/"use client"\n?/g, '')
      code = code.replace(/from\s+["']@\/lib\/utils["']/g, `from './utils'`)
      code = code.replace(/from\s+["']@\/registry\/[^"']+\/ui\/(\w+)["']/g, `from './$1'`)

      fs.writeFileSync(path.join(OUT, file), code)
      console.log(`✓ ${file}`)
    } catch (e) {
      console.log(`✗ ${file}: ${e.message}`)
    }
  }

  console.log('\n완료')
}

main()
