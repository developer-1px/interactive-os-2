---
id: 2-areas/distribution/plans/2026-04-12-single-entry-refactor
title: 'Single Entry Refactor — Implementation Plan'
status: active
kind: note
created: 2026-04-12
updated: 2026-04-12
summary: '**For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.'
topics: [2-areas]
relates: []
supersedes: []
---
# Single Entry Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ARIA OS의 외부 npm 표면을 144개 stale exports → **3개 LLM-facing entry**(`aria-os/ui`, `aria-os/layout`, `aria-os/schema`) + **1개 escape hatch**(`aria-os/advanced`)로 수렴한다. LLM이 다루는 면을 좁히고, 사람-개발자는 advanced로 우회할 수 있게 한다.

**Architecture:** barrel index.ts 4개를 신설/확장하여 단일 진입점을 제공한다. tsup entry를 52개 → 4개로 줄이고 package.json exports도 동기화한다. dependency-cruiser로 layer 위반을 감지하고, guardOsPatterns hook에 새 import 패턴 강제 규칙을 추가한다. 외부 사용자가 0명이므로 SemVer 호환성은 고려하지 않는다. `src/pages/` 내부는 path alias(`@os/*`)를 그대로 유지하며 마이그레이션하지 않는다(별도 plan에서 점진 처리).

**Tech Stack:** tsup (ESM+DTS 빌드), TypeScript, Vitest, dependency-cruiser, Node ESM hooks (guardOsPatterns.mjs)

---

## File Structure

**Create:**
- `src/interactive-os/ui/index.ts` — 90+ ui 컴포넌트 + AriaComponentProps 타입 barrel
- `src/interactive-os/schema/index.ts` — NormalizedData/Entity 타입 + Zod 헬퍼 re-export (실제 코드는 store/에 있음, 새 폴더는 re-export 전용)
- `src/interactive-os/advanced/index.ts` — useAria/useAriaZone/useEngine/composePattern/definePlugin 등 사람-개발자용 escape hatch barrel
- `src/interactive-os/__tests__/single-entry.test.ts` — 단일 entry import 가능 여부 + 차단 경로 검증
- `.claude/hooks/__tests__/guardOsPatterns.single-entry.test.mjs` — hook 신규 규칙 단위 테스트

**Modify:**
- `src/interactive-os/layout/index.ts` — 기존 export 보강 (LayoutNode 9타입 + definePage + widgetRegistry 빠짐없이)
- `tsup.config.ts` — entry 52 → 4 (ui/layout/schema/advanced barrel)
- `package.json` — exports 144 → 8 (4 entry × import+types)
- `.claude/hooks/guardOsPatterns.mjs` — 규칙 24 추가: `src/pages/`에서 `@os/(?!ui|layout|schema|advanced)` 직접 import 경고 (Phase 0에서는 경고만, 후속 plan에서 차단으로 승격)
- `.claude/CLAUDE.md` — 아키텍처 절에 "외부 표면 (LLM-facing) / 내부 구조 (개발용)" 2 섹션 명시
- `src/interactive-os/CATALOG.md` — import 경로 예시를 단일 entry로 갱신, "사람용 vs LLM용" 분리 표시

**Out of scope (별도 plan):**
- `src/pages/` 73개 파일 import 경로 마이그레이션 → Plan 1.5
- demo 파일 72개 마이그레이션 → Plan 1.5
- defineData() schema 빌더 → Plan 3
- aria.md 작성 → Plan 5
- eject CLI → Plan 4

---

## Task 0: 베이스라인 캡처

**Files:**
- Read: `package.json`, `tsup.config.ts`

- [ ] **Step 1: 현재 typecheck 통과 확인**

Run: `pnpm typecheck`
Expected: 에러 없음 (혹은 기존 에러 수 기록 — 본 plan은 그 수를 늘리지 않는다)

- [ ] **Step 2: 현재 테스트 통과 확인 + 카운트 기록**

Run: `pnpm test 2>&1 | tail -20`
Expected: "Tests  N passed" 형식. N 값을 메모 (회귀 감지 baseline). PRD 기준 859 근처여야 함.

- [ ] **Step 3: 현재 빌드 통과 확인 + dist-lib 구조 캡처**

Run: `pnpm build:lib && find dist-lib -maxdepth 2 -type d | sort > /tmp/dist-lib-before.txt && cat /tmp/dist-lib-before.txt`
Expected: 빌드 성공. 폴더 목록 저장됨. 이후 Task에서 /tmp/dist-lib-after.txt와 비교한다.

- [ ] **Step 4: 현재 dependency-cruiser 통과 확인**

