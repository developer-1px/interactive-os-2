---
id: chat-module
title: 'Agent Chat (Gen UI)'
status: prototype
kind: note
created: 2026-01
updated: 2026-04-17
summary: 'Anthropic Agent SDK + WebSocket 기반 채팅. Phase A는 텍스트, Phase B/C에서 tool UI·permission·인터랙티브 Gen UI 블록.'
topics: [1-projects, agent-sdk, chat, gen-ui, websocket]
parent: null
relates: []
supersedes: []
legacy:
  name: 'Agent Chat (Gen UI)'
  slug: chat-module
  layer: service
  maturity: 2
  deps: []
  routes: ['/chat']
  prds: []
  handoffs: []
  tags: [chat, gen-ui, agent-sdk, websocket]
  last_touched: 2026-04-10
---
# Agent Chat

Anthropic Agent SDK + WebSocket 기반 채팅. Phase A는 텍스트, Phase B/C에서 tool UI·permission·인터랙티브 Gen UI 블록.

## Insights
- 2026-02-10 · 설계: 채팅 블록 카탈로그 = AI→UI 변환 레이어의 최소 단위
- 2026-03-05 · 결정: WebSocket 세션 수명주기를 store가 소유, React는 subscribe만
- 2026-04-10 · 관찰: tool UI 미구현 상태에서 긴 코드 블록 스트리밍이 사용성 병목

## Decisions
- 2026-03-12 · Phase A(텍스트) 확정 후 Phase B(tool UI)로 확장 — 단계 역전 금지

## Gaps
- [ ] tool_use / tool_result 인터랙티브 블록 UI
- [ ] permission 모달 (도구 실행 사전 승인)
