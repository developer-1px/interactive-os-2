---
id: inspectorDefinePagePanelPrd
type: prd
layer: devtools
slug: inspectorDefinePagePanelPrd
title: Inspector Page 탭 — definePage 기반 시각화·편집 패널
tags: [inspector, devtools, flatlayout, treegrid]
created: 2026-04-19
updated: 2026-04-19
summary: Inspector에 Page 탭을 추가하여 FlatLayout definePage store를 시각화·편집·복사 가능하게 만든다. 휘발 편집 + 클립보드 복사 MVP. TreeGrid 편집 dogfooding 포함.
---

# Inspector Page 탭 — PRD

> **Discussion**: 이 세션 `/discuss` → 휘발 only + 클립보드 + TreeGrid 편집 결정
> **산출물 유형**: UI 기능 (devtools)
> **규모 추정**: 신규 6개, 수정 3개, 재사용 5개

## §0 요구사항 (from discuss)

- **해결책 ⑪**: Inspector에 Page 탭을 추가하여 ① FlatLayout 사용 검증 ② Layout 트리 시각화 ③ 선택 노드의 LayoutBase 4축(surface/padding/hidden/gap) TreeGrid 휘발 편집 ④ Copy as definePage 클립보드 복사
- **제약 ⑦**: 휘발 only / 파일 쓰기 0 / os 부품만 / ax()만 / store command 경유
- **보유 자산 ⑧**: FlatLayoutContext(store+dispatch+getNodeElement) · TreeView · TreeGrid(enableEditing 지원) · ariaRegistry 패턴 · layoutCommands(기존 setHidden/setGap 등) · renderInspectorItem
- **부작용 ⑫**: (a) 외부 변경이 편집분 덮어씀 수용 (b) 클립보드 paste 수동 정리 (c) stateNode 편집 시 위젯 영향
- **기각 대안**: B(영속 파일쓰기: 스코프 10배), E(ARIA+Layout 통합 트리: 스키마 2중화)

## §1 책임 분해

| # | 책임 | 파일 경로 | 레이어 | 기존/신규 | 의존 |
|---|------|----------|-------|----------|------|
| 1 | FlatLayout 인스턴스 전역 레지스트리 (register/unregister/getAll/subscribe) | `src/interactive-os/primitives/flatLayoutRegistry.ts` | primitives | 신규 | — |
| 2 | FlatLayout 컴포넌트 mount 시 레지스트리 등록 | `src/interactive-os/ui/FlatLayout.tsx` | ui | 수정 | 1 |
| 3 | Layout store → 트리 노드(NormalizedData) 변환 | `src/devtools/inspector/layoutStoreToTree.ts` | devtools | 신규 | — |
| 4 | 선택된 LayoutNode → TreeGrid data (LayoutBase 4축 kv) 변환 + 역변환 | `src/devtools/inspector/layoutNodeToGridData.ts` | devtools | 신규 | — |
| 5 | definePage 직렬화 (store → TS 코드 문자열) | `src/devtools/inspector/serializeToDefinePage.ts` | devtools | 신규 | — |
| 6 | 범용 노드 patch command (updateNode) | `src/interactive-os/layout/layoutCommands.ts` | layout | 확장 | — |
| 7 | Page 탭 콘텐츠 UI (레지스트리 구독 + 트리 + TreeGrid 편집 + Copy 버튼) | `src/devtools/inspector/InspectorPageTab.tsx` | devtools | 신규 | 1,3,4,5,6 |
| 8 | InspectorWindow TAB_LIST에 'page' 추가 | `src/devtools/inspector/InspectorWindow.tsx` | devtools | 수정 | 7 |

### 탐색 증거

