// ② 2026-04-03-app-inspector-prd.md
import { useMemo } from 'react'
import type { Plugin, InspectResult } from '@os/engine/types'
import { TreeView } from '@os/ui/TreeView'
import { inspectToTree } from '@os/engine/inspectToTree'
import { renderInspectorItem } from './renderInspectorItem'

const emptyPlugins: Plugin[] = []

interface AppInspectorProps {
  inspectResult: InspectResult
}

export function AppInspector({ inspectResult }: AppInspectorProps) {
  const treeData = useMemo(() => inspectToTree(inspectResult), [inspectResult])

  return (
    <TreeView
      data={treeData}
      plugins={emptyPlugins}
      renderItem={renderInspectorItem}
      aria-label="App inspector"
    />
  )
}
