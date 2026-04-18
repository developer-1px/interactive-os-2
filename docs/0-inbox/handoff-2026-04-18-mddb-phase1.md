---
id: handoff-2026-04-18-mddb-phase1
title: mddb Phase 1 — L0 결정적 frontmatter 인프라
status: inbox
kind: handoff
created: 2026-04-18
updated: 2026-04-18
---

# Handoff: mddb Phase 1

> discuss → prd → go 완주. 335 md 관리 인프라 착지. Phase 2·3은 별도 PRD로 대기.

## 완료

| 커밋 | 내용 |
|------|------|
| `a1e72aac` | feat(mddb): Phase 1 — L0 결정적 frontmatter 인프라 (18 파일, 6778 insertions) |
| (후속) | fix(mddb): Phase 1 pre-commit 훅 완전 soft — schema block 로직 제거 |

- `scripts/mddb/` 11 파일 — schema(Zod SSOT), L0 extract 체인(path/git/content), validate/audit/inject/cli
- `.claude/hooks/` 2 파일 — pre-commit 주입 soft + post-edit `updated` 갱신, `memory/` 이중 차단
- PRD `docs/2-areas/docs-infra/prds/mddb-phase1-prd.md` — Blueprint 🟢 6/6 (§7 역PRD 채움)
- audit `docs/0-inbox/mddb-audit-2026-04-18.md` — 335 md 현황 (소급 설계 입력)
- `pnpm mddb:{extract|validate|audit|inject}` 4개 CLI 동작 확인

**audit dry-run 실측:**
- 342 md / frontmatter 6.1% / L0 status 100% · kind 74% · title 99.4% · created 95.3%
- warnings: missing-frontmatter 321 · status-folder-mismatch 5 · legacy-field-preserved 19 · untracked-mtime-fallback 16 · created-after-updated 4

## 남은 것

### 미완료 (세션 교체 시 첫 작업)

1. **실제 소급 실행** — `pnpm mddb:inject --scope docs/0-inbox/` (폴더별 분할 커밋)
   - 순서: `0-inbox` → `1-projects` → `2-areas` → `3-resources` → `4-archive` → 기타
   - 각 폴더 완료 후 사용자 확인하고 다음 폴더로
   - warning 10건 넘으면 사용자 검토 (§5.3 임계치)
2. **§6 vitest 테스트 작성** — §5 경계 30건 커버리지. fixture 22개 구조 PRD §6 참고. Phase 2 deferred 상태

### 이후 (backlog)

- **Phase 2 PRD** — 로컬 Gemma로 topic/summary 제안 · `mddb-phase2-classify-prd.md`
- **Phase 3 PRD** — `/knowledge` 라우트 뷰어 (TreeGrid/Graph/Calendar 조합) · `mddb-phase3-viewer-prd.md`
- **기존 스킬 재정의 discuss** — `/para`, `/archive`, `/publish`, `/inbox`가 mddb schema를 읽고 쓰도록 흡수 (discuss 장애물 #3)
- **apca-w3 분리 커밋** — 이번 커밋에 섞인 focus contrast 부산물(`check:focus-apca`, `baseline:*`, `apca-w3` devDep)을 별도 커밋으로 분리
- **§5.3 임계치 튜닝** — status-folder-mismatch 경고 임계치 (현재 권고 ≥10, 실패 ≥50) 실측 후 조정
- **§4.6 훅 import 전략 재검토** — tsx subprocess(A) vs dynamic import(B). 성능·복잡도 실측 후 결정. (훅 block 기능 재도입 시 이 결정이 전제)
- **pre-existing 이슈** — `src/pages/catalog/catalog.generated.ts`의 `./catalogTypes` 누락 (mddb 무관, 별도 작업)

## 컨텍스트

- **PRD**: `docs/2-areas/docs-infra/prds/mddb-phase1-prd.md` (§7 역PRD 채워짐)
- **audit**: `docs/0-inbox/mddb-audit-2026-04-18.md`
- **discuss 요지**: frontmatter 6.3% → 자동화. 시간축·주제축·공식성 3축 + 개념 위계 자동 생성. scope = `docs/**` 한정 (`memory/` 제외 — Claude 자동 관리 영역)
- **주의사항**:
  - `memory/` 경로는 절대 건드리지 않음. paths.ts `isMemoryPath()` + settings.json matcher 이중 방어 확인
  - `pnpm mddb:inject`는 항상 `--dry-run` 우선. 일괄 실행 금지, 폴더별 분할
  - Phase 1은 L0(결정적) 추출만. Gemma 분류는 Phase 2 대기
  - explicit 소스 필드는 preserve. status-folder 불일치 시 warn + explicit 유지
  - 훅은 현재 Phase 1 완전 soft (block 없음). 엄격 검증은 `pnpm mddb:validate`로 명시 호출
  - 첫 세션 verify에서 pre-commit 훅이 자기 작성(신규 파일) 차단 버그 발견 → schema block 제거로 해소

## 이어받는 법 (다음 세션 AI가 읽을 지시문)

1. `pnpm mddb:audit` 실행하여 현 상태 스냅샷 확보
2. `pnpm mddb:inject --scope docs/0-inbox/ --dry-run --json`으로 변경 미리보기
3. 사용자 승인 후 `--dry-run` 제거하고 실행 → `chore(mddb): 소급 frontmatter 주입 [0-inbox]` 커밋
4. 다음 폴더 반복 (1-projects, 2-areas, 3-resources, 4-archive)

**구체적 첫 행동**: `pnpm mddb:audit` 실행 + 결과 사용자에게 보고.