- `Glob("src/interactive-os/primitives/*Registry*")` → `ariaRegistry.ts` 1건 (패턴 복제 원본)
- `Grep("registerAria")` → `ariaRegistry.ts:16` — registerAria/unregisterAria/subscribeRegistry/getAllAriaActions 패턴 확인
- `Grep("FlatLayoutContext")` → `src/interactive-os/ui/useFlatLayout.ts:14` — `{ store, dispatch, getNodeElement }` 시그니처 확인
- `Glob("src/interactive-os/ui/TreeGrid.tsx")` → 1건, `enableEditing` prop + `cellEdit()` plugin 지원 확인 (`TreeGrid.tsx:60`, `:110`)
- `Grep("updateEntityData")` in `layoutCommands.ts` → setVisibility/setHidden/setGap은 있으나 **범용 updateNode(nodeId, patch) 없음** → W6에서 확장
- `Read("src/interactive-os/store/storeToInspectorTree.ts")` → 기존은 `entities/relationships` 2-group 평면 뷰. 트리 계층 표현 아님 → W3 신규 필요
- `Grep("definePage(")` → `flatLayout.ts:102` 시그니처 `{ entities: Record<id, {data, children?}> }` 확인 (W5 역직렬화 기준)
- CATALOG.md — TreeGrid/TreeView/Inspector 구성품은 이미 있음, Layout 트리 렌더러·직렬화기·FlatLayoutRegistry는 부재 확인

**완성도**: 🟢

## §2 Contract

### `src/interactive-os/primitives/flatLayoutRegistry.ts`

```ts
import type { NormalizedData } from '../store/types'
import type { Command } from '../engine/types'

export interface FlatLayoutActions {
  /** 현재 store 스냅샷 — subscribe로 갱신 알림 */
  getStore: () => NormalizedData
  /** 레이아웃 mutate 진입점 — layoutCommands 전용 */
  dispatch: (command: Command) => void
  /** DOM lookup (focusDir·flashPane 등에서 재사용) */
  getNodeElement: (nodeId: string) => HTMLElement | null
  /** store 변경 구독 */
  subscribe: (listener: () => void) => () => void
}

/** @invariant id는 FlatLayout 인스턴스당 1회만 등록; 중복 id는 덮어씀 */
export function registerFlatLayout(id: string, actions: FlatLayoutActions): void
export function unregisterFlatLayout(id: string): void
export function getFlatLayoutActions(id: string): FlatLayoutActions | undefined
export function getAllFlatLayouts(): Map<string, FlatLayoutActions>
/** registry 엔트리 추가/삭제 시 호출됨 (개별 store 변경 아님) */
export function subscribeFlatLayoutRegistry(listener: () => void): () => void
```

### `src/devtools/inspector/layoutStoreToTree.ts`

```ts
import type { NormalizedData } from '@os/store/types'

/**
 * FlatLayout store를 Inspector TreeView용 NormalizedData로 변환.
 * ROOT_ID children부터 relationships를 재귀 순회하여 계층을 보존한다.
 * 각 노드 label = `${id} · ${data.type}` (예: "root · split", "header · widget")
 * 위젯 노드는 widget 이름을 label 꼬리에 추가: "header · widget:TodoHeaderWidget"
 *
 * @invariant 반환 store의 entity id는 원본 id와 동일 (선택 시 원본 store에서 lookup 가능)
 */
export function layoutStoreToTree(source: NormalizedData): NormalizedData
```

### `src/devtools/inspector/layoutNodeToGridData.ts`

```ts
import type { NormalizedData } from '@os/store/types'

/** MVP 편집 대상 — LayoutBase 4축 (discuss 질문 3 C 선택) */
export const EDITABLE_KEYS = ['surface', 'padding', 'hidden', 'gap'] as const
export type EditableKey = typeof EDITABLE_KEYS[number]

/**
 * LayoutNode data → TreeGrid column mode용 NormalizedData.
 * 각 row entity = { id: `prop:${key}`, data: { cells: [key, String(value)] } }
 * 값이 undefined면 빈 문자열. hidden은 boolean이므로 'true'/'false' 문자열로 직렬화.
 *
 * @invariant EDITABLE_KEYS 순서를 유지한다 (TreeGrid row 순서 결정적)
 */
export function layoutNodeToGridData(nodeData: Record<string, unknown>): NormalizedData

/**
 * TreeGrid onChange에서 받은 갱신 store → LayoutNode patch (부분).
 * 값 파싱: surface/padding/gap은 enum 문자열 그대로, hidden은 'true'→true/'false'→false.
 * 빈 문자열은 해당 키를 제거(undefined)로 해석.
 *
 * @invariant EDITABLE_KEYS에 없는 키는 patch에 포함하지 않는다
 */
export function gridDataToLayoutPatch(grid: NormalizedData): Record<string, unknown>
```

### `src/devtools/inspector/serializeToDefinePage.ts`

