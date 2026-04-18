---
id: 2-areas/engine/prds/enforce-command-keymap-plan
title: 'Command 패턴 강제 완성 Implementation Plan'
created: 2026-04-05
updated: 2026-04-08
summary: '**For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.'
legacy:
  status: active
  kind: plan
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Command 패턴 강제 완성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 keyMap entry가 `KeyHandler` 타입(`.commands` 필수)을 사용하도록 강제하여 inspector blind spot을 구조적으로 제거한다.

**Architecture:** `KeyHandler` 시그니처에 `original?` 파라미터를 추가하여 axis/plugin/override 구분 없이 단일 타입으로 통일. `key()` 팩토리 없이는 keyMap에 등록 불가능하게 타입을 닫는다. `defineRouteKey`는 engine 밖 계약으로 `.type` required 강제.

**Tech Stack:** TypeScript strict typing, vitest

**Spec:** `docs/superpowers/specs/2026-04-05-enforce-command-keymap-design.md`

---

### Task 1: KeyHandler 시그니처 확장 + wrapWithOriginal 수정

**Files:**
- Modify: `src/interactive-os/axis/types.ts:110-115`
- Modify: `src/interactive-os/primitives/useAriaView.ts:14-22`

- [ ] **Step 1: KeyHandler에 original 파라미터 추가**

`src/interactive-os/axis/types.ts`:

```typescript
// 변경 전 (line 110)
export type KeyHandler = ((ctx: PatternContext) => Command | void) & { commands: readonly string[] }

// 변경 후
export type KeyHandler = ((ctx: PatternContext, original?: () => Command | void) => Command | void) & { commands: readonly string[] }
```

`key()` 팩토리도 동일하게 (line 113):

```typescript
// 변경 전
export function key(commands: readonly string[], handler: (ctx: PatternContext) => Command | void): KeyHandler {

// 변경 후
export function key(commands: readonly string[], handler: (ctx: PatternContext, original?: () => Command | void) => Command | void): KeyHandler {
```

- [ ] **Step 2: useAriaView의 PluginKeyMapHandler/KeyMapHandler 타입 삭제, KeyHandler로 통일**

`src/interactive-os/primitives/useAriaView.ts`:

```typescript
// 삭제 (lines 17-18)
type KeyMapHandler = (ctx: ReturnType<typeof createPatternContext>) => Command | void
type PluginKeyMapHandler = (ctx: ReturnType<typeof createPatternContext>, original?: () => Command | void) => Command | void

// 대신 import 추가
import type { KeyHandler } from '../axis/types'
```

- [ ] **Step 3: wrapWithOriginal을 KeyHandler 기반으로 수정**

`src/interactive-os/primitives/useAriaView.ts`:

```typescript
// 변경 전 (lines 20-23)
function wrapWithOriginal(inner: KeyMapHandler, outer: PluginKeyMapHandler): KeyMapHandler {
  return (ctx) => outer(ctx, () => inner(ctx))
}

// 변경 후
function wrapWithOriginal(inner: KeyHandler, outer: KeyHandler): KeyHandler {
  const merged = [...new Set([...inner.commands, ...outer.commands])]
  return key(merged, (ctx) => outer(ctx, () => inner(ctx)))
}
```

`key` import 추가: `import { key } from '../axis/types'`

- [ ] **Step 4: collectPluginKeyMaps 반환 타입 수정**

```typescript
// 변경 전 (line 27)
export function collectPluginKeyMaps(plugins: Plugin[]): Record<string, PluginKeyMapHandler> | undefined {
  const merged: Record<string, PluginKeyMapHandler> = {}

// 변경 후
export function collectPluginKeyMaps(plugins: Plugin[]): Record<string, KeyHandler> | undefined {
  const merged: Record<string, KeyHandler> = {}
```

- [ ] **Step 5: mergedKeyMap 조립의 타입 수정**

`src/interactive-os/primitives/useAriaView.ts` (lines 123-133):

