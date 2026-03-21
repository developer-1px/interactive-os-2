# Dispatch Logger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dispatch마다 LLM이 소비할 수 있는 구조화 로그를 출력하는 logger를 추가한다.

**Architecture:** logger는 일반 Middleware가 아니라 engine 내부에서 executor를 감싸는 형태로 동작한다. Middleware는 `getStore()`에 접근할 수 없으므로, prev/next diff 계산을 위해 engine이 직접 로깅한다. `computeStoreDiff` 순수 함수가 diff를 계산하고, `LogEntry` 구조체를 delegate 함수에 전달한다. `createCommandEngine`의 optional 4번째 인자 `EngineOptions`로 DEV 자동 활성/opt-out/커스텀 delegate를 지원한다.

**Tech Stack:** TypeScript, Vitest

**PRD:** `docs/superpowers/specs/2026-03-21-dispatch-logger-prd.md`

---

## File Structure

| 파일 | 역할 |
|------|------|
| Create: `src/interactive-os/core/computeStoreDiff.ts` | `StoreDiff` 타입 + `computeStoreDiff(prev, next)` 순수 함수 |
| Create: `src/interactive-os/core/dispatchLogger.ts` | `LogEntry`, `Logger`, `EngineOptions` 타입 + `defaultLogger` + `isBatchCommand` |
| Modify: `src/interactive-os/core/createCommandEngine.ts` | 4번째 인자 `EngineOptions` 추가, executor 감싸는 로깅 로직 |
| Create: `src/interactive-os/__tests__/dispatch-logger.test.ts` | 모든 검증 시나리오 |

---

### Task 1: computeStoreDiff — 순수 diff 계산

**Files:**
- Create: `src/interactive-os/__tests__/dispatch-logger.test.ts`
- Create: `src/interactive-os/core/computeStoreDiff.ts`

- [ ] **Step 1: Write failing tests for computeStoreDiff**

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { computeStoreDiff } from '../core/computeStoreDiff'
import type { NormalizedData } from '../core/types'

describe('computeStoreDiff', () => {
  const base: NormalizedData = {
    entities: {
      __focus__: { id: '__focus__', focusedId: 'a' },
      __selection__: { id: '__selection__', selected: ['a', 'b'] },
      item1: { id: 'item1', data: { name: 'Item 1' } },
      item2: { id: 'item2', data: { name: 'Item 2' } },
    },
    relationships: { __root__: ['item1', 'item2'] },
  }

  it('returns empty array when stores are identical', () => {
    expect(computeStoreDiff(base, base)).toEqual([])
  })

  it('detects meta entity value-level change', () => {
    const next = {
      ...base,
      entities: {
        ...base.entities,
        __focus__: { id: '__focus__', focusedId: 'b' },
      },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: '__focus__.focusedId', kind: 'changed', before: 'a', after: 'b' },
    ])
  })

  it('detects user entity added', () => {
    const next = {
      ...base,
      entities: {
        ...base.entities,
        item3: { id: 'item3', data: { name: 'Item 3' } },
      },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: 'entities', kind: 'added', after: 'item3' },
    ])
  })

  it('detects user entity removed', () => {
    const { item2: _, ...rest } = base.entities
    const next = { ...base, entities: rest }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: 'entities', kind: 'removed', before: 'item2' },
    ])
  })

  it('detects user entity changed (shallow)', () => {
    const next = {
      ...base,
      entities: {
        ...base.entities,
        item1: { id: 'item1', data: { name: 'Updated' } },
      },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: 'entities', kind: 'changed', before: 'item1', after: 'item1' },
    ])
  })

  it('detects relationship added ids', () => {
    const next = {
      ...base,
      relationships: { __root__: ['item1', 'item2', 'item3'] },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: '__root__', kind: 'added', after: 'item3' },
    ])
  })

  it('detects relationship removed ids', () => {
    const next = {
      ...base,
      relationships: { __root__: ['item1'] },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: '__root__', kind: 'removed', before: 'item2' },
    ])
  })

  it('detects meta entity with multiple changed fields', () => {
    const next = {
      ...base,
      entities: {
        ...base.entities,
        __selection__: { id: '__selection__', selected: ['c'] },
      },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: '__selection__.selected', kind: 'changed', before: ['a', 'b'], after: ['c'] },
    ])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/interactive-os/__tests__/dispatch-logger.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement computeStoreDiff**

