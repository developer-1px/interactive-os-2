# interactive-os

> 키보드 우선 ARIA 프레임워크. LLM이 인터랙션을 재발명하지 않도록 하는 빌딩블록.

## 레이어 순서

의존 방향: 위에서 아래로. 아래 레이어는 위 레이어만 참조.

| # | 레이어 | Area | 모듈 수 | 설명 |
|---|--------|------|---------|------|
| 0 | Vision | [vision](./vision.mdx) | — | 왜 만드는가 — FE 가치 thesis, 확산 전략 |
| 1 | Core | [core](./core.mdx) | 3 | Entity, Store, CommandEngine |
| 2 | Axes | [axes](./axes.mdx) | 6 + 1⬜ | 키맵 원자 — navigate, select, activate, expand, trap, value |
| 3 | Patterns | [patterns](./patterns.mdx) | 17 + 1⬜ | 축 조합 → AriaBehavior |
| 4 | Plugins | [plugins](./plugins.mdx) | 9 | Command 확장 — crud, history, clipboard, dnd, rename, focusRecovery |
| 5 | Hooks | [hooks](./hooks.mdx) | 7 | React 통합 — useAria, useEngine, useAriaZone |
| 6 | UI | [ui](./ui.mdx) | 15/34 | 패턴별 컴포넌트. [사전](./ui-dictionary.mdx) |
| 7 | Pages | — | 41 | 쇼케이스 (후순위) |

## 의존 그래프

```
Core (Entity, Command, Store)
  ↓
Axes (navigate, select, activate, expand, trap, value)
  ↓
Patterns (composePattern → AriaBehavior)
  ↓
Plugins (Command 확장)
  ↓
Hooks (useEngine → useAria → DOM)
  ↓
UI (React 컴포넌트)
  ↓
Pages (쇼케이스)
```

## Ideal Usage

하나의 ListBox가 전 레이어를 관통하는 모습. 번호(❶~❻)가 위 레이어 표와 대응한다.

```tsx
// ❶ Core — 정규화된 데이터 구조
const data = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Apple' } },
    b: { id: 'b', data: { label: 'Banana' } },
    c: { id: 'c', data: { label: 'Cherry' } },
  },
  relationships: { [ROOT_ID]: ['a', 'b', 'c'] },
})

// ❷ Axes + ❸ Patterns — 축 조합 → AriaBehavior
const listbox = composePattern(
  { role: 'listbox', childRole: 'option' },
  select({ mode: 'multiple', extended: true }),
  activate({ onClick: true }),
  navigate({ orientation: 'vertical' }),
)

// ❹ Plugins — Command 확장
const plugins = [core(), crud(), history()]

// ❺ Hooks + ❻ UI — React 통합 → DOM 바인딩
function MyList() {
  const [items, setItems] = useState(data)
  const aria = useAria({
    behavior: listbox,
    data: items,
    plugins,
    onChange: setItems,
  })

  return (
    <div {...aria.containerProps}>
      {getChildren(items, ROOT_ID).map(id => (
        <div key={id} {...aria.getNodeProps(id)}>
          {getEntity(items, id)?.data?.label}
        </div>
      ))}
    </div>
  )
}
```

## 전체 빈칸 (⬜)

| 레이어 | 빈칸 | 비고 |
|--------|------|------|
| Axes | trigger↔popup | combobox open/close를 축으로 분리 가능한지 미결정 |
| Patterns | menubar | multi-zone (useAriaZone)으로 해결 예상 |
| UI | Dialog, AlertDialog, Toolbar | behavior는 있지만 범용 UI 컴포넌트 없음 |
