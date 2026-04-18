#!/usr/bin/env node

/**
 * PostToolUse:Write|Edit hook — Page* 파일에 FlatLayout 미사용 경고 (비블로킹)
 *
 * Page*.tsx 파일을 수정할 때 FlatLayout import가 없으면 경고를 출력한다.
 * exit 0으로 블로킹하지 않는다.
 */

const input = JSON.parse(await new Promise(r => {
  let d = ''
  process.stdin.on('data', c => d += c)
  process.stdin.on('end', () => r(d))
}))

const filePath = input.tool_input?.file_path ?? input.tool_input?.path ?? ''

// Page*.tsx 파일만 대상
if (!/\/pages\/.*\/Page[A-Z][^/]*\.tsx$/.test(filePath)) process.exit(0)

// 파일 내용 읽기
import { readFileSync } from 'fs'
let content
try {
  content = readFileSync(filePath, 'utf8')
} catch {
  process.exit(0)
}

if (!content.includes('FlatLayout')) {
  const name = filePath.split('/').pop()
  process.stderr.write(`\n💡 FlatLayout 미사용: ${name} — 페이지 레이아웃은 FlatLayout으로 선언하세요.\n   import { FlatLayout } from '@os/ui/FlatLayout'\n`)
}

process.exit(0)
