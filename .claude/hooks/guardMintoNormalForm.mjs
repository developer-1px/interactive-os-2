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
 *   12. warn — 같은 L2 챕터 내 위치 근거 prefix 시퀀스 역행 ([반박] before [귀결], [전제] after [증거] 등)
 *   18. warn — 접속사에 ? 표기 (LLM이 사슬 의심을 자기 노출한 자리)
 *   19. warn — L2 챕터 표 다음에 낭독 블록(인용 `>`)이 없음
 *   20. warn(우선순위) — GAP placeholder 행 (요소=`GAP`, 원문=`(대충 ... 내용)`) — 갭 질문 1순위
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

// 새 5컬럼: 요소 | 자연스런 의문 | 원문 | 구체화 | 순서
// 인덱스:    0     1               2     3        4
// 요소가 맨 앞 — 행 역할(P/D/P'/GAP)을 첫눈에 식별하도록.
// 자연스런 의문 = 이 행으로 가는 다리에서 독자가 떠올릴 의문 (적대적 반문 아님).
// 요소 기호는 depth만 (S/C/R1/R2/Q/A/A'/P/P2/P'/D/D2/GAP). 순번 번호 금지.
const COL = { ELEM: 0, QUESTION: 1, QUOTE: 2, KIND: 3, ORDER: 4 }
const LEGACY_COL_CONJ = 0 // 옛 5컬럼의 접속사 위치 (legacy 호환용)

// 서브토탈 행 판정 (요소 컬럼 = 마지막 셀이 →로 시작)
// 6컬럼/7컬럼 호환: 항상 마지막 셀을 본다 (둘 다 요소 컬럼이 마지막)
function isSubtotal(row) {
  const cells = rowCells(row)
  return cells.length > 0 && /^→/.test(cells[cells.length - 1])
}

// 닫힌 접속사 어휘 → 카테고리
const CONJ_TO_CATEGORY = {
  '그래서': '인과', '따라서': '인과', '그러므로': '인과', '그렇기에': '인과', '결국': '인과', '마침내': '인과',
  '즉': '부연', '다시 말해': '부연', '게다가': '부연', '더구나': '부연', '또한': '부연',
  '그런데': '반박', '그러나': '반박', '하지만': '반박', '그렇지만': '반박', '그런데도': '반박',
  '한편': '전환', '반면': '전환',
  '예를 들어': '예시', '가령': '예시',
}
const CONJ_VOCAB = new Set(Object.keys(CONJ_TO_CATEGORY))

// 위치 근거 prefix → 호환 가능 접속사 카테고리들
const PREFIX_TO_CATEGORIES = {
  '전제': ['부연', '전환'],
  '정의': ['부연', '전환'],
  '증거': ['부연', '예시', '인과', '반박'], // [전제]→반례 증거 패턴 허용
  '보강': ['부연', '예시'],
  '귀결': ['인과'],
  '반박': ['반박'],
  '문제': ['전환', '인과', '반박'],
  '상황': ['전환', '부연'],
  '행동': ['인과'],
  '엔딩': ['인과'],
  '훅': ['전환', '부연', '예시'],
  '맥락': ['부연', '전환'],
}

// ─── 검사 1: 모든 부모-자식 관계 7 임계 ────────────────
// (a) L2 챕터 표 절 행 ≥ 7 (GAP placeholder 제외)
function isGapRow(row) {
  const cells = rowCells(row)
  if (cells.length === 0) return false
  return cells[cells.length - 1].replace(/\*/g, '').trim() === 'GAP'
}
for (const sec of sections) {
  if (sec.level !== 'L2') continue
  const dataRows = sec.tableRows.filter(r => !isSubtotal(r) && !isGapRow(r))
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
  const quoteIdx = sec.newOrder ? 2 : 1
  for (const row of sec.tableRows) {
    if (isSubtotal(row)) continue
    const cells = rowCells(row)
    if (cells.length <= quoteIdx) continue
    const q = normalizeQuote(cells[quoteIdx])
    if (!q || q.length < 12) continue
    if (!seen.has(q)) seen.set(q, [])
    seen.get(q).push(sec.title)
  }
}
// A/A' 행은 도입부/마무리에서 의도적으로 가져온 것이라 중복 면제
const seenAArows = new Set()
for (const sec of sections) {
  if (!['L0', 'L2', 'AUX'].includes(sec.level)) continue
  for (const row of sec.tableRows) {
    const cells = rowCells(row)
    if (cells.length === 0) continue
    const elem = cells[cells.length - 1].replace(/\*/g, '').trim()
    if (elem === 'A' || elem === "A'") {
      const q = normalizeQuote(cells[1] || '')
      if (q) seenAArows.add(q)
    }
  }
}
for (const [q, locs] of seen) {
  if (seenAArows.has(q)) continue // A/A' 의도적 중복 면제
  if (locs.length > 1) {
    fails.push(`원문 중복 (${locs.length}곳: ${locs.join(' / ')}): "${q.slice(0, 50)}..."`)
  }
}