```typescript
// src/interactive-os/core/computeStoreDiff.ts
import type { NormalizedData } from './types'

export interface StoreDiff {
  path: string
  kind: 'added' | 'removed' | 'changed'
  before?: unknown
  after?: unknown
}

function isMetaEntity(id: string): boolean {
  return id.startsWith('__')
}

export function computeStoreDiff(
  prev: NormalizedData,
  next: NormalizedData
): StoreDiff[] {
  if (prev === next) return []

  const diffs: StoreDiff[] = []

  // --- entities ---
  const prevIds = Object.keys(prev.entities)
  const nextIds = Object.keys(next.entities)
  const allIds = new Set([...prevIds, ...nextIds])

  for (const id of allIds) {
    const prevEntity = prev.entities[id]
    const nextEntity = next.entities[id]

    if (!prevEntity && nextEntity) {
      if (isMetaEntity(id)) {
        for (const [key, val] of Object.entries(nextEntity)) {
          if (key === 'id') continue
          diffs.push({ path: `${id}.${key}`, kind: 'added', after: val })
        }
      } else {
        diffs.push({ path: 'entities', kind: 'added', after: id })
      }
    } else if (prevEntity && !nextEntity) {
      if (isMetaEntity(id)) {
        for (const [key, val] of Object.entries(prevEntity)) {
          if (key === 'id') continue
          diffs.push({ path: `${id}.${key}`, kind: 'removed', before: val })
        }
      } else {
        diffs.push({ path: 'entities', kind: 'removed', before: id })
      }
    } else if (prevEntity && nextEntity && prevEntity !== nextEntity) {
      if (isMetaEntity(id)) {
        const allKeys = new Set([
          ...Object.keys(prevEntity),
          ...Object.keys(nextEntity),
        ])
        for (const key of allKeys) {
          if (key === 'id') continue
          const pv = prevEntity[key]
          const nv = nextEntity[key]
          if (pv !== nv) {
            if (pv === undefined) {
              diffs.push({ path: `${id}.${key}`, kind: 'added', after: nv })
            } else if (nv === undefined) {
              diffs.push({ path: `${id}.${key}`, kind: 'removed', before: pv })
            } else {
              diffs.push({ path: `${id}.${key}`, kind: 'changed', before: pv, after: nv })
            }
          }
        }
      } else {
        diffs.push({ path: 'entities', kind: 'changed', before: id, after: id })
      }
    }
  }

  // --- relationships (id-level diff) ---
  const allRelKeys = new Set([
    ...Object.keys(prev.relationships),
    ...Object.keys(next.relationships),
  ])
  for (const key of allRelKeys) {
    const pArr = prev.relationships[key]
    const nArr = next.relationships[key]
    if (pArr === nArr) continue

    if (!pArr && nArr) {
      for (const id of nArr) diffs.push({ path: key, kind: 'added', after: id })
    } else if (pArr && !nArr) {
      for (const id of pArr) diffs.push({ path: key, kind: 'removed', before: id })
    } else if (pArr && nArr) {
      const prevSet = new Set(pArr)
      const nextSet = new Set(nArr)
      for (const id of nArr) {
        if (!prevSet.has(id)) diffs.push({ path: key, kind: 'added', after: id })
      }
      for (const id of pArr) {
        if (!nextSet.has(id)) diffs.push({ path: key, kind: 'removed', before: id })
      }
    }
  }

  return diffs
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/interactive-os/__tests__/dispatch-logger.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/core/computeStoreDiff.ts src/interactive-os/__tests__/dispatch-logger.test.ts
git commit -m "feat(logger): add computeStoreDiff with id-level relationship diff"
```

---

### Task 2: dispatchLogger 타입 + defaultLogger

**Files:**
- Modify: `src/interactive-os/__tests__/dispatch-logger.test.ts`
- Create: `src/interactive-os/core/dispatchLogger.ts`

이 파일은 타입 정의와 포맷터만 담당한다. 실제 로깅 로직은 Task 3에서 engine 내부에 구현한다.

- [ ] **Step 1: Write failing tests for defaultLogger**

`dispatch-logger.test.ts`에 아래 테스트 추가:

