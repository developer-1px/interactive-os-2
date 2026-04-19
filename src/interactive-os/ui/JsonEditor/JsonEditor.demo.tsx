import { useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { z } from 'zod'
import { ax } from '@styles/ax'
import { SplitPane, type PaneSize } from '../SplitPane'
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

function EditorWithRaw({ title, editor, raw }: { title: string; editor: ReactNode; raw: string }): ReactElement {
  const [sizes, setSizes] = useState<PaneSize[]>(['flex', 0.35])
  return (
    <section className={ax({ layout: 'stack' })}>
      <h2 className={ax({ textStyle: 'section' })}>{title}</h2>
      <div className={ax({ layout: 'fill' })} data-full-height>
        <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes}>
          <div className={ax({ layout: 'fill' })}>{editor}</div>
          <pre className={ax({
              role: 'control-group',
            textStyle: 'caption', surface: 'sunken' })}>{raw}</pre>
        </SplitPane>
      </div>
    </section>
  )
}

export function Demo(): ReactElement {
  const [free, setFree] = useState<JsonValue>(sampleFree)
  const [typed, setTyped] = useState<SampleSchema>(sampleSchemaData)

  return (
    <div className={ax({ layout: 'stack', width: 'full' })}>
      <EditorWithRaw
        title="Free mode (no schema)"
        editor={<JsonEditor value={free} onChange={setFree} aria-label="Free JSON editor" />}
        raw={JSON.stringify(free, null, 2)}
      />
      <EditorWithRaw
        title="Schema mode (z.object)"
        editor={<JsonEditor value={typed} onChange={setTyped} schema={sampleSchema} aria-label="Schema JSON editor" />}
        raw={JSON.stringify(typed, null, 2)}
      />
    </div>
  )
}
