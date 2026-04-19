// ② jsonEditorPrd.md
import { useMemo, useRef } from 'react'
import type { ReactElement } from 'react'
import type { ZodType } from 'zod'
import { ax } from '@styles/ax'
import { TreeGrid } from '../TreeGrid'
import { history } from '../../plugins/history'
import { crud } from '../../plugins/crud'
import { clipboard } from '../../plugins/clipboard'
import { rename } from '../../plugins/rename'
import { focusRecovery } from '../../plugins/focusRecovery'
import { zodSchema } from '../../plugins/zodSchema'
import type { ZodSchema } from '../../plugins/zodSchema'
import type { NormalizedData } from '../../store/types'
import {
  jsonToNormalized,
  type JsonCellRef,
  type JsonNodeCore,
  type JsonNodeData,
  type JsonValue,
} from './jsonToNormalized'
import { normalizedToJson } from './normalizedToJson'
import { resolveSchemaAt, zodToAxis, type FieldAxis } from './zodToAxis'
import { JsonValueCell } from './JsonValueCell'
import { jsonEditPlugin } from './jsonEditCommands'

export interface JsonEditorProps<T extends JsonValue = JsonValue> {
  value: T
  onChange: (next: T) => void
  /** 있으면 schema-aware 모드 — 타입 enforced, paste validated, CRUD gated */
  schema?: ZodType<T>
  'aria-label'?: string
}

const COLUMNS = [
  { key: 'key', header: 'Key', width: '40%' },
  { key: 'value', header: 'Value' },
]

function serializeSubtree(subtree: NormalizedData): string {
  return JSON.stringify(normalizedToJson(subtree), null, 2)
}

function deserializeSubtree(text: string): NormalizedData | null {
  try {
    const parsed = JSON.parse(text) as JsonValue
    return jsonToNormalized(parsed)
  } catch {
    return null
  }
}

/**
 * @invariant controlled: 내부 NormalizedData는 ephemeral. 모든 command 후 onChange 호출
 * @invariant plugins: history, crud, clipboard, rename, focusRecovery 기본 탑재
 * @invariant schema 있을 때: zodSchema plugin 추가 (rootTypes: [schema])
 * @invariant clipboard serializer: NormalizedData↔JSON (application/json MIME + text fallback)
 */
export function JsonEditor<T extends JsonValue = JsonValue>({
  value,
  onChange,
  schema,
  'aria-label': ariaLabel = 'JSON editor',
}: JsonEditorProps<T>): ReactElement {
  const data = useMemo(() => jsonToNormalized(value), [value])

  const plugins = useMemo(() => {
    const base = [
      history(),
      crud(),
      clipboard({ serialize: serializeSubtree, deserialize: deserializeSubtree }),
      rename(),
      focusRecovery(),
      jsonEditPlugin(),
    ]
    if (schema) {
      base.push(zodSchema({ childRules: {}, rootTypes: [schema as unknown as ZodSchema] }))
    }
    return base
  }, [schema])

  const lastEmitted = useRef<T>(value)
  const handleChange = (next: NormalizedData) => {
    const json = normalizedToJson(next) as T
    if (json !== lastEmitted.current) {
      lastEmitted.current = json
      onChange(json)
    }
  }

  const axisAt = (nodeData: JsonNodeCore): FieldAxis | undefined => {
    if (!schema) return undefined
    const resolved = resolveSchemaAt(schema, nodeData.path, value) ?? schema
    return zodToAxis(resolved)
  }

  return (
    <TreeGrid
      data={data}
      columns={COLUMNS}
      plugins={plugins}
      onChange={handleChange}
      enableEditing
      aria-label={ariaLabel}
      renderCell={(_props, cellValue, column) => {
        const ref = cellValue as JsonCellRef | undefined
        if (!ref) return <span />
        const nodeData = ref.data
        if (column.key === 'key') {
          return (
            <span className={ax({ textStyle: 'caption' })}>
              {nodeData.key ?? indexLabel(nodeData)}
            </span>
          )
        }
        const fullData: JsonNodeData = { ...nodeData, cells: [ref, ref] }
        return <JsonValueCell nodeId={ref.nodeId} data={fullData} axis={axisAt(nodeData)} />
      }}
    />
  )
}

function indexLabel(nodeData: JsonNodeCore): string {
  const last = nodeData.path[nodeData.path.length - 1]
  if (typeof last === 'number') return `[${last}]`
  if (typeof last === 'string') return last
  return ''
}
