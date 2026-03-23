# UI Components

> 패턴별 구현 컴포넌트. 각 behavior를 시각적으로 렌더링하는 React 컴포넌트.

## 주기율표

| 컴포넌트 | behavior 대응 | 그룹 | 상태 |
|---------|--------------|------|------|
| Accordion | accordion | Navigation | 🟢 |
| ListBox | listbox | Navigation | 🟢 |
| MenuList | menu | Navigation | 🟢 |
| TabList | tabs | Navigation | 🟢 |
| RadioGroup | radiogroup | Navigation | 🟢 |
| DisclosureGroup | disclosure | Navigation | 🟢 |
| SwitchGroup | switch | Navigation | 🟢 |
| TreeView | tree | Navigation | 🟢 |
| TreeGrid | treegrid | Collection | 🟢 |
| Grid | grid | Collection | 🟢 |
| Kanban | kanban | Collection | 🟢 |
| Combobox | combobox | Navigation | 🟢 |
| Slider | slider | Value | 🟢 |
| Spinbutton | spinbutton | Value | 🟢 |
| **Dialog** | **dialog** | **Navigation** | **⬜** |
| **AlertDialog** | **alertdialog** | **Navigation** | **⬜** |
| **Toolbar** | **toolbar** | **Navigation** | **⬜** |
| Tooltip | — (engine 밖) | Standalone | 🟢 |

## behavior vs UI 매핑

18개 behavior 중 14개에 UI 컴포넌트가 있고, 3개가 ⬜. Tooltip은 engine 밖 독립 컴포넌트 (`popover="hint"` + `interestfor` 네이티브 API):
- **dialog/alertdialog**: behavior는 있지만 범용 UI 컴포넌트가 없음 (데모 페이지에서 인라인 구현)
- **toolbar**: behavior는 있지만 독립 UI 컴포넌트가 없음 (ActivityBar에서 인라인 사용)
- spatial은 Kanban 내부에서 사용되므로 별도 UI 불필요

## 갭

- ⬜ **Dialog/AlertDialog**: 범용 UI 컴포넌트로 분리할지, 인라인 패턴으로 충분한지 미결정
- ⬜ **Toolbar**: ActivityBar가 toolbar behavior를 사용하지만 재사용 가능한 컴포넌트 없음
