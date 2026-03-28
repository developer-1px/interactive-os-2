---
last_commit: 3cb927f4a34cb541fa2ea88f52e2077ac491cb02
last_updated: 2026-03-28
---

## Verbs
| fragment | count | roles | identifiers |
|----------|-------|-------|-------------|
| create | 13 | factory | createStore, createCommandEngine, createBatchCommand, createToaster, createReproRecorder, createFruitStore, createGroupedStore |
| get | 21 | lookup: getEntity, getChildren, getParent, getEntityData, getFocusedId, getNodeState; traverse: getVisibleNodes, getRootAncestor, getTabItemAncestor; derive: getNodeClassName, getSectionClassName, getChildrenContainerClassName, getNodeTag, getNodeProps, getAriaActions; extract: getEditableFields, getRowMetadata, getFileExt, getCutSourceIds, getSpatialParentId; type: GetLabelFn |
| add | 1 | store mutation | addEntity |
| remove | 1 | store mutation | removeEntity |
| update | 2 | store mutation | updateEntity, updateEntityData |
| move | 5 | command | moveNode, moveUp, moveDown, moveOut, moveIn |
| insert | 1 | command | insertNode |
| set | 5 | state assignment | setFocus, setAnchor, setGridCol, setFilter, setValue |
| toggle | 4 | command | toggleSelect, toggleExpand, toggleTheme |
| select | 3 | command | select, selectRange, selectAll |
| clear | 2 | command | clearSelection, clearCursorsAtDepth |
| extend | 1 | command | extendSelection |
| focus | 8 | command | focusNext, focusPrev, focusFirst, focusLast, focusParent, focusChild, focusCommands, focusRecovery |
| expand | 2 | command | expand, expandCommands |
| collapse | 1 | command | collapse |
| activate | 3 | command | activate, onActivate, activateOnClick |
| dispatch | 2 | engine | dispatch, dispatchKeyAction |
| start | 1 | command | startRename |
| confirm | 1 | command | confirmRename |
| cancel | 1 | command | cancelRename |
| open | 1 | command | open |
| close | 1 | command | close |
| copy | 1 | command | copy |
| cut | 1 | command | cut |
| paste | 1 | command | paste |
| reset | 3 | command | resetClipboard, resetCmsData, resetTypeahead |
| parse | 1 | transform | parseKeyCombo |
| match | 2 | search | matchKeyEvent, findTypeaheadMatch |
| find | 5 | search | findMatchingKey, findNearest, findAdjacentGroup, findFallbackFocus, findTypeaheadMatch |
| compute | 1 | derive | computeStoreDiff |
| validate | 1 | guard | validateNode |
| enter | 1 | command | enterChild |
| exit | 1 | command | exitToParent |
| flatten | 1 | transform | flattenFiles |
| replay | 1 | devtools | replay |
| format | 1 | derive | formatSnapshots |
| undo | 1 | command | undoCommand |
| redo | 1 | command | redoCommand |
| use | 10 | React hook | useAria, useAriaZone, useAriaView, useControlledAria, useEngine, useKeyboard, useSpatialNav, useResizer, useVirtualScroll, useCmsData |
| load | 1 | I/O | loadColumnOrder |
| save | 1 | I/O | saveColumnOrder |
| make | 20 | fixture factory | makeListBoxData, makeTreeGridData, makeAccordionData, ... (fixture factories) |
| compose | 2 | function composition | composePattern, composeMiddlewares |
| apply | 1 | command | applyMetaCommand |
| sync | 1 | I/O | syncStore |
| collect | 6 | array traverse + merge | collectSections, collectEditableGroups, collectPluginKeyMaps, collectPluginUnhandledKeyHandlers, collectPluginClipboardHandlers |
| detect | 1 | change detection | detectNewVisibleEntities |
| register | 1 | registry | registerAria |
| unregister | 1 | registry | unregisterAria |
| render | 2 | React render | RenderTreeItem, comboboxRenderItem |
| navigate | 1 | axis function | navigate |
| define | 1 | factory | definePlugin |
| replace | 1 | swap | replaceEditPlugin |
| merge | 1 | object merge | mergeProps |
| edit | 1 | axis factory | edit |
| event | 1 | label | eventLabel |
| rel | 1 | derive | relPath |

