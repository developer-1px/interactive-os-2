---
last_commit: a0ce5b605407f8a4d29932c3b43c7cd0202cb465
last_updated: 2026-03-17
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
| set | 4 | setFocus, setAnchor, setGridCol, setFilter |
| toggle | 3 | toggleSelect, toggleExpand, toggleSelect |
| select | 3 | select, selectRange, selectAll |
| clear | 1 | clearSelection |
| extend | 1 | extendSelection |
| focus | 8 | focusNext, focusPrev, focusFirst, focusLast, focusParent, focusChild, focusCommands, focusRecovery |
| expand | 2 | expand, expandCommands |
| collapse | 1 | collapse |
| activate | 1 | activate |
| dispatch | 1 | dispatch |
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
| find | 1 | findMatchingKey |
| replay | 1 | replay |
| format | 1 | formatSnapshots |
| undo | 1 | undoCommand |
| redo | 1 | redoCommand |
| use | 3 | useAria, useControlledAria, useKeyboard |

## Nouns
| fragment | count | identifiers |
|----------|-------|-------------|
| store | 2 | createStore, NormalizedData |
| entity | 4 | Entity, getEntity, addEntity, removeEntity, updateEntity, getEntityData, updateEntityData |
| command | 5 | Command, BatchCommand, CommandEngine, createCommandEngine, createBatchCommand |
| engine | 2 | CommandEngine, createCommandEngine |
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
| grid | 4 | GridNav, GRID_COL_ID, gridColCommands, grid (behavior) |
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
| aria | 4 | Aria, AriaInternalContext, AriaBehavior, useAria |
| recovery | 1 | focusRecovery |
| tree | 2 | tree (behavior), TreeView (UI) |
| apg | 16 | ApgKeyboardEntry, ApgPatternData, ApgKeyboardTable, apgAccordion, apgDisclosure, apgSwitch, apgTabs, apgRadioGroup, apgMenu, apgToolbar, apgDialog, apgAlertDialog, apgTreeView, apgTreeGrid, apgListbox, apgGrid, apgCombobox |
| keyboard | 2 | ApgKeyboardEntry, ApgKeyboardTable |
| pattern | 1 | ApgPatternData |
| entry | 1 | ApgKeyboardEntry |
| table | 1 | ApgKeyboardTable |

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

## Synonym Map
| canonical | known synonyms | notes |
|-----------|---------------|-------|
| create | — | sole factory verb |
| get | find (useKeyboard only) | getEntity/getChildren/getParent (store), findMatchingKey (keyboard) — find is justified here as it searches, not retrieves |
| remove | delete (command type only) | removeEntity (store API), `crud:delete` (command type string) — different layers |
| update | set (focus/grid state) | updateEntity (data mutation), setFocus/setGridCol (state assignment) — semantically distinct |
| children | items (routeConfig only) | getChildren (store API), items (App.tsx route config) — different domains |