// ─── 검사 3: 컬럼 수 = 5 (새 정규형) ──────────────────────
// 새 5컬럼 순서: 접속사 | 원문 | 구체화 | 순서 | 요소
// 위치 근거 폐기. 낭독은 표가 아닌 챕터 표 다음 줄글 블록 (검사 19)
const EXPECTED_COLS = 5
const LEGACY_COLS_6 = 6 // 옛 6컬럼 (위치 근거 셀 포함) — 마이그레이션 진행 중 임시 호환
const LEGACY_COLS_7 = 7 // 옛 7컬럼 (낭독 셀 포함) — 마이그레이션 진행 중 임시 호환
for (const sec of sections) {
  if (!sec.headerCells) continue
  if (['L0', 'L2', 'AUX'].includes(sec.level)) {
    if (sec.headerCells.length === LEGACY_COLS_7) {
      warns.push(`표 7컬럼 (deprecated, 낭독 셀): "${sec.title}" (line ${sec.lineNo}) — 낭독 셀 제거 후 5컬럼 + 별도 낭독 블록으로`)
      continue
    }
    if (sec.headerCells.length === LEGACY_COLS_6) {
      warns.push(`표 6컬럼 (deprecated, 위치 근거 셀): "${sec.title}" (line ${sec.lineNo}) — 위치 근거 셀 제거 후 5컬럼으로 (사후 라벨 폐기)`)
      continue
    }
    if (sec.headerCells.length !== EXPECTED_COLS) {
      fails.push(`표 컬럼 ${sec.headerCells.length}개 (≠5): "${sec.title}" (line ${sec.lineNo})`)
      continue
    }
    // 헤더 순서 검사 — 신형: 요소(0) | 자연스런 의문(1) | 원문(2) | 구체화(3) | 순서(4)
    const headerNorm = sec.headerCells.map(c => c.replace(/\*/g, '').trim())
    const firstCol = headerNorm[0]
    const QUESTION_VOCAB = /^(자연스런 의문|자연스러운 의문|의문|반문|독자 질문|독자의 질문)$/
    if (firstCol === '접속사') {
      warns.push(`첫 컬럼이 "접속사" (deprecated): "${sec.title}" (line ${sec.lineNo})`)
      sec.legacyConj = true
    } else if (firstCol === '요소') {
      // 신형: 요소 맨 앞
      if (!QUESTION_VOCAB.test(headerNorm[1])) {
        fails.push(`둘째 컬럼이 "자연스런 의문"이 아님: "${sec.title}" (line ${sec.lineNo})`)
      }
      sec.newOrder = true
    } else if (QUESTION_VOCAB.test(firstCol)) {
      // 중간형: 의문 맨 앞 (이전 단계) — warn으로 이전
      warns.push(`첫 컬럼이 "의문" (중간형): "${sec.title}" (line ${sec.lineNo}) — "요소"를 맨 앞으로 이동 예정`)
    } else {
      fails.push(`첫 컬럼이 "요소"가 아님: "${sec.title}" (line ${sec.lineNo}) — 요소가 행 역할 식별자, 가장 왼쪽 필수`)
    }
  }
}

