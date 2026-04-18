---
id: 2-areas/engine/prds/enforce-command-keymap-design
type: note
slug: enforceCommandKeymapDesign
title: 'Command 패턴 강제 완성 — KeyHandler 통일 설계'
tags: [untagged]
created: 2026-04-05
updated: 2026-04-08
summary: '작성일: 2026-04-05 맥락: inspector가 plugin/override keyMap의 command를 표시하지 못하는 blind spot 수정'
legacy:
  status: active
  kind: note
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Command 패턴 강제 완성 — KeyHandler 통일 설계

> 작성일: 2026-04-05
> 맥락: inspector가 plugin/override keyMap의 command를 표시하지 못하는 blind spot 수정

## 문제

command 패턴(`defineCommands` + `key()` 팩토리)이 axis/pattern에서만 강제되고, plugin keyMap/keyMapOverrides/RouteKeyMap에서는 plain 함수를 허용한다. 결과:

1. plugin keyMap ~30개 바인딩이 inspector에서 command 빈칸
2. keyMapOverrides가 inspector에서 `owner: 'override'`만 표시
3. 새 plugin 작성 시 `key()` 없이 plain 함수로 우회 가능 — 강제가 아닌 권장

## 설계 원칙

- **`KeyHandler` = 유일한 keyMap entry 타입.** `.commands` 필수.
- **`key()` = `KeyHandler`를 만드는 유일한 팩토리.** plain 함수는 컴파일 에러.
- **`original` 데코레이터 유지.** plugin이 pattern handler를 위임할 수 있는 구조 보존.
- **RouteKeyMap은 별도 계약.** engine 밖(document-level)이라 PatternContext 없음. `defineRouteKey`의 `.type` required 강제.
- **inspector blind spot은 부수 효과로 해소.** inspector를 고치는 게 아니라 command 등록 강제를 완성하는 것.

## 변경 사항

### 1. KeyHandler 시그니처 통일

```typescript
// axis/types.ts — 변경 전
type KeyHandler = ((ctx: PatternContext) => Command | void) & { commands: readonly string[] }

// axis/types.ts — 변경 후
type KeyHandler = ((ctx: PatternContext, original?: () => Command | void) => Command | void) & { commands: readonly string[] }
```

`key()` 팩토리 API는 동일:
```typescript
function key(commands: readonly string[], handler: (ctx: PatternContext, original?: () => Command | void) => Command | void): KeyHandler
```

### 2. definePlugin.keyMap 타입 강제

```typescript
// definePlugin.ts — 변경 전
keyMap?: Record<string, (ctx: any) => any>

// definePlugin.ts — 변경 후
keyMap?: Record<string, KeyHandler>
```

### 3. keyMapOverrides 타입 강제

```typescript
// useAriaZone.ts, useAriaView.ts — 변경 전
Record<string, (ctx: ReturnType<typeof createPatternContext>) => Command | void>

// 변경 후
Record<string, KeyHandler>
```

### 4. wrapWithOriginal 타입 정리

```typescript
// useAriaView.ts — 변경 전
type PluginKeyMapHandler = (ctx: ..., original?: () => Command | void) => Command | void
type KeyMapHandler = (ctx: ...) => Command | void

// 변경 후
// 둘 다 삭제. KeyHandler로 통일.
// wrapWithOriginal: (inner: KeyHandler, outer: KeyHandler) => KeyHandler
```

`wrapWithOriginal`은 기존 동작 그대로 — `(ctx) => outer(ctx, () => inner(ctx))`. 반환하는 함수에 `.commands`를 합쳐서 붙인다:
```typescript
function wrapWithOriginal(inner: KeyHandler, outer: KeyHandler): KeyHandler {
  const merged = [...new Set([...inner.commands, ...outer.commands])]
  return key(merged, (ctx) => outer(ctx, () => inner(ctx)))
}
```

### 5. collectPluginKeyMaps 반환 타입

