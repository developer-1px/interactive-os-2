---
id: mdConventions
type: resource
slug: mdConventions
title: md 작성 규칙 (frontmatter SSOT)
tags: [docs-infra, frontmatter, spec, convention]
created: 2026-04-19
updated: 2026-04-19
summary: docs/ 하위 모든 md 파일의 경로·frontmatter·쿼리 규격. mddb-lite 하단 해시태그 SSOT를 2026-04-19 폐기하고 frontmatter SSOT로 통일.
---

# md 작성 규칙

> **SSOT**: 모든 분류·수명주기·관계 정보는 **frontmatter**에 기록한다.
> 폴더는 오직 **시간축**. 하단 해시태그 라인은 **폐기**.

## 1. 경로

```
docs/YYYY/YYYY-MM/YYYY-MM-DD/{slug}.md
```

- `YYYY` 4자리 연도 · `YYYY-MM` 월 · `YYYY-MM-DD` 일 3단 폴더
- **생성일** 기준으로 배치 (갱신 시 이동하지 않음; `updated` 필드로 추적)
- PARA 폴더 (`0-inbox/1-projects/2-areas/3-resources/4-archive/5-backlogs`) 폐기

## 2. 파일명

```
{slug}.md
```

- `slug` = camelCase, 영문으로 시작 (`^[a-z][a-zA-Z0-9]*$`)
- 순번 prefix (`01-`, `02-`) **선택** (정렬 보조용; 의미 없음)
- 날짜 prefix 금지 (폴더가 이미 날짜)
- `[tag]` prefix 금지 (tags는 frontmatter)
- **예시**
  - `mdConventions.md`
  - `handoffCmuxPreviewPoc.md`
  - `a2uiSimulationPipeline.md`
  - `01-mandate.md` (순번 선택 사용 예)

## 3. Frontmatter (SSOT)

### 필수 (hard required)

| 필드 | 타입 | 규칙 |
|------|------|------|
| `id` | string | 고유 식별자. 기본 = slug |
| `type` | enum | `DOC_TYPES` 18종 중 하나 (§4) |
| `slug` | string | 파일명과 일치. camelCase |
| `title` | string | 본문 첫 H1과 일치 (자동 파생 가능) |
| `tags` | string[] | 최소 1개. camelCase/kebab-case 허용 |
| `created` | `YYYY-MM-DD` | 최초 생성일. git log --follow → tail |
| `updated` | `YYYY-MM-DD` | 마지막 수정일. git log -1 |

### 선택 (optional)

| 필드 | 타입 | 용도 |
|------|------|------|
| `summary` | string | 1~2문장 요약 |
| `status` | enum | `open` · `in_progress` · `consumed` · `merged` · `archived` |
| `project` | string | 서비스 식별자 (`cms` · `viewer` · `chat` 등) |
| `layer` | string | 레이어 식별자 (`ui` · `engine` · `axis` · `pattern` · `store` · `primitives` · `pages`) |
| `consumed_by` | string | handoff 소비 링크 (상대 경로) |
| `legacy` | object | pre-mddb 필드 보존 (`kind` · `topics` · `parent` · `relates` 등) |

### 스키마 정의

SSOT 코드: `scripts/mddb/schema.ts` → `DocFrontmatterSchema`.

## 4. Type 카탈로그

| type | 설명 |
|------|------|
| `prd` | Product Requirements Document. discuss → prd → go 파이프라인 산출물 |
| `plan` | 실행 계획서 (task 분해, 단계 정의) |
| `handoff` | 세션 간 인수인계 |
| `backlog` | 배경·검증 필요 보류 항목 |
| `retro` | 회고 |
| `audit` | 감사 보고 |
| `explain` | 해설 문서 (민토 피라미드 기반) |
| `pyramid` | SCQAPD 피라미드 |
| `minto` | 민토 구조화 |
| `story` | 유저스토리 맵 |
| `ia` | 정보 구조 설계 |
| `wireframe` | 와이어프레임 + 부품 매칭 |
| `inbox` | 임시 메모 / 일회성 기록 |
| `decision` | 결정 기록 (ADR 유사) |
| `area` | 지속 갱신 living doc (모듈/레이어 해설) |
| `resource` | 참고 자료 (외부 조사·방법론) |
| `archive` | 역할이 끝난 문서 |
| `note` | 분류 미정 기본값 |

## 5. Tag 컨벤션

- camelCase 또는 kebab-case
- 최소 1개 (schema enforce)
- **네임스페이스 구분자 금지**: `kind/xxx`·`topic/xxx` 같은 슬래시 계층 tag는 폐기 (이전 mddb-lite 관례). type/status/project/layer가 이미 필드로 있으므로 중복.
- **좋은 예**: `[cmux, preview, flatlayout]`, `[docs-infra, mddb, migration]`
- **나쁜 예**: `[kind/handoff, topic/cmux, status/open]` → 각각 `type`, `tags`, `status` 필드로 분리

## 6. 하단 태그 라인

**폐기 (2026-04-19)**.

- 파일 마지막 줄의 `#tag1 #tag2` 패턴은 더 이상 파싱되지 않는다
- 기존 파일의 하단 태그 라인은 `backfillFrontmatter` 실행 시 `tags` 필드로 흡수 후 제거

## 7. 쿼리

```bash
pnpm mddb query --type=handoff --status=open
pnpm mddb query --tag=cmux
pnpm mddb query --project=cms --type=prd
```

스킬이 "inbox 파일 목록" 같은 자연어를 내부적으로 위 쿼리로 번역한다.

## 8. 검증

모든 docs/.md 파일은 `pnpm mddb validate`를 통과해야 한다:

- `missing-type` / `missing-slug` / `missing-tags` → **error** (CI block)
- `schema-invalid` / `duplicate-id` / `duplicate-slug` / `date-path-mismatch` → **error**
- `slug-filename-mismatch` / `created-after-updated` → **warn**

훅: `.claude/hooks/md-validate.mjs`가 PostToolUse(Edit|Write)로 자동 호출.

## 9. 마이그레이션 이력

- 2026-04-18: mddb-lite-prd 확정 — 하단 해시태그 SSOT
- 2026-04-19: 본 문서 — frontmatter SSOT로 재정렬. mddb-lite-prd supersede.
  - 근거: Jekyll/Hugo/Astro/Docusaurus/Obsidian Properties 등 frontmatter SSOT가 사실상 표준
  - PRD: `mdPathPolicyMigrationPrd.md`
