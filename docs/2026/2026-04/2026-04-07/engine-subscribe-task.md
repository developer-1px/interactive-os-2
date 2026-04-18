---
id: 2-areas/engine/prds/engine-subscribe-task
type: plan
slug: engineSubscribe
title: 'engine.subscribe — Task'
tags: [untagged]
created: 2026-04-07
updated: 2026-04-08
legacy:
  status: active
  kind: plan
  topics: [2-areas]
  relates: []
  supersedes: []
---
# engine.subscribe — Task

## 목표
engine에 subscribe API를 추가하여 모든 command dispatch 이벤트를 외부에서 구독 가능하게 한다.

## 액션 플랜

1. **types.ts** — `DispatchEvent`, `EngineEvent`, `Unsubscribe` 타입 추가. `CommandEngine`에 `subscribe` 메서드 추가
2. **createCommandEngine.ts** — subscribers Set, emit 함수, logCommand를 subscriber로 전환, lazy diff getter
3. **테스트** — subscribe 동작 검증 (이벤트 수신, unsubscribe, error 시 prev===next, 구독자 0명일 때 diff 미계산)

## 설계 결정 (실험에서 확정)
- `EngineEvent` 판별 유니온 (kind: 'dispatch')
- logger를 내부 subscriber로 전환 — diff 중복 계산 제거
- lazy diff: `get diff()` getter로 on-demand
- error 시 next === prev 보장
- parent 필드 없음 (batch children emit 안 함)
- Unsubscribe 패턴 (React useEffect cleanup 대응)

## 파일 변경
- `src/interactive-os/engine/types.ts`
- `src/interactive-os/engine/createCommandEngine.ts`