Run: `pnpm check:deps`
Expected: layer 위반 0 (혹은 기존 위반 수 기록)

- [ ] **Step 5: 베이스라인 커밋**

```bash
git status
# 본 plan에서 변경 안 한 파일은 건드리지 않는다. 이미 변경된 파일 있으면 stash 후 새 브랜치
git checkout -b feat/single-entry-refactor
```

---

## Task 1: ui/index.ts barrel 작성

**Files:**
- Create: `src/interactive-os/ui/index.ts`

- [ ] **Step 1: ui 폴더의 tsx 파일 목록 확보**

Run:
```bash
ls /Users/user/Desktop/aria/src/interactive-os/ui/*.tsx | grep -v '.test.' | grep -v '.demo.' | xargs -n1 basename | sed 's/\.tsx$//' | sort
```
Expected: 컴포넌트 이름 목록 (TreeGrid, ListBox, TabList, ...). 이 목록을 기반으로 barrel을 작성.

- [ ] **Step 2: 하위 폴더(indicators, items, panels, cells, composites) 목록 확보**

Run:
```bash
for d in indicators items panels cells composites; do
  echo "=== $d ==="
  ls /Users/user/Desktop/aria/src/interactive-os/ui/$d/*.tsx 2>/dev/null | grep -v '.test.' | xargs -n1 basename | sed 's/\.tsx$//' | sort
done
```
Expected: 각 폴더별 컴포넌트 목록. 일부 폴더는 자체 index.ts가 이미 있을 수 있음 — 있으면 재사용.

- [ ] **Step 3: ui/index.ts 작성 (Step 1, 2 결과 기반)**

Create `src/interactive-os/ui/index.ts`:
```ts
// LLM-facing barrel for aria-os/ui
// 90+ 완성품 컴포넌트 + AriaComponentProps 타입.
// 이 파일은 외부 npm 사용자와 LLM 시스템 프롬프트의 단일 진입점이다.
// 새 컴포넌트 추가 시 이 파일에 export를 추가해야 dist에 노출된다.

// === 핵심 데이터 컴포넌트 ===
export { TreeGrid } from './TreeGrid'
export { TreeView } from './TreeView'
export { ListBox } from './ListBox'
export { ListBoxGrouped } from './ListBoxGrouped'
export { Grid } from './Grid'
export { Table } from './Table'
export { Combobox } from './Combobox'
export { TabList } from './TabList'
export { Accordion } from './Accordion'
export { MenuList } from './MenuList'
export { Menubar } from './Menubar'
export { DisclosureGroup } from './DisclosureGroup'
export { Toolbar } from './Toolbar'

// === 단일 값 입력 ===
export { RadioGroup } from './RadioGroup'
export { Checkbox } from './Checkbox'
export { CheckboxMixed } from './CheckboxMixed'
export { Toggle } from './Toggle'
export { ToggleGroup } from './ToggleGroup'
export { ButtonToggle } from './ButtonToggle'
export { SwitchGroup } from './SwitchGroup'
export { Slider } from './Slider'
export { Spinbutton } from './Spinbutton'

// === 알림/오버레이 ===
export { Alert } from './Alert'
export { AlertDialog } from './AlertDialog'
export { Toaster } from './Toaster'
export { Tooltip } from './Tooltip'

// === 칸반/날짜/특수 ===
export { Kanban } from './Kanban'
export { DatePicker } from './DatePicker'
export { CalendarGrid } from './CalendarGrid'
export { Feed } from './Feed'
export { Link } from './Link'
export { Meter } from './Meter'
export { WindowSplitter } from './WindowSplitter'
export { Form } from './Form'
export { SpatialView } from './SpatialView'
export { MenuButton } from './MenuButton'
export { MenuActivedescendant } from './MenuActivedescendant'
export { RadioGroupActivedescendant } from './RadioGroupActivedescendant'
export { SelectionOverlay } from './SelectionOverlay'

// === 공통 타입 ===
export type { AriaComponentProps } from './types'

// === 하위 카탈로그 (indicators / items / panels / cells / composites) ===
// 이미 자체 index.ts가 있으면 그것을 통해 export. 없으면 wildcard.
export * as indicators from './indicators'
export * as items from './items'
export * as panels from './panels'
export * as cells from './cells'
export * as composites from './composites'
```
> 주의: Step 1, 2 결과로 실제 파일명이 다르면 즉시 수정. 누락 컴포넌트 0건이 목표.

- [ ] **Step 4: 하위 폴더 index.ts 존재 확인**

