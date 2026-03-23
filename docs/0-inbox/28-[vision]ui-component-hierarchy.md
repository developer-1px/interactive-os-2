# UI Component Hierarchy — 2026-03-23

## 배경

UI SDK 카탈로그 32개 컴포넌트를 만들어가면서, 높은 것(FileViewerModal)과 낮은 것(FileIcon)의 위계를 구분할 필요가 생김. Pattern을 가운데 놓고 3층 구조를 정리.

## 내용

### 3층 위계

```
┌─────────────────────────────────────────┐
│  Composition (조립)                      │
│  Element + Pattern을 조립한 더 큰 완성품    │
├─────────────────────────────────────────┤
│  Pattern (인터랙션)                      │
│  interactive-os behavior 기반            │
│  키보드/포커스/ARIA가 있는 것              │
├─────────────────────────────────────────┤
│  Element (시각)                          │
│  behavior 없음. 데이터 → 표시             │
└─────────────────────────────────────────┘
```

### 구분 기준

| 레이어 | 정의 | 특징 |
|--------|------|------|
| **Element** | 인터랙션 없음. 데이터 → 표시 | props in → JSX out. 키보드/포커스 없음 |
| **Pattern** | 인터랙션 있음. os behavior 기반 (또는 향후 지원할 축) | hook-first (useX + `<X>`). composePattern behavior 사용 |
| **Composition** | Element + Pattern 조립 | 여러 하위 완성품 import해서 조합. 자체 레이아웃/상태 |

### os 미지원 인터랙션 축 (갭)

| 미지원 축 | 필요한 컴포넌트 | 현재 상태 |
|----------|-------------|----------|
| drag/resize | SplitPane, DnD reorder | useResizer hook은 있지만 behavior 아님 |
| anchor/position | Popover, Tooltip, ContextMenu | tooltip은 범위 밖으로 결정됨 |
| pointer interaction | Slider track click, drag | 부분 구현 |

SplitPane/Popover는 위계상 Pattern이지만, os 갭으로 현재는 자체 구현. 향후 behavior 전환 대상.

### 전체 분류

**Element (8개)**
FileIcon ✅, CodeBlock ✅, Breadcrumb ✅, MarkdownViewer 🔴, Avatar 🔴, Badge 🔴, Progress 🔴, Skeleton 🔴

**Pattern (19개)**
NavList ✅, TreeView ✅, ListBox 🟡, DataGrid 🟡, Tabs 🟡, Toolbar 🟡, MenuList 🟡, Combobox 🟡, Dialog 🟡, AlertDialog 🟡, Accordion 🟡, RadioGroup 🟡, Checkbox 🟡, Switch 🟡, Slider 🟡, Spinbutton 🟡, Toggle/ToggleGroup 🟡, SplitPane 🔴(os갭), Popover 🔴(os갭)

**Composition (5개)**
FileViewerModal ✅, CommandPalette 🔴, ContextMenu 🔴, Timeline 🔴, Kanban 🟡
