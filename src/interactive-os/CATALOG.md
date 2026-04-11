# OS Parts Catalog

> 구현 전 이 파일을 읽고, 기존 부품으로 해결 가능한지 먼저 확인한다.

## axis

navigate, select, expand, activate, tab, value, checked, popup, edit

`axis/{name}.ts`

## pattern (composePattern 조합)

listbox, listboxGrouped, tree, treegrid, grid, table, tabs, tabsManual, combobox, menu, menuActivedescendant, menuButton, menubar, toolbar, feed, dialog, alertdialog, alert, accordion, disclosure, radiogroup, radiogroupActivedescendant, checkbox, checkboxMixed, switch, buttonToggle, slider, spinbutton, calendarGrid, meter, link, windowSplitter

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

Accordion, Alert, AlertDialog, Avatar, Badge, Breadcrumb, Button, ButtonToggle, ButtonToolbar, CalendarGrid, Checkbox, CheckboxMixed, CodeBlock, Combobox, Composer, DatePicker, Dialog, DisclosureGroup, Divider, EmptyState, Feed, FileIcon, FilePreview, FileTreeView, FileViewer, FileViewerModal, FilterBar, FlatLayout, Form, Grid, GroupHeader, Kanban, Kbd, Lightbox, Link, ListBox, ListBoxGrouped, MarkdownViewer, MenuActivedescendant, MenuButton, MenuList, Menubar, Meter, MillerColumns, NavList, PanelHeader, PatternDemo, PipelineGrid, Progress, PropertyRow, QuickOpen, RadioGroup, RadioGroupActivedescendant, RouteModal, ScrollArea, SearchResults, SelectionOverlay, Skeleton, Slider, Spinbutton, SpatialView, SplitPane, SpreadReader, StreamFeed, SwitchGroup, TabGroup, TabList, Table, TerminalOutput, TextInput, Toaster, TocNavList, Toggle, ToggleGroup, Toolbar, Tooltip, TreeGrid, TreeView, ViewerTabList, VirtualCodeBlock, WindowSplitter, Workspace, WriterTreeGrid, ZoomPanCanvas

`ui/{Name}.tsx`

## ui/composites

FormSection, MasterDetail, SearchableList, StatGrid, StepWizard

`ui/composites/{Name}.tsx`

## ui/indicators

AddIndicator, BadgeIndicator, CheckIndicator, CloseIndicator, DirectionIndicator, ExpandIndicator, FileTypeIndicator, GripIndicator, IncrementIndicator, IndeterminateIndicator, OverflowIndicator, PageIndicator, ProgressIndicator, RadioIndicator, SeparatorIndicator, SkeletonIndicator, SortIndicator, SpinnerIndicator, StatusIndicator, StepIndicator, SwitchIndicator, TreeConnector

`ui/indicators/{Name}.tsx`

## ui/items

ButtonToolbarItem, EditableListItem, EditableTreeItem, FileTreeItem, IssueRow, ListItem, MenubarItem, MenuItem, TabItem, TocItem, ToolbarItem, TreeItem, ViewerTabItem, WriterItem

`ui/items/{Name}.tsx`

## ui/panels

Panel, SidePanel, SubmenuPanel

`ui/panels/{Name}.tsx`

## ui/cells

BadgeCell, CodeCell, DocLinkCell, EditableCell, PhaseCell, SearchableCell, SummaryCell, TextCell, TierCell, VisualCell

`ui/cells/{Name}.tsx`