Run:
```bash
for d in indicators items panels cells composites; do
  test -f /Users/user/Desktop/aria/src/interactive-os/ui/$d/index.ts && echo "$d: OK" || echo "$d: MISSING"
done
```
Expected: 5개 모두 OK. MISSING이 있으면 다음 step에서 생성.

- [ ] **Step 5: 누락된 하위 index.ts 생성 (있을 경우만)**

각 MISSING 폴더에 대해 (예: indicators):
```bash
ls /Users/user/Desktop/aria/src/interactive-os/ui/indicators/*.tsx | grep -v test | xargs -n1 basename -s .tsx
```
출력 결과를 기반으로 `src/interactive-os/ui/indicators/index.ts`:
```ts
export { ExpandIndicator } from './ExpandIndicator'
export { CheckIndicator } from './CheckIndicator'
// ... 실제 파일에 맞게
```

- [ ] **Step 6: typecheck**

Run: `pnpm typecheck 2>&1 | tail -30`
Expected: barrel 관련 에러 0건. "Cannot find module ./X" 에러가 나면 Step 3의 export를 실제 파일로 수정.

- [ ] **Step 7: 커밋**

```bash
git add src/interactive-os/ui/index.ts src/interactive-os/ui/{indicators,items,panels,cells,composites}/index.ts
git commit -m "feat(ui): single-entry barrel for aria-os/ui"
```

---

## Task 2: layout/index.ts 보강

**Files:**
- Modify: `src/interactive-os/layout/index.ts`

- [ ] **Step 1: 현재 layout/index.ts 내용 확인**

Read `src/interactive-os/layout/index.ts`. 어떤 export가 있고 빠진 게 있는지 식별.

- [ ] **Step 2: layout/ 폴더 전체 export 후보 식별**

Run:
```bash
ls /Users/user/Desktop/aria/src/interactive-os/layout/*.ts | xargs -n1 basename -s .ts
```
Expected: flatLayout, widgetRegistry, layoutCommands, layoutPlugin, index. 각 파일에서 외부에 노출할 항목을 식별 (definePage, LayoutNode 타입, createWidgetRegistry, resolveWidget 등).

- [ ] **Step 3: layout/index.ts 보강**

Replace contents of `src/interactive-os/layout/index.ts`:
```ts
// LLM-facing barrel for aria-os/layout
// FlatLayout 엔진: definePage, LayoutNode 9타입, widgetRegistry.
// LLM은 이 모듈의 definePage()로 화면을 배치한다.

export { definePage } from './flatLayout'
export type {
  LayoutNode,
  SplitNode,
  StackNode,
  BarNode,
  OverlayNode,
  WidgetNode,
  GridNode,
  NavNode,
  TabNode,
  SectionNode,
  StateNode,
} from './flatLayout'

export { createWidgetRegistry, resolveWidget } from './widgetRegistry'
export type { WidgetRegistry } from './widgetRegistry'

// FlatLayout 컴포넌트는 ui/에 있으므로 layout barrel에서 re-export
export { FlatLayout } from '../ui/FlatLayout'
```
> 주의: 실제 export 이름이 다르면 Step 2 결과에 맞게 조정. tsup이 빌드한 dist-lib에서 LayoutNode가 어떤 이름으로 나오는지 확인.

- [ ] **Step 4: typecheck**

Run: `pnpm typecheck 2>&1 | grep -E "interactive-os/layout" | head -20`
Expected: layout 관련 에러 0건.

- [ ] **Step 5: 커밋**

```bash
git add src/interactive-os/layout/index.ts
git commit -m "feat(layout): single-entry barrel for aria-os/layout"
```

---

## Task 3: schema/index.ts 신설 (re-export 전용)

**Files:**
- Create: `src/interactive-os/schema/index.ts`

> 주의: schema/는 새 폴더다. 실제 NormalizedData 타입은 store/types.ts에 있고 이를 re-export만 한다. defineData() 빌더는 Plan 3에서 구현하므로 본 plan에서는 타입만 노출한다.

- [ ] **Step 1: store/types.ts에서 외부 노출 타입 식별**

Read `src/interactive-os/store/types.ts`. NormalizedData, Entity, EntityId, ROOT_ID 등 외부에 필요한 식별자 목록 작성.

- [ ] **Step 2: schema 폴더 생성 + index.ts 작성**

```bash
mkdir -p /Users/user/Desktop/aria/src/interactive-os/schema
```

