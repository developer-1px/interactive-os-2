코드를 쭉 읽어봤다. 현재 구조에서 "useAria 하나면 다 되게" 하고 싶다는 건, 이미 거의 되고 있다. 다만 지금은 사용자가 알아야 할 개념이 많다. 정리하면 이렇다.

---

## 현재 useAria가 이미 하는 것

```ts
const aria = useAria({
  behavior: tree,           // 어떤 위젯인지 (ARIA role + keyMap + 축 조합)
  data: store,              // NormalizedData
  plugins: [core(), history()],  // 기능 확장
  onChange: setStore,        // 외부 상태 동기화
  onActivate: handleActivate,
})

// 반환
aria.dispatch(command)       // 명령 실행
aria.getNodeProps(id)        // role, tabIndex, aria-*, onKeyDown, onClick, onFocus
aria.getNodeState(id)        // focused, selected, expanded, index, level...
aria.containerProps          // 컨테이너에 뿌릴 props
aria.focused                 // 현재 포커스 ID
aria.selected                // 선택된 ID 배열
aria.getStore()              // 현재 스토어 스냅샷
```

이미 단일 진입점이다. 문제는 **이걸 쓰기 위해 알아야 할 것이 behavior, plugin, NormalizedData, Command 4가지**라는 점.

---

## SDK에서 나와야 하는 API 레이어

현재 코드 기준으로 3층이 보인다.

### Layer 1: 용도별 hook (사용자가 쓰는 것)

이미 useNavList, useTreeView, useTabList이 이 패턴이다. behavior를 숨기고, 도메인 용어로 된 API를 제공한다.

```ts
// 사용자가 쓰는 API
const nav = useNavList({ data, onActivate })
// nav.rootProps, nav.getItemProps(id), nav.getItemState(id)

const tv = useTreeView({ data, onChange, followFocus: true })
// tv.rootProps, tv.getItemProps(id), tv.getItemState(id)
```

반환 타입을 보면 패턴이 동일하다:

| 반환값 | 설명 |
|--------|------|
| `rootProps` | 컨테이너 element에 spread |
| `getItemProps(id)` | 아이템 element에 spread |
| `getItemState(id)` | 조건부 렌더링용 상태 |
| `focused` | 현재 포커스 ID |
| `dispatch(command)` | escape hatch |
| `getStore()` | 스토어 접근 |

**이 패턴을 카탈로그 17개 전체로 확장**하면 SDK API가 된다. 현재 완성: 3개, 미완성: 14개.

카탈로그(docs/5-backlogs/uiSdkCatalog.md) 기준으로 나와야 할 hook:

| Hook | Behavior | 비고 |
|------|----------|------|
| `useNavList` | navlist | 완료 |
| `useTreeView` | tree | 완료 |
| `useTabList` | tabs | 완료 |
| `useListBox` | listbox | select + activate + navigate |
| `useCombobox` | combobox | combobox plugin 필요 |
| `useGrid` | grid | colCount, getItemProps + getCellProps |
| `useToolbar` | toolbar | horizontal navigate |
| `useMenuList` | menu | activate + navigate |
| `useAccordion` | accordion | expand + navigate |
| `useDisclosure` | disclosure | expand only |
| `useRadioGroup` | radiogroup | single select + followFocus |
| `useSlider` | slider | value axis |
| `useSpinbutton` | spinbutton | value axis |
| `useDialog` | dialog | trap axis |
| `useAlertDialog` | alertdialog | trap axis |

### Layer 2: useAria (파워 유저용)

behavior + plugin을 직접 조합하고 싶을 때. 현재 그대로 유지.

```ts
// 커스텀 behavior 조합
const myBehavior = composePattern(
  { role: 'listbox', childRole: 'option', ariaAttributes: ... },
  select({ mode: 'multiple' }),
  activate({ onClick: true }),
  navigate({ orientation: 'vertical' }),
)

const aria = useAria({ behavior: myBehavior, data, plugins: [core(), crud(), history()] })
```

### Layer 3: 데이터 유틸 (공통)

```ts
// 스토어 생성
createStore({ entities: {...}, relationships: {...} })

// 스토어 읽기
getChildren(store, parentId)
getEntity(store, id)
getParent(store, id)

// 상수
ROOT_ID
```

---

## 구체적으로 뭐가 빠져 있나

1. **용도별 hook 14개** -- behavior는 이미 18개 다 있다. hook 래퍼만 useNavList 패턴으로 만들면 된다.

2. **Grid 계열은 반환 API가 다르다** -- `getCellProps(rowId, colIndex)`가 추가로 필요. getItemProps만으로는 셀 단위 접근이 안 된다. 현재 TreeGrid.tsx를 보면 Aria.Cell로 해결하고 있지만, hook-first로 전환하면 이 부분이 설계 포인트.

3. **편의 컴포넌트** -- 각 hook에 대응하는 `<NavList>`, `<TreeView>` 같은 편의 컴포넌트. renderItem prop으로 커스터마이즈. 이미 패턴 있으니 반복.

4. **Zone 모드 지원** -- 모든 용도별 hook이 standalone(data/onChange)과 zone(engine/scope/store) 두 가지 모드를 지원해야 한다. useNavList, useTreeView에 이미 union type으로 구현돼 있다.

---

## 정리하면

"useAria 하나면 다 되게" 하려면 두 가지 경로:

- **A. useAria 자체를 SDK API로** -- behavior 이름만 넣으면 되게. `useAria({ behavior: 'listbox', data })`. 문제: behavior마다 반환 API가 미묘하게 다르다(grid의 getCellProps, dialog의 close 등). 타입 안전성이 깨진다.

- **B. 용도별 hook이 SDK API, useAria는 내부** -- 현재 방향. 사용자는 useListBox, useTreeView만 알면 된다. useAria는 escape hatch. 타입이 정확하고, 각 hook의 문서가 해당 위젯의 사용법이 된다.

현재 코드가 B 방향으로 가고 있고, 이게 맞다. v1 실패 교훈("범용 추상화 금지, 용도별 완성품")과도 일치한다.

**다음 단계**: uiSdkCatalog.md의 Pattern 17개 중 미완성 14개를 useNavList 패턴으로 하나씩 추가. Sidebar에서 이미 쓰고 있는 것부터(ListBox, Grid 순).