```typescript
// 변경 전
const mergedKeyMap = useMemo(() => {
  const base: Record<string, KeyMapHandler> = { ...pattern.keyMap }
  if (pluginKeyMaps) {
    for (const [key, handler] of Object.entries(pluginKeyMaps)) {
      const patternHandler = base[key]
      base[key] = patternHandler ? wrapWithOriginal(patternHandler, handler) : handler as KeyMapHandler
    }
  }
  if (keyMapOverrides) Object.assign(base, keyMapOverrides)
  return base
}, [pattern.keyMap, pluginKeyMaps, keyMapOverrides])

// 변경 후 — KeyMapHandler → KeyHandler, cast 제거
const mergedKeyMap = useMemo(() => {
  const base: Record<string, KeyHandler> = { ...pattern.keyMap }
  if (pluginKeyMaps) {
    for (const [k, handler] of Object.entries(pluginKeyMaps)) {
      const patternHandler = base[k]
      base[k] = patternHandler ? wrapWithOriginal(patternHandler, handler) : handler
    }
  }
  if (keyMapOverrides) Object.assign(base, keyMapOverrides)
  return base
}, [pattern.keyMap, pluginKeyMaps, keyMapOverrides])
```

- [ ] **Step 6: typecheck 실행**

Run: `pnpm typecheck 2>&1 | head -30`
Expected: definePlugin keyMap 타입 불일치 에러 다수 (아직 plugin 미전환이므로 예상됨). axis/types.ts, useAriaView.ts 자체 에러는 0.

- [ ] **Step 7: Commit**

```bash
git add src/interactive-os/axis/types.ts src/interactive-os/primitives/useAriaView.ts
git commit -m "refactor: unify KeyHandler type with original parameter

KeyHandler 시그니처에 original? 추가, PluginKeyMapHandler/KeyMapHandler 삭제.
wrapWithOriginal이 .commands를 합쳐서 보존."
```

---

### Task 2: definePlugin.keyMap 타입 강제

**Files:**
- Modify: `src/interactive-os/plugins/definePlugin.ts:12`
- Modify: `src/interactive-os/plugins/types.ts` (Plugin interface)

- [ ] **Step 1: definePlugin keyMap 타입을 KeyHandler로 변경**

`src/interactive-os/plugins/definePlugin.ts`:

```typescript
// 변경 전 (line 12)
keyMap?: Record<string, (ctx: any) => any>

// 변경 후
keyMap?: Record<string, import('../axis/types').KeyHandler>
```

- [ ] **Step 2: Plugin interface의 keyMap 타입도 동일하게 수정**

`src/interactive-os/plugins/types.ts`에서 Plugin interface의 keyMap 필드를 찾아 동일하게 수정:

```typescript
keyMap?: Record<string, import('../axis/types').KeyHandler>
```

- [ ] **Step 3: typecheck로 미전환 plugin 목록 확인**

Run: `pnpm typecheck 2>&1 | grep 'error TS'`
Expected: 각 plugin의 keyMap에서 타입 에러. 이 목록이 Task 3의 전환 대상.

- [ ] **Step 4: Commit**

```bash
git add src/interactive-os/plugins/definePlugin.ts src/interactive-os/plugins/types.ts
git commit -m "refactor: enforce KeyHandler type on definePlugin.keyMap

plain 함수는 컴파일 에러. key() 팩토리 필수."
```

---

### Task 3: Plugin keyMap 전환 — key() 래핑

**Files:**
- Modify: `src/interactive-os/plugins/history.ts:81-84`
- Modify: `src/interactive-os/plugins/search.ts:83-85`
- Modify: `src/interactive-os/plugins/crud.ts:43-46`
- Modify: `src/interactive-os/plugins/dnd.ts:74-77`
- Modify: `src/interactive-os/plugins/clipboard.ts:477-483`
- Modify: `src/interactive-os/plugins/edit.ts:16-31`
- Modify: `src/interactive-os/plugins/cellEdit.ts:9-16`
- Modify: `src/interactive-os/plugins/combobox.ts:76-115`
- Modify: `src/interactive-os/plugins/spatial.ts:57-84`
- Modify: `src/pages/writer/PageWriter.tsx:390-505` (writerKeys plugin)

각 plugin에 `import { key } from '../axis/types'` (또는 적절한 상대경로) 추가 후 keyMap entry를 `key()` 래핑.

- [ ] **Step 1: history.ts**

```typescript
import { key } from '../axis/types'

keyMap: {
  'Mod+Z': key(['history:undo'], () => historyCommands.undo()),
  'Mod+Shift+Z': key(['history:redo'], () => historyCommands.redo()),
},
```

- [ ] **Step 2: search.ts**