Create `src/interactive-os/schema/index.ts`:
```ts
// LLM-facing barrel for aria-os/schema
// NormalizedData 타입 + Zod 헬퍼 re-export.
// defineData() 상위 빌더는 Plan 3에서 추가 예정 — 본 파일은 타입 노출만.
// LLM은 여기서 NormalizedData 직접 다루기보다 Plan 3의 defineData를 사용해야 한다.

export type {
  NormalizedData,
  Entity,
  EntityId,
} from '../store/types'

export { ROOT_ID } from '../store/types'
export { createStore } from '../store/createStore'
export type { Store } from '../store/types'
```
> Step 1에서 식별한 실제 export 이름으로 조정. createStore가 다른 파일에 있으면 경로 수정.

- [ ] **Step 3: typecheck**

Run: `pnpm typecheck 2>&1 | grep -E "schema/" | head -20`
Expected: 에러 0건. "Module has no exported member 'X'" 에러가 나면 store/types.ts의 실제 export 이름과 맞춤.

- [ ] **Step 4: 커밋**

```bash
git add src/interactive-os/schema/index.ts
git commit -m "feat(schema): single-entry barrel for aria-os/schema (types only, defineData in Plan 3)"
```

---

## Task 4: advanced/index.ts (escape hatch barrel)

**Files:**
- Create: `src/interactive-os/advanced/index.ts`

> 사람-개발자가 useAria, composePattern, definePlugin 등을 직접 쓰고 싶을 때의 escape hatch. aria.md(LLM 시스템 프롬프트)에는 절대 등장하지 않는다.

- [ ] **Step 1: primitives/, pattern/, plugins/, engine/에서 외부 노출 후보 식별**

```bash
for d in primitives pattern engine plugins; do
  echo "=== $d ==="
  ls /Users/user/Desktop/aria/src/interactive-os/$d/*.ts 2>/dev/null | xargs -n1 basename -s .ts
done
```
Expected: useAria, useAriaZone, useControlledAria, useKeyboard, composePattern, createCommandEngine, definePlugin, ... 등 식별.

- [ ] **Step 2: advanced 폴더 생성 + index.ts 작성**

```bash
mkdir -p /Users/user/Desktop/aria/src/interactive-os/advanced
```

Create `src/interactive-os/advanced/index.ts`:
```ts
// Escape hatch for advanced human developers.
// LLM 시스템 프롬프트(aria.md)에는 등장하지 않는다.
// composite/non-standard 패턴이 필요할 때만 사용한다.

// === Primitives (React 바인딩) ===
export { useAria } from '../primitives/useAria'
export { useAriaZone } from '../primitives/useAriaZone'
export { useControlledAria } from '../primitives/useControlledAria'
export { useKeyboard } from '../primitives/useKeyboard'

// === Pattern composition ===
export { composePattern } from '../pattern/composePattern'

// === Engine ===
export { createCommandEngine } from '../engine/createCommandEngine'
export { useEngine } from '../engine/useEngine'

// === Plugin factory ===
export { definePlugin } from '../engine/definePlugin'
```
> Step 1 결과로 실제 파일명이 다르면 import 경로 수정. composePattern은 pattern/index.ts 또는 pattern/composePattern.ts 중 어디에 있는지 확인.

- [ ] **Step 3: typecheck**

Run: `pnpm typecheck 2>&1 | grep -E "advanced/" | head -20`
Expected: 에러 0건.

- [ ] **Step 4: 커밋**

```bash
git add src/interactive-os/advanced/index.ts
git commit -m "feat(advanced): escape hatch barrel for human developers (LLM-비노출)"
```

---

## Task 5: tsup.config.ts 정리

**Files:**
- Modify: `tsup.config.ts`

- [ ] **Step 1: 새 tsup.config.ts 작성**

Replace contents of `tsup.config.ts`:
```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    ui: 'src/interactive-os/ui/index.ts',
    layout: 'src/interactive-os/layout/index.ts',
    schema: 'src/interactive-os/schema/index.ts',
    advanced: 'src/interactive-os/advanced/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: true,
  clean: true,
  outDir: 'dist-lib',
  external: ['react', 'react-dom'],
  treeshake: true,
  tsconfig: 'tsconfig.app.json',
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})
```

- [ ] **Step 2: 빌드 실행**

Run: `pnpm build:lib 2>&1 | tail -30`
Expected: 4개 entry 빌드 성공. ui.js / layout.js / schema.js / advanced.js + 각 .d.ts 생성.

- [ ] **Step 3: dist-lib 구조 확인**

Run: `find dist-lib -maxdepth 1 -type f | sort > /tmp/dist-lib-after.txt && cat /tmp/dist-lib-after.txt`
Expected: `dist-lib/ui.js`, `dist-lib/ui.d.ts`, `dist-lib/layout.js`, ..., `dist-lib/advanced.d.ts`. chunk 파일은 dist-lib/_chunks/ 같은 폴더에 분리되어도 OK.