```ts
import type { NormalizedData } from '@os/store/types'

/**
 * NormalizedData (definePage 결과) → `definePage({ entities: {...} })` TS 코드 문자열.
 * - 2-space indent, JSON.stringify 기반 + 키 언쿼트
 * - ROOT_ID 메타 relationship은 생략 (children 필드로 복원됨)
 * - __-prefixed 메타 entity(FOCUS_STATE_ID 등)는 skip
 *
 * @invariant 반환 문자열은 eval 대상이 아니라 클립보드 paste용; 사용자가 수동 정리 전제
 */
export function serializeToDefinePage(store: NormalizedData): string
```

### `src/interactive-os/layout/layoutCommands.ts` — 확장 한 줄

```ts
// 기존 defineCommands 블록에 추가
updateNode: {
  type: 'layout:updateNode' as const,
  create: (nodeId: string, patch: Record<string, unknown>) => ({ nodeId, patch }),
  handler: (store, { nodeId, patch }) => updateEntityData(store, nodeId, patch),
},
```

### `src/interactive-os/ui/FlatLayout.tsx` — 수정 (2개 훅 추가)

```ts
// FlatLayout 컴포넌트 내부 — instance id prop 추가 (선택적, 기본 생성)
interface FlatLayoutProps {
  id?: string  // 신규 — 레지스트리 key. 미지정 시 useId()
  // ... 기존 props
}

// mount/unmount 시 레지스트리 등록
useEffect(() => {
  registerFlatLayout(instanceId, { getStore, dispatch, getNodeElement, subscribe })
  return () => unregisterFlatLayout(instanceId)
}, [instanceId])
```

### `src/devtools/inspector/InspectorPageTab.tsx`

```ts
interface InspectorPageTabProps {
  /** 외부 상태 — 여러 FlatLayout 인스턴스 중 선택된 id (여러 개면 드롭다운) */
  activeInstanceId: string | null
  onSelectInstance: (id: string | null) => void
}

/**
 * Page 탭 콘텐츠.
 * - 레지스트리 비어 있음 → "No definePage detected" 배지
 * - 있음 → 좌: TreeView(layoutStoreToTree) / 우: 선택 노드 TreeGrid 편집
 * - 하단: Copy as definePage 버튼
 *
 * @invariant 이 컴포넌트는 @os/ui 외부 부품(TreeView/TreeGrid)만 사용 — 날코딩 금지
 */
export function InspectorPageTab(props: InspectorPageTabProps): React.ReactElement
```

**완성도**: 🟢

## §3 WHY

**왜 지금 이 분해인가**

1. **FlatLayout 1st 원칙 + os 검증 강제** — 프로젝트 메모리 `feedback_flatlayout_first`는 "FlatLayout이 못 하면 우회 말고 엔진 확장"이라고 못박지만, 런타임에 "이 페이지가 definePage로 만들어졌는가"를 확인할 도구가 없었다. Page 탭의 존재 유무가 곧 검증이다 (사용자 확정: "Page 탭에 컨텐츠가 노출되면 그 자체가 쓴다는 거잖아").

2. **디자인 실험 루프 단축** — 현재 `surface`/`padding`/`hidden`/`gap` 실험은 코드 편집 → HMR → 확인 왕복. Inspector 내부 편집 + 즉시 반영으로 loop time을 초 단위로 줄인다. `feedback_ratchet_convergence`(Ratcheting Convergence)와 부합.

3. **TreeGrid dogfooding** — `feedback_os_validation_strategy`(날코딩→os 교체로 실전 검증). Page 탭이 TreeGrid의 editable 경로를 실제 작업 흐름에 투입하는 첫 사례가 된다.

4. **스코프 축소로 위험 제거** — "휘발 + 클립보드"로 결정하면서 write-back AST · Vite WS 채널 · codemod가 모두 제외됐다. 신규 파일 6개, 수정 3개, 재사용 5개로 수렴 (생태계 정석 = Storybook Controls 모델).

**왜 이 책임 분해인가 (1파일 1책임 강제)**

- 레지스트리(1) vs 레지스트리 등록(2) 분리: register 로직과 register 호출 지점은 레이어가 다르다(primitives vs ui).
- 트리 변환(3)과 편집 그리드 변환(4) 분리: 읽기와 쓰기는 방향이 다르고 데이터 모양이 다르다. 3은 트리, 4는 테이블 row.
- 직렬화(5) 분리: 클립보드 유틸은 편집과 독립적이라 테스트 표면이 다르다.
- 범용 updateNode command(6)는 layout 레이어에 두어야 다른 도구(스크립트·테스트 fixture)에서도 재사용 가능.
- 인스펙터 UI(7)는 devtools. 위 6개를 조립만 한다.

