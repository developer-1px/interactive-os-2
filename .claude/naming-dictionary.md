---
last_commit: e450367a9e3d171998935cf095948af3719f5bcb
last_updated: 2026-04-14
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
| toggle | 4 | command | toggleSelect, toggleExpand, toggleTheme, toggleCheck |
| select | 4 | command | select, selectRange, selectAll, selectAndAnchor |
| clear | 2 | command | clearSelection, clearCursorsAtDepth |
| extend | 1 | command | extendSelection |
| focus | 8 | command | focusNext, focusPrev, focusFirst, focusLast, focusParent, focusChild, focusCommands, focusRecovery |
| expand | 2 | command | expand, expandCommands |
| collapse | 1 | command | collapse |
| activate | 4 | command | activate, activateCommands, activateHandler, onActivate |
| dismiss | 1 | axis handler | dismissHandler |
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
| collect | 9 | array traverse + merge | collectSections, collectEditableGroups, collectPluginKeyMaps, collectPluginUnhandledKeyHandlers, collectPluginClipboardHandlers, collectEntities, collectCtxFactories, collectAriaGens, collectMeta |
| detect | 1 | change detection | detectNewVisibleEntities |
| register | 1 | registry | registerAria |
| unregister | 1 | registry | unregisterAria |
| render | 2 | React render | RenderTreeItem, comboboxRenderItem |
| navigate | 1 | axis function | navigate |
| define | 2 | factory | definePlugin, defineCommands |
| replace | 1 | swap | replaceEditPlugin |
| merge | 2 | object merge | mergeProps, mergeKeyMaps |
| edit | 1 | axis factory | edit |
| event | 1 | label | eventLabel |
| rel | 1 | derive | relPath |
| split | 1 | transform | splitInputMap |
| build | 1 | derive | buildFileConflictMap |
| checked | 1 | axis factory | checked |
| selected | 1 | axis factory | selected |
| expanded | 1 | axis factory | expanded |
| popup | 1 | axis factory | popup |
| value | 1 | axis factory | value |
| grid | 1 | axis factory | grid |

