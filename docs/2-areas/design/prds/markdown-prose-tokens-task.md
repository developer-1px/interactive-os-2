---
id: 2-areas/design/prds/markdown-prose-tokens-task
title: 'Markdown Prose 토큰 분리 및 base 정리'
status: active
kind: plan
created: 2026-04-02
updated: 2026-04-08
topics: [2-areas]
relates: []
supersedes: []
---
# Markdown Prose 토큰 분리 및 base 정리

## 액션 플랜

1. `tokens.css`에 `--type-prose-*` 토큰 추가 (size: 16px, line-height, letter-spacing)
2. `MarkdownViewer.module.css` 수정:
   - font-size → `--type-prose-size`
   - max-width: `65ch` → `48rem`
   - table: `width: max-content` + `min-width: 100%` 제거 → 본문 폭 내 제한
3. 앱 UI(14px) 불변, chat variant 영향 없음