// 요소 기호 유효 어휘 (depth만, 순번 번호 금지)
// 고정 명칭: S C R1 R2 Q A A'
// Depth 기호: P (1depth장), P2 (2depth절), P3 (3depth), D (원문), D2, D3 ...
// 예외: GAP / 서브토탈 (→ ...)
const ELEM_VOCAB_RE = /^(S|C|R1|R2|Q|A'?|P\d*'?|D\d*'?|GAP)$/

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
// 순서 컬럼 — 두 차원 병기: (귀납|연역) · (시간|구조|정도|행동) N (근거)
// 예: "귀납 · 정도 1 (LLM 본질)", "귀납 · 정도 (LLM 본질 → 시중 오해)"
// P 행 허용: "귀납 · 정도 (선언)" 또는 "(헤딩 회수)"
// legacy 형식도 유지: "시간 1 (...)", "도입 N", "그루핑: 시간"
// 새 형식:
//   (귀납|연역) \d* · ... (근거)    예: "연역 1 (전제 — ...)", "귀납 · 정도 1 (LLM 본질)"
//   (귀납|연역) \d+ \(.+\)           예: "연역 1 (전제 — ...)"
// Legacy: "시간 1 (...)", "도입 N", "그루핑: 시간"
const ORDER_RE = /^((귀납|연역)(\s*·\s*.+|\s+\d+\s*\(.+\))|(시간|구조|정도|행동)\s+\d+\s+\(.+\)|도입\s+\d+|그루핑:\s*(시간|구조|정도|행동)(\s+\(.+\))?|선언.*|\(.+\))$/
const PREFIX_RE = new RegExp(`^\\[(${VALID_VOCAB.join('|')})\\]\\s+.+`)

// 인과 사슬 단조성 rank — rank 0 은 자유 위치 (단조 검사 면제)
const PREFIX_RANK = {
  '훅': 0, '맥락': 0,
  '상황': 1, '문제': 2,
  '전제': 3, '정의': 3,
  '증거': 4, '보강': 4,
  '귀결': 5, '반박': 6,
  '행동': 7, '엔딩': 8,
}

// 어절 추출: 한글/영문/숫자/문장부호 단위로 마지막/처음 N개 어절 가져오기
function lastWords(text, n = 3) {
  const cleaned = text.replace(/^\s*\*+|\*+\s*$/g, '').trim()
  const words = cleaned.split(/\s+/).filter(Boolean)
  return words.slice(-n).join(' ')
}
function firstWords(text, n = 3) {
  const cleaned = text.replace(/^\s*\*+|\*+\s*$/g, '').trim()
  const words = cleaned.split(/\s+/).filter(Boolean)
  return words.slice(0, n).join(' ')
}

for (const sec of sections) {
  if (!['L0', 'L2', 'AUX'].includes(sec.level)) continue

  // 검사 19: L2 챕터 표 다음에 낭독 블록(인용 `>`)이 있는가
  if (sec.level === 'L2' && sec.headerCells && sec.headerCells.length === EXPECTED_COLS) {
    const hasBlockquote = sec.bodyLines.some(line => /^>\s/.test(line))
    if (!hasBlockquote) {
      warns.push(`낭독 블록 누락 (검사 19): "${sec.title}" — 챕터 표 다음에 인용블록(>)으로 사슬 낭독을 적어야 함`)
    }
  }

  // 검사 12 폐기 (위치 근거 prefix 입력이 사라졌으므로). 사슬 검증은 (B) 레드팀 에이전트 + 사용자 직접 검토.

  // 데이터 행만 모으기 (서브토탈 제외) — 첫 행 판정 + 이전 행 참조용
  // 5컬럼만 처리. 6/7컬럼(deprecated)은 검사 3에서 이미 warn 출력 후 스킵.
  if (sec.headerCells && (sec.headerCells.length === LEGACY_COLS_7 || sec.headerCells.length === LEGACY_COLS_6)) continue
  const dataRowsWithIdx = []
  for (const row of sec.tableRows) {
    if (isSubtotal(row)) continue
    const cells = rowCells(row)
    if (cells.length < EXPECTED_COLS) continue
    dataRowsWithIdx.push(cells)
  }

  // 컬럼 인덱스 매핑 — 신형(요소 맨 앞) vs legacy(요소 맨 뒤)
  const I = sec.newOrder
    ? { ELEM: 0, QUESTION: 1, QUOTE: 2, KIND: 3, ORDER: 4 }
    : { QUESTION: 0, QUOTE: 1, KIND: 2, ORDER: 3, ELEM: 4 }

  for (let i = 0; i < dataRowsWithIdx.length; i++) {
    const cells = dataRowsWithIdx[i]
    const 반문 = cells[I.QUESTION]
    const 원문 = cells[I.QUOTE]
    const 구체화 = cells[I.KIND]
    const 순서 = cells[I.ORDER]
    const 요소Raw = cells[I.ELEM].replace(/\*/g, '').trim()
    const isFirstDataRow = (i === 0)
    const prev = isFirstDataRow ? null : dataRowsWithIdx[i - 1]

    // 검사 20: GAP placeholder 행
    if (요소Raw === 'GAP') {
      warns.unshift(`★ GAP 1순위 (검사 20): "${sec.title}" — ${원문} (갭 질문 우선)`)
      continue
    }

    // 검사 21: 요소 depth 기호 검증 (순번 번호 금지)
    if (!sec.legacyConj && !ELEM_VOCAB_RE.test(요소Raw)) {
      fails.push(`요소 기호 유효하지 않음 (검사 21): "${sec.title}" / "${요소Raw}" — depth 기호만 허용 (S/C/R1/R2/Q/A/A'/P/P2/P3/D/D2/D3/GAP). 순번 번호(1.1.1 등) 금지.`)
    }

    // 검사 8: 순서 형식
    if (sec.level === 'L2') {
      if (!ORDER_RE.test(순서)) {
        warns.push(`순서 형식 오류: "${sec.title}" / ${요소} — "${순서}" (예: "시간 1 (인과: ...)")`)
      }
    }

    // 검사 11: 원문 셀이 완전한 습니다체 문장인가
    // P / P' 행은 헤딩 회수 / 착지라 평서체 허용 (면제)
    const elemBare = 요소Raw.replace(/^\s*\*+|\*+\s*$/g, '').trim()
    const isPRow = /^P\d*'?$/.test(elemBare) || /^→\s*P/.test(elemBare)
    if ((sec.level === 'L2' || sec.level === 'AUX') && !isPRow) {
      const cleaned = 원문.replace(/^\s*\*+|\*+\s*$/g, '').trim()
      if (cleaned && cleaned !== '—') {
        if (cleaned.length < TOO_SHORT_LEN) {
          warns.push(`원문 너무 짧음 (파편 의심): "${sec.title}" / ${요소} — "${cleaned}" (습니다체 완전 문장으로)`)
        } else if (!SENTENCE_END_RE.test(cleaned)) {
          warns.push(`원문이 습니다체 종결 아님: "${sec.title}" / ${요소} — "...${cleaned.slice(-20)}" (습니다/입니다/...십시오로 끝나야)`)
        } else if (BANNED_FRAGMENT_RE.test(cleaned) && cleaned.length < 40) {
          warns.push(`원문이 키워드 나열 형태 (메모 의심): "${sec.title}" / ${요소} — "${cleaned}" (완전 문장으로)`)
        }
      }
    }

    // ─── 게이트 검사 (L2만, legacy 접속사 컬럼만) ───────
    if (sec.level !== 'L2') continue
    if (!sec.legacyConj) continue // 새 5컬럼(반문)은 접속사 검사 면제 — 낭독/반문이 게이트

    const conjClean = 반문.replace(/^\s*\*+|\*+\s*$/g, '').trim()

    // 검사 13: 접속사 셀 빈칸 (첫 행 제외) — legacy만
    if (isFirstDataRow) {
      if (conjClean !== '—' && !CONJ_VOCAB.has(conjClean)) {
        warns.push(`첫 행 접속사는 "—"여야 함: "${sec.title}" / ${요소Raw} — "${conjClean}"`)
      }
    } else {
      if (!conjClean || conjClean === '—') {
        fails.push(`접속사 빈칸 (검사 13, legacy): "${sec.title}" / ${요소Raw}`)
      } else {
        const hasDoubt = conjClean.endsWith('?')
        const conjBare = hasDoubt ? conjClean.slice(0, -1).trim() : conjClean
        if (!CONJ_VOCAB.has(conjBare)) {
          fails.push(`접속사가 닫힌 어휘 밖 (검사 14, legacy): "${sec.title}" / ${요소Raw} — "${conjClean}"`)
        } else if (hasDoubt) {
          warns.push(`접속사 의심 표시 (검사 18, legacy): "${sec.title}" / ${요소Raw} — "${conjClean}"`)
        }
      }
    }

    // 검사 15·16(낭독) 폐기 — 낭독은 표가 아닌 챕터 다음 줄글 블록으로 분리됨 (검사 19에서 별도 검사)

    // 검사 17 폐기 (위치 근거 컬럼 폐기와 함께)
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
out.push('정규형: 표 = 6컬럼 | 접속사 | 원문 | 구체화 | 순서 | 위치 근거 | 요소 | + 챕터별 낭독 블록(>)')
out.push('게이트: 접속사(가장 왼쪽) → 원문 순으로 채움. 요소(번호)는 가장 오른쪽 = 결과.')
out.push('규칙: L2 절 행 <7, 원문 중복 0, 헤딩=액션 타이틀, 사후 라벨 금지 (검사 13·14·17·18·19)')

if (fails.length > 0) {
  // fail → stdout JSON block 프로토콜
  process.stdout.write(JSON.stringify({ decision: 'block', reason: out.join('\n') }))
  process.exit(0)
} else {
  // warn only → stderr 경고, block하지 않음
  process.stderr.write(out.join('\n') + '\n')
  process.exit(0)
}
