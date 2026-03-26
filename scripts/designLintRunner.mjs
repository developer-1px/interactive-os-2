#!/usr/bin/env node
/**
 * Design Lint Runner — Playwright 전수조사 + 텍스트 리포트
 *
 * Usage:
 *   pnpm lint:design                         # 전 라우트
 *   pnpm lint:design -- /ui/listbox          # 특정 경로
 *   pnpm lint:design -- /ui/listbox /ui/grid # 여러 경로
 *   pnpm lint:design -- ui                   # "ui" 포함 라우트만
 *   pnpm lint:design -- cms                  # "cms" 포함
 */
import { execSync } from 'node:child_process'

const args = process.argv.slice(2).join(' ')
const cmd = `node scripts/designScoreVisual.mjs ${args}`

try {
  const json = execSync(cmd, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }).toString()
  // pipe to report formatter
  const report = execSync('node scripts/designLintReport.mjs', {
    input: json,
    timeout: 10000,
  }).toString()
  console.log(report)
} catch (e) {
  if (e.stderr) process.stderr.write(e.stderr)
  process.exit(1)
}
