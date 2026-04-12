#!/usr/bin/env node

/**
 * PostToolUse:Edit|Write hook — minto 산출물 정규형 검증
 *
 * 대상: docs/0-inbox/minto-*.md
 *
 * 정규형: 표가 있는 모든 곳(도입부·L2 챕터·미배치·결론후보·수사장치)이
 *         동일한 7컬럼 공통 스키마를 따른다.
 *
 * 컬럼: | 요소 | 원문 | 구체화 | 순서 | 추론 | 위치 근거 | 이해도 |
 *
 * 검사:
 *   1. fail — L2 챕터 표 절 행 ≥ 7 (서브토탈 →X.Y 행 제외)
 *   2. fail — 표 사이 원문 중복
 *   3. fail — 컬럼 수 ≠ 7
 *   4. warn — 휘발 메타 본문 잔존
 *   5. warn — L1 헤딩 직하에 표 (장 헤딩에는 표 금지)
 *   6. warn — 위치 근거 카테고리 라벨 패턴 (So What 위반)
 *   7. warn — 절 행 추론 컬럼 빈칸
 *   8. warn — 헤딩 텍스트 카테고리 라벨 패턴 (액션 타이틀 위반)
 *   11. warn — 원문 셀이 완전한 습니다체 문장이 아님 (파편/메모/반말)
 */

const SENTENCE_END_RE = /(습니다|입니다|합니다|됩니다|있습니다|없습니다|드립니다|십시오|십시요|싶습니다|입니까|합니까|니까|이다|것이다|입니다\.|\.|!|\?)["')\]]?\s*$/
const BANNED_FRAGMENT_RE = /^[^.!?…」』\)\]]*[—–\-]\s*[^.!?…」』\)\]]+$/
const TOO_SHORT_LEN = 18

import { readFileSync } from 'fs'

const input = JSON.parse(readFileSync('/dev/stdin', 'utf8'))
const filePath = input.tool_input?.file_path ?? ''

if (!/\/docs\/0-inbox\/minto-.*\.md$/.test(filePath)) process.exit(0)
if (filePath.endsWith('.bak')) process.exit(0)

let content
try { content = readFileSync(filePath, 'utf8') } catch { process.exit(0) }

const lines = content.split('\n')
const fails = []
const warns = []

