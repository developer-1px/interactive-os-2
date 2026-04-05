import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { getProjects, type ProjectInfo } from './projectData'

// Column indices: 0=name, 1=maturity, 2=kind, 3=progress, 4=files
export const PROJECT_COLUMNS = [
  { key: 'name', header: 'Name', width: '1fr' },
  { key: 'maturity', header: 'Maturity', width: '120px' },
  { key: 'kind', header: 'Kind', width: '80px' },
  { key: 'progress', header: 'Backlogs', width: '140px' },
  { key: 'files', header: 'Files', width: '80px' },
]

export function buildProjectStore(): { store: NormalizedData; projects: ProjectInfo[]; pathMap: Record<string, string> } {
  const projects = getProjects()

  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const childIds: string[] = []

  for (const project of projects) {
    entities[project.id] = {
      id: project.id,
      data: {
        label: project.displayName,
        cells: [
          { text: project.displayName, hasP0: project.hasP0, openBacklogs: project.openBacklogs },
          project.maturity,
          project.kind,
          project.backlogs.length > 0
            ? { done: project.doneBacklogs, total: project.backlogs.length, open: project.openBacklogs }
            : null,
          project.fileCount > 0 ? project.fileCount : null,
        ],
      },
    }
    childIds.push(project.id)
  }

  const relationships: Record<string, string[]> = { [ROOT_ID]: childIds }

  const pathMap: Record<string, string> = {}
  for (const project of projects) {
    if (project.path) pathMap[project.id] = project.path
  }

  return { store: createStore({ entities, relationships }), projects, pathMap }
}
