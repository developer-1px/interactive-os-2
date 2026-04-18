---
id: 0-inbox/mddb-audit-2026-04-18
type: note
slug: mddbAudit
title: 'mddb 소급 설계용 docs/ 현황 감사'
tags: [tag]
created: 2026-04-18
updated: 2026-04-18
summary: '**날짜**: 2026-04-18 **목적**: file 기반 md DB 시스템 소급 적용 전 `docs/` 하위 현황 파악 **scope**: `docs/**/*.md` (335 파일) — `memory/`는 Claude 자동 관리 영역이라 제외'
legacy:
  status: inbox
  kind: note
  topics: [0-inbox, tag]
  relates: []
  supersedes: []
---
# mddb 소급 설계용 docs/ 현황 감사

**날짜**: 2026-04-18
**목적**: file 기반 md DB 시스템 소급 적용 전 `docs/` 하위 현황 파악
**scope**: `docs/**/*.md` (335 파일) — `memory/`는 Claude 자동 관리 영역이라 제외

---

## 1. 전체 분포

| 위치 | 파일 수 | 비율 | frontmatter 보유 |
|------|--------:|-----:|-----------------:|
| `docs/0-inbox/` | 19 | 5.7% | 9 (47%) |
| `docs/1-projects/` | 56 | 16.7% | 3 (5%) |
| `docs/2-areas/` | 134 | 40.0% | 0 (0%) |
| `docs/3-resources/` | 45 | 13.4% | 0 (0%) |
| `docs/4-archive/` | 51 | 15.2% | 9 (18%) |
| `docs/5-backlogs/` | 5 | 1.5% | 0 (0%) |
| `docs/birdseye/` | 0 | — | — |
| `docs/research/` | 3 | 0.9% | — |
| `docs/samples/` | 10 | 3.0% | — |
| `docs/superpowers/` | 3 | 0.9% | — |
| `docs/` (root) | 9 | 2.7% | — |
| **합계** | **335** | 100% | **21 (6.3%)** |

---

## 2. 핵심 관찰

### 2.1 Frontmatter 보유율 6.3% — 거의 백지
- 소급 대상: **314 파일**
- 가장 큰 폴더(`2-areas/` 134 파일)는 **0% 보유**
- 기존 보유 파일도 스키마 일관성 미확인 → 개별 검증 필요

### 2.2 `2-areas/`가 최대 위험/기회 영역
- 전체 40% 차지, 규약 전무
- PRD 문서 밀집 지역 (`*/prds/*-prd.md` 대량)
- **mddb 가치 증명의 주 무대**

### 2.3 파일명 규약 커버리지 66%
| 패턴 | 개수 | 추출 가능 정보 |
|------|-----:|---------------|
| `{N}-[{tag}]{title}.md` | 99 | kind, topic 힌트 |
| `*-prd.md` | 87 | kind=prd |
| `handoff-YYYY-MM-DD-*.md` | 16 | kind=handoff, created 힌트 |
| `*-plan.md` | 8 | kind=plan |
| `summary.md` | 7 | kind=summary |
| `README.md` | 4 | kind=readme |
| **규약 준수** | **221 (66%)** | L0 추출 강함 |
| 자유 네이밍 | 114 (34%) | Gemma 보조 필요 |

### 2.4 git log 시간축 — 부분 실패
- sample: `docs/0-inbox/handoff-2026-04-17-replay-design-fix.md` → `created/updated` **빈 값** (untracked)
- 원인: 신규 파일은 아직 git에 없음
- **대안 필요**: untracked는 (a) 파일명 날짜 parsing (`handoff-YYYY-MM-DD`) 또는 (b) `fs.stat` mtime fallback

---

## 3. 예상 L0 자동 추출 커버리지

| 필드 | 커버리지 | 방법 |
|------|---------:|------|
| `status` | **100%** | 폴더 매핑 (0-inbox→inbox, 1-projects→active, 3-resources→reference, 4-archive→archived, 5-backlogs→backlog) |
| `kind` | **66%** | 파일명 규약 매칭. 나머지 34%는 `kind: note` 기본값 |
| `created` / `updated` | ~**90%** | git log (커밋된 파일). untracked는 fallback |
| `title` | ~**95%** | 본문 첫 `# heading` AST 추출 |
| `topics` (자동 제안) | ~**50%** | 폴더명 + 파일명 `[tag]` 추출. 나머지는 Gemma |
| `parent` (가상 위계) | ~**30%** | 폴더 기반 1차 제안. 나머지는 Gemma+사람 |
| `supersedes` | **0%** | 명시적 선언만 (자동 불가) |

---

## 4. 함의 (PRD 설계 입력)

1. **소급 일괄 커밋 금지 확정**
   314 파일 단일 커밋은 리뷰 불가. **폴더별 분할 필수**, 우선순위: `0-inbox` → `1-projects` → `2-areas` → `3-resources` → `4-archive` → 기타

2. **`2-areas/`가 우선 타깃**
   전체 40% + frontmatter 0% → mddb 가치 증명 최대. PRD Phase 1 MVP는 2-areas 커버부터.

3. **규약 준수 66%는 강한 기반**
   Gemma 의존도 낮음. L0 스크립트가 잘 만들어지면 대부분 자동 처리.

4. **untracked 파일 처리 규칙 필수**
   파일명 날짜 parsing (handoff 패턴) 또는 mtime fallback을 스키마 extract 로직에 명시.

5. **기존 21개 frontmatter는 스키마 일관성 검증 필요**
   PRD에서 "기존 frontmatter 있으면 새 스키마로 merge, 누락 필드만 채움" 규칙 명시.

---

## 5. 다음 단계

- [ ] PRD 작성 (`/prd`) — 이 audit 결과를 입력으로
- [ ] PRD 포함 사항: L0 extract 규칙 테이블, 폴더 매핑, kind 매핑, untracked fallback, 소급 분할 커밋 순서
- [ ] Phase 1 MVP 범위: Zod schema + `extract.ts` + pre-commit hook (memory/ 제외, docs/ 한정)
- [ ] Phase 2: 로컬 Gemma 분류 — **별도 PRD** 또는 같은 PRD의 Phase 2 섹션
- [ ] Phase 3: `/knowledge` 라우트 뷰어 — 별도 PRD

#kind/note
