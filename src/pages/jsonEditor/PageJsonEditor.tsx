import { useMemo } from 'react'
import type { ReactElement } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { useEngine } from '@os/engine/useEngine'
import { definePlugin } from '@os/plugins/definePlugin'
import { jsonEditorStore, jsonEditorCommands } from './jsonEditorStore'
import { jsonEditorLayout } from './jsonEditorLayout'
import { JsonEditorProvider } from './jsonEditorContext'
import {
  JsonEditorWidget,
  JsonOutputWidget,
  TsOutputWidget,
  ZodOutputWidget,
} from './jsonEditorWidgets'

const jsonEditorPlugin = definePlugin({
  name: 'jsonEditorPage',
  commands: { setJson: jsonEditorCommands.setJson },
})

const registry = createWidgetRegistry({
  JsonEditorWidget,
  JsonOutputWidget,
  ZodOutputWidget,
  TsOutputWidget,
})

export default function PageJsonEditor(): ReactElement {
  const { engine, store } = useEngine({
    data: jsonEditorStore,
    plugins: [jsonEditorPlugin],
  })

  const ctx = useMemo(
    () => ({ store, dispatch: (c: Parameters<typeof engine.dispatch>[0]) => engine.dispatch(c) }),
    [engine, store],
  )

  return (
    <JsonEditorProvider value={ctx}>
      <FlatLayout data={jsonEditorLayout} registry={registry} aria-label="JSON Editor" />
    </JsonEditorProvider>
  )
}
