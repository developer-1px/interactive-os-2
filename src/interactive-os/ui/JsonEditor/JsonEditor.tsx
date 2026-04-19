import { useMemo, useRef } from 'react'
import type { ReactElement } from 'react'
import type { ZodType } from 'zod'
import { TreeGrid } from '../TreeGrid'
import { history } from '../../plugins/history'
import { crud } from '../../plugins/crud'
import { clipboard, clipboardCommands } from '../../plugins/clipboard'
import { rename, renameCommands } from '../../plugins/rename'
import { focusRecovery } from '../../plugins/focusRecovery'
import { zodSchema } from '../../plugins/zodSchema'
import type { ZodSchema } from '../../plugins/zodSchema'
import { key } from '../../axis/types'
import { GRID_COL_ID } from '../../axis/navigate'
import type { NormalizedData } from '../../store/types'
import { EditableCell, EnumCell, SearchableCell, ToggleCell } from '../cells'
import { BadgeCell } from '../cells/BadgeCell'
import {
  jsonToNormalized,
  type JsonNodeCore,
  type JsonNodeData,
  type JsonValue,
} from './jsonToNormalized'
import { normalizedToJson } from './normalizedToJson'
import { resolveSchemaAt, zodToAxis, type FieldAxis } from './zodToAxis'
import {
  jsonEditPlugin,
  nextJsonType,
  setJsonType,
  setJsonValue,
  toggleJsonBoolean,
} from './jsonEditCommands'

export interface JsonEditorProps<T extends JsonValue = JsonValue> {
  value: T
  onChange: (next: T) => void
  /** 있으면 schema-aware 모드 — 타입 enforced, paste validated */
  schema?: ZodType<T>
  'aria-label'?: string
}

const COLUMNS = [
  { key: 'key', header: 'Key', width: '30%' },
  { key: 'type', header: 'Type', width: '15%' },
  { key: 'value', header: 'Value' },
] as const

function serializeSubtree(subtree: NormalizedData): string {
  return JSON.stringify(normalizedToJson(subtree), null, 2)
}

/** Validating deserializer — rejects paste text that can't parse or fails root schema. */
function makeDeserializer(schema?: ZodType<unknown>) {
  return (text: string): NormalizedData | null => {
    try {
      const parsed = JSON.parse(text) as JsonValue
      if (schema && !schema.safeParse(parsed).success) return null
      return jsonToNormalized(parsed)
    } catch {
      return null
    }
  }
}

function axisFor(
  schema: ZodType<unknown> | undefined,
  rootValue: JsonValue,
  data: JsonNodeCore,
): FieldAxis | undefined {
  if (!schema) return undefined
  const resolved = resolveSchemaAt(schema, data.path, rootValue) ?? schema
  return zodToAxis(resolved)
}

/**
 * @invariant controlled: 내부 NormalizedData는 ephemeral. 모든 command 후 onChange 호출
 * @invariant plugins: history, crud, clipboard, rename, focusRecovery 기본 탑재
 * @invariant 편집: rename 축(AriaEditable via EditableCell) + jsonEditor middleware가 type coercion
 * @invariant Enter 디스패처: Key+chevron → expand, 그 외 type별 분기 (bool toggle, str/num rename, enum cycle)
 * @invariant Mod+C/V/X: colIndex < 0 → row subtree (JSON), colIndex >= 0 → cell string
 * @invariant schema 있을 때: paste deserialize + cell/value 편집이 zod로 validate
 */
