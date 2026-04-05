import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { getProjects, type ProjectInfo } from './projectData'

export function buildProjectStore(): { store: NormalizedData; projects: ProjectInfo[]; pathMap: Record<string, string> } {
  const projects = getProjects()

  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const childIds: string[] = []

  for (const project of projects) {
    entities[project.id] = {
      id: project.id,
      data: {
        label: project.displayName,
        kind: project.kind,
        fileCount: project.fileCount,
        openBacklogs: project.openBacklogs,
        doneBacklogs: project.doneBacklogs,
        totalBacklogs: project.backlogs.length,
        maturity: project.maturity,
        hasP0: project.hasP0,
        path: project.path,
      },
    }
    childIds.push(project.id)
  }

  const relationships: Record<string, string[]> = { [ROOT_ID]: childIds }

  // Build path map for activate → navigate
  const pathMap: Record<string, string> = {}
  for (const project of projects) {
    if (project.path) pathMap[project.id] = project.path
  }

  return { store: createStore({ entities, relationships }), projects, pathMap }
}