## Nouns
| fragment | count | identifiers |
|----------|-------|-------------|
| store | 13 | createStore, NormalizedData, cmsStore, computeStoreDiff, createFruitStore, createGroupedStore, storeToTree |
| entity | 7 | Entity, getEntity, addEntity, removeEntity, updateEntity, getEntityData, updateEntityData |
| command | 10 | Command, BatchCommand, CommandEngine, createCommandEngine, createBatchCommand, templateToCommand, redoCommand, undoCommand |
| engine | 12 | CommandEngine, createCommandEngine, useEngine, EngineOptions, UseEngineOptions, UseEngineReturn |
| context | 4 | PatternContext, PatternContextOptions, AriaInternalContext, AriaInternalContextValue |
| plugin | 5 | Plugin, PluginConfig, definePlugin, replaceEditPlugin, collectPlugin* |
| middleware | 2 | Middleware, composeMiddlewares |
| node | 8 | NodeState, moveNode, insertNode, FileNodeData, getNodeClassName, getNodeTag, NodeContent, TypeaheadNode |
| children | 2 | getChildren, getChildrenContainerClassName |
| parent | 3 | getParent, getSpatialParentId, SPATIAL_PARENT_ID |
| focus | 7 | FOCUS_ID, focusCommands, FocusStrategy, focusRecovery, FocusRecoveryOptions, findFallbackFocus |
| selection | 4 | SELECTION_ID, SELECTION_ANCHOR_ID, selectionCommands, SelectionMode |
| anchor | 1 | SELECTION_ANCHOR_ID, setAnchor |
| state | 1 | NodeState |
| grid | 28 | GridNav, GRID_COL_ID, gridColCommands, grid (behavior), navGrid, gridColumns, gridInitialData, PageGrid, TreeGrid, translatableEntriesToGrid, editingKeyMap |
| value | 7 | VALUE_ID, ValueRange, valueCommands, ValueNav, value (axis), valueCurrent |
| slider | 8 | slider (behavior factory), Slider (UI), apgSlider, makeSliderData |
| spinbutton | 8 | spinbutton (behavior factory), Spinbutton (UI), apgSpinbutton, makeSpinbuttonData |
| key | 7 | KeyCombo, findMatchingKey, parseKeyCombo, dispatchKeyAction, extractKeyMap, matchKeyEvent, isPrintableKey |
| recorder | 2 | createReproRecorder, ReproRecorderOverlay |
| adapter | 3 | TransformAdapter, fileTreeAdapter, cmsI18nAdapter |
| data | 42 | NormalizedData, getEntityData, updateEntityData, ApgPatternData, ToastData, FileNodeData, ... (shared data files) |
| clipboard | 7 | clipboardCommands, resetClipboard, ClipboardOptions, CanAcceptFn, CanAcceptResult, CanDeleteFn |
| rename | 6 | renameCommands, startRename, confirmRename, cancelRename, RENAME_ID |
| combobox | 15 | comboboxCommands, combobox (behavior), Combobox (UI), ComboboxOptions, comboboxRenderItem |
| history | 7 | historyCommands, history (plugin) |
| crud | 7 | crudCommands, crud (plugin), PageCrud, PageTabsCrud |
| dnd | 5 | dndCommands, dnd (plugin), PageDnd |
| aria | 25 | Aria, AriaInternalContext, AriaBehavior, useAria, useAriaZone, useAriaView, AriaActions, registerAria, unregisterAria, AriaEditable, AriaCell |
| item | 4 | AriaItem (component), AriaItemProps, AriaItemContext, comboboxRenderItem, RenderTreeItem |
| recovery | 3 | focusRecovery, FocusRecoveryOptions |
| spatial | 10 | spatial (behavior), spatial (plugin), spatialCommands, SPATIAL_PARENT_ID, getSpatialParentId, useSpatialNav, SpatialNavResult, findNearest, findAdjacentGroup, spatialReachable |
| tree | 23 | tree (behavior), TreeView (UI), storeToTree, TreeGrid, treeData, RenderTreeItem, SharedTreeComponents |
| apg | 21 | ApgKeyboardEntry, ApgPatternData, ApgKeyboardTable, apgAccordion, ... (all APG pattern data) |
| keyboard | 4 | ApgKeyboardEntry, ApgKeyboardTable, useKeyboard |
| pattern | 4 | ApgPatternData, composePattern, PatternConfig |
| entry | 4 | ApgKeyboardEntry, LogEntry, ComponentEntry, EditableGroupEntry |
| diff | 3 | StoreDiff, computeStoreDiff |
| logger | 3 | Logger, defaultLogger, dispatchLogger |
| field | 3 | EditableField, fieldsOf, getEditableFields, localeFieldsOf |
| schema | 3 | localeMapSchema, nodeSchemas, childRules |
| mermaid | 1 | MermaidBlock |
| table | 2 | ApgKeyboardTable |
| axis | 8 | Axis (type), navigate, select, expand, activate, dismiss, tab, value, edit, checked, popup |
| zone | 3 | useAriaZone, UseAriaZoneOptions |
| view | 3 | useAriaView, UseAriaViewOptions, UseAriaViewReturn |
| column | 2 | columnOrder, TimelineColumn |
| order | 1 | columnOrder |
| session | 2 | SessionInfo, sessionMap |
| component | 3 | ComponentEntry, PageAriaComponent |
| fixture | 20 | showcaseFixtures.ts (makeXxxData factories) |
| scope | 1 | UseAriaZoneOptions.scope |
| depth | 1 | clearCursorsAtDepth |
| cursor | 1 | stickyCursorRef (보관된 이전 위치 ≠ focus. focus=현재 활성, cursor=이전 보관) |
| direction | 1 | Direction (type) |
| group | 22 | findAdjacentGroup, ToolGroup, ToolGroupCard, groupEvents, EditableGroup, EditableGroupEntry, DisclosureGroup, RadioGroup, SwitchGroup, ToggleGroup, RouteGroup |
| display | 1 | DisplayItem |
| result | 2 | SpatialNavResult, CanAcceptResult |
| keymap | 1 | keymap-helpers (file) |
| toast | 1 | ToastData |
| toaster | 6 | createToaster, Toaster, ToasterOptions |
| typeahead | 8 | typeahead (plugin), TypeaheadNode, TypeaheadOptions, findTypeaheadMatch, resetTypeahead |
| locale | 4 | Locale, localeFieldsOf, localeMap, LocaleMap, LOCALES |
| template | 5 | CmsTemplatePicker, TEMPLATE_VARIANTS, templateToCommand, TemplateType |
| toolbar | 12 | toolbar (behavior), Toolbar (UI), CmsFloatingToolbar, CmsTopToolbar, makeToolbarData |
| viewport | 3 | CmsViewportWrapper, ViewportSize |
| sidebar | 5 | AreaSidebar, CmsSidebar, SidebarLayout, sidebarStore, sidebarStores |
| drawer | 2 | CmsHamburgerDrawer |
| panel | 2 | CmsDetailPanel |
| modal | 2 | FileViewerModal |
| dialog | 14 | dialog (behavior), Dialog (UI), AlertDialog, apgDialog, apgAlertDialog |
| disclosure | 8 | disclosure (behavior), DisclosureGroup (UI), apgDisclosure, makeDisclosureGroupData |
| kanban | 9 | kanban (behavior), Kanban (UI), kanbanInitialData, makeKanbanData |
| menu | 8 | menu (behavior), MenuList (UI), apgMenu, makeMenuListData |
| checkbox | 3 | Checkbox (UI), makeCheckboxData |
| toggle | 6 | Toggle (UI), ToggleGroup (UI), makeToggleData, makeToggleGroupData |
| tabs | 7 | tabs (behavior), TabList (UI), apgTabs, makeTabListData |
| registry | 2 | ariaRegistry, showcaseRegistry |
| root | 3 | ROOT_ID, DEFAULT_ROOT, getRootAncestor |
| repro | 2 | createReproRecorder, ReproRecorderOverlay |
| overlay | 2 | ReproRecorderOverlay |
| resizer | 2 | useResizer |
| diagram | 2 | ExportDiagram |
| viewer | 13 | PageViewer, MarkdownViewer, MdxViewer, FileViewerModal, PageAgentViewer, PageAreaViewer |
| route | 3 | RouteItem, RouteGroup, routeConfig |
| shell | 1 | AppShell |
| timeline | 4 | TimelineColumn, TimelineEvent, TimelineItem, TimelineItems |
| switch | 7 | SwitchGroup, apgSwitch, makeSwitchGroupData |
| radio | 6 | RadioGroup, apgRadioGroup, makeRadioGroupData |
| listbox | 7 | listbox (behavior), ListBox (UI), apgListbox |
| navlist | 5 | navlist (behavior), NavList (UI), useNavList, UseNavListOptions, UseNavListReturn |
| present | 1 | CmsPresentMode |