## §4 HOW

```mermaid
flowchart TD
  subgraph ui[ui layer]
    FL[FlatLayout<br/>mount]
  end

  subgraph primitives[primitives]
    REG[flatLayoutRegistry<br/>Map&lt;id, actions&gt;]
  end

  subgraph devtools[devtools/inspector]
    TAB[InspectorPageTab]
    T2T[layoutStoreToTree]
    N2G[layoutNodeToGridData]
    SER[serializeToDefinePage]
    TV[TreeView]
    TG[TreeGrid editable]
    COPY[Copy button]
  end

  subgraph layout[layout commands]
    CMD[layoutCommands.updateNode]
  end

  FL -->|register id, store, dispatch| REG
  TAB -->|subscribe + getAllFlatLayouts| REG
  REG -->|store snapshot| T2T
  T2T -->|tree NormalizedData| TV
  TV -->|onFocusChange nodeId| TAB
  TAB -->|entity.data| N2G
  N2G -->|grid NormalizedData| TG
  TG -->|onChange updated grid| TAB
  TAB -->|gridDataToLayoutPatch| CMD
  CMD -->|dispatch via FL actions| REG
  TAB -->|serializeToDefinePage| COPY
  COPY -->|navigator.clipboard.writeText| User([clipboard])
```

## §5 WHAT (의존 순서)

### W1. flatLayoutRegistry (§1.1)

**의존**: —
**파일**: `src/interactive-os/primitives/flatLayoutRegistry.ts`

```ts
import type { NormalizedData } from '../store/types'
import type { Command } from '../engine/types'

export interface FlatLayoutActions {
  getStore: () => NormalizedData
  dispatch: (command: Command) => void
  getNodeElement: (nodeId: string) => HTMLElement | null
  subscribe: (listener: () => void) => () => void
}

const registry = new Map<string, FlatLayoutActions>()
const registryListeners = new Set<() => void>()

function emit(): void {
  registryListeners.forEach(fn => fn())
}

export function registerFlatLayout(id: string, actions: FlatLayoutActions): void {
  registry.set(id, actions)
  emit()
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    const win = window as unknown as Record<string, unknown>
    if (!win.__FLAT_LAYOUTS__) win.__FLAT_LAYOUTS__ = registry
  }
}

export function unregisterFlatLayout(id: string): void {
  registry.delete(id)
  emit()
}

export function getFlatLayoutActions(id: string): FlatLayoutActions | undefined {
  return registry.get(id)
}

export function getAllFlatLayouts(): Map<string, FlatLayoutActions> {
  return registry
}

export function subscribeFlatLayoutRegistry(listener: () => void): () => void {
  registryListeners.add(listener)
  return () => { registryListeners.delete(listener) }
}
```

**검증**: vitest unit — register/get/unregister 3단계 후 `getAllFlatLayouts().size === 0`; subscribe 콜백 호출 횟수 = 2 (register + unregister).

### W6. layoutCommands.updateNode (§1.6)

**의존**: —
**파일**: `src/interactive-os/layout/layoutCommands.ts` (기존 `defineCommands({...})` 블록 내부)

```ts
updateNode: {
  type: 'layout:updateNode' as const,
  create: (nodeId: string, patch: Record<string, unknown>) => ({ nodeId, patch }),
  handler: (store, { nodeId, patch }) => updateEntityData(store, nodeId, patch),
},
```

**검증**: vitest — `layoutCommands.updateNode('root', { surface: 'raised' }).handler(store, ...)` 후 `getEntityData(result, 'root').surface === 'raised'`.

### W2. FlatLayout 등록 hook (§1.2)

**의존**: W1
**파일**: `src/interactive-os/ui/FlatLayout.tsx`