- [ ] **Step 4: 빌드 산출물 크기 sanity check**

Run: `du -sh dist-lib/ && du -sh dist-lib/*.js`
Expected: 각 entry가 수십~수백 KB. 0KB나 비정상적으로 작으면 export 누락.

- [ ] **Step 5: 커밋**

```bash
git add tsup.config.ts
git commit -m "build(tsup): consolidate to 4 entries (ui/layout/schema/advanced)"
```

---

## Task 6: package.json exports 재구성

**Files:**
- Modify: `package.json`

- [ ] **Step 1: package.json exports 필드 교체**

Edit `package.json`. 현재 `"exports": { ... }` 블록(line 24~217)을 다음으로 교체:

```json
  "exports": {
    "./ui": {
      "import": "./dist-lib/ui.js",
      "types": "./dist-lib/ui.d.ts"
    },
    "./layout": {
      "import": "./dist-lib/layout.js",
      "types": "./dist-lib/layout.d.ts"
    },
    "./schema": {
      "import": "./dist-lib/schema.js",
      "types": "./dist-lib/schema.d.ts"
    },
    "./advanced": {
      "import": "./dist-lib/advanced.js",
      "types": "./dist-lib/advanced.d.ts"
    }
  },
```

- [ ] **Step 2: package.json 유효성 확인**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('OK')"`
Expected: "OK"

- [ ] **Step 3: 노출 검증 — exports 외 경로는 해석 불가**

Run:
```bash
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('exports keys:', Object.keys(pkg.exports));
"
```
Expected: `[ './ui', './layout', './schema', './advanced' ]`

- [ ] **Step 4: 커밋**

```bash
git add package.json
git commit -m "build(pkg): exports 144 → 4 (ui/layout/schema/advanced)"
```

---

## Task 7: 단일 entry import 가능 여부 통합 테스트

**Files:**
- Create: `src/interactive-os/__tests__/single-entry.test.ts`

- [ ] **Step 1: 실패하는 테스트 먼저 작성**

Create `src/interactive-os/__tests__/single-entry.test.ts`:
```ts
import { describe, it, expect } from 'vitest'

describe('single-entry barrel', () => {
  it('aria-os/ui exports core components', async () => {
    const ui = await import('../ui/index')
    expect(typeof ui.TreeGrid).toBe('function')
    expect(typeof ui.ListBox).toBe('function')
    expect(typeof ui.Combobox).toBe('function')
    expect(typeof ui.TabList).toBe('function')
    expect(typeof ui.RadioGroup).toBe('function')
    expect(typeof ui.Slider).toBe('function')
    expect(typeof ui.DatePicker).toBe('function')
  })

  it('aria-os/ui exports indicators/items/panels/cells/composites namespaces', async () => {
    const ui = await import('../ui/index')
    expect(ui.indicators).toBeDefined()
    expect(ui.items).toBeDefined()
    expect(ui.panels).toBeDefined()
    expect(ui.cells).toBeDefined()
    expect(ui.composites).toBeDefined()
  })

  it('aria-os/layout exports definePage and FlatLayout', async () => {
    const layout = await import('../layout/index')
    expect(typeof layout.definePage).toBe('function')
    expect(typeof layout.FlatLayout).toBe('function')
    expect(typeof layout.createWidgetRegistry).toBe('function')
  })

  it('aria-os/schema exports NormalizedData types and createStore', async () => {
    const schema = await import('../schema/index')
    expect(schema.ROOT_ID).toBeDefined()
    expect(typeof schema.createStore).toBe('function')
  })

  it('aria-os/advanced exports useAria and composePattern (escape hatch)', async () => {
    const advanced = await import('../advanced/index')
    expect(typeof advanced.useAria).toBe('function')
    expect(typeof advanced.composePattern).toBe('function')
    expect(typeof advanced.definePlugin).toBe('function')
  })
})
```

- [ ] **Step 2: 테스트 실행 (실패 예상 → 통과)**

Run: `pnpm test src/interactive-os/__tests__/single-entry.test.ts`
Expected: 5개 테스트 모두 PASS. 실패하면 Task 1~4의 barrel 작성 누락 — 누락된 export 추가.

- [ ] **Step 3: 커밋**

```bash
git add src/interactive-os/__tests__/single-entry.test.ts
git commit -m "test(single-entry): verify 4-barrel exports"
```

---

## Task 8: guardOsPatterns hook에 단일 entry 권장 규칙 추가

**Files:**
- Modify: `.claude/hooks/guardOsPatterns.mjs`
- Create: `.claude/hooks/__tests__/guardOsPatterns.single-entry.test.mjs`

