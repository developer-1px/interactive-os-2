#!/usr/bin/env node

/**
 * PreToolUse:Write|Edit hook — mockup fidelity-tier 규칙 강제
 *
 * Phase 3 Low-fi / Phase 4 Mid-fi / Phase 5 Hi-fi 각 tier의 경계를 정적 검사로 차단.
 * "fidelity leak" (low-fi에 hi-fi 요소가 들어오거나 반대)을 막는다.
 *
 * 대상 파일 경로:
 *   src/pages/__mockup__/{slug}/PageLow.tsx
 *   src/pages/__mockup__/{slug}/WireframeWidgets.tsx
 *   src/pages/__mockup__/{slug}/PageMid.tsx
 *   src/pages/__mockup__/{slug}/MidfiWidgets.tsx
 *   src/pages/__mockup__/{slug}/PageHi.tsx
 *   src/pages/__mockup__/{slug}/HifiWidgets.tsx
 *   src/pages/__mockup__/{slug}/layout.ts
 */

import { readFileSync } from 'fs'

function getFullContent(file_path, ti) {
  // Write: full content provided.
  if (ti.content != null) return ti.content
  // Edit: simulate old_string → new_string on current file content,
  // so presence/absence checks see the final state, not just the diff fragment.
  if (ti.new_string != null && ti.old_string != null) {
    try {
      const current = readFileSync(file_path, 'utf8')
      return ti.replace_all
        ? current.split(ti.old_string).join(ti.new_string)
        : current.replace(ti.old_string, ti.new_string)
    } catch {
      return ti.new_string
    }
  }
  return ''
}

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (c) => { input += c })
process.stdin.on('end', () => {
  let payload
  try { payload = JSON.parse(input) } catch { process.exit(0) }
  const ti = payload?.tool_input ?? {}
  const file_path = ti.file_path ?? ''
  const body = getFullContent(file_path, ti)
  if (!file_path || !body) process.exit(0)

  const violations = []

  const isMockupPath = /\/src\/pages\/__mockup__\/[^/]+\//.test(file_path)
  if (!isMockupPath) process.exit(0)

  const isLowWidgets = /\/WireframeWidgets\.tsx$/.test(file_path)
  const isPageLow = /\/PageLow\.tsx$/.test(file_path)
  const isMidWidgets = /\/MidfiWidgets\.tsx$/.test(file_path)
  const isPageMid = /\/PageMid\.tsx$/.test(file_path)
  const isHiWidgets = /\/HifiWidgets\.tsx$/.test(file_path)
  const isPageHi = /\/PageHi\.tsx$/.test(file_path)
  const isLayout = /\/layout\.ts$/.test(file_path)
  const isPageAny = isPageLow || isPageMid || isPageHi

  // ── Shared: all mockup pages ──
  if (isPageAny) {
    if (/from ['"].*AppShell/.test(body) || /import\s+AppShell/.test(body)) {
      violations.push('AppShell import 금지 — mockup 라우트는 shell-clean (router에서 AppShell 바깥에 등록)')
    }
    if (!/FlatLayout/.test(body)) {
      violations.push('FlatLayout import 필수 — mockup은 defineLayout 엔진 기반 렌더')
    }
    if (!/createWidgetRegistry/.test(body)) {
      violations.push('createWidgetRegistry 필수 — widget registry 없이 FlatLayout 비정상 동작')
    }
    if (/data-theme=['"]light['"]/.test(body)) {
      violations.push('data-theme="light" 금지 — 프로젝트 dark 기본 유지 (fidelity와 theme은 독립 축)')
    }
  }

  // ── Layout (shared across Phase 3-5) ──
  if (isLayout) {
    if (!/defineLayout/.test(body)) {
      violations.push('layout.ts는 defineLayout 사용 필수')
    }
  }

  // ── Phase 3 Low-fi rules ──
  if (isLowWidgets) {
    if (!/MockupBar/.test(body)) {
      violations.push('MockupBar import 필수 — wireframe은 ax-based MockupBar (role:item + surface:display)만 사용. badge+nbsp 꼼수 금지')
    }
    if (/tone:\s*['"](accent|danger|success|warning)(?!-)/.test(body)) {
      violations.push("tone 강조 금지 — low-fi는 중립. 'accent'/'danger'/'success'/'warning' 사용 시 Phase 5 Hi-fi로 이동")
    }
    if (/textStyle:\s*['"](page|section|hero)['"]/.test(body)) {
      violations.push("textStyle hierarchy 금지 — 'page'/'section'/'hero'는 Phase 5 Hi-fi용. Low-fi는 label/body/caption만")
    }
    if (/Array\.from\(\{\s*length:/.test(body)) {
      violations.push('Array.from({length:N}) 금지 — Phase 1 fixtures(MAILS/THREAD/FOLDERS)를 그대로 순회. Low-fi는 실제 데이터 분포를 반영해야')
    }
    if (/(starred|unread|important|selected|active|checked|hasAttachment)\s*\?\s*[^:]+:/.test(body)) {
      violations.push('상태 분기 (ternary) 금지 — low-fi는 state-uniform. unread/read 같은 조건 분기는 Phase 5 Hi-fi에서')
    }
    if (/surface:\s*['"]action['"]/.test(body)) {
      violations.push("surface:'action' 금지 — action surface는 tone 강조와 쌍 (Phase 5 Hi-fi). Low-fi는 base/ghost/sunken/display만")
    }
    if (/role:\s*['"]control['"].*?tone:/s.test(body) && /surface:\s*['"]action['"]/.test(body)) {
      // already caught above but reinforced
    }
  }

  // ── Phase 4 Mid-fi rules ──
  if (isMidWidgets) {
    if (/MockupBar/.test(body)) {
      violations.push('MockupBar 금지 — Mid-fi는 실 데이터 텍스트 렌더. MockupBar는 Low-fi 전용')
    }
    if (/textStyle:\s*['"](page|section|hero)['"]/.test(body)) {
      violations.push("strong hierarchy 금지 — textStyle 'page'/'section'/'hero'는 Phase 5 Hi-fi용")
    }
    if (/(unread|starred)\s*\?\s*['"]display['"]\s*:\s*['"]ghost['"]/.test(body)) {
      violations.push('unread/starred 기반 surface 분기 금지 — Phase 5 Hi-fi에서 Hierarchy 결정 후 분기')
    }
  }

  // ── Phase 5 Hi-fi rules ──
  if (isHiWidgets) {
    if (/MockupBar/.test(body)) {
      violations.push('MockupBar 금지 — Hi-fi는 실 ui/ 부품 사용 (Avatar/Badge/Button 등)')
    }
  }

  if (violations.length) {
    const header = isLowWidgets || isPageLow ? 'Low-fi 규칙'
      : isMidWidgets || isPageMid ? 'Mid-fi 규칙'
      : isHiWidgets || isPageHi ? 'Hi-fi 규칙'
      : isLayout ? 'Layout 규칙' : 'Mockup 규칙'
    process.stderr.write(`mockup fidelity ${header} 위반 ${violations.length}건:\n`)
    violations.forEach((v, i) => process.stderr.write(`  ${i + 1}. ${v}\n`))
    process.stderr.write('\n참고: .claude/skills/mockup/SKILL.md · docs/.../gmailMockup.md\n')
    process.exit(2)
  }
  process.exit(0)
})