export function JsonEditor<T extends JsonValue = JsonValue>({
  value,
  onChange,
  schema,
  'aria-label': ariaLabel = 'JSON editor',
}: JsonEditorProps<T>): ReactElement {
  const data = useMemo(() => jsonToNormalized(value), [value])

  const rootValueRef = useRef<T>(value)
  rootValueRef.current = value

  const plugins = useMemo(() => {
    const base = [
      history(),
      crud(),
      clipboard({
        serialize: serializeSubtree,
        deserialize: makeDeserializer(schema as ZodType<unknown> | undefined),
      }),
      rename(),
      focusRecovery(),
      jsonEditPlugin({
        schema: schema as ZodType<unknown> | undefined,
        getRootValue: () => rootValueRef.current as JsonValue,
      }),
    ]
    if (schema) {
      base.push(zodSchema({ childRules: {}, rootTypes: [schema as unknown as ZodSchema] }))
    }
    return base
  }, [schema])

  const lastEmitted = useRef<T>(value)
  // dataRef tracks the LIVE engine store (with GRID_COL_ID, RENAME_ID, etc.) — updated
  // only via onChange. Do NOT overwrite with prop-derived `data` on every render; that
  // would erase the axis entities the engine adds.
  const dataRef = useRef<NormalizedData>(data)

  const handleChange = (next: NormalizedData) => {
    dataRef.current = next
    const json = normalizedToJson(next) as T
    if (json !== lastEmitted.current) {
      lastEmitted.current = json
      onChange(json)
    }
  }

  const keyMap = useMemo(() => ({
    Enter: key(
      ['core:expand', 'rename:start', 'jsonEditor:toggleBoolean', 'jsonEditor:setType', 'jsonEditor:setValue'],
      (ctx) => {
        const col = ctx.grid?.colIndex ?? -1
        const nodeData = ctx.getEntity(ctx.focused)?.data as JsonNodeCore | undefined
        if (!nodeData) return

        // Key cell (or row-mode) with chevron → expand
        if ((col === -1 || col === 0) && ctx.expanded?.isExpandable) {
          return ctx.expanded.toggle()
        }

        if (col === 0) {
          return renameCommands.startRename(ctx.focused)
        }

        if (col === 1) {
          return setJsonType(ctx.focused, nextJsonType(nodeData.type))
        }

        if (col === 2) {
          if (nodeData.type === 'boolean') return toggleJsonBoolean(ctx.focused)
          if (nodeData.type === 'string' || nodeData.type === 'number') {
            return renameCommands.startRename(ctx.focused)
          }
          // enum from schema: cycle
          const axis = axisFor(schema as ZodType<unknown> | undefined, rootValueRef.current as JsonValue, nodeData)
          if (axis?.kind === 'enum') {
            const current = String(nodeData.value ?? axis.options[0] ?? '')
            const idx = axis.options.indexOf(current)
            const nextVal = axis.options[(idx + 1) % axis.options.length] ?? current
            return setJsonValue(ctx.focused, nextVal)
          }
          // null/object/array → no-op
        }
      },
    ),
    'Mod+C': key(['clipboard:copy', 'clipboard:copyCellValue'], (ctx) => {
      const col = ctx.grid?.colIndex ?? -1
      if (col < 0) return clipboardCommands.copy([ctx.focused])
      return clipboardCommands.copyCellValue(ctx.focused, col)
    }),
    'Mod+X': key(['clipboard:cut', 'clipboard:cutCellValue'], (ctx) => {
      const col = ctx.grid?.colIndex ?? -1
      if (col < 0) return clipboardCommands.cut([ctx.focused])
      return clipboardCommands.cutCellValue(ctx.focused, col)
    }),
    'Mod+V': key(['clipboard:paste', 'clipboard:pasteCellValue'], (ctx) => {
      const col = ctx.grid?.colIndex ?? -1
      if (col < 0) return clipboardCommands.paste(ctx.focused)
      return clipboardCommands.pasteCellValue(ctx.focused, col)
    }),
  }), [schema])

  return (
    <TreeGrid
      data={data}
      columns={COLUMNS as unknown as { key: string; header: string; width?: string }[]}
      plugins={plugins}
      onChange={handleChange}
      enableEditing
      header
      keyMap={keyMap}
      aria-label={ariaLabel}
      renderCell={(_props, _cellValue, column, state, nodeData) => {
        const core = nodeData as JsonNodeData | undefined
        if (!core) return <span />

        const focusedCol = (dataRef.current.entities[GRID_COL_ID]?.colIndex as number | undefined) ?? -1
        const isActiveCell = state.focused && focusedCol === COLUMNS.findIndex(c => c.key === column.key)

        if (column.key === 'key') {
          if (isActiveCell) {
            return <EditableCell field="cells.0" allowEmpty>{core.cells[0]}</EditableCell>
          }
          return <SearchableCell>{core.cells[0]}</SearchableCell>
        }

        if (column.key === 'type') {
          return <EnumCell value={core.type} />
        }

        // value column
        if (core.type === 'boolean') return <ToggleCell value={Boolean(core.value)} />
        if (core.type === 'null') return <BadgeCell tone="neutral-dim">null</BadgeCell>
        if (core.type === 'object') return <BadgeCell tone="neutral-dim">{'{ }'}</BadgeCell>
        if (core.type === 'array') return <BadgeCell tone="neutral-dim">{'[ ]'}</BadgeCell>

        const axis = axisFor(schema as ZodType<unknown> | undefined, rootValueRef.current as JsonValue, core)
        if (axis?.kind === 'enum') {
          return <EnumCell value={String(core.value ?? '')} />
        }

        if (isActiveCell) {
          return <EditableCell field="cells.2" allowEmpty>{core.cells[2]}</EditableCell>
        }
        return <SearchableCell>{core.cells[2]}</SearchableCell>
      }}
    />
  )
}