## Adjectives
| fragment | count | identifiers |
|----------|-------|-------------|
| normalized | 1 | NormalizedData |
| focused | 1 | NodeState.focused |
| selected | 1 | NodeState.selected |
| disabled | 1 | NodeState.disabled |
| expanded | 2 | NodeState.expanded, EXPANDED_ID |
| internal | 1 | AriaInternalContext |
| controlled | 1 | useControlledAria |
| batch | 2 | BatchCommand, createBatchCommand |
| raw | 1 | RawEvent |
| matching | 1 | findMatchingKey |
| editable | 7 | isEditableElement, CmsInlineEditable, EditableGroup, EditableGroupEntry, collectEditableGroups, getEditableFields, AriaEditable |
| extended | 1 | selectExtended |
| meta | 1 | META_COMMAND_TYPES |
| sticky | 1 | stickyCursorRef |
| adjacent | 1 | findAdjacentGroup |
| visible | 3 | isVisible, getVisibleNodes, detectNewVisibleEntities |
| reachable | 2 | IsReachable, spatialReachable |
| printable | 1 | isPrintableKey |
| grouped | 1 | createGroupedStore |
| localized | 1 | localized (cms-types) |
| initial | 2 | gridInitialData, kanbanInitialData |
| shared | 6 | SharedTreeComponents, shared-*-data files |
| floating | 2 | CmsFloatingToolbar |
| virtual | 2 | useVirtualScroll |
| quick | 2 | QuickOpen |
| default | 2 | DEFAULT_ROOT, defaultLogger |
| inline | 2 | CmsInlineEditable |
| active | 2 | activeGroup, activeItemPath |
| vertical | 1 | verticalToolbar |