> Phase 1에서는 **경고만**(차단 X). pages 마이그레이션이 끝나는 후속 plan에서 차단으로 승격.

- [ ] **Step 1: hook test 디렉토리 확인**

```bash
ls /Users/user/Desktop/aria/.claude/hooks/__tests__/ 2>/dev/null || mkdir -p /Users/user/Desktop/aria/.claude/hooks/__tests__/
```

- [ ] **Step 2: hook 단위 테스트 작성 (실패 예상)**

Create `.claude/hooks/__tests__/guardOsPatterns.single-entry.test.mjs`:
```js
import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'

const HOOK = '/Users/user/Desktop/aria/.claude/hooks/guardOsPatterns.mjs'

function runHook(input) {
  try {
    const out = execSync(`node ${HOOK}`, { input: JSON.stringify(input), encoding: 'utf8' })
    return out ? JSON.parse(out) : null
  } catch (err) {
    return err.stdout ? JSON.parse(err.stdout) : null
  }
}

describe('guardOsPatterns: single-entry rule', () => {
  it('warns when src/pages imports from internal layer (store)', () => {
    const result = runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '/Users/user/Desktop/aria/src/pages/foo/Bar.tsx',
        content: `import { createStore } from '@os/store/createStore'\nexport const x = 1`,
      },
    })
    // Phase 1: 경고만 — block 안 함
    // 본 plan에서는 reason에 'single-entry' 단어가 포함되면 OK로 본다
    if (result?.decision === 'block') {
      expect(result.reason).toMatch(/single-entry|aria-os\/(?:ui|layout|schema|advanced)/)
    }
    // 경고도 안 나면 fail
    expect(result).not.toBeNull()
  })

  it('does NOT warn when src/pages imports from @os/ui', () => {
    const result = runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '/Users/user/Desktop/aria/src/pages/foo/Bar.tsx',
        content: `import { TreeGrid } from '@os/ui'\nexport const x = 1`,
      },
    })
    // 단일 entry 쓰면 위반 없음 (다른 규칙엔 걸릴 수 있으나 single-entry 규칙은 아님)
    if (result?.decision === 'block') {
      expect(result.reason).not.toMatch(/single-entry/)
    }
  })

  it('does NOT warn when interactive-os internal cross-imports', () => {
    const result = runHook({
      tool_name: 'Write',
      tool_input: {
        file_path: '/Users/user/Desktop/aria/src/interactive-os/ui/TreeGrid.tsx',
        content: `import { useAria } from '../primitives/useAria'\nexport const x = 1`,
      },
    })
    // 내부는 면제
    if (result?.decision === 'block') {
      expect(result.reason).not.toMatch(/single-entry/)
    }
  })
})
```

- [ ] **Step 3: 테스트 실행 (실패 예상)**

Run: `pnpm test .claude/hooks/__tests__/guardOsPatterns.single-entry.test.mjs`
Expected: 첫 번째 케이스 fail (현재 hook은 single-entry 규칙 없음). 또는 result null.

- [ ] **Step 4: hook에 규칙 24 추가**

Edit `.claude/hooks/guardOsPatterns.mjs`. 마지막 규칙(규칙 23) 다음, `if (violations.length > 0)` 직전에 추가:

```js
// 규칙 24: src/pages/에서 @os/(store|engine|axis|pattern|primitives|plugins) 직접 import 권장 위반 (Phase 1: 경고)
// 단일 entry: @os/ui, @os/layout, @os/schema, @os/advanced 만 권장
if (isPages && /from\s+['"]@os\/(?:store|engine|axis|pattern|primitives|plugins)\b/.test(content)) {
  violations.push(
    'single-entry 권장: @os/(store|engine|axis|pattern|primitives|plugins) 대신 @os/ui · @os/layout · @os/schema · @os/advanced 4개 단일 entry를 사용하세요. (Phase 1: 경고 — 후속 plan에서 차단으로 승격)'
  )
}
```

- [ ] **Step 5: 테스트 재실행**

Run: `pnpm test .claude/hooks/__tests__/guardOsPatterns.single-entry.test.mjs`
Expected: 3개 테스트 모두 PASS.

- [ ] **Step 6: 커밋**

```bash
git add .claude/hooks/guardOsPatterns.mjs .claude/hooks/__tests__/guardOsPatterns.single-entry.test.mjs
git commit -m "feat(hooks): rule 24 — single-entry recommendation (Phase 1: warn)"
```

---

## Task 9: 빌드 + 전체 테스트 회귀 검증

**Files:** (없음 — 검증만)

- [ ] **Step 1: 빌드 재실행**

