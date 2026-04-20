import { useMemo } from 'react'
import type { ReactElement } from 'react'
import { JsonEditor } from '@os/ui/JsonEditor/JsonEditor'
import type { JsonValue } from '@os/ui/JsonEditor/jsonToNormalized'
import { Panel } from '@os/ui/panels/Panel'
import { useJsonEditor } from './jsonEditorContext'
import { VALUE_ID, jsonEditorCommands } from './jsonEditorStore'
import { generateTypeScript, generateZodSchema } from './jsonSchemaGen'

function useValue(): JsonValue {
  const { store } = useJsonEditor()
  return (store.entities[VALUE_ID]?.data as { json: JsonValue }).json
}

export function JsonEditorWidget(): ReactElement {
  const { dispatch } = useJsonEditor()
  const value = useValue()
  return (
    <Panel>
      <JsonEditor
        value={value}
        onChange={(next) => dispatch(jsonEditorCommands.setJson(next))}
        aria-label="JSON editor"
      />
    </Panel>
  )
}

export function JsonOutputWidget(): ReactElement {
  const value = useValue()
  const body = useMemo(() => JSON.stringify(value, null, 2), [value])
  return (
    <Panel surface="sunken">
      <pre>{body}</pre>
    </Panel>
  )
}

export function ZodOutputWidget(): ReactElement {
  const value = useValue()
  const body = useMemo(() => generateZodSchema(value), [value])
  return (
    <Panel surface="sunken">
      <pre>{body}</pre>
    </Panel>
  )
}

export function TsOutputWidget(): ReactElement {
  const value = useValue()
  const body = useMemo(() => generateTypeScript(value), [value])
  return (
    <Panel surface="sunken">
      <pre>{body}</pre>
    </Panel>
  )
}