## Nouns
| fragment | count | identifiers |
|----------|-------|-------------|
| store | 13 | createStore, NormalizedData, cmsStore, computeStoreDiff, createFruitStore, createGroupedStore, storeToInspectorTree |
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
| anchor | 2 | SELECTION_ANCHOR_ID, setAnchor, selectAndAnchor |
| state | 1 | NodeState |
| grid | 28 | GridNav, GRID_COL_ID, gridColCommands, grid (axis), gridCtx, gridColumns, gridInitialData, PageGrid, TreeGrid |
| value | 8 | VALUE_ID, ValueRange, valueCommands, ValueNav, value (axis), valueCtx, valueCurrent |
| slider | 8 | slider (pattern), Slider (UI), apgSlider, makeSliderData |
| spinbutton | 8 | spinbutton (pattern), Spinbutton (UI), apgSpinbutton, makeSpinbuttonData |
| key | 7 | KeyCombo, findMatchingKey, parseKeyCombo, dispatchKeyAction, matchKeyEvent, isPrintableKey |
| recorder | 2 | createReproRecorder, ReproRecorderOverlay |
| adapter | 3 | TransformAdapter, fileTreeAdapter, cmsI18nAdapter |
| data | 42 | NormalizedData, getEntityData, updateEntityData, ApgPatternData, ToastData, FileNodeData, ... |
| clipboard | 7 | clipboardCommands, resetClipboard, ClipboardOptions, CanAcceptFn, CanAcceptResult, CanDeleteFn |
| rename | 6 | renameCommands, startRename, confirmRename, cancelRename, RENAME_ID |
| combobox | 15 | comboboxCommands, combobox (pattern), Combobox (UI), ComboboxOptions, comboboxRenderItem |
| history | 7 | historyCommands, history (plugin) |
| crud | 7 | crudCommands, crud (plugin), PageCrud, PageTabsCrud |
| dnd | 5 | dndCommands, dnd (plugin), PageDnd |
| aria | 28 | Aria, AriaInternalContext, AriaGen, AriaPattern, useAria, useAriaZone, useAriaView, AriaActions, registerAria, unregisterAria |
| item | 4 | AriaItem (component), AriaItemProps, AriaItemContext, comboboxRenderItem, RenderTreeItem |
| recovery | 3 | focusRecovery, FocusRecoveryOptions |
| spatial | 10 | spatial (pattern), spatial (plugin), spatialCommands, SPATIAL_PARENT_ID, getSpatialParentId, useSpatialNav |
| tree | 23 | tree (pattern), TreeView (UI), storeToInspectorTree, TreeGrid, treeData, RenderTreeItem |
| apg | 21 | ApgKeyboardEntry, ApgPatternData, ApgKeyboardTable, apgAccordion, ... |
| keyboard | 4 | ApgKeyboardEntry, ApgKeyboardTable, useKeyboard |
| pattern | 9 | AriaPattern, composePattern, PatternContext, PatternContextOptions, switchPattern |
| axis | 8 | Axis (type), navigate, selected, expanded, checked, popup, value, grid |
| identity | 1 | Identity (composePattern 1st arg type) |
| zone | 3 | useAriaZone, UseAriaZoneOptions |
| view | 4 | useAriaView, UseAriaViewOptions, UseAriaViewReturn, observedEngine |
| nav | 6 | CheckedNav, ExpandedNav, GridNav, PopupNav, SelectedNav, ValueNav |
| gen | 1 | AriaGen |
| meta | 1 | Axis.meta (Record<string, unknown>) |
| ctx | 6 | checkedCtx, expandedCtx, selectedCtx, popupCtx, gridCtx, valueCtx |
| column | 2 | columnOrder, TimelineColumn |
| order | 1 | columnOrder |
| session | 2 | SessionInfo, sessionMap |
| component | 3 | ComponentEntry, PageAriaComponent |
| fixture | 20 | showcaseFixtures.ts (makeXxxData factories) |
| scope | 1 | UseAriaZoneOptions.scope |
| depth | 1 | clearCursorsAtDepth |
| cursor | 1 | stickyCursorRef |
| direction | 1 | Direction (type) |
| group | 22 | findAdjacentGroup, ToolGroup, RadioGroup, SwitchGroup, ToggleGroup |
| display | 1 | DisplayItem |
| result | 2 | SpatialNavResult, CanAcceptResult |
| toast | 1 | ToastData |
| toaster | 6 | createToaster, Toaster, ToasterOptions |
| typeahead | 8 | typeahead (plugin), TypeaheadNode, TypeaheadOptions, findTypeaheadMatch, resetTypeahead |
| locale | 4 | Locale, localeFieldsOf, localeMap, LocaleMap, LOCALES |
| template | 5 | CmsTemplatePicker, TEMPLATE_VARIANTS, templateToCommand, TemplateType |
| toolbar | 12 | toolbar (pattern), Toolbar (UI), CmsFloatingToolbar, CmsTopToolbar, makeToolbarData |
| viewport | 3 | CmsViewportWrapper, ViewportSize |
| sidebar | 5 | AreaSidebar, CmsSidebar, SidebarLayout, sidebarStore |
| panel | 2 | CmsDetailPanel |
| modal | 2 | FileViewerModal |
| dialog | 14 | dialog (pattern), Dialog (UI), AlertDialog, apgDialog |
| disclosure | 8 | disclosure (pattern), DisclosureGroup (UI), apgDisclosure |
| kanban | 9 | kanban (pattern), Kanban (UI), kanbanInitialData |
| menu | 8 | menu (pattern), MenuList (UI), apgMenu |
| checkbox | 3 | Checkbox (UI), makeCheckboxData |
| toggle | 6 | Toggle (UI), ToggleGroup (UI), makeToggleData |
| tabs | 7 | tabs (pattern), TabList (UI), apgTabs |
| registry | 2 | ariaRegistry, coreRegistry |
| root | 3 | ROOT_ID, DEFAULT_ROOT, getRootAncestor |
| repro | 2 | createReproRecorder, ReproRecorderOverlay |
| overlay | 2 | ReproRecorderOverlay |
| resizer | 2 | useResizer |
| diagram | 2 | ExportDiagram |
| viewer | 13 | PageViewer, MarkdownViewer, FileViewerModal, PageAgentViewer |
| route | 3 | RouteItem, RouteGroup, routeConfig |
| shell | 1 | AppShell |
| timeline | 4 | TimelineColumn, TimelineEvent, TimelineItem |
| switch | 7 | SwitchGroup, apgSwitch |
| radio | 6 | RadioGroup, apgRadioGroup |
| listbox | 7 | listbox (pattern), ListBox (UI), apgListbox |
| navlist | 5 | navlist (misc pattern), NavList (UI), useNavList |

