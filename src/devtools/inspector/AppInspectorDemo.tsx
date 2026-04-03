import { useMemo } from 'react'
import type { NormalizedData } from '@os/store/types'
import { useEngine } from '@os/engine/useEngine'
import { history } from '@os/plugins/history'
import { crud } from '@os/plugins/crud'
import { dnd } from '@os/plugins/dnd'
import { focusRecovery } from '@os/plugins/focusRecovery'
import { treeData } from '../../pages/shared/shared-tree-data'
import { AppInspector } from './AppInspector'

export default function AppInspectorDemo() {
  const plugins = useMemo(() => [crud(), dnd(), history(), focusRecovery()], [])
  const { engine } = useEngine({ data: treeData as NormalizedData, plugins })
  const inspectResult = engine.inspect()

  return (
    <div className="card overflow-hidden" style={{ minHeight: 400 }}>
      <AppInspector inspectResult={inspectResult} />
    </div>
  )
}