```ts
// 1. imports 추가
import { useId, useEffect, useRef } from 'react'
import { registerFlatLayout, unregisterFlatLayout } from '@os/primitives/flatLayoutRegistry'

// 2. FlatLayout props에 id 추가 (선택적)
interface FlatLayoutProps {
  id?: string
  // ... 기존 props 그대로
}

// 3. 컴포넌트 본문 안 — store/dispatch/getNodeElement는 기존 FlatLayoutContext value와 동일
export function FlatLayout({ id: propId, ...rest }: FlatLayoutProps) {
  const fallbackId = useId()
  const instanceId = propId ?? fallbackId
  const listenersRef = useRef(new Set<() => void>())

  // 기존 useAria / store / dispatch / getNodeElement 계산 블록은 그대로.
  // store가 바뀔 때 listenersRef 전파
  useEffect(() => { listenersRef.current.forEach(fn => fn()) }, [store])

  useEffect(() => {
    registerFlatLayout(instanceId, {
      getStore: () => store,
      dispatch,
      getNodeElement,
      subscribe: (fn) => {
        listenersRef.current.add(fn)
        return () => { listenersRef.current.delete(fn) }
      },
    })
    return () => unregisterFlatLayout(instanceId)
  }, [instanceId, store, dispatch, getNodeElement])

  // ... 기존 JSX
}
```

**검증**: FlatLayout을 마운트한 테스트 — `getAllFlatLayouts().size === 1`, unmount 후 `=== 0`.

### W3. layoutStoreToTree (§1.3)

**의존**: —
**파일**: `src/devtools/inspector/layoutStoreToTree.ts`

```ts
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'

export function layoutStoreToTree(source: NormalizedData): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = {}

  for (const [id, entity] of Object.entries(source.entities)) {
    if (id.startsWith('__')) continue
    const data = (entity.data ?? {}) as Record<string, unknown>
    const type = typeof data.type === 'string' ? data.type : '?'
    const widget = type === 'widget' && typeof data.widget === 'string' ? `:${data.widget}` : ''
    entities[id] = {
      id,
      data: { label: `${id} · ${type}${widget}`, type, raw: data },
    }
  }

  for (const [parentId, childIds] of Object.entries(source.relationships)) {
    if (parentId.startsWith('__')) continue
    relationships[parentId] = childIds.filter(c => !c.startsWith('__'))
  }
  if (!relationships[ROOT_ID]) relationships[ROOT_ID] = []

  return { entities, relationships }
}
```

**검증**: `todoLayout` fixture 입력 → 반환 store의 `relationships[ROOT_ID]` === `['root']`, `relationships.root` === `['header', 'list', 'composer']`, `entities.header.data.label` === `'header · widget:TodoHeaderWidget'`.

### W4. layoutNodeToGridData (§1.4)

**의존**: —
**파일**: `src/devtools/inspector/layoutNodeToGridData.ts`

```ts
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'

export const EDITABLE_KEYS = ['surface', 'padding', 'hidden', 'gap'] as const
export type EditableKey = typeof EDITABLE_KEYS[number]

export function layoutNodeToGridData(nodeData: Record<string, unknown>): NormalizedData {
  const entities: Record<string, Entity> = {}
  const children: string[] = []

  for (const key of EDITABLE_KEYS) {
    const rowId = `prop:${key}`
    const raw = nodeData[key]
    const value = raw === undefined ? '' : typeof raw === 'boolean' ? String(raw) : String(raw)
    entities[rowId] = { id: rowId, data: { cells: [key, value] } }
    children.push(rowId)
  }

  return { entities, relationships: { [ROOT_ID]: children } }
}

export function gridDataToLayoutPatch(grid: NormalizedData): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const key of EDITABLE_KEYS) {
    const row = grid.entities[`prop:${key}`]
    const cells = (row?.data as { cells?: unknown[] } | undefined)?.cells
    if (!Array.isArray(cells) || cells.length < 2) continue
    const raw = cells[1]
    if (raw === '' || raw === undefined) {
      patch[key] = undefined
      continue
    }
    if (key === 'hidden') {
      patch[key] = raw === 'true' || raw === true
    } else {
      patch[key] = raw
    }
  }
  return patch
}
```

**검증**: `layoutNodeToGridData({ surface: 'raised', hidden: true })` → 4행 반환, `cells[1]`가 `'raised'`·`'true'`·`''`·`''`. 역변환 후 `{ surface: 'raised', hidden: true, padding: undefined, gap: undefined }`.

### W5. serializeToDefinePage (§1.5)

**의존**: —
**파일**: `src/devtools/inspector/serializeToDefinePage.ts`