```typescript
import { defaultLogger } from '../core/dispatchLogger'
import type { LogEntry } from '../core/dispatchLogger'

describe('defaultLogger', () => {
  it('formats single command as structured string', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))

    defaultLogger({
      seq: 1,
      type: 'core:focus',
      payload: { nodeId: 'item1' },
      diff: [{ path: '__focus__.focusedId', kind: 'changed' as const, before: '', after: 'item1' }],
    })

    console.log = origLog
    expect(logs[0]).toContain('[dispatch #1]')
    expect(logs[0]).toContain('core:focus')
    expect(logs[0]).toContain('∆')
  })

  it('formats error command', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))

    defaultLogger({
      seq: 3,
      type: 'bad:command',
      payload: {},
      diff: [],
      error: 'Boom',
    })

    console.log = origLog
    expect(logs[0]).toContain('ERROR')
    expect(logs[0]).toContain('Boom')
    expect(logs[0]).toContain('(rollback)')
  })

  it('formats no-change command', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))

    defaultLogger({
      seq: 2,
      type: 'core:focus',
      payload: { nodeId: 'item1' },
      diff: [],
    })

    console.log = origLog
    expect(logs[0]).toContain('(no change)')
  })

  it('indents child entries', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))

    defaultLogger({
      seq: 2,
      type: 'core:focus',
      payload: { nodeId: 'item1' },
      diff: [],
      parent: 1,
    })

    console.log = origLog
    expect(logs[0]).toMatch(/^\s{2}/)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/interactive-os/__tests__/dispatch-logger.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement dispatchLogger.ts**

```typescript
// src/interactive-os/core/dispatchLogger.ts
import type { Command, BatchCommand } from './types'
import type { StoreDiff } from './computeStoreDiff'

export interface LogEntry {
  seq: number
  type: string
  payload: unknown
  diff: StoreDiff[]
  parent?: number
  error?: string
}

export type Logger = (entry: LogEntry) => void

export interface EngineOptions {
  logger?: boolean | Logger
}

function truncatePayload(payload: unknown): string {
  const str = JSON.stringify(payload)
  if (str && str.length > 200) {
    const keys = typeof payload === 'object' && payload !== null ? Object.keys(payload) : []
    return `{ ...truncated (${keys.length} keys) }`
  }
  return str ?? 'undefined'
}

function formatDiff(diff: StoreDiff[]): string {
  if (diff.length === 0) return '(no change)'
  return diff
    .map((d) => {
      if (d.kind === 'added') return `∆ ${d.path}: +${JSON.stringify(d.after)}`
      if (d.kind === 'removed') return `∆ ${d.path}: -${JSON.stringify(d.before)}`
      return `∆ ${d.path}: ${JSON.stringify(d.before)} → ${JSON.stringify(d.after)}`
    })
    .join(' | ')
}

export const defaultLogger: Logger = (entry) => {
  const indent = entry.parent != null ? '  ' : ''
  const prefix = `${indent}[dispatch #${entry.seq}]`

  if (entry.error) {
    console.log(`${prefix} ERROR ${entry.type} | ${truncatePayload(entry.payload)} | "${entry.error}" | (rollback)`)
    return
  }

  console.log(`${prefix} ${entry.type} | ${truncatePayload(entry.payload)} | ${formatDiff(entry.diff)}`)
}