```typescript
import { key } from '../axis/types'

keyMap: {
  'Mod+F': key(['search:activate'], () => searchCommands.activateSearch()),
},
```

- [ ] **Step 3: crud.ts**

```typescript
import { key } from '../axis/types'

keyMap: {
  'Delete': key(['crud:remove'], (ctx) => crudCommands.remove(ctx.focused)),
  'Backspace': key(['crud:remove'], (ctx) => crudCommands.remove(ctx.focused)),
},
```

- [ ] **Step 4: dnd.ts**

```typescript
import { key } from '../axis/types'

keyMap: {
  'Mod+ArrowUp': key(['dnd:moveUp'], (ctx) => dndCommands.moveUp(ctx.focused)),
  'Mod+ArrowDown': key(['dnd:moveDown'], (ctx) => dndCommands.moveDown(ctx.focused)),
},
```

- [ ] **Step 5: clipboard.ts**

```typescript
import { key } from '../axis/types'

keyMap: {
  'Mod+D': key(['clipboard:copy', 'clipboard:duplicateAfter'], (ctx) => {
    const ids = resolveTargetIds(ctx)
    ctx.dispatch(clipboardCommands.copy(ids))
    return clipboardCommands.duplicateAfter(ids.at(-1)!)
  }),
},
```

Note: ctx 타입이 `{ focused, selected?, dispatch }` — PatternContext에 dispatch가 있는지 확인 필요. 없으면 ctx.dispatch 호출을 middleware로 이동하거나 ctx 타입을 확인.

- [ ] **Step 6: edit.ts**

```typescript
import { key } from '../axis/types'

export function edit(options?: EditOptions): Plugin {
  const keyMapEntries: Record<string, KeyHandler> = {
    'F2': key(['rename:start'], (ctx) => renameCommands.startRename(ctx.focused)),
    'Enter': key(['rename:start'], (ctx) => renameCommands.startRename(ctx.focused)),
    'Delete': key(['crud:remove'], (ctx) => crudCommands.remove(ctx.focused)),
    'Alt+ArrowUp': key(['dnd:moveUp'], (ctx) => dndCommands.moveUp(ctx.focused)),
    'Alt+ArrowDown': key(['dnd:moveDown'], (ctx) => dndCommands.moveDown(ctx.focused)),
  }

  if (options?.tree) {
    keyMapEntries['Alt+ArrowLeft'] = key(['dnd:moveOut'], (ctx) => dndCommands.moveOut(ctx.focused))
    keyMapEntries['Alt+ArrowRight'] = key(['dnd:moveIn'], (ctx) => dndCommands.moveIn(ctx.focused))
  }

  return definePlugin({ name: 'edit', keyMap: keyMapEntries })
}
```

Remove the `eslint-disable-next-line @typescript-eslint/no-explicit-any` and the `any` type cast — `KeyHandler` is now the proper type.

- [ ] **Step 7: cellEdit.ts**

```typescript
import { key } from '../axis/types'

keyMap: {
  'Delete': key(['clipboard:clearCellValue'], (ctx) => clipboardCommands.clearCellValue(ctx.focused, ctx.grid?.colIndex ?? 0)),
  'Mod+X': key(['clipboard:cutCellValue'], (ctx) => clipboardCommands.cutCellValue(ctx.focused, ctx.grid?.colIndex ?? 0)),
  'Mod+C': key(['clipboard:copyCellValue'], (ctx) => clipboardCommands.copyCellValue(ctx.focused, ctx.grid?.colIndex ?? 0)),
  'Mod+V': key(['clipboard:pasteCellValue'], (ctx) => clipboardCommands.pasteCellValue(ctx.focused, ctx.grid?.colIndex ?? 0)),
  'Enter': key(['core:focus:next'], (ctx) => ctx.focusNext()),
  'Shift+Enter': key(['core:focus:prev'], (ctx) => ctx.focusPrev()),
},
```

Note: `ctx.grid` — PatternContext에 `grid` 필드가 있는지 확인 필요. cellEdit은 grid 전용 plugin이므로 PatternContext에 포함되어 있을 것.

- [ ] **Step 8: combobox.ts**

