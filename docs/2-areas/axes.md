# Axes

> 키맵 원자. 7개 축이 behavior(패턴)를 조합하는 빌딩블록. `composePattern(metadata, ...axes)` → `AriaBehavior`.

## 주기율표

| 축 | 함수 | 점유 키 | 사용 패턴 | 상태 |
|---|---|---|---|---|
| Navigation | `navigate()` | ↑↓←→ Home End | listbox, tree, grid, menu, toolbar, tabs, radiogroup, combobox | 🟢 |
| Selection | `select()` | Space, Shift+↑↓ Home End, Click/Shift+Click/Ctrl+Click (auto selectOnClick) | listbox, tree, treegrid, grid, kanban | 🟢 |
| Activation | `activate()` | Enter, Space(fallback) | listbox, menu, switch, toolbar | 🟢 |
| Expansion | `expand()` | ←→ (state-dependent) | tree, accordion, disclosure | 🟢 |
| Dismiss | `dismiss()` | Escape | dialog, alertdialog | 🟢 |
| Value | `value()` | ↑↓←→ min/max/step | slider, spinbutton | 🟢 |
| Tab | `tab()` | Tab, Shift+Tab (loop만) | CMS(flow), dialog(loop 가능) | 🟢 |
| **Trigger↔Popup** | **—** | **?** | **combobox, tooltip, popover** | **⬜** |

## 의존 방향

```
core (Entity, Command, Store)
  ↓
axes (navigate, select, activate, expand, dismiss, value, tab)
  ↓
behaviors (composePattern → AriaBehavior)
```

## 축 간 키 충돌 해결

축은 chain of responsibility로 합성된다. 같은 키를 여러 축이 점유하면 스택 위(우선순위 높은 축)부터 순회, 첫 번째 non-void Command가 승리한다.

| 충돌 키 | 축 A (우선) | 축 B | 해결 |
|--------|------------|------|------|
| ←→ | expand (depthArrow) | navigate | expand가 expanded 상태에서만 반응, 아니면 void → navigate로 fallback |
| ←→ | value | navigate | value가 slider에서만 사용, 조합하지 않음 |
| Space | select (selectToggle) | activate | select가 먼저 처리, select 없으면 activate로 fallback |
| Tab | tab (loop) | navigate (grid tabCycle) | **동시 사용 금지** — 둘 다 Tab keyMap 정의. JSDoc 경고 명시 |

## 갭

- ⬜ **trigger↔popup**: combobox의 open/close, tooltip의 show/hide를 축으로 분리 가능한지 미결정. 현재 combobox behavior에 하드코딩.