## Adjectives
| fragment | count | identifiers |
|----------|-------|-------------|
| normalized | 1 | NormalizedData |
| focused | 1 | NodeState.focused |
| selected | 3 | NodeState.selected, selected (axis factory), selectedCtx |
| disabled | 1 | NodeState.disabled |
| expanded | 3 | NodeState.expanded, EXPANDED_ID, expanded (axis factory), expandedCtx |
| internal | 1 | AriaInternalContext |
| controlled | 1 | useControlledAria |
| batch | 2 | BatchCommand, createBatchCommand |
| editable | 7 | isEditableElement, EditableGroup, EditableGroupEntry, collectEditableGroups, getEditableFields, AriaEditable |
| visible | 3 | isVisible, getVisibleNodes, detectNewVisibleEntities |
| reachable | 2 | IsReachable, spatialReachable |
| observed | 1 | observedEngine |
| grouped | 1 | createGroupedStore |
| shared | 6 | SharedTreeComponents, shared-*-data files |
| virtual | 2 | useVirtualScroll |

## Postfixes
| fragment | count | rule | identifiers |
|----------|-------|------|-------------|
| Commands | 13 | `Record<string, CommandFactory>` — command group | focusCommands, selectionCommands, clipboardCommands, renameCommands, expandCommands, gridColCommands, valueCommands, spatialCommands, comboboxCommands, dndCommands, historyCommands, crudCommands, activateCommands, checkedCommands, popupCommands |
| Options | 11 | **Rule**: `Options` = config bag. Hook params use hook name prefix. | EditOptions ✓, ClipboardOptions ✓, ComboboxOptions ✓, FocusRecoveryOptions ✓, PatternContextOptions ✓, UseAriaOptions (hook), UseAriaZoneOptions (hook), UseAriaViewOptions (hook) |
| Data | 42+ | **Rule**: fixture `makeXxxData` = OK. Type suffix `Data` = noise. | makeTreeGridData (OK), NormalizedData (legacy) |
| ID | 10 | store state slot identifier (SCREAMING_SNAKE) | FOCUS_ID, SELECTION_ID, SELECTION_ANCHOR_ID, GRID_COL_ID, ROOT_ID, RENAME_ID, VALUE_ID, EXPANDED_ID, SPATIAL_PARENT_ID, POPUP_ID, CHECKED_ID |
| Return | 3 | hook return type | UseEngineReturn, UseAriaViewReturn, UseNavListReturn |
| Props | 1 | component props | AriaItemProps |
| Nav | 6 | **Rule**: axis 런타임 조작 인터페이스 (PatternContext에 주입되는 namespace) | CheckedNav, ExpandedNav, GridNav, PopupNav, SelectedNav, ValueNav |
| Ctx | 6 | **Rule**: Nav 인스턴스를 만드는 factory 함수 (내부 전용) | checkedCtx, expandedCtx, selectedCtx, popupCtx, gridCtx, valueCtx |
| Gen | 1 | per-node ARIA attribute generator | AriaGen |
| Handler | 2 | standalone axis handler (inputMap에 직접 바인딩) | activateHandler, dismissHandler |
| Filter | 2 | VisibilityFilter factory | expandVisibilityFilter, popupVisibilityFilter |