```typescript
import { key } from '../axis/types'

keyMap: {
  ArrowDown: key(['combobox:open', 'core:focus:next'], (ctx) => {
    const entity = ctx.getEntity('__combobox__')
    const isOpen = (entity as Record<string, unknown> | undefined)?.isOpen === true
    if (!isOpen) {
      ctx.dispatch(comboboxCommands.open())
      return ctx.focusFirst()
    }
    return ctx.focusNext()
  }),
  Enter: key(['core:select', 'combobox:open', 'combobox:close'], (ctx) => {
    const entity = ctx.getEntity('__combobox__')
    const isOpen = (entity as Record<string, unknown> | undefined)?.isOpen === true
    if (isOpen) {
      if (selectionMode === 'multiple') {
        return ctx.selected!.toggle()
      }
      return createBatchCommand([
        selectionCommands.select(ctx.focused),
        comboboxCommands.close(),
      ])
    }
    return comboboxCommands.open()
  }),
  Escape: key(['combobox:close'], () => comboboxCommands.close()),
  Backspace: key(['core:select:toggle'], (ctx) => {
    if (selectionMode !== 'multiple') return undefined
    const entity = ctx.getEntity('__combobox__')
    const filterText = (entity as Record<string, unknown> | undefined)?.filterText ?? ''
    if (filterText !== '') return undefined
    const selected = ctx.selected?.ids ?? []
    if (selected.length > 0) {
      return selectionCommands.toggleSelect(selected[selected.length - 1])
    }
    return undefined
  }),
},
```

Remove `eslint-disable-next-line @typescript-eslint/no-explicit-any` lines.

- [ ] **Step 9: spatial.ts**

```typescript
import { key } from '../axis/types'

keyMap: {
  Enter: key(['spatial:enterChild', 'core:focus'], (ctx, original) => {
    const kids = ctx.getChildren(ctx.focused)
    if (kids.length > 0) {
      return createBatchCommand([
        spatialCommands.enterChild(ctx.focused),
        focusCommands.setFocus(kids[0]!),
      ])
    }
    const slotKids = ctx.getSlotChildren(ctx.focused)
    if (slotKids.length > 0) {
      return createBatchCommand([
        spatialCommands.enterChild(ctx.focused),
        focusCommands.setFocus(slotKids[0]!),
      ])
    }
    return original?.()
  }),
  Escape: key(['spatial:exitToParent', 'core:focus'], (ctx, original) => {
    const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
    const parentId = spatialParent?.parentId as string | undefined
    if (!parentId || parentId === ROOT_ID) return original?.()
    return createBatchCommand([
      spatialCommands.exitToParent(),
      focusCommands.setFocus(parentId),
    ])
  }),
},
```

- [ ] **Step 10: writerKeys plugin (PageWriter.tsx)**

```typescript
import { key } from '@os/axis/types'
```

모든 keyMap entry를 `key()` 래핑. 예시 (전체 목록은 파일 참조):

```typescript
keyMap: {
  'Enter': key(['rename:start'], (ctx) => {
    const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
    if (d?.type === 'hr') return undefined
    return renameCommands.startRename(ctx.focused)
  }),
  'Mod+Enter': key(['writer:insert-after', 'rename:start'], (ctx) => {
    // ... existing handler body unchanged
  }),
  'Mod+Shift+Enter': key(['crud:create', 'rename:start'], (ctx) => {
    // ... existing handler body unchanged
  }),
  'Tab': key(['dnd:moveIn'], (ctx) => dndCommands.moveIn(ctx.focused)),
  'Shift+Tab': key(['dnd:moveOut'], (ctx) => dndCommands.moveOut(ctx.focused)),
  'Alt+ArrowUp': key(['writer:visible-swap'], (ctx) => {
    // ... existing handler body unchanged
  }),
  'Alt+ArrowDown': key(['writer:visible-swap'], (ctx) => {
    // ... existing handler body unchanged
  }),
  'Backspace': key(['crud:remove', 'rename:start'], (ctx) => {
    // ... existing handler body unchanged
  }),
  'Mod+l': key(['writer:wrap-list'], (ctx) => {
    // ... existing handler body unchanged
  }),
  'Mod+Shift+l': key(['writer:unwrap-list'], (ctx) => writerCommands.unwrapFromList(ctx.focused)),
  'Mod+Digit0': key(['writer:convert-type'], (ctx) => {
    // ... existing handler body unchanged
  }),
  'Mod+Shift+h': key(['writer:convert-type'], (ctx) => {
    // ... existing handler body unchanged
  }),
},
```

