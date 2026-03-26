# Pattern (L5)

> `composePattern(identity, ...axes)` → AriaPattern. 축을 조합하여 W3C APG 패턴을 선언적으로 구성. edit 축 + presets + createPatternContext 포함.

## 주기율표

| 패턴 | factory | 축 조합 | childRole | 상태 |
|------|---------|---------|-----------|------|
| listbox | `listbox` | select(multi,extended) + activate(onClick) + navigate(vertical) | option | 🟢 |
| menu | `menu` | activate(onClick) + navigate(vertical) | menuitem | 🟢 |
| tabs | `tabs` | select(single) + activate(onClick,followFocus) + navigate(horizontal) | tab | 🟢 |
| radiogroup | `radiogroup` | select(single) + activate(onClick) + navigate(both,wrap) | radio | 🟢 |
| accordion | `accordion` | activate(toggleExpand) + navigate(vertical) | heading | 🟢 |
| disclosure | `disclosure` | activate(toggleExpand) + navigate(vertical) | button | 🟢 |
| switch | `switchBehavior` | activate(onClick,toggleExpand) | switch | 🟢 |
| toolbar | `toolbar` | activate(onClick) + navigate(horizontal) | button | 🟢 |
| dialog | `dialog` | trap | group | 🟢 |
| alertdialog | `alertdialog` | trap | group | 🟢 |
| tree | `tree` | select(multi,extended) + activate(onClick) + expand(arrow) + navigate(vertical) | treeitem | 🟢 |
| treegrid | `treegrid` | select(multi,extended) + activate(onClick) + expand(arrow) + navigate(vertical) | row | 🟢 |
| grid | `grid({columns})` | select(multi) + activate(onClick) + navigate(grid) | gridcell | 🟢 |
| combobox | `combobox` | (custom keyMap) | option | 🟢 |
| spatial | `spatial` | select(toggle) + expand(enter-esc) + navigate(both) | group | 🟢 |
| kanban | `kanban` | (custom 5-axis compose) | group | 🟢 |
| slider | `slider({min,max,step})` | value(horizontal) | slider | 🟢 |
| spinbutton | `spinbutton({min,max,step})` | value(vertical) | spinbutton | 🟢 |
| **menubar** | **—** | **multi-zone (useAriaZone)** | **menuitem** | **⬜** |

## 분류

| 그룹 | 패턴 |
|------|------|
| Navigation (read-only) | listbox, tree, menu, tabs, radiogroup, toolbar, combobox, accordion, disclosure, switch, dialog, alertdialog |
| Collection (CRUD) | treegrid, grid, kanban |
| Spatial (depth) | spatial |
| Value (continuous) | slider, spinbutton |

## 갭

- ⬜ **menubar**: bar 레벨(horizontal) + dropdown 레벨(vertical) = multi-zone 합성. 새 축 불필요, useAriaZone으로 해결 예상.