```ts
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'

function jsonWithUnquotedKeys(value: unknown, indent: number): string {
  const raw = JSON.stringify(value, null, 2)
  const reIndent = raw.split('\n').map((line, i) => i === 0 ? line : ' '.repeat(indent) + line).join('\n')
  return reIndent.replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1:')
}

export function serializeToDefinePage(store: NormalizedData): string {
  const lines: string[] = ['definePage({', '  entities: {']
  const ids = Object.keys(store.entities).filter(id => !id.startsWith('__'))
  for (const id of ids) {
    const entity = store.entities[id]
    const data = (entity?.data ?? {}) as Record<string, unknown>
    const { label: _label, ...cleanData } = data
    const children = store.relationships[id]?.filter(c => !c.startsWith('__')) ?? []
    lines.push(`    ${id}: {`)
    lines.push(`      data: ${jsonWithUnquotedKeys(cleanData, 6)},`)
    if (children.length > 0) {
      lines.push(`      children: ${JSON.stringify(children)},`)
    }
    lines.push(`    },`)
  }
  lines.push('  },')
  lines.push('})')
  return lines.join('\n')
}
```

**검증**: `todoLayout` → 출력 문자열이 `definePage({`로 시작, `entities: {` 포함, `root: {`, `children: ["header","list","composer"]` 포함, `__`-접두 항목 미포함.

### W7. InspectorPageTab (§1.7)

**의존**: W1, W3, W4, W5, W6
**파일**: `src/devtools/inspector/InspectorPageTab.tsx`

```tsx
import { useEffect, useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { TreeView } from '@os/ui/TreeView'
import { TreeGrid } from '@os/ui/TreeGrid'
import { SplitPane } from '@os/ui/SplitPane'
import type { NormalizedData, PaneSize } from '@os/store/types'
import { getEntityData } from '@os/store/createStore'
import {
  getAllFlatLayouts,
  subscribeFlatLayoutRegistry,
  type FlatLayoutActions,
} from '@os/primitives/flatLayoutRegistry'
import { layoutCommands } from '@os/layout/layoutCommands'
import { layoutStoreToTree } from './layoutStoreToTree'
import { layoutNodeToGridData, gridDataToLayoutPatch } from './layoutNodeToGridData'
import { serializeToDefinePage } from './serializeToDefinePage'
import { renderInspectorItem } from './renderInspectorItem'
import { ax } from '@styles/ax'

const GRID_COLUMNS = [
  { key: 'key', header: 'Prop' },
  { key: 'value', header: 'Value' },
]

function useRegistrySnapshot(): Map<string, FlatLayoutActions> {
  return useSyncExternalStore(subscribeFlatLayoutRegistry, getAllFlatLayouts, getAllFlatLayouts)
}

function useStoreSnapshot(actions: FlatLayoutActions | undefined): NormalizedData | null {
  const [store, setStore] = useState<NormalizedData | null>(() => actions?.getStore() ?? null)
  useEffect(() => {
    if (!actions) { setStore(null); return }
    setStore(actions.getStore())
    return actions.subscribe(() => setStore(actions.getStore()))
  }, [actions])
  return store
}

export function InspectorPageTab() {
  const registry = useRegistrySnapshot()
  const instanceIds = useMemo(() => [...registry.keys()], [registry])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sizes, setSizes] = useState<PaneSize[]>([0.5, 'flex'])

  useEffect(() => {
    if (activeId && !registry.has(activeId)) setActiveId(null)
    if (!activeId && instanceIds.length > 0) setActiveId(instanceIds[0]!)
  }, [activeId, instanceIds, registry])

  const actions = activeId ? registry.get(activeId) : undefined
  const store = useStoreSnapshot(actions)

  const treeData = useMemo(() => store ? layoutStoreToTree(store) : null, [store])

  const selectedData = useMemo(() => {
    if (!store || !selectedNodeId) return null
    return getEntityData<Record<string, unknown>>(store, selectedNodeId) ?? null
  }, [store, selectedNodeId])

  const gridData = useMemo(
    () => selectedData ? layoutNodeToGridData(selectedData) : null,
    [selectedData],
  )

  const handleGridChange = useCallback((next: NormalizedData) => {
    if (!selectedNodeId || !actions) return
    const patch = gridDataToLayoutPatch(next)
    actions.dispatch(layoutCommands.updateNode(selectedNodeId, patch))
  }, [selectedNodeId, actions])

  const handleCopy = useCallback(async () => {
    if (!store) return
    await navigator.clipboard.writeText(serializeToDefinePage(store))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [store])

  if (registry.size === 0) {
    return (
      <div className={ax({ padding: 'md', text: 'muted', textStyle: 'caption' })}>
        No definePage detected. This page may be hand-coded outside FlatLayout.
      </div>
    )
  }

  return (
    <div className={ax({ layout: 'stack', gap: 'sm', padding: 'sm' })}>
      {instanceIds.length > 1 && (
        <select
          value={activeId ?? ''}
          onChange={(e) => setActiveId(e.target.value || null)}
          className={ax({ textStyle: 'caption', padding: 'xs', border: 'default', shape: 'sm' })}
        >
          {instanceIds.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
      )}
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes}>
        <div className={ax({ padding: 'xs' })}>
          {treeData && (
            <TreeView
              data={treeData}
              plugins={[]}
              renderItem={renderInspectorItem}
              onFocusChange={(id) => setSelectedNodeId(id)}
              aria-label="Layout tree"
            />
          )}
        </div>
        <div className={ax({ layout: 'stack', gap: 'sm', padding: 'xs' })}>
          {gridData ? (
            <TreeGrid
              data={gridData}
              columns={GRID_COLUMNS}
              enableEditing
              onChange={handleGridChange}
              header
              aria-label="Layout node props"
            />
          ) : (
            <div className={ax({ text: 'muted', textStyle: 'caption' })}>Select a node.</div>
          )}
          <button
            className={ax({ textStyle: 'caption', padding: 'xs', border: 'default', shape: 'sm', interactive: 'button' })}
            onClick={handleCopy}
            disabled={!store}
          >
            {copied ? '✓ Copied' : 'Copy as definePage'}
          </button>
        </div>
      </SplitPane>
    </div>
  )
}
```

