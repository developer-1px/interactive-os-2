## 시뮬레이션: 개발 (Code Usage)

"useAria 하나면 다 된다"는 현재 프로젝트에서 이미 해결한 문제와 아직 해결 안 된 문제가 섞여 있다. 소비자 코드를 먼저 써 보면 어디가 어색한지 보인다.

---

### 시나리오 1: 가장 흔한 케이스 — 사이드바 네비게이션

```tsx
// 소비자가 쓰고 싶은 코드
import { useAria } from 'interactive-os'

function Sidebar({ items }) {
  const aria = useAria({ data: items })

  return (
    <nav {...aria.containerProps}>
      {aria.items.map(item => (
        <div key={item.id} {...item.props}>
          {item.label}
        </div>
      ))}
    </nav>
  )
}
```

**판정: 이 코드는 자연스럽지 않다.** 이유:

1. `data: items` — items가 뭔 형태인지 모른다. `NormalizedData`를 요구하면 소비자가 `createStore()`를 알아야 한다.
2. `aria.items` — 현재 API에는 없다. `getChildren(store, ROOT_ID)`로 id 배열을 가져오고, `getNodeProps(id)`와 `getNodeState(id)`를 각각 호출해야 한다.
3. behavior가 없다 — listbox인지 tree인지 알 수 없다. 키보드 동작이 결정 안 됨.

---

### 시나리오 2: 현재 실제로 쓰이는 코드 (useNavList)

```tsx
// 현재 프로젝트에서 실제로 동작하는 코드
import { useNavList } from 'interactive-os/ui/useNavList'
import { createStore } from 'interactive-os/core/createStore'
import { ROOT_ID } from 'interactive-os/core/types'
import { getChildren } from 'interactive-os/core/createStore'

const data = createStore({
  entities: {
    home: { id: 'home', data: { label: 'Home' } },
    settings: { id: 'settings', data: { label: 'Settings' } },
  },
  relationships: { [ROOT_ID]: ['home', 'settings'] },
})

function Sidebar() {
  const [store, setStore] = useState(data)
  const nav = useNavList({ data: store, onChange: setStore, onActivate: handleNav })

  const childIds = getChildren(nav.getStore(), ROOT_ID)

  return (
    <div {...nav.rootProps}>
      {childIds.map(id => {
        const entity = nav.getStore().entities[id]
        const state = nav.getItemState(id)
        return (
          <div key={id} {...nav.getItemProps(id)}>
            {entity.data.label}
          </div>
        )
      })}
    </div>
  )
}
```

**판정: 동작하지만 boilerplate가 많다.** 소비자가 알아야 하는 것:

- `createStore` + `NormalizedData` 구조 (entities/relationships)
- `ROOT_ID`, `getChildren` 유틸
- `getStore()` → `entities[id]` → `data.label` 경로
- `getItemProps(id)` / `getItemState(id)` 분리 호출

---

### 시나리오 3: "useAria 하나로 다 되는" 이상적 코드

```tsx
// 이상: 사이드바
const nav = useAria('navlist', items, { onActivate: handleNav })
return <div {...nav.rootProps}>
  {nav.items.map(item => <div key={item.id} {...item.props}>{item.label}</div>)}
</div>

// 이상: 트리뷰
const tree = useAria('tree', fileData, { onActivate: openFile })
return <div {...tree.rootProps}>
  {tree.items.map(item => <div key={item.id} {...item.props} style={{ paddingLeft: item.state.level * 16 }}>
    {item.label}
  </div>)}
</div>

// 이상: 탭
const tabs = useAria('tabs', tabData, { onActivate: switchTab })
return <div {...tabs.rootProps}>
  {tabs.items.map(item => <div key={item.id} {...item.props}>{item.label}</div>)}
</div>
```

**이 코드가 자연스러운가?** 읽기는 좋은데 문제가 있다:

1. **`'navlist'` 문자열로 behavior 선택** — 타입 안전성 약함. 각 behavior마다 고유 옵션이 다르다 (tree에는 `followFocus`, tabs에는 `orientation`, grid에는 `colCount`).
2. **`items` 배열 vs `NormalizedData`** — 플랫 배열은 tree 구조를 표현 못함. tree는 부모-자식 관계가 필요.
3. **`nav.items`** — tree처럼 중첩 구조에서는 "items"가 뭘 의미하는지 모호. 전체 flatten? visible만?

---

### 시나리오 4: 엣지 케이스 — 같은 데이터를 두 위젯이 공유 (Zone)

