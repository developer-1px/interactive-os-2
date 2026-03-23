---
last_commit: 35494bf5ff0498d6d09f974d085b282e3af594c1
last_updated: 2026-03-23
---

## Verbs
| fragment | count | identifiers |
|----------|-------|-------------|
| create | 15 | createStore, createCommandEngine, createBehaviorContext, createRecorder, createBatchCommand, createToaster, createReproRecorder, createFruitStore, createGroupedStore |
| get | 19 | getEntity, getChildren, getParent, getEntityData, getAriaActions, getChildrenContainerClassName, getCutSourceIds, getEditableFields, getFileExt, getFocusedId, GetLabelFn, getNodeClassName, getNodeTag, getRootAncestor, getRowMetadata, getSectionClassName, getSpatialParentId, getTabItemAncestor, getVisibleNodes |
| add | 1 | addEntity |
| remove | 1 | removeEntity |
| update | 2 | updateEntity, updateEntityData |
| move | 5 | moveNode, moveUp, moveDown, moveOut, moveIn |
| insert | 1 | insertNode |
| set | 5 | setFocus, setAnchor, setGridCol, setFilter, setValue |
| toggle | 4 | toggleSelect, toggleExpand, toggleSelect, toggleTheme |
| select | 3 | select, selectRange, selectAll |
| clear | 2 | clearSelection, clearCursorsAtDepth |
| extend | 1 | extendSelection |
| focus | 8 | focusNext, focusPrev, focusFirst, focusLast, focusParent, focusChild, focusCommands, focusRecovery |
| expand | 2 | expand, expandCommands |
| collapse | 1 | collapse |
| activate | 3 | activate, onActivate, activateOnClick |
| follow | 1 | followFocus |
| dispatch | 2 | dispatch, dispatchKeyAction |
| start | 1 | startRename |
| confirm | 1 | confirmRename |
| cancel | 1 | cancelRename |
| open | 1 | open |
| close | 1 | close |
| copy | 1 | copy |
| cut | 1 | cut |
| paste | 1 | paste |
| reset | 3 | resetClipboard, resetCmsData, resetTypeahead |
| parse | 1 | parseKeyCombo |
| match | 2 | matchKeyEvent, findTypeaheadMatch |
| find | 5 | findMatchingKey, findNearest, findAdjacentGroup, findFallbackFocus, findTypeaheadMatch |
| compute | 1 | computeStoreDiff |
| validate | 1 | validateNode |
| enter | 1 | enterChild |
| exit | 1 | exitToParent |
| flatten | 1 | flattenFiles |
| replay | 1 | replay |
| format | 1 | formatSnapshots |
| undo | 1 | undoCommand |
| redo | 1 | redoCommand |
| use | 9 | useAria, useAriaZone, useControlledAria, useEngine, useKeyboard, useSpatialNav, useResizer, useVirtualScroll, useCmsData |
| load | 1 | loadColumnOrder |
| save | 1 | saveColumnOrder |
| make | 20 | makeListBoxData, makeTreeGridData, makeAccordionData, ... (fixture factories) |
| increment | 1 | valueCommands.increment |
| decrement | 1 | valueCommands.decrement |
| clamp | 1 | clamp (internal to core.ts) |
| compose | 1 | composePattern |
| apply | 1 | applyMetaCommand |
| sync | 1 | syncStore |
| nav | 4 | navV, navH, navVhUniform, navGrid |
| collect | 3 | collectSections, collectEditableGroups |
| detect | 1 | detectNewVisibleEntities |
| extract | 2 | extractConfig, extractKeyMap |
| register | 1 | registerAria |
| unregister | 1 | unregisterAria |
| render | 2 | RenderTreeItem, comboboxRenderItem |
| navigate | 1 | navigate (axis function) |