## Synonym Map
| canonical | known synonyms | notes |
|-----------|---------------|-------|
| create | define (plugin/command factory) | createStore (runtime), definePlugin/defineCommands (config→instance) |
| get | find (search context) | get=lookup, find=search/traverse — boundary defined |
| remove | delete (command type only) | removeEntity (store API), `crud:delete` (command type string) |
| update | set (focus/grid state) | updateEntity (data mutation), setFocus/setGridCol (state assignment) |
| children | items (routeConfig only) | getChildren (store API), items (routeConfig) |
| node | item (component layer) | node = store/data layer, item = component API (Aria.Item) |
| compose | merge | composeMiddlewares (function composition), mergeProps/mergeKeyMaps (object merge) |
| make | create | make = fixture/demo data factory, create = runtime instance factory |
| build | create | build = derived lookup structure (1회, pages/replay), create = runtime instance |
| load/save | get/set | load/save = localStorage I/O, get/set = in-memory state |
| cursor | focus | cursor=보관된 이전 위치, focus=현재 활성 노드 |
| collect | get | collect = 배열 순회/병합, get = 단건 조회 |
| register | add | registerAria = 글로벌 레지스트리, addEntity = store |
| detect | find | detectNewVisibleEntities = 변경 감지, find = 조건 검색 |
| navigate | — | navigate = axis 함수 (full word) |
| replace | remove | replaceEditPlugin = swap, removeEntity = delete |
| Nav | Ctx | Nav = 타입(인터페이스), Ctx = factory 함수. 같은 대상의 타입/생성자 |

## Role Map
| fragment | role | recommended verb | examples |
|----------|------|-----------------|----------|
| get | lookup (id → record, O(1)) | get | getEntity, getChildren, getParent, getNodeState |
| get | traverse (walk tree + filter/collect) | find | getVisibleNodes → findVisibleNodes, getRootAncestor → resolveRootAncestor |
| get | derive (compute string/object from inputs) | get (React convention) | getNodeClassName, getSectionClassName, getNodeProps |
| get | extract (pick subset from object) | get or extract | getEditableFields, getRowMetadata, getFileExt |
| collect | axis merge (composePattern 내부) | collect | collectEntities, collectCtxFactories, collectAriaGens, collectMeta, collectMiddlewares, collectVisibilityFilters |
| collect | plugin merge (useAriaView 내부) | collect | collectPluginKeyMaps, collectPluginUnhandledKeyHandlers, collectPluginClipboardHandlers |

## Aptness Flags (review 필요)
| # | 항목 | 심각도 | 설명 |
|---|------|--------|------|
| 1 | `Nav` postfix | 🟡 | 5가지 다른 구조(boolean toggle, set operation, open/close, numeric, grid)를 커버. "Nav"가 navigation이 아닌 용도로도 쓰임 |
| 2 | `Identity` | 🟡 | APG 표준에 없는 용어. composePattern 3인자가 APG Roles/States/Keyboard 1:1이면 `Roles`가 더 apt |

## File Naming Rule
- **파일명 = 주 export 식별자** — `useAria.ts` → `export function useAria`, `TreeGrid.tsx` → `export function TreeGrid`
- **multi-export 파일** — 모듈명 camelCase (`keymapHelpers.ts`)
- **단일 소문자 export** — 그대로 (`accordion.ts` → `export const accordion`)
- **kebab-case 파일명 금지** — 기존 kebab 파일은 `git mv`로 rename
- **rename 시 반드시 `git mv`** — macOS case-insensitive 충돌 방지