**검증**: screen-test — todo 라우트 로드 → Cmd+O로 Inspector 열기 → Page 탭 → `root` 선택 → TreeGrid에서 `surface` 셀 편집 → Enter → 화면 `root` surface 토큰 변경 확인 + Copy 클릭 → 클립보드에 `definePage({` 포함.

### W8. InspectorWindow TAB_LIST 확장 (§1.8)

**의존**: W7
**파일**: `src/devtools/inspector/InspectorWindow.tsx`

```ts
// 1. import 추가
import { InspectorPageTab } from './InspectorPageTab'

// 2. TAB_LIST 확장 — 'page' 첫 자리에 추가
type DetailTab = 'page' | 'interaction' | 'aria' | 'state' | 'log'
const TAB_LIST: { id: DetailTab; label: string }[] = [
  { id: 'page', label: 'Page' },
  { id: 'interaction', label: 'Interaction' },
  { id: 'aria', label: 'ARIA' },
  { id: 'state', label: 'State' },
  { id: 'log', label: 'Log' },
]

// 3. 탭 콘텐츠 분기에 추가
{activeTab === 'page' && <InspectorPageTab />}
```

**검증**: Inspector 열면 탭 5개 보임, 'Page'가 첫 자리. 기존 Interaction/ARIA/State/Log 동작 무변화.

## §6 원칙 감시자 결과

| 항목 | 검사 | 결과 |
|------|------|------|
| 파일명 = 주 export 식별자 | 8개 파일 모두 camelCase + 주 export 일치 | ✅ |
| 레이어 의존 방향 | store → primitives → layout/ui → devtools, 역방향 없음 | ✅ |
| ax()만 | InspectorPageTab JSX 내 style={} 없음, 모든 className = ax() | ✅ |
| os 부품만 | TreeView/TreeGrid/SplitPane 재사용, 새 UI 없음 | ✅ |
| 있는 걸로 (CATALOG) | W3·W4·W5·W1·W6·W7 모두 "탐색 증거"에 부재 확인 | ✅ |
| store command 경유 | 편집은 `layoutCommands.updateNode` dispatch만 | ✅ |
| Placeholder 없음 | "TBD/적절히/필요시" 없음 — 전 구현 완결 | ✅ |
| 1파일 1책임 | 각 행이 단일 export/단일 의도 | ✅ |
| 휘발 only | `fs.write`·Vite WS·codemod 코드 없음 | ✅ |
| frontmatter 규약 | id/type/slug/title/tags/created/updated/summary 모두 존재 | ✅ |

**위반**: 0건.

---

**전체 완성도**: 🟢