## Nouns
| fragment | count | identifiers |
|----------|-------|-------------|
| store | 13 | createStore, NormalizedData, cmsStore, computeStoreDiff, createFruitStore, createGroupedStore, storeToTree |
| entity | 7 | Entity, getEntity, addEntity, removeEntity, updateEntity, getEntityData, updateEntityData |
| command | 10 | Command, BatchCommand, CommandEngine, createCommandEngine, createBatchCommand, templateToCommand, redoCommand, undoCommand |
| engine | 12 | CommandEngine, createCommandEngine, useEngine, EngineOptions, UseEngineOptions, UseEngineReturn |
| behavior | 6 | AriaBehavior, BehaviorContext, createBehaviorContext, BehaviorContextOptions, switchBehavior |
| context | 7 | BehaviorContext, createBehaviorContext, AriaInternalContext, AriaInternalContextValue, BehaviorContextOptions |
| plugin | 1 | Plugin |
| middleware | 1 | Middleware |
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
| recorder | 6 | createRecorder, createReproRecorder, ReproRecorderOverlay |
| snapshot | 1 | ReplaySnapshot |
| adapter | 3 | TransformAdapter, fileTreeAdapter, cmsI18nAdapter |
| data | 42 | NormalizedData, getEntityData, updateEntityData, ApgPatternData, ToastData, FileNodeData, ... (shared data files) |
| clipboard | 7 | clipboardCommands, resetClipboard, ClipboardOptions, CanAcceptFn, CanAcceptResult, CanDeleteFn |
| rename | 6 | renameCommands, startRename, confirmRename, cancelRename, RENAME_ID |
| combobox | 15 | comboboxCommands, combobox (behavior), Combobox (UI), ComboboxOptions, comboboxRenderItem |
| history | 7 | historyCommands, history (plugin) |
| crud | 7 | crudCommands, crud (plugin), PageCrud, PageTabsCrud |
| dnd | 5 | dndCommands, dnd (plugin), PageDnd |
| aria | 23 | Aria, AriaInternalContext, AriaBehavior, useAria, useAriaZone, AriaActions, registerAria, unregisterAria |
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
| axis | 13 | Axis (type), navV, navH, navVhUniform, navGrid, depthArrow, depthEnterEsc, selectToggle, selectExtended, activate, activateFollowFocus, focusTrap, value |
| zone | 3 | useAriaZone, UseAriaZoneOptions |
| column | 2 | columnOrder, TimelineColumn |
| order | 1 | columnOrder |
| session | 2 | SessionInfo, sessionMap |
| component | 3 | ComponentEntry, PageAriaComponent |
| fixture | 20 | showcaseFixtures.ts (makeXxxData factories) |
| scope | 1 | UseAriaZoneOptions.scope |
| depth | 3 | depthArrow, depthEnterEsc, clearCursorsAtDepth |
| cursor | 1 | stickyCursorRef (보관된 이전 위치 ≠ focus. focus=현재 활성, cursor=이전 보관) |
| direction | 1 | Direction (type) |
| group | 21 | findAdjacentGroup, ToolGroup, ToolGroupCard, groupEvents, EditableGroup, EditableGroupEntry, DisclosureGroup, RadioGroup, SwitchGroup, ToggleGroup |
| display | 1 | DisplayItem |
| result | 2 | SpatialNavResult, CanAcceptResult |
| trap | 4 | focusTrap, trap (axis), PageTrap |
| keymap | 1 | keymap-helpers (file) |
| toast | 1 | ToastData |
| toaster | 6 | createToaster, Toaster, ToasterOptions |
| typeahead | 8 | typeahead (plugin), TypeaheadNode, TypeaheadOptions, findTypeaheadMatch, resetTypeahead |
| locale | 4 | Locale, localeFieldsOf, localeMap, LocaleMap, LOCALES |
| template | 5 | CmsTemplatePicker, TEMPLATE_VARIANTS, templateToCommand, TemplateType |
| toolbar | 12 | toolbar (behavior), Toolbar (UI), CmsFloatingToolbar, CmsTopToolbar, makeToolbarData |
| viewport | 3 | CmsViewportWrapper, ViewportSize |
| sidebar | 4 | AreaSidebar, CmsSidebar |
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
| repro | 4 | createReproRecorder, ReproRecorderOverlay |
| overlay | 2 | ReproRecorderOverlay |
| resizer | 2 | useResizer |
| diagram | 2 | ExportDiagram |
| viewer | 13 | PageViewer, MarkdownViewer, MdxViewer, FileViewerModal, PageAgentViewer, PageAreaViewer |
| options | 12 | BehaviorContextOptions, ClipboardOptions, ComboboxOptions, EngineOptions, FocusRecoveryOptions, NavigateOptions, ToasterOptions, TypeaheadOptions, UseAriaOptions, UseAriaZoneOptions, UseControlledAriaOptions, UseEngineOptions |
| range | 1 | ValueRange |
| section | 2 | SectionVariant, collectSections |
| breadcrumb | 2 | Breadcrumb |
| tooltip | 2 | Tooltip (UI) |
| identity | 1 | Identity (type in composePattern) |
| showcase | 4 | PageUiShowcase, showcaseFixtures, showcaseRegistry |
| timeline | 3 | TimelineColumn, TimelineEvent |
| switch | 8 | switchBehavior, SwitchGroup, apgSwitch, makeSwitchGroupData |
| radio | 6 | RadioGroup, apgRadioGroup, makeRadioGroupData |
| listbox | 7 | listbox (behavior), ListBox (UI), apgListbox |
| navlist | 5 | navlist (behavior), NavList (UI), useNavList, UseNavListOptions, UseNavListReturn |

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
| editable | 7 | isEditableElement, CmsInlineEditable, EditableGroup, EditableGroupEntry, collectEditableGroups, getEditableFields |
| uniform | 1 | navVhUniform |
| extended | 1 | selectExtended |
| meta | 1 | META_COMMAND_TYPES |
| sticky | 1 | stickyCursorRef |
| adjacent | 1 | findAdjacentGroup |
| visible | 3 | isVisible, getVisibleNodes, detectNewVisibleEntities |
| reachable | 2 | IsReachable, spatialReachable |
| printable | 1 | isPrintableKey |
| structured | 2 | StructuredAxis, isStructuredAxis |
| grouped | 1 | createGroupedStore |
| localized | 1 | localized (cms-types) |
| initial | 2 | gridInitialData, kanbanInitialData |
| shared | 6 | SharedTreeComponents, shared-*-data files |
| floating | 2 | CmsFloatingToolbar |
| virtual | 2 | useVirtualScroll |
| quick | 2 | QuickOpen |
| default | 2 | DEFAULT_ROOT, defaultLogger |
| inline | 2 | CmsInlineEditable |

