---
last_commit: 5722ff86acf048cfe3ec43009969f1b56fcc9f03
last_updated: 2026-03-22
---

## Verbs
| fragment | count | identifiers |
|----------|-------|-------------|
| create | 5 | createStore, createCommandEngine, createBehaviorContext, createRecorder, createBatchCommand |
| get | 4 | getEntity, getChildren, getParent, getEntityData |
| add | 1 | addEntity |
| remove | 1 | removeEntity |
| update | 2 | updateEntity, updateEntityData |
| move | 5 | moveNode, moveUp, moveDown, moveOut, moveIn |
| insert | 1 | insertNode |
| set | 5 | setFocus, setAnchor, setGridCol, setFilter, setValue |
| toggle | 4 | toggleSelect, toggleExpand, toggleSelect, toggleTheme |
| select | 3 | select, selectRange, selectAll |
| clear | 1 | clearSelection |
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
| reset | 1 | resetClipboard |
| parse | 1 | parseKeyCombo |
| match | 1 | matchKeyEvent |
| find | 2 | findMatchingKey, findNearest |
| compute | 1 | computeStoreDiff |
| validate | 1 | validateNode |
| enter | 1 | enterChild |
| exit | 1 | exitToParent |
| flatten | 1 | flattenFiles |
| replay | 1 | replay |
| format | 1 | formatSnapshots |
| undo | 1 | undoCommand |
| redo | 1 | redoCommand |
| use | 6 | useAria, useAriaZone, useControlledAria, useEngine, useKeyboard, useSpatialNav |
| increment | 1 | valueCommands.increment |
| decrement | 1 | valueCommands.decrement |
| clamp | 1 | clamp (internal to core.ts) |
| compose | 1 | composePattern |
| apply | 1 | applyMetaCommand |
| sync | 1 | syncStore |
| nav | 4 | navV, navH, navVhUniform, navGrid |

## Nouns
| fragment | count | identifiers |
|----------|-------|-------------|
| store | 2 | createStore, NormalizedData |
| entity | 4 | Entity, getEntity, addEntity, removeEntity, updateEntity, getEntityData, updateEntityData |
| command | 5 | Command, BatchCommand, CommandEngine, createCommandEngine, createBatchCommand |
| engine | 3 | CommandEngine, createCommandEngine, useEngine |
| behavior | 3 | AriaBehavior, BehaviorContext, createBehaviorContext |
| context | 3 | BehaviorContext, createBehaviorContext, AriaInternalContext |
| plugin | 1 | Plugin |
| middleware | 1 | Middleware |
| node | 3 | NodeState, moveNode, insertNode |
| children | 1 | getChildren |
| parent | 1 | getParent |
| focus | 3 | FOCUS_ID, focusCommands, FocusStrategy |
| selection | 4 | SELECTION_ID, SELECTION_ANCHOR_ID, selectionCommands, SelectionMode |
| anchor | 1 | SELECTION_ANCHOR_ID, setAnchor |
| state | 1 | NodeState |
| grid | 5 | GridNav, GRID_COL_ID, gridColCommands, grid (behavior), navGrid |
| value | 5 | VALUE_ID, ValueRange, valueCommands, ValueNav, value (axis), valueCurrent |
| slider | 2 | slider (behavior factory), Slider (UI) |
| spinbutton | 2 | spinbutton (behavior factory), Spinbutton (UI) |
| key | 3 | KeyCombo, findMatchingKey, parseKeyCombo |
| recorder | 1 | createRecorder |
| snapshot | 1 | ReplaySnapshot |
| adapter | 1 | TransformAdapter, fileTreeAdapter |
| data | 2 | NormalizedData, getEntityData, updateEntityData |
| clipboard | 2 | clipboardCommands, resetClipboard |
| rename | 2 | renameCommands, startRename, confirmRename, cancelRename |
| combobox | 2 | comboboxCommands, combobox (behavior) |
| history | 2 | historyCommands, history (plugin) |
| crud | 1 | crudCommands |
| dnd | 1 | dndCommands |
| aria | 5 | Aria, AriaInternalContext, AriaBehavior, useAria, useAriaZone |
| item | 3 | AriaItem (component), AriaItemProps, AriaItemContext |
| recovery | 1 | focusRecovery |
| spatial | 3 | spatial (behavior), spatial (plugin), spatialCommands, SPATIAL_PARENT_ID, getSpatialParentId, useSpatialNav, findNearest |
| tree | 2 | tree (behavior), TreeView (UI) |
| apg | 16 | ApgKeyboardEntry, ApgPatternData, ApgKeyboardTable, apgAccordion, apgDisclosure, apgSwitch, apgTabs, apgRadioGroup, apgMenu, apgToolbar, apgDialog, apgAlertDialog, apgTreeView, apgTreeGrid, apgListbox, apgGrid, apgCombobox |
| keyboard | 2 | ApgKeyboardEntry, ApgKeyboardTable |
| pattern | 2 | ApgPatternData, composePattern, PatternConfig |
| entry | 2 | ApgKeyboardEntry, LogEntry |
| diff | 1 | StoreDiff, computeStoreDiff |
| logger | 1 | Logger, defaultLogger |
| field | 3 | EditableField, fieldsOf, getEditableFields, localeFieldsOf |
| schema | 3 | localeMapSchema, nodeSchemas, childRules |
| mermaid | 1 | MermaidBlock |
| table | 1 | ApgKeyboardTable |
| axis | 13 | Axis (type), navV, navH, navVhUniform, navGrid, depthArrow, depthEnterEsc, selectToggle, selectExtended, activate, activateFollowFocus, focusTrap, value |
| zone | 2 | useAriaZone, UseAriaZoneOptions |
| scope | 1 | UseAriaZoneOptions.scope |
| depth | 2 | depthArrow, depthEnterEsc |
| trap | 1 | focusTrap |
| keymap | 1 | keymap-helpers (file) |

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
| editable | 1 | isEditableElement |
| uniform | 1 | navVhUniform |
| extended | 1 | selectExtended |
| meta | 1 | META_COMMAND_TYPES |

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
| switchBehavior | — | `switch` is JS reserved word; only behavior export with suffix — unavoidable exception |
| metadata | config | PatternMetadata → PatternConfig (renamed: Omit&lt;AriaBehavior, 'keyMap'&gt;) |

## File Naming Rule
- **파일명 = 주 export 식별자** — `useAria.ts` → `export function useAria`, `TreeGrid.tsx` → `export function TreeGrid`
- **multi-export 파일** — 모듈명 camelCase (`keymapHelpers.ts`)
- **단일 소문자 export** — 그대로 (`accordion.ts` → `export const accordion`)
- **kebab-case 파일명 금지** — 기존 kebab 파일은 `git mv`로 rename
- **rename 시 반드시 `git mv`** — macOS case-insensitive 충돌 방지