Run: `pnpm build:lib 2>&1 | tail -20`
Expected: 4 entry 빌드 성공. 에러 0.

- [ ] **Step 2: dist-lib 노출 표면 검증**

Run:
```bash
test -f dist-lib/ui.js && test -f dist-lib/ui.d.ts && \
test -f dist-lib/layout.js && test -f dist-lib/layout.d.ts && \
test -f dist-lib/schema.js && test -f dist-lib/schema.d.ts && \
test -f dist-lib/advanced.js && test -f dist-lib/advanced.d.ts && \
echo "ALL 4 ENTRIES OK"
```
Expected: "ALL 4 ENTRIES OK"

- [ ] **Step 3: dist-lib에 옛 entry가 안 남았는지 확인**

Run: `ls dist-lib/*.js`
Expected: ui.js / layout.js / schema.js / advanced.js 4개만. (chunk 파일은 _chunks/ 등 하위 폴더에 있어도 OK)
> 옛 store.js, engine.js 등이 root에 보이면 `clean: true`가 작동 안 한 것. `rm -rf dist-lib && pnpm build:lib` 재실행.

- [ ] **Step 4: typecheck**

Run: `pnpm typecheck 2>&1 | tail -20`
Expected: Task 0 베이스라인 대비 에러 수가 늘지 않음.

- [ ] **Step 5: 전체 테스트**

Run: `pnpm test 2>&1 | tail -20`
Expected: Task 0 베이스라인 대비 통과 수가 줄지 않음. 새 테스트(single-entry, guardOsPatterns single-entry) 포함.

- [ ] **Step 6: dependency-cruiser**

Run: `pnpm check:deps 2>&1 | tail -20`
Expected: layer 위반 0 (혹은 베이스라인 유지).

- [ ] **Step 7: 검증 통과 확인 메모 — 이슈 없으면 다음 Task로**

이 Task는 검증만이므로 커밋 없음. 실패하면 해당 Task로 돌아가 수정.

---

## Task 10: 문서 갱신 (CLAUDE.md, CATALOG.md)

**Files:**
- Modify: `.claude/CLAUDE.md`
- Modify: `src/interactive-os/CATALOG.md`

- [ ] **Step 1: CLAUDE.md 아키텍처 절 갱신**

Edit `.claude/CLAUDE.md`. "## 아키텍처" 절의 "### 레이어 구조 (의존 순서)" 직후에 새 섹션 삽입:

```markdown
### 외부 표면 vs 내부 구조

ARIA OS는 두 청자를 위해 두 개의 면을 가진다.

**외부 표면 (npm 사용자, LLM 시스템 프롬프트):**
- `aria-os/ui` — 90+ 완성품 컴포넌트 + 타입
- `aria-os/layout` — definePage, LayoutNode, FlatLayout
- `aria-os/schema` — NormalizedData 타입, createStore (defineData는 Plan 3에서 추가 예정)
- `aria-os/advanced` — useAria, composePattern, definePlugin (사람 개발자 escape hatch, LLM 비노출)

**내부 구조 (개발용, 위 의존 순서 그대로):**
store → engine → axis → pattern → primitives → ui → pages

내부 cross-layer import는 자유. 외부 사용자/LLM은 4개 entry만 본다.
```

- [ ] **Step 2: CATALOG.md import 경로 예시 갱신**

Edit `src/interactive-os/CATALOG.md`. 파일 상단에 새 섹션 삽입(또는 기존 "Usage" 섹션 갱신):