```tsx
// CMS: sidebar + canvas가 같은 store 공유
const engine = useEngine(cmsData, [core(), history(), clipboard()])

// sidebar zone — 트리뷰로 표시
const sidebar = useAria('tree', { engine, scope: 'sidebar' })

// canvas zone — 그리드로 표시
const canvas = useAria('grid', { engine, scope: 'canvas', colCount: 3 })
```

**현재 이 패턴은 `useAriaZone`으로 이미 존재한다.** 하지만 `useAria` 하나로 통합하면 overload가 복잡해진다: standalone(data 소유) vs zone(engine 공유)을 하나의 함수에서 구분해야 한다.

---

### 역추출된 API 시그니처

시나리오들에서 패턴을 뽑으면, "useAria 하나"가 아니라 **두 개 레이어**가 보인다:

```
레이어 1: useNavList, useTreeView, useTabList, useDataGrid, ...
          (용도별 완성품 hook — 소비자가 직접 쓰는 것)

레이어 2: useAria + useAriaZone
          (내부 엔진 — 완성품 hook이 내부에서 쓰는 것)
```

이것은 현재 프로젝트가 이미 가고 있는 방향과 일치한다 (useNavList, useTreeView, useTabList이 이미 존재).

만약 정말 "하나의 hook"으로 통합한다면 가능한 형태:

```typescript
// 옵션 A: 제네릭 + discriminated union
function useAria(type: 'navlist', options: NavListOptions): NavListReturn
function useAria(type: 'tree', options: TreeOptions): TreeReturn
function useAria(type: 'tabs', options: TabsOptions): TabsReturn
function useAria(type: 'grid', options: GridOptions): GridReturn
// ... 17개 overload

// 옵션 B: 현재 구조 유지 (behavior 객체 직접 전달)
function useAria(options: { behavior: AriaBehavior, data: NormalizedData, ... }): UseAriaReturn
// → 소비자가 behavior를 알아야 함. 이미 존재하고, 이미 "너무 low-level"이라고 판정됨.

// 옵션 C: 용도별 hook 유지 (현재 방향)
useNavList(options)   // behavior = navlist, 내부에서 useAria 호출
useTreeView(options)  // behavior = tree
useTabList(options)   // behavior = tabs
// → 소비자는 자기 용도의 hook만 알면 됨
```

---

### 발견된 갭

- **갭 1: "useAria 하나"는 오히려 API를 악화시킨다.** 17개 behavior의 고유 옵션을 하나의 함수에 넣으면 overload 지옥이 된다. 현재 방향(용도별 hook)이 소비자 입장에서 더 자연스럽다. 이 프로젝트의 memory에도 "LLM은 UI 컴포넌트만, Aria primitives 노출 금지"라고 되어 있다.

- **갭 2: 데이터 입력이 여전히 불편하다.** `createStore({ entities: {...}, relationships: {...} })`는 소비자에게 무거운 개념이다. 플랫 리스트(`[{ id, label }]`)나 트리(`[{ id, label, children: [...] }]`)를 받아서 내부에서 NormalizedData로 변환하는 adapter가 없다. 이게 "하나면 다 되게" 느껴지지 않는 실제 원인일 수 있다.

- **갭 3: `nav.items` 같은 편의 접근자가 없다.** 매번 `getChildren(store, ROOT_ID)` + `store.entities[id]`를 하는 패턴이 반복된다. hook return에 `items: Array<{ id, props, state, data }>` 같은 pre-computed 접근자가 있으면 소비자 코드가 절반으로 줄어든다.

- **갭 4: import 경로가 분산되어 있다.** `useNavList`은 `interactive-os/ui/useNavList`에, `createStore`는 `interactive-os/core/createStore`에, `ROOT_ID`는 `interactive-os/core/types`에 있다. 소비자 입장에서는 진입점이 하나여야 한다.

### 질문

제 판단: "useAria 하나"가 목표가 아니라, **소비자 boilerplate 제거**가 실제 목표다. 이유: 시나리오 2(현재 코드)와 시나리오 3(이상 코드)의 차이는 hook 이름이 아니라 데이터 준비 + 렌더링 반복 코드의 양이다.

구체적으로, 다음 중 어디가 가장 아픈 지점인가?
1. **데이터 준비** — `createStore` + `NormalizedData`를 매번 만드는 것이 불편?
2. **렌더링 반복** — `getChildren` + `getNodeProps` + `getNodeState`를 매번 조립하는 것이 불편?
3. **import 분산** — 여러 경로에서 가져와야 하는 것이 불편?
4. **behavior 선택** — navlist/tree/tabs 중 뭘 써야 하는지 모르겠다?

어디가 가장 거슬리는지에 따라 해법이 달라진다. 1번이면 data adapter, 2번이면 items 접근자, 3번이면 facade export, 4번이면 가이드 문서다.