Note: WriterCtx vs PatternContext — writerKeys의 ctx는 `WriterCtx`로 커스텀 타입. `KeyHandler`가 `PatternContext`를 요구하므로 WriterCtx가 PatternContext를 extends하는지 확인 필요. 아니면 writerKeys의 ctx 접근 패턴을 PatternContext 기반으로 조정.

- [ ] **Step 11: typecheck 실행**

Run: `pnpm typecheck 2>&1 | head -40`
Expected: 0 errors (기존 PageProject 에러 제외)

- [ ] **Step 12: test 실행**

Run: `pnpm test 2>&1 | tail -5`
Expected: 모든 테스트 통과

- [ ] **Step 13: Commit**

```bash
git add src/interactive-os/plugins/ src/pages/writer/PageWriter.tsx
git commit -m "refactor: wrap all plugin keyMap entries with key() factory

11개 plugin의 ~30개 keyMap entry에 key() 래핑 추가.
command type이 정적으로 노출되어 inspector에서 표시 가능."
```

---

### Task 4: keyMapOverrides 타입 강제 (UI 컴포넌트)

**Files:**
- Modify: `src/interactive-os/ui/AriaZone.tsx:28`
- Modify: `src/interactive-os/ui/TabGroup.tsx:24`
- Modify: `src/interactive-os/ui/useTabList.ts:24`
- Modify: `src/interactive-os/ui/TabList.tsx:13`
- Modify: `src/interactive-os/ui/useNavList.ts:12`
- Modify: `src/interactive-os/ui/Grid.tsx:29`
- Modify: `src/interactive-os/ui/ListBox.tsx:19`
- Modify: `src/interactive-os/ui/Toolbar.tsx:24`
- Modify: `src/interactive-os/primitives/useAriaZone.ts` (keyMapOverrides 타입)

- [ ] **Step 1: 각 UI 컴포넌트의 keyMap prop 타입을 KeyHandler로 변경**

모든 파일에서:

```typescript
// 변경 전
keyMap?: Record<string, (ctx: PatternContext) => Command | void>

// 변경 후
keyMap?: Record<string, import('../axis/types').KeyHandler>
```

- [ ] **Step 2: useAriaZone의 keyMapOverrides 타입 수정**

```typescript
// 변경 전
keyMap?: Record<string, (ctx: ReturnType<typeof createPatternContext>) => Command | void>

// 변경 후
keyMap?: Record<string, KeyHandler>
```

- [ ] **Step 3: pages에서 keyMapOverrides로 전달하는 곳 전환**

keyMapOverrides 소비처 (CmsCanvas, CmsSidebar, CmsTemplatePicker, CmsFloatingToolbar 등)의 keyMap을 `key()` 래핑. 각 핸들러에서 반환하는 command type을 추적하여 `key([...commands], handler)` 형태로.

- [ ] **Step 4: typecheck + test**

Run: `pnpm typecheck 2>&1 | head -30`
Run: `pnpm test 2>&1 | tail -5`
Expected: 0 errors, 모든 테스트 통과

- [ ] **Step 5: Commit**

```bash
git add src/interactive-os/ui/ src/interactive-os/primitives/useAriaZone.ts src/pages/cms/
git commit -m "refactor: enforce KeyHandler type on keyMapOverrides

UI 컴포넌트 keyMap prop과 useAriaZone keyMapOverrides를 KeyHandler로 통일."
```

---

### Task 5: inspect 파이프라인 수정

**Files:**
- Modify: `src/interactive-os/primitives/useAriaView.ts:442-463`

- [ ] **Step 1: plugin/override inspect에서 .commands 읽기**

```typescript
useMemo(() => {
  const desc: Record<string, import('../engine/types').KeyMapEntry> = {}
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
  engine.setInspectKeyMap(desc)
}, [pattern.keyMap, pluginKeyMaps, keyMapOverrides, engine])
```

- [ ] **Step 2: typecheck + test**

Run: `pnpm typecheck 2>&1 | head -20`
Run: `pnpm test 2>&1 | tail -5`
Expected: 0 errors, 모든 테스트 통과

- [ ] **Step 3: Commit**

```bash
git add src/interactive-os/primitives/useAriaView.ts
git commit -m "refactor: inspector reads .commands from all keyMap sources

plugin/override keyMap도 handler.commands를 읽어 inspector에 command 표시."
```

---