## Postfixes
| fragment | count | rule | identifiers |
|----------|-------|------|-------------|
| Commands | 12+ | `Record<string, CommandFactory>` — command group | focusCommands, selectionCommands, clipboardCommands, renameCommands, expandCommands, gridColCommands, valueCommands, spatialCommands, comboboxCommands, dndCommands, historyCommands, crudCommands |
| Options | 11 | **Rule**: `Options` = all-optional config bag. Hook params with required fields use hook name prefix (`UseAriaOptions`). | EditOptions ✓, ClipboardOptions ✓, ComboboxOptions ✓, FocusRecoveryOptions ✓, NavigateOptions ✓, ToasterOptions ✓, TypeaheadOptions ✓, PatternContextOptions ✓, UseAriaOptions (hook), UseAriaZoneOptions (hook), UseAriaViewOptions (hook) |
| Data | 42+ | **Rule**: fixture `makeXxxData` = OK. Type suffix `Data` = noise (avoid in new types). Existing: NormalizedData, ApgPatternData (legacy, don't rename). | makeTreeGridData (OK), NormalizedData (legacy), ApgPatternData (legacy) |
| ID | 9 | store state slot identifier (SCREAMING_SNAKE) | FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, GRID_COL_ID, ROOT_ID, RENAME_ID, VALUE_ID, EXPANDED_ID, SPATIAL_PARENT_ID |
| Return | 3 | hook return type | UseEngineReturn, UseAriaViewReturn, UseNavListReturn |
| Props | 1 | component props | AriaItemProps |

## Synonym Map
| canonical | known synonyms | notes |
|-----------|---------------|-------|
| create | define (plugin factory) | createStore (runtime), definePlugin (config→Plugin) — both are factories but define emphasizes declarative config |
| get | find (search context) | get=lookup, find=search/traverse — boundary defined |
| remove | delete (command type only) | removeEntity (store API), `crud:delete` (command type string) — different layers |
| update | set (focus/grid state) | updateEntity (data mutation), setFocus/setGridCol (state assignment) — semantically distinct |
| children | items (routeConfig only) | getChildren (store API), items (routeConfig) — different domains |
| pattern | navigation (deprecated) | route group renamed to 'pattern' per ARIA terminology |
| node | item (component layer) | node = store/data layer, item = component API (Aria.Item) |
| compose | merge | composeMiddlewares (function composition, reduceRight), mergeProps (object merge, spread) — distinct operations |
| make | create | make = fixture/demo data factory, create = runtime instance factory |
| load/save | get/set | load/save = localStorage I/O, get/set = in-memory state |
| cursor | focus | cursor=보관된 이전 위치, focus=현재 활성 노드 |
| collect | get | collect = 배열 순회/병합 (collectSections, collectPlugin*), get = 단건 조회 |
| register | add | registerAria = 글로벌 레지스트리, addEntity = store |
| detect | find | detectNewVisibleEntities = 변경 감지, find = 조건 검색 |
| navigate | — | navigate = axis 함수 (full word). nav* prefix 제거됨 |
| replace | remove | replaceEditPlugin = swap, removeEntity = delete — distinct |

## Role Map
| fragment | role | recommended verb | examples |
|----------|------|-----------------|----------|
| get | lookup (id → record, O(1)) | get | getEntity, getChildren, getParent, getNodeState |
| get | traverse (walk tree + filter/collect) | find | getVisibleNodes → findVisibleNodes, getRootAncestor → resolveRootAncestor |
| get | derive (compute string/object from inputs) | get (React convention) | getNodeClassName, getSectionClassName, getNodeProps |
| get | extract (pick subset from object) | get or extract | getEditableFields, getRowMetadata, getFileExt |

## File Naming Rule
- **파일명 = 주 export 식별자** — `useAria.ts` → `export function useAria`, `TreeGrid.tsx` → `export function TreeGrid`
- **multi-export 파일** — 모듈명 camelCase (`keymapHelpers.ts`)
- **단일 소문자 export** — 그대로 (`accordion.ts` → `export const accordion`)
- **kebab-case 파일명 금지** — 기존 kebab 파일은 `git mv`로 rename
- **rename 시 반드시 `git mv`** — macOS case-insensitive 충돌 방지
