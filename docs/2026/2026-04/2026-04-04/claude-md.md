---
id: 2-areas/harness/claude-md
type: note
slug: claudeMd
title: 'CLAUDE.md — 규칙 레퍼런스'
tags: [untagged]
created: 2026-04-04
updated: 2026-04-04
summary: '`.claude/CLAUDE.md`는 강제력 ~50%. LLM이 매 세션 시작 시 읽지만, 복잡한 규칙은 무시될 수 있다. **기계적으로 잡을 수 있는 규칙은 훅으로 승격**하는 것이 원칙.'
legacy:
  status: active
  kind: note
  topics: [2-areas]
  relates: []
  supersedes: []
---
# CLAUDE.md — 규칙 레퍼런스

> `.claude/CLAUDE.md`는 강제력 ~50%. LLM이 매 세션 시작 시 읽지만, 복잡한 규칙은 무시될 수 있다.
> **기계적으로 잡을 수 있는 규칙은 훅으로 승격**하는 것이 원칙.

## 역할

- 아키텍처 레이어 구조 설명
- 앱 라우트 구조
- CMS 핵심 파일 매핑
- 디자인 시스템 (ax()) 소개
- 코딩 규칙 선언

## 훅 승격 상태

| CLAUDE.md 규칙 | 훅 승격 |
|---------------|---------|
| `import type { Foo }` 사용 | guardCodePatterns (인라인 타입만) + tsgo (verbatimModuleSyntax) |
| 파일명 = 주 export 식별자 | guardFilename |
| pages 네이밍 관례 | guardFilename |
| style={} 금지 | guardOsPatterns |
| addEventListener 금지 | guardOsPatterns |
| KeyMap 선언 사용 | guardOsPatterns (onKeyDown 차단) |
| os 기반 개발 | guardOsPatterns (9규칙) |
| ax()만 사용 | guardCssAxes + guardOsPatterns |
| mock 호출 검증 금지 | guardCodePatterns |
| docs/3-resources 파일명 | guardCodePatterns |
| 커밋 전 /simplify | 텍스트만 (훅화 미정) |
| PROGRESS.md 갱신 | /close 스킬에서 처리 |

## 남아있는 텍스트 전용 규칙

- 테스트 전략 (계산=unit, 인터랙션=통합)
- git mv 사용 (rename 시)
- 테스트 실패 시 원복 정책 (activeSessions.sh)

#kind/note #topic/harness
