import { createStore } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'

// Flat list — shared by navV, navH, navVhUniform, selectToggle, selectExtended, activate, activateFollowFocus, focusTrap
export const axisListData = createStore({
  entities: {
    a1: { id: 'a1', data: { label: 'Navigate' } },
    a2: { id: 'a2', data: { label: 'Select' } },
    a3: { id: 'a3', data: { label: 'Activate' } },
    a4: { id: 'a4', data: { label: 'Expand' } },
    a5: { id: 'a5', data: { label: 'Collapse' } },
    a6: { id: 'a6', data: { label: 'Focus' } },
    a7: { id: 'a7', data: { label: 'Escape' } },
  },
  relationships: {
    [ROOT_ID]: ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'],
  },
})

// Tree — shared by depthArrow, depthEnterEsc
export const axisTreeData = createStore({
  entities: {
    folder1: { id: 'folder1', data: { label: 'Documents' } },
    folder2: { id: 'folder2', data: { label: 'Projects' } },
    folder3: { id: 'folder3', data: { label: 'Archive' } },
    doc1: { id: 'doc1', data: { label: 'README.md' } },
    doc2: { id: 'doc2', data: { label: 'notes.txt' } },
    proj1: { id: 'proj1', data: { label: 'app.tsx' } },
    proj2: { id: 'proj2', data: { label: 'index.ts' } },
    proj3: { id: 'proj3', data: { label: 'utils.ts' } },
    arc1: { id: 'arc1', data: { label: 'backup.zip' } },
    arc2: { id: 'arc2', data: { label: 'old-config.json' } },
  },
  relationships: {
    [ROOT_ID]: ['folder1', 'folder2', 'folder3'],
    folder1: ['doc1', 'doc2'],
    folder2: ['proj1', 'proj2', 'proj3'],
    folder3: ['arc1', 'arc2'],
  },
})

// Grid 3×4 — navGrid only
export const axisGridColumns = [
  { key: 'action', header: 'Action' },
  { key: 'key', header: 'Key' },
  { key: 'axis', header: 'Axis' },
]

export const axisGridData = createStore({
  entities: {
    'r1': { id: 'r1', data: { cells: ['Move up', '↑', 'navV'] } },
    'r2': { id: 'r2', data: { cells: ['Move down', '↓', 'navV'] } },
    'r3': { id: 'r3', data: { cells: ['Move left', '←', 'navH'] } },
    'r4': { id: 'r4', data: { cells: ['Move right', '→', 'navH'] } },
  },
  relationships: {
    [ROOT_ID]: ['r1', 'r2', 'r3', 'r4'],
  },
})
