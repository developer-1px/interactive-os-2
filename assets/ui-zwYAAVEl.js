import{r as e}from"./chunk-CFjPhJqf.js";var t=e({default:()=>n}),n=`# UI Components

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
| Dialog | dialog | Navigation | 🟢 |
| AlertDialog | alertdialog | Navigation | 🟢 |
| Toolbar | toolbar | Navigation | 🟢 |
| Tooltip | — (engine 밖) | Standalone | 🟢 |

## behavior vs UI 매핑

18개 behavior 중 17개에 UI 컴포넌트가 있고, 전부 🟢. Tooltip은 engine 밖 독립 컴포넌트 (\`popover="hint"\` + \`interestfor\` 네이티브 API):
- spatial은 Kanban 내부에서 사용되므로 별도 UI 불필요
- Dialog/AlertDialog/Toolbar: ax() 기반 스타일 적용 완료
`;export{t};