### Task 6: defineRouteKey .type required + AriaRoute 소비처 전환

**Files:**
- Modify: `src/interactive-os/primitives/defineRouteKey.ts:4`
- Modify: `src/AppShell.tsx:38-43`
- Modify: `src/pages/cms/PageCms.tsx:52-54`
- Modify: `src/pages/cms/CmsPresentMode.tsx:19-21`
- Modify: `src/pages/birdseye/PageBirdseye.tsx:82-90`
- Modify: `src/pages/viewer/PageViewer.tsx:150-157`
- Modify: `src/pages/viewer/widgets/FilePanel.tsx:22-24`

- [ ] **Step 1: defineRouteKey .type required**

`src/interactive-os/primitives/defineRouteKey.ts`:

```typescript
// 변경 전 (line 4)
export type RouteKeyHandler = (() => Command | void) & { type?: string; owner?: string }

// 변경 후
export type RouteKeyHandler = (() => Command | void) & { type: string; owner?: string }
```

- [ ] **Step 2: AppShell.tsx 전환**

```typescript
import { defineRouteKey } from '@os/primitives/defineRouteKey'

const shellKeyMap = useMemo(() => ({
  'Mod+Shift+I': defineRouteKey('shell:open-inspector', () => openInspectorWindow(), 'Shell'),
}), [])
```

- [ ] **Step 3: PageCms.tsx 전환**

```typescript
import { defineRouteKey } from '@os/primitives/defineRouteKey'

const cmsGlobalKeyMap = useMemo(() => ({
  'Mod+\\': defineRouteKey('cms:toggle-present', () => setPresenting(prev => !prev), 'CMS'),
}), [])
```

- [ ] **Step 4: CmsPresentMode.tsx 전환**

```typescript
import { defineRouteKey } from '@os/primitives/defineRouteKey'

const keyMap = useMemo(() => ({
  Escape: defineRouteKey('present:exit', () => onExit(), 'PresentMode'),
}), [onExit])
```

- [ ] **Step 5: PageBirdseye.tsx 전환**

```typescript
import { defineRouteKey } from '@os/primitives/defineRouteKey'

const keyMap = useMemo(() => ({
  Escape: defineRouteKey('birdseye:back', () => {
    if (layer) setSearchParams({})
  }, 'Birdseye'),
}), [layer, setSearchParams])
```

- [ ] **Step 6: PageViewer.tsx 전환**

```typescript
import { defineRouteKey } from '@os/primitives/defineRouteKey'

const quickOpenKeyMap = useMemo(() => ({
  'Meta+p': defineRouteKey('viewer:quick-open', () => setQuickOpenVisibleRef.current(true), 'Viewer'),
  'Meta+Enter': defineRouteKey('viewer:open-in-new-pane', () => {
    const path = focusedFileRef.current
    if (path) openInNewPaneRef.current(path)
  }, 'Viewer'),
}), [])
```

- [ ] **Step 7: FilePanel.tsx 전환**

```typescript
import { defineRouteKey } from '@os/primitives/defineRouteKey'

const keyMap = useMemo(() => ({
  'Meta+b': defineRouteKey('file-panel:toggle-spread', () => { if (isMarkdown) setSpreadMode(s => !s) }, 'FilePanel'),
}), [isMarkdown])
```

- [ ] **Step 8: typecheck + test**

Run: `pnpm typecheck 2>&1 | head -20`
Run: `pnpm test 2>&1 | tail -5`
Expected: 0 errors, 모든 테스트 통과

- [ ] **Step 9: Commit**

```bash
git add src/interactive-os/primitives/defineRouteKey.ts src/AppShell.tsx src/pages/
git commit -m "refactor: enforce defineRouteKey .type required + convert all AriaRoute consumers

6개 AriaRoute 소비처를 defineRouteKey로 전환. .type 없이는 컴파일 에러."
```

---

### Task 7: Verify

- [ ] **Step 1: Full verification**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm check:deps
```

Expected: 모든 통과 (기존 에러 제외).

- [ ] **Step 2: key() 없이 plain 함수 등록 시 컴파일 에러 확인**

임시로 아무 plugin에 plain 함수를 넣어보고 typecheck 에러가 나는지 확인. 확인 후 되돌리기.

- [ ] **Step 3: Final commit (있으면)**

남은 수정사항 커밋.

#kind/plan #topic/engine