## Synonym Map
| canonical | known synonyms | notes |
|-----------|---------------|-------|
| create | — | sole factory verb |
| get | find (useKeyboard only) | getEntity/getChildren/getParent (store), findMatchingKey (keyboard) — find is justified here as it searches, not retrieves |
| remove | delete (command type only) | removeEntity (store API), `crud:delete` (command type string) — different layers |
| update | set (focus/grid state) | updateEntity (data mutation), setFocus/setGridCol (state assignment) — semantically distinct |
| children | items (routeConfig only) | getChildren (store API), items (App.tsx route config) — different domains |
| pattern | navigation (deprecated) | route group for ARIA APG patterns was 'navigation' → renamed to 'pattern' per ARIA terminology |
| node | item (component layer) | node = store/data layer (NodeState, moveNode), item = component API (Aria.Item) — proper layer separation |
| activate | activateFollowFocus | activateFollowFocus is alias for activate — followFocus is metadata flag, not keyMap |
| compose | create | composePattern (axis→behavior composition), create (entity/engine factory) — distinct intent |
| make | create | make = fixture/demo data factory, create = runtime instance factory — distinct intent |
| load/save | get/set | load/save = localStorage I/O, get/set = in-memory state access — distinct intent |
| cursor | focus | cursor=보관된 이전 위치 (sticky cursor), focus=현재 활성 노드 — semantically distinct |
| switchBehavior | — | `switch` is JS reserved word; only behavior export with suffix — unavoidable exception |
| metadata | config | PatternMetadata → PatternConfig (renamed: Omit&lt;AriaBehavior, 'keyMap'&gt;) |
| collect | get | collect = 여러 노드 순회/수집 (collectSections), get = 단건 조회 — distinct intent |
| register | add | registerAria = 글로벌 레지스트리 등록, addEntity = store에 엔티티 추가 — different layers |
| detect | find | detectNewVisibleEntities = 변경 감지, find = 조건 검색 — distinct intent |
| navigate | nav | navigate = axis 함수 (full word), nav = 타입 접미사/축약 (GridNav, navV) — full vs abbreviated |

## File Naming Rule
- **파일명 = 주 export 식별자** — `useAria.ts` → `export function useAria`, `TreeGrid.tsx` → `export function TreeGrid`
- **multi-export 파일** — 모듈명 camelCase (`keymapHelpers.ts`)
- **단일 소문자 export** — 그대로 (`accordion.ts` → `export const accordion`)
- **kebab-case 파일명 금지** — 기존 kebab 파일은 `git mv`로 rename
- **rename 시 반드시 `git mv`** — macOS case-insensitive 충돌 방지