// ─── 섹션 분해 (헤딩 + 직후 표) ───────────────────────
const sections = []
let cur = null
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  const h1 = line.match(/^# (?!#)(.+)$/)
  const h2 = line.match(/^## (.+)$/)
  const h3 = line.match(/^### (.+)$/)
  if (h1 || h2 || h3) {
    if (cur) sections.push(cur)
    const title = (h1 || h2 || h3)[1].trim()
    let level = h1 ? 'L1' : h2 ? 'L2' : 'L3'
    if (/^(도입부|전개|마무리|미배치|결론 후보|결론후보|수사 장치|수사장치|의도)/.test(title)) {
      level = title.startsWith('도입부') ? 'L0'
            : title.startsWith('마무리') ? 'L4'
            : title.startsWith('의도') ? 'META'
            : 'AUX'
    }
    cur = { level, title, lineNo: i + 1, tableRows: [], headerCells: null, bodyLines: [] }
    continue
  }
  if (cur) cur.bodyLines.push(line)
}
if (cur) sections.push(cur)

function extractTable(bodyLines) {
  const rows = []
  let header = null
  let inTable = false
  let separatorSeen = false
  for (const line of bodyLines) {
    const isRow = /^\|.*\|\s*$/.test(line)
    if (!isRow) {
      if (inTable) break
      continue
    }
    if (!header) { header = line; inTable = true; continue }
    if (!separatorSeen && /^\|[-:\s|]+\|\s*$/.test(line)) { separatorSeen = true; continue }
    rows.push(line)
  }
  return { header, rows }
}

for (const sec of sections) {
  const { header, rows } = extractTable(sec.bodyLines)
  sec.tableRows = rows
  sec.headerCells = header ? header.split('|').slice(1, -1).map(c => c.trim()) : null
}

function rowCells(row) {
  return row.split('|').slice(1, -1).map(c => c.trim())
}

// 서브토탈 행 판정 (요소 컬럼이 →로 시작)
function isSubtotal(row) {
  const cells = rowCells(row)
  return cells.length > 0 && /^→/.test(cells[0])
}

// ─── 검사 1: 모든 부모-자식 관계 7 임계 ────────────────
// (a) L2 챕터 표 절 행 ≥ 7
for (const sec of sections) {
  if (sec.level !== 'L2') continue
  const dataRows = sec.tableRows.filter(r => !isSubtotal(r))
  if (dataRows.length >= 7) {
    fails.push(`L2 챕터 절 행 ${dataRows.length}개 (>=7) — 그루핑 강제: "${sec.title}" (line ${sec.lineNo})`)
  }
}
// (b) L1 장 안의 직계 L2 챕터 수 ≥ 7
const chaptersByL1 = []
let curL1 = null
for (const sec of sections) {
  if (sec.level === 'L1') {
    if (curL1) chaptersByL1.push(curL1)
    curL1 = { title: sec.title, lineNo: sec.lineNo, count: 0 }
  } else if (sec.level === 'L2' && curL1) {
    curL1.count++
  }
}
if (curL1) chaptersByL1.push(curL1)
for (const l1 of chaptersByL1) {
  if (l1.count >= 7) {
    fails.push(`L1 장 직계 L2 챕터 ${l1.count}개 (>=7) — 장 분할 강제: "${l1.title}" (line ${l1.lineNo})`)
  }
}
// (c) 책 전체 L1 장 수 ≥ 7
const l1Count = sections.filter(s => s.level === 'L1').length
if (l1Count >= 7) {
  fails.push(`책 전체 L1 장 ${l1Count}개 (>=7) — 부 단위 분할 검토`)
}

// ─── 검사 2: 표 사이 원문 중복 ────────────────────────
function normalizeQuote(cell) {
  return cell.replace(/^\s*\*+|\*+\s*$/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
}
const seen = new Map()
for (const sec of sections) {
  if (!['L0', 'L2', 'AUX'].includes(sec.level)) continue
  for (const row of sec.tableRows) {
    if (isSubtotal(row)) continue
    const cells = rowCells(row)
    if (cells.length < 2) continue
    const q = normalizeQuote(cells[1])
    if (!q || q.length < 12) continue
    if (!seen.has(q)) seen.set(q, [])
    seen.get(q).push(sec.title)
  }
}
for (const [q, locs] of seen) {
  if (locs.length > 1) {
    fails.push(`원문 중복 (${locs.length}곳: ${locs.join(' / ')}): "${q.slice(0, 50)}..."`)
  }
}

// ─── 검사 3: 컬럼 수 ≠ 7 ───────────────────────────────
const EXPECTED_COLS = 7
for (const sec of sections) {
  if (!sec.headerCells) continue
  if (['L0', 'L2', 'AUX'].includes(sec.level)) {
    if (sec.headerCells.length !== EXPECTED_COLS) {
      fails.push(`표 컬럼 ${sec.headerCells.length}개 (≠7): "${sec.title}" (line ${sec.lineNo})`)
    }
  }
}

// ─── 검사 4: 휘발 메타 본문 잔존 ──────────────────────
const volatilePatterns = [
  { re: /<!--\s*Grouping/, label: '<!-- Grouping --> 주석' },
  { re: /←\s*원\s*P\d/, label: '"← 원 P*" 마이그레이션 흔적' },
  { re: /검증\s*\(\d차/, label: '"검증 (N차)" 누적 회차' },
  { re: /해체\s*근거/, label: '"해체 근거" 마이그레이션 노트' },
  { re: /이동된\s*D/, label: '"이동된 D" 마이그레이션 노트' },
  { re: /^### MECE 검증/m, label: 'MECE 검증 표 (휘발 대상)' },
  { re: /스토리 게이트 낭독/, label: '스토리 게이트 낭독 (휘발 대상)' },
]
for (let i = 0; i < lines.length; i++) {
  for (const { re, label } of volatilePatterns) {
    if (re.test(lines[i])) {
      warns.push(`휘발 메타 본문 잔존 (line ${i + 1}): ${label}`)
      break
    }
  }
}

// ─── 검사 5: L1 헤딩 직하에 표 ────────────────────────
for (const sec of sections) {
  if (sec.level !== 'L1') continue
  if (sec.tableRows.length > 0) {
    warns.push(`L1 장 헤딩에 표 — 장은 헤딩 텍스트만: "${sec.title}" (line ${sec.lineNo})`)
  }
}

// ─── 검사 6·7·8·9·10: 절 행 셀 형식 검사 ───────────────
const labelPatterns = [/들$/, /에 관한/, /^기타/, /방법들/, /사항들/, /것들/]
function isCategoryLabel(text) {
  if (!text) return false
  return labelPatterns.some(re => re.test(text.trim()))
}

const VALID_VOCAB = ['전제','정의','증거','보강','반박','귀결','문제','행동','상황','훅','엔딩','맥락']
const REASONING_RE = /^(연역\([1-3]\)|귀납|—)$/
const REASONING_OVER_RE = /^연역\([4-9]\)/
const ORDER_RE = /^((시간|구조|정도)\s+\d+\s+\(.+\)|도입\s+\d+|그루핑:\s*(시간|구조|정도)(\s+\(.+\))?)$/
const PREFIX_RE = new RegExp(`^\\[(${VALID_VOCAB.join('|')})\\]\\s+.+`)

for (const sec of sections) {
  if (!['L0', 'L2', 'AUX'].includes(sec.level)) continue

  // 같은 L2 챕터 내 절 행 추론 섞임 검사 준비
  const reasoningTypes = new Set()

  for (const row of sec.tableRows) {
    const cells = rowCells(row)
    if (cells.length < EXPECTED_COLS) continue
    const [요소, 원문, 구체화, 순서, 추론, 위치근거, 이해도] = cells
    const subtotal = isSubtotal(row)

    // 검사 6: 위치 근거 카테고리 라벨 (백업)
    if (isCategoryLabel(위치근거)) {
      warns.push(`위치 근거 카테고리 라벨 (So What 위반): "${sec.title}" / ${요소}`)
    }

    // 검사 7: 추론 형식 (도입부 S~A·서브토탈 제외)
    if (sec.level === 'L2' && !subtotal) {
      if (REASONING_OVER_RE.test(추론)) {
        fails.push(`연역 ≥4단 (B5 위반): "${sec.title}" / ${요소} — "${추론}"`)
      } else if (!REASONING_RE.test(추론)) {
        warns.push(`추론 형식 오류: "${sec.title}" / ${요소} — "${추론}" (연역(1-3)/귀납/— 중 하나)`)
      }
      const baseType = 추론.split('(')[0]
      if (baseType !== '—') reasoningTypes.add(baseType)
    }

    // 검사 8: 순서 형식
    if (sec.level === 'L2' && !subtotal) {
      if (!ORDER_RE.test(순서)) {
        warns.push(`순서 형식 오류: "${sec.title}" / ${요소} — "${순서}" (예: "시간 1 (인과: ...)")`)
      }
    }

    // 검사 9: 위치 근거 prefix (도입부·서브토탈 면제)
    if (sec.level === 'L2' && !subtotal) {
      if (!PREFIX_RE.test(위치근거)) {
        warns.push(`위치 근거 prefix 누락: "${sec.title}" / ${요소} — "${위치근거}" (12 어휘 중 하나 [...])`)
      }
    }

    // 검사 11: 원문 셀이 완전한 습니다체 문장인가
    // 대상: L2 절 행 + 미배치/결론후보/수사 표 (L0 도입부 S/C/R/Q/A는 면제 — 의도적으로 짧음)
    if (!subtotal && (sec.level === 'L2' || sec.level === 'AUX')) {
      const cleaned = 원문.replace(/^\s*\*+|\*+\s*$/g, '').trim()
      if (cleaned && cleaned !== '—' && !/^\(원문 그대로\)$/.test(cleaned)) {
        if (cleaned.length < TOO_SHORT_LEN) {
          warns.push(`원문 너무 짧음 (파편 의심): "${sec.title}" / ${요소} — "${cleaned}" (습니다체 완전 문장으로)`)
        } else if (!SENTENCE_END_RE.test(cleaned)) {
          warns.push(`원문이 습니다체 종결 아님: "${sec.title}" / ${요소} — "...${cleaned.slice(-20)}" (습니다/입니다/...십시오로 끝나야)`)
        } else if (BANNED_FRAGMENT_RE.test(cleaned) && cleaned.length < 40) {
          warns.push(`원문이 키워드 나열 형태 (메모 의심): "${sec.title}" / ${요소} — "${cleaned}" (완전 문장으로)`)
        }
      }
    }
  }

  // 검사 10: 같은 L2 챕터 내 절들의 추론 섞임 (B8)
  if (sec.level === 'L2' && reasoningTypes.size > 1) {
    warns.push(`그룹 내 추론 섞임 (B8): "${sec.title}" — ${[...reasoningTypes].join(', ')}`)
  }
}

// 검사 8: 헤딩 텍스트 카테고리 라벨
for (const sec of sections) {
  if (!['L1', 'L2'].includes(sec.level)) continue
  // "1장. " "1.1 " 같은 번호 prefix 제거
  const titleBody = sec.title.replace(/^\d+(\.\d+)*[.\s]+/, '').trim()
  if (isCategoryLabel(titleBody)) {
    warns.push(`헤딩 카테고리 라벨 (액션 타이틀 위반): "${sec.title}" (line ${sec.lineNo})`)
  }
}

// ─── 출력 ──────────────────────────────────────────
if (fails.length === 0 && warns.length === 0) process.exit(0)

const out = []
if (fails.length > 0) {
  out.push('❌ minto 정규형 위반 (fail):')
  fails.forEach(m => out.push(`  - ${m}`))
}
if (warns.length > 0) {
  out.push('⚠ minto 정규형 경고 (warn):')
  warns.forEach(m => out.push(`  - ${m}`))
}
out.push('')
out.push('정규형: 표 = 7컬럼 | 요소 | 원문 | 구체화 | 순서 | 추론 | 위치 근거 | 이해도 |')
out.push('규칙: L2 절 행 <7, 원문 중복 0, 헤딩=액션 타이틀, 위치 근거=카테고리 라벨 금지')

process.stderr.write(out.join('\n') + '\n')
process.exit(fails.length > 0 ? 2 : 0)
