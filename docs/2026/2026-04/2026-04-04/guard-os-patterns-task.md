---
id: 2-areas/harness/prds/guard-os-patterns-task
type: plan
slug: guardOsPatterns
title: guard-os-patterns hook
tags: [untagged]
created: 2026-04-04
updated: 2026-04-08
legacy:
  status: active
  kind: plan
  topics: [2-areas]
  relates: []
  supersedes: []
---
# guard-os-patterns hook

## 목적
Write/Edit 시 os 위반 패턴을 블로킹하는 PreToolUse hook

## 액션 플랜
1. `.claude/hooks/guardOsPatterns.mjs` 생성
2. `.claude/settings.json` PreToolUse에 Write|Edit matcher로 등록

## 감지 규칙

| 위반 | regex | 적용 범위 |
|------|-------|----------|
| primitives 직접 import | `from.*interactive-os/primitives` | src/pages/ |
| useAria/useAriaZone 직접 사용 | `useAria(Zone)?\b` import | src/pages/ |
| addEventListener key/mouse | `addEventListener\(.*['\"](key\|mouse)` | src/ 전체 |
| style={} 인라인 | `style\s*=\s*\{` | src/ 전체 (.test. 제외) |

## 제외
- node_modules, .test., __tests__, tokens.css
- src/interactive-os/ui/는 useAria 허용 (정상 사용)
- src/interactive-os/ 하위는 addEventListener 허용 (축/엔진 구현)

#kind/plan #topic/harness
