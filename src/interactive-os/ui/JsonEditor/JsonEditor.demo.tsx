// ② jsonEditorPrd.md
import { useState } from 'react'
import type { ReactElement } from 'react'
import { z } from 'zod'
import { ax } from '@styles/ax'
import { JsonEditor } from './JsonEditor'
import type { JsonValue } from './jsonToNormalized'

const sampleFree: JsonValue = {
  app: 'aria',
  version: 3,
  enabled: true,
  tags: ['ui', 'treegrid', 'json'],
  nested: { deep: { value: null } },
}

const sampleSchema = z.object({
  app: z.string(),
  version: z.number(),
  enabled: z.boolean(),
  tags: z.array(z.string()),
})
type SampleSchema = z.infer<typeof sampleSchema>

const sampleSchemaData: SampleSchema = {
  app: 'aria',
  version: 3,
  enabled: true,
  tags: ['ui', 'treegrid'],
}

export default function JsonEditorDemo(): ReactElement {
  const [free, setFree] = useState<JsonValue>(sampleFree)
  const [typed, setTyped] = useState<SampleSchema>(sampleSchemaData)

  return (
    <div className={ax({ layout: 'stack', width: 'full' })}>
      <section className={ax({ layout: 'stack' })}>
        <h2 className={ax({ textStyle: 'section' })}>Free mode (no schema)</h2>
        <JsonEditor value={free} onChange={setFree} aria-label="Free JSON editor" />
        <pre className={ax({ textStyle: 'caption' })}>
          {JSON.stringify(free, null, 2)}
        </pre>
      </section>

      <section className={ax({ layout: 'stack' })}>
        <h2 className={ax({ textStyle: 'section' })}>Schema mode (z.object)</h2>
        <JsonEditor<SampleSchema>
          value={typed}
          onChange={setTyped}
          schema={sampleSchema}
          aria-label="Schema JSON editor"
        />
        <pre className={ax({ textStyle: 'caption' })}>
          {JSON.stringify(typed, null, 2)}
        </pre>
      </section>
    </div>
  )
}