export function isBatchCommand(cmd: Command): cmd is BatchCommand {
  return cmd.type === 'batch' && 'commands' in cmd
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/interactive-os/__tests__/dispatch-logger.test.ts`
Expected: computeStoreDiff + defaultLogger tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/core/dispatchLogger.ts src/interactive-os/__tests__/dispatch-logger.test.ts
git commit -m "feat(logger): add LogEntry/Logger types and defaultLogger formatter"
```

---

### Task 3: createCommandEngine에 EngineOptions + logger 통합

**Files:**
- Modify: `src/interactive-os/core/createCommandEngine.ts`
- Modify: `src/interactive-os/__tests__/dispatch-logger.test.ts`

logger는 일반 Middleware가 아니라 engine 내부에서 executor를 감싸는 형태로 동작한다. Middleware의 `(next) => (command) => void` 시그니처는 `getStore()`에 접근할 수 없으므로, prev/next store를 캡처할 수 없다. 따라서 engine의 `executor` 함수 내부에서 로깅한다.

batch children은 재실행하지 않는다 (closure 기반 undo 상태가 오염됨). 부모 entry에 전체 diff를 담고, 자식은 type/payload만 기록한다 (diff 빈 배열). 중첩 batch는 재귀적으로 풀어쓴다.

- [ ] **Step 1: Write failing integration tests**

`dispatch-logger.test.ts`에 아래 테스트 추가:

```typescript
import { createCommandEngine } from '../core/createCommandEngine'
import { createStore } from '../core/createStore'
import { focusCommands } from '../plugins/core'
import { createBatchCommand } from '../core/types'
import type { Command } from '../core/types'
import type { LogEntry } from '../core/dispatchLogger'

describe('engine logger integration', () => {
  function setup(logger: (entry: LogEntry) => void) {
    const store = createStore({
      entities: {
        item1: { id: 'item1', data: { name: 'A' } },
        item2: { id: 'item2', data: { name: 'B' } },
      },
      relationships: { __root__: ['item1', 'item2'] },
    })
    return createCommandEngine(store, [], () => {}, { logger })
  }

  it('logs single command with seq, type, payload, diff', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    engine.dispatch(focusCommands.setFocus('item1'))

    expect(entries).toHaveLength(1)
    expect(entries[0]!.seq).toBe(1)
    expect(entries[0]!.type).toBe('core:focus')
    expect(entries[0]!.payload).toEqual({ nodeId: 'item1' })
    expect(entries[0]!.diff.length).toBeGreaterThan(0)
    expect(entries[0]!.parent).toBeUndefined()
    expect(entries[0]!.error).toBeUndefined()
  })

  it('increments seq across dispatches', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    engine.dispatch(focusCommands.setFocus('item1'))
    engine.dispatch(focusCommands.setFocus('item2'))

    expect(entries[0]!.seq).toBe(1)
    expect(entries[1]!.seq).toBe(2)
  })

  it('logs batch with parent (full diff) + children (type/payload only)', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    const batch = createBatchCommand([
      focusCommands.setFocus('item1'),
      focusCommands.setFocus('item2'),
    ])
    engine.dispatch(batch)

    expect(entries).toHaveLength(3)
    // parent has diff
    expect(entries[0]!.type).toBe('batch')
    expect(entries[0]!.diff.length).toBeGreaterThan(0)
    expect(entries[0]!.parent).toBeUndefined()
    const parentSeq = entries[0]!.seq
    // children have no diff, just type/payload
    expect(entries[1]!.parent).toBe(parentSeq)
    expect(entries[1]!.diff).toEqual([])
    expect(entries[2]!.parent).toBe(parentSeq)
    expect(entries[2]!.diff).toEqual([])
  })

  it('handles nested batch recursively', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    const inner = createBatchCommand([
      focusCommands.setFocus('item1'),
    ])
    const outer = createBatchCommand([
      inner,
      focusCommands.setFocus('item2'),
    ])
    engine.dispatch(outer)

    // outer(1) → inner(2) → setFocus-item1(3) → setFocus-item2(4)
    expect(entries).toHaveLength(4)
    expect(entries[0]!.type).toBe('batch') // outer
    expect(entries[1]!.type).toBe('batch') // inner
    expect(entries[1]!.parent).toBe(entries[0]!.seq)
    expect(entries[2]!.parent).toBe(entries[0]!.seq) // inner's child → top-level parent
    expect(entries[3]!.parent).toBe(entries[0]!.seq)
  })

  it('logs no-change command with empty diff', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    engine.dispatch(focusCommands.setFocus('item1'))
    engine.dispatch(focusCommands.setFocus('item1'))

    expect(entries[1]!.diff).toEqual([])
  })

  it('logs error command with error field', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    const badCommand: Command = {
      type: 'bad:command',
      payload: {},
      execute() { throw new Error('Boom') },
      undo(s) { return s },
    }
    engine.dispatch(badCommand)

    expect(entries).toHaveLength(1)
    expect(entries[0]!.error).toBe('Boom')
    expect(entries[0]!.diff).toEqual([])
  })

  it('does not log when logger is false', () => {
    const entries: LogEntry[] = []
    const store = createStore({ entities: {}, relationships: { __root__: [] } })
    const engine = createCommandEngine(store, [], () => {}, { logger: false })
    // Use a second engine WITH logger to verify the delegate pattern works
    const engineWithLogger = createCommandEngine(store, [], () => {}, { logger: (e) => entries.push(e) })

    engine.dispatch(focusCommands.setFocus('x'))
    expect(entries).toHaveLength(0) // false → no delegate called

    engineWithLogger.dispatch(focusCommands.setFocus('x'))
    expect(entries).toHaveLength(1) // custom delegate → called
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/interactive-os/__tests__/dispatch-logger.test.ts`
Expected: FAIL — `EngineOptions` not recognized

- [ ] **Step 3: Modify createCommandEngine**

```typescript
// src/interactive-os/core/createCommandEngine.ts
import type { Command, Middleware, NormalizedData, BatchCommand } from './types'
import { computeStoreDiff } from './computeStoreDiff'
import type { LogEntry, Logger } from './dispatchLogger'
import type { EngineOptions } from './dispatchLogger'
import { defaultLogger, isBatchCommand } from './dispatchLogger'

export interface CommandEngine {
  dispatch(command: Command): void
  getStore(): NormalizedData
  /** Replace internal store with external data (for controlled/sync scenarios) */
  syncStore(newStore: NormalizedData): void
}

export function createCommandEngine(
  initialStore: NormalizedData,
  middlewares: Middleware[],
  onStoreChange: (store: NormalizedData) => void,
  options?: EngineOptions
): CommandEngine {
  let store = initialStore

  // --- resolve logger ---
  const resolveLogger = (): Logger | null => {
    if (options?.logger === false) return null
    if (typeof options?.logger === 'function') return options.logger
    // logger: true or undefined → DEV only
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      return defaultLogger
    }
    return null
  }
  const logger = resolveLogger()
  let seq = 0

  const logCommand = (
    command: Command,
    prev: NormalizedData,
    next: NormalizedData,
    parentSeq?: number,
    error?: string
  ) => {
    if (!logger) return
    seq++
    const entry: LogEntry = {
      seq,
      type: command.type,
      payload: command.payload,
      diff: error ? [] : computeStoreDiff(prev, next),
      ...(parentSeq != null ? { parent: parentSeq } : {}),
      ...(error ? { error } : {}),
    }
    logger(entry)

    // batch children: type/payload only, no re-execution
    if (!error && isBatchCommand(command)) {
      const topParentSeq = entry.seq
      const logChildren = (batch: BatchCommand) => {
        for (const child of batch.commands) {
          seq++
          logger({
            seq,
            type: child.type,
            payload: child.payload,
            diff: [],
            parent: topParentSeq,
          })
          // recurse for nested batch
          if (isBatchCommand(child)) {
            logChildren(child as BatchCommand)
          }
        }
      }
      logChildren(command as BatchCommand)
    }
  }

  const executor = (command: Command) => {
    const prev = store
    try {
      store = command.execute(store)
    } catch (error) {
      store = prev
      logCommand(command, prev, prev, undefined, error instanceof Error ? error.message : String(error))
      return
    }
    logCommand(command, prev, store)
    if (store !== prev) {
      onStoreChange(store)
    }
  }

  const chain = middlewares.reduceRight<(command: Command) => void>(
    (next, mw) => mw(next),
    executor
  )

  return {
    dispatch: (command) => chain(command),
    getStore: () => store,
    syncStore: (newStore: NormalizedData) => {
      // Silently replace internal store — no onStoreChange callback
      // This is for external data sync, not internal mutations
      store = newStore
    },
  }
}
```

- [ ] **Step 4: Run logger tests**

Run: `pnpm vitest run src/interactive-os/__tests__/dispatch-logger.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS — 기존 테스트는 옵션 생략 시 DEV에서 console.log가 나오지만 동작 영향 없음

- [ ] **Step 6: Commit**

```bash
git add src/interactive-os/core/createCommandEngine.ts src/interactive-os/__tests__/dispatch-logger.test.ts
git commit -m "feat(logger): integrate dispatch logger into createCommandEngine with EngineOptions"
```

---

### Task 4: 기존 테스트에서 logger 노이즈 방지

DEV 환경에서 기존 테스트의 `createCommandEngine` 직접 호출이 console.log를 출력한다. `{ logger: false }`를 추가하여 노이즈를 방지한다.

**Files:**
- Modify: `createCommandEngine`을 직접 호출하는 모든 테스트 파일

- [ ] **Step 1: Find all direct createCommandEngine calls in tests**

Run: `grep -rn "createCommandEngine(" src/interactive-os/__tests__/`

- [ ] **Step 2: Add `{ logger: false }` to each call**

각 `createCommandEngine(store, middlewares, callback)` 호출에 4번째 인자 `{ logger: false }` 추가.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS, 불필요한 console.log 없음

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/__tests__/
git commit -m "chore: suppress dispatch logger in existing tests"
```

---

### Task 5: lint + 최종 검증

- [ ] **Step 1: Run lint**

Run: `pnpm lint`
Expected: 0 errors

- [ ] **Step 2: Run full test suite**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **Step 3: Run build**

Run: `pnpm build:lib`
Expected: SUCCESS

- [ ] **Step 4: Commit if any fixes needed**
