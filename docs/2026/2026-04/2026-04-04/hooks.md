---
id: 2-areas/harness/hooks
title: 'Hooks — 기계적 강제'
created: 2026-04-04
updated: 2026-04-04
summary: '훅은 강제력 100%. regex/파일 체크로 위반을 감지하고 block 또는 warning을 반환한다. 모든 훅은 `.claude/hooks/*.mjs` (ESM), stdin으로 JSON 입력, stdout/stderr로 출력.'
legacy:
  status: active
  kind: note
  topics: [2-areas, async]
  relates: []
  supersedes: []
---
# Hooks — 기계적 강제

> 훅은 강제력 100%. regex/파일 체크로 위반을 감지하고 block 또는 warning을 반환한다.
> 모든 훅은 `.claude/hooks/*.mjs` (ESM), stdin으로 JSON 입력, stdout/stderr로 출력.

## Pre 훅 (차단) — 5개

코드 작성 시점에 위반을 감지하면 **block** 반환하여 도구 실행을 막는다.

### guardBash — PreToolUse(Bash)

**역할:** 비가역 git 명령 차단

| 차단 패턴 | 이유 |
|----------|------|
| `git stash` (main 브랜치) | 전체 원복 금지 |
| `git checkout .` / `git restore .` | 전체 원복 금지 — 개별 파일만 |
| `git clean -f` | untracked 삭제 금지 |
| `git reset --hard` | 히스토리 파괴 |
| `git push --force` / `-f` | 원격 히스토리 파괴 |
| `git branch -D` | `-d`(소문자) 사용 |

### guardFilename — PreToolUse(Write)

**역할:** 파일명 관례 검증

| 규칙 | 예시 |
|------|------|
| kebab-case 금지 | `my-component.tsx` �� `MyComponent.tsx` |
| pages/ `*Layout.tsx` 금지 | `CmsLayout.tsx` → `PageCms.tsx` |
| pages/ `*Adapter.ts` 금지 | `cmsAdapter.ts` → `cmsTransform.ts` |

**제외:** .css, .json, .md, docs/, __tests__, node_modules

### guardOsPatterns — PreToolUse(Write|Edit)

**역할:** interactive-os 우회 코딩 차단. LLM이 학습하지 않은 os 프레임워크 대신 vanilla React를 쓰는 것을 방지.

| # | 차단 패턴 | os 대안 | 적용 범위 |
|---|----------|---------|----------|
| 1 | primitives 직접 import | ui/ 완성품 사용 | pages/ only |
| 2 | useAria/useAriaZone | ui/ 완성품 사용 | pages/ only |
| 3 | addEventListener('key*'/'mouse*') | KeyMap 선언 | src/ (exempt 제외) |
| 4 | style={{}} 인라인 | ax() / module.css | src/ (backgroundImage, var() 예외) |
| 5 | onKeyDown/onKeyUp JSX 핸들러 | KeyMap 선언 | src/ (exempt 제외) |
| 6 | role="listbox" 등 수동 ARIA | pattern 자동 생성 | src/ (exempt 제외) |
| 7 | aria-selected/expanded 등 | axis 자동 생성 | src/ (exempt 제외) |
| 8 | ref.current.focus() | engine 포커스 관리 | src/ (exempt 제외) |
| 9 | useState(selected/expanded/focused/active/checked) | NormalizedData + Command | src/ (exempt 제외) |

**제외 폴더:** `src/interactive-os/` (os 내부), `src/devtools/`, `src/styles/`

### guardCssAxes — PreToolUse(Write|Edit)

**역할:** module.css에서 ax() 12축이 소유하는 CSS 속성 직접 사용 차단

**대상:** `*.module.css` 파일만

**차단:** display, flex-direction, align-items, justify-content, gap, padding, width, height, font-size, font-weight, line-height, color, background, border, border-radius, box-shadow, cursor, opacity, overflow, flex, animation 등 40+ 속성

**허용:** var() 참조, inherit/initial/unset/none/0, position/z-index/transform/grid-template 등 ax()에 없는 last-mile 속성

### guardCodePatterns — PreToolUse(Write|Edit)

**역할:** 코드 안티패턴 차단

| 규칙 | 대상 | 차단 패턴 |
|------|------|----------|
| 인라인 타입 금지 | src/ ts/tsx | `: import('...')`, `<import('...')>` |
| @/styles/ 경로 금지 | src/ ts/tsx | `from '@/styles/'` → `@styles/` |
| mock 검증 금지 | *.test.* | `toHaveBeenCalled` |
| docs 파일명 형식 | docs/3-resources/ | `{순번}-[{태그}]{제목}.md` |

---

## Post 훅 (피드백) — 5개

코드 작성 직후 경고/정보를 stderr로 출력한다. block하지 않음.

### logAgentOps — PostToolUse(Edit|Write|Bash) [async]

**역할:** 세션 작업 로그. `.claude/agent-ops/{session_id}.ndjson`에 기록.

Write/Edit → 파일 경로, Bash → 커맨드를 로깅. stopTestGate의 판단 근거.

### checkDesignTokens — PostToolUse(Edit|Write)

**역할:** CSS/TSX에서 raw 디자인 수치 감지 (font-size: 14px 등). var() 토큰 사용 유도.

### checkTestComponents — PostToolUse(Write)

**역할:** 테스트 파일 컴포넌트 구조 검증.

### checkFileSize — PostToolUse(Edit|Write)

**역할:** src/ ts/tsx 파일이 300줄 초과 시 `/srp` 스킬 사용 제안.

### checkTypecheck — PostToolUse(Edit|Write) [async]

**역할:** tsgo(TypeScript Go port, `@typescript/native-preview`)로 전체 프로젝트 타입 체크. ~2초.

**설정:** `tsconfig.tsgo.json` 사용 (baseUrl 제거, paths를 tsgo 호환 형식).

---

## Stop 훅 (최종 게이트) — 1개

### stopTestGate — Stop

**역할:** Claude가 작업을 완료하려 할 때, src/ 코드 수정이 있는데 테스트를 실행하지 않았으면 block.

**판단 로직:**
1. `agent-ops/{session_id}.ndjson`에서 src/ 파일 수정 확인
2. 같은 로그에서 `pnpm test|vitest|typecheck|tsc` Bash 실행 확인
3. 수정 있고 테스트 없으면 → block

**조건:** `stop_reason === 'end_turn'`일 때만 (tool_use 중에는 무시)

#kind/note #topic/harness