```typescript
// 변경 전
Record<string, PluginKeyMapHandler> | undefined

// 변경 후
Record<string, KeyHandler> | undefined
```

### 6. inspect 파이프라인 단순화

```typescript
// useAriaView.ts — 변경 전 (3가지 분기)
for (const [k, handler] of Object.entries(pattern.keyMap)) {
  desc[k] = { owner: 'pattern', command: handler.commands.join(' | ') }
}
if (pluginKeyMaps) {
  for (const k of Object.keys(pluginKeyMaps)) {
    desc[k] = { owner: 'plugin' }  // ← command 없음
  }
}
if (keyMapOverrides) {
  for (const k of Object.keys(keyMapOverrides)) {
    desc[k] = { owner: 'override' }  // ← command 없음
  }
}

// 변경 후 — 3분기 모두 .commands 읽기
for (const [k, handler] of Object.entries(pattern.keyMap)) {
  desc[k] = { owner: 'pattern', command: handler.commands.join(' | ') }
}
if (pluginKeyMaps) {
  for (const [k, handler] of Object.entries(pluginKeyMaps)) {
    if (desc[k]) {
      desc[k] = { ...desc[k]!, owner: `${desc[k]!.owner} + plugin`, command: handler.commands.join(' | ') }
    } else {
      desc[k] = { owner: 'plugin', command: handler.commands.join(' | ') }
    }
  }
}
if (keyMapOverrides) {
  for (const [k, handler] of Object.entries(keyMapOverrides)) {
    desc[k] = { owner: 'override', command: handler.commands.join(' | ') }
  }
}
```

### 7. defineRouteKey — `.type` required

```typescript
// defineRouteKey.ts — 변경 전
type RouteKeyHandler = (() => Command | void) & { type?: string; owner?: string }

// 변경 후
type RouteKeyHandler = (() => Command | void) & { type: string; owner?: string }
```

### 8. Plugin keyMap 전환 (11개 파일, ~30 사이트)

각 plugin의 keyMap entry를 `key()` 래핑:

```typescript
// 변경 전 (예: history.ts)
keyMap: {
  'Mod+Z': () => historyCommands.undo(),
  'Mod+Shift+Z': () => historyCommands.redo(),
}

// 변경 후
keyMap: {
  'Mod+Z': key(['history:undo'], () => historyCommands.undo()),
  'Mod+Shift+Z': key(['history:redo'], () => historyCommands.redo()),
}
```

`original` 데코레이터 사용 예 (spatial.ts):
```typescript
keyMap: {
  'Enter': key(['spatial:activate'], (ctx, original) => {
    // spatial 로직 또는 original에 위임
    if (shouldHandle(ctx)) return spatialCommands.activate(ctx.focused)
    return original?.()
  }),
}
```

### 9. 기존 AriaRoute 소비처 전환

`defineRouteKey` 미사용 AriaRoute (CMS, Birdseye, Viewer, AppShell 등)를 `defineRouteKey`로 전환.

## 변경하지 않는 것

- `key()` 팩토리 API (시그니처만 확장, 호출 방식 동일)
- `composePattern`, `mergeKeyMaps` (KeyHandler 호환)
- engine dispatch/history/middleware
- clickMap (이미 KeyHandler 타입)

## 영향 범위

| 계층 | 파일 수 | 변경 성격 |
|------|---------|----------|
| 타입 정의 | 3 | axis/types.ts, definePlugin.ts, useAriaView.ts |
| 인프라 | 3 | useAriaView.ts, useAriaZone.ts, defineRouteKey.ts |
| plugin | 11 | key() 래핑 추가 |
| pages (AriaRoute) | ~6 | defineRouteKey 전환 |

## 검증 기준

1. `pnpm typecheck` — `key()` 없이 keyMap에 plain 함수 넣으면 컴파일 에러
2. inspector — 모든 keyMap entry에 command 표시
3. `pnpm test` — 기존 1237 테스트 통과
4. spatial Enter/Escape — original 데코레이터 정상 동작
