---
id: 2-areas/harness/settings
type: note
slug: settings
title: 'Settings — 훅 등록'
tags: [untagged]
created: 2026-04-04
updated: 2026-04-04
summary: '`.claude/settings.json`이 훅의 등록/매칭/실행 방식을 결정한다.'
legacy:
  status: active
  kind: note
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Settings — 훅 등록

> `.claude/settings.json`이 훅의 등록/매칭/실행 방식을 결정한다.

## 구조

```json
{
  "enabledPlugins": { ... },
  "hooks": {
    "PreToolUse":  [ ... ],  // 도구 실행 전 — block 가능
    "PostToolUse": [ ... ],  // 도구 실행 후 — 피드백만
    "Stop":        [ ... ]   // Claude 응답 완료 시 — block 가능
  }
}
```

## 훅 등록 형식

```json
{
  "matcher": "Edit|Write",        // 대상 도구 (|로 OR)
  "hooks": [{
    "type": "command",
    "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/xxx.mjs",
    "timeout": 3000,              // ms
    "async": false,               // true면 비동기 (block 불가)
    "statusMessage": "..."        // 상태바 메시지 (선택)
  }]
}
```

## 현재 등록 현황

### PreToolUse (5개)

| matcher | 훅 | timeout |
|---------|-----|---------|
| Bash | guardBash | 3s |
| Write | guardFilename | 3s |
| Write\|Edit | guardOsPatterns | 3s |
| Write\|Edit | guardCssAxes | 3s |
| Write\|Edit | guardCodePatterns | 3s |

### PostToolUse (5개)

| matcher | 훅 | timeout | async |
|---------|-----|---------|-------|
| Edit\|Write\|Bash | logAgentOps | 5s | true |
| Edit\|Write | checkDesignTokens | 3s | false |
| Write | checkTestComponents | 5s | false |
| Edit\|Write | checkFileSize | 3s | false |
| Edit\|Write | checkTypecheck | 15s | true |

### Stop (1개)

| matcher | 훅 | timeout |
|---------|-----|---------|
| (전체) | stopTestGate | 5s |

## 실행 순서

같은 이벤트 내에서 훅은 등록 순서대로 실행된다. Pre 훅이 block을 반환하면 이후 훅은 실행되지 않고 도구 실행도 중단된다.
