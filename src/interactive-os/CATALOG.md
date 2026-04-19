# OS Parts Catalog

> 구현 전 이 파일을 읽고, 기존 부품으로 해결 가능한지 먼저 확인한다.

## Import 경로

**LLM/외부 사용자 (권장 — 단일 entry 4개):**
```ts
import { TreeGrid, ListBox, indicators } from 'aria-os/ui'
import { defineLayout, FlatLayout } from 'aria-os/layout'
import type { NormalizedData } from 'aria-os/schema'
```

**고급 사용자 (escape hatch, LLM 비노출):**
```ts
import { useAria, composePattern, definePlugin } from 'aria-os/advanced'
```

**프로젝트 내부(monorepo):** path alias `@os/*` 그대로 사용. pages → 단일 entry 마이그레이션은 별도 plan.

## axis

navigate, select, expand, activate, tab, value, checked, popup, edit

`axis/{name}.ts`

## pattern (composePattern 조합)

listbox, listboxGrouped, tree, treegrid, grid, table, tabs, tabsManual, combobox, menu, menuActivedescendant, menuButton, menubar, toolbar, feed, dialog, alertdialog, alert, accordion, disclosure, radiogroup, radiogroupActivedescendant, checkbox, checkboxMixed, switch, buttonToggle, select, slider, spinbutton, calendarGrid, meter, link, windowSplitter

`pattern/roles/{name}.ts`

## engine

createCommandEngine, useEngine, defineCommand, defineCommands, getVisibleNodes, computeNodeAriaProps

`engine/{name}.ts`

## store

createStore, createSingleNodeStore, useStore, computeStoreDiff

`store/{name}.ts`

## primitives

useAria, useAriaZone, useAriaView, useControlledAria, useCommand, useCommandBind, useKeyMap, useKeyboard, useSpatialBridge, mergeProps, ariaRegistry, bindingRegistry, defineRouteKey

`primitives/{name}.ts`

## ui

Accordion, Alert, AlertDialog, Avatar, Badge, Breadcrumb, Button, ButtonToggle, ButtonToolbar, CalendarGrid, Camera, Card, Carousel, Checkbox, CheckboxMixed, CodeViewer, Combobox, Composer, DatePicker, Dialog, DisclosureGroup, Divider, Drawer, EmptyState, Feed, FileIcon, FilePreview, FileTreeView, FileViewer, FileViewerModal, FilterBar, FlatLayout, Form, FrontmatterCard, Grid, GroupHeader, JsonEditor, Kanban, Kbd, Lightbox, Link, ListBox, ListBoxGrouped, MarkdownViewer, MenuActivedescendant, MenuButton, MenuList, Menubar, Meter, MillerColumns, NavList, Pagination, PanelHeader, PatternDemo, PipelineGrid, Popover, Progress, PropertyRow, QuickOpen, RadioGroup, RadioGroupActivedescendant, Rating, RouteModal, ScrollArea, SearchResults, Select, SelectionOverlay, Skeleton, Slider, Spinbutton, SpatialView, SplitPane, SpreadReader, Stepper, StreamFeed, SwitchGroup, TabGroup, TabList, Table, TerminalOutput, Textarea, TextInput, Timeline, Toaster, TocNavList, Toggle, ToggleGroup, Toolbar, Tooltip, TreeGrid, TreeView, ViewerTabList, WindowSplitter, Workspace, WriterTreeGrid

`ui/{Name}.tsx`

## ui/composites

FormSection, MasterDetail, SearchableList, StatGrid, StepWizard

`ui/composites/{Name}.tsx`

## ui/indicators

AddIndicator, BadgeIndicator, CheckIndicator, CloseIndicator, DirectionIndicator, ExpandIndicator, FileTypeIndicator, GripIndicator, IncrementIndicator, IndeterminateIndicator, OverflowIndicator, PageIndicator, ProgressIndicator, RadioIndicator, SeparatorIndicator, SkeletonIndicator, SortIndicator, SpinnerIndicator, StarIndicator, StatusIndicator, StepIndicator, SwitchIndicator, TreeConnector

`ui/indicators/{Name}.tsx`

## ui/items

ButtonToolbarItem, CarouselItem, EditableListItem, EditableTreeItem, FileTreeItem, IssueRow, ListItem, MenubarItem, MenuItem, PaginationItem, RatingItem, SelectItem, StepperItem, TabItem, TimelineItem, TocItem, ToolbarItem, TreeItem, ViewerTabItem, WriterItem

`ui/items/{Name}.tsx`

## ui/panels

Panel, SidePanel, SubmenuPanel

`ui/panels/{Name}.tsx`

## ui/cells

BadgeCell, CodeCell, DocLinkCell, EditableCell, PhaseCell, SearchableCell, SummaryCell, TextCell, TierCell, VisualCell

`ui/cells/{Name}.tsx`

## plugins

autoscroll, cellDragSelect, cellEdit, clipboard, combobox, crud, dnd, dragResize, edit, focusHistory, focusRecovery, form, history, rename, scope, scroll, search, spatial, typeahead, urlSync, useUrlSync, useSpatialNav, workspaceStore, zodSchema

`plugins/{name}.ts`