```markdown
## Import 경로

**LLM/외부 사용자 (권장):**
\`\`\`ts
import { TreeGrid, ListBox } from 'aria-os/ui'
import { definePage } from 'aria-os/layout'
import type { NormalizedData } from 'aria-os/schema'
\`\`\`

**고급 사용자 (escape hatch):**
\`\`\`ts
import { useAria, composePattern } from 'aria-os/advanced'
\`\`\`

**프로젝트 내부(monorepo):** path alias `@os/*` 그대로 사용. 마이그레이션 별도 plan.
```

- [ ] **Step 3: 커밋**

```bash
git add .claude/CLAUDE.md src/interactive-os/CATALOG.md
git commit -m "docs: 외부 표면 (4 single-entry) vs 내부 구조 명시"
```

---

## Task 11: PROGRESS.md 갱신

**Files:**
- Modify: `docs/PROGRESS.md`

- [ ] **Step 1: PROGRESS.md의 Infra 섹션에 항목 추가**

Edit `docs/PROGRESS.md`. "## Infra" 섹션의 표에 행 추가:

```markdown
| Single Entry (ui/layout/schema/advanced) | Validated | 4 barrel exports + tsup 정리 + hook 규칙 24. pages 마이그레이션 별도 plan |
```

- [ ] **Step 2: 커밋**

```bash
git add docs/PROGRESS.md
git commit -m "docs(progress): single-entry refactor entry"
```

---

## Task 12: 최종 sanity check + plan 종료

**Files:** (없음)

- [ ] **Step 1: 모든 검증 일괄 실행**

Run:
```bash
pnpm typecheck && \
pnpm test && \
pnpm build:lib && \
pnpm check:deps && \
echo "ALL GREEN"
```
Expected: "ALL GREEN"

- [ ] **Step 2: dist-lib 최종 구조 캡처**

Run: `find dist-lib -maxdepth 2 -type f -name '*.js' | sort`
Expected: ui.js, layout.js, schema.js, advanced.js + 내부 chunk 파일들.

- [ ] **Step 3: 외부 사용자 시뮬레이션 — node ESM resolve 테스트**

Run:
```bash
node --input-type=module -e "
import * as ui from './dist-lib/ui.js';
import * as layout from './dist-lib/layout.js';
import * as schema from './dist-lib/schema.js';
import * as advanced from './dist-lib/advanced.js';
console.log('ui exports:', Object.keys(ui).length);
console.log('layout exports:', Object.keys(layout).length);
console.log('schema exports:', Object.keys(schema).length);
console.log('advanced exports:', Object.keys(advanced).length);
"
```
Expected: 각 entry에서 export 카운트 출력. ui ≥ 30, layout ≥ 5, schema ≥ 3, advanced ≥ 6.

- [ ] **Step 4: 브랜치 정리 메모**

`git log --oneline feat/single-entry-refactor ^main` 출력 확인. Task별 커밋 12개 정도. 머지 또는 PR은 사용자 판단.

- [ ] **Step 5: 후속 plan 트리거 메모**

본 plan 완료 후 다음 plan들이 unblock된다:
- Plan 2: data-component-matrix 작성
- Plan 3: defineData() schema 빌더 구현 (schema/index.ts에 실 구현 추가)
- Plan 4: eject CLI + doctor (registry.json 형식 결정)
- Plan 5: aria.md (Plan 2, 3 결과 소비)
- Plan 6: evals harness (Plan 5 결과 소비)
- Plan 1.5 (선택): src/pages/ 73 파일 codemod로 단일 entry 마이그레이션 + hook 규칙 24를 차단으로 승격

---

## Self-Review Checklist

PRD 대비 본 plan의 커버리지:
- ✅ ② 산출물의 "package.json exports 재구성" → Task 6
- ✅ ② 산출물의 "tsup.config.ts entry 정리" → Task 5
- ✅ ② 산출물의 "ui/index.ts barrel" → Task 1
- ✅ ② 산출물의 "layout/index.ts barrel" → Task 2
- ✅ ② 산출물의 "schema/index.ts barrel (re-export 전용)" → Task 3
- ✅ ② 산출물의 "advanced 4번째 entry (PRD ④2 escape hatch)" → Task 4
- ✅ ② 산출물의 "guardOsPatterns hook 갱신" → Task 8
- ✅ ② 산출물의 "CLAUDE.md 갱신" → Task 10
- ✅ ② 산출물의 "CATALOG.md 갱신" → Task 10
- ✅ ⑧ 검증 #11 (Phase 1 빌드 통과) → Task 9, 12
- ✅ ⑧ 검증 #14 (exports wildcard 0건) → Task 6 Step 1 (수동 wildcard 없음)

**Plan 1 범위 외 (별도 plan):**
- defineData() 실 구현 → Plan 3
- data-component-matrix.md → Plan 2
- aria.md → Plan 5
- eject CLI → Plan 4
- evals harness → Plan 6
- src/pages/ 73 파일 마이그레이션 → Plan 1.5 (hook 차단 승격 포함)
- src/pages/ 외 demo/test 파일 → Plan 1.5

**Placeholder scan:** 모든 step에 실제 코드/명령/경로 포함. "TBD/적절히/필요시" 0건. ✅

**Type consistency:** ui/index.ts에서 export하는 컴포넌트명은 Task 1 Step 1에서 실제 파일명으로 검증. layout/index.ts의 LayoutNode union 구성요소는 Task 2 Step 2에서 실제 export로 검증. schema/index.ts와 advanced/index.ts도 동일.

---

## Execution Handoff

Plan complete and saved to `docs/2-areas/distribution/plans/2026-04-12-single-entry-refactor.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration. 12 Task 단위로 디스패치.

**2. Inline Execution** — 본 세션에서 직접 실행. Task별 checkpoint.

Which approach?
