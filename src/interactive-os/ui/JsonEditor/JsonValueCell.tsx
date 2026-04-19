// ② jsonEditorPrd.md
import { useContext, useEffect, useState } from 'react'
import type { ChangeEvent, FocusEvent, ReactElement } from 'react'
import { ax } from '@styles/ax'
import { AriaInternalContext } from '../../primitives/AriaInternalContext'
import { StatusIndicator } from '../indicators/StatusIndicator'
import type { FieldAxis } from './zodToAxis'
import type { JsonNodeData, JsonType } from './jsonToNormalized'
import { parseAutoValue, setJsonType, setJsonValue } from './jsonEditCommands'

export interface JsonValueCellProps {
  nodeId: string
  data: JsonNodeData
  /** schema 모드에서만 주입. 없으면 free-mode 4종 type toggle */
  axis?: FieldAxis
}

// ── Schema-aware widgets ────────────────────────────────────────────────

function EnumSelect({
  nodeId,
  value,
  options,
}: { nodeId: string, value: string, options: readonly string[] }): ReactElement {
  const ariaCtx = useContext(AriaInternalContext)
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])

  const commit = (next: string) => {
    setLocal(next)
    if (next !== value) ariaCtx?.dispatch(setJsonValue(nodeId, next))
  }

  return (
    <select
      aria-label="value"
      value={local}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => commit(e.target.value)}
      onBlur={(e: FocusEvent<HTMLSelectElement>) => commit(e.target.value)}
      className={ax({ role: 'control', surface: 'input', cs: 'sm', textStyle: 'body' })}
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  )
}

function BooleanCheckbox({ nodeId, value }: { nodeId: string, value: boolean }): ReactElement {
  const ariaCtx = useContext(AriaInternalContext)
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  return (
    <input
      type="checkbox"
      aria-label="value"
      checked={local}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const next = e.target.checked
        setLocal(next)
        ariaCtx?.dispatch(setJsonValue(nodeId, next))
      }}
    />
  )
}

function NumberInput({ nodeId, value }: { nodeId: string, value: number }): ReactElement {
  const ariaCtx = useContext(AriaInternalContext)
  const [local, setLocal] = useState(String(value))
  useEffect(() => { setLocal(String(value)) }, [value])
  return (
    <input
      type="number"
      aria-label="value"
      value={local}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
      onBlur={() => {
        const parsed = Number(local)
        const next = Number.isFinite(parsed) ? parsed : 0
        if (next !== value) ariaCtx?.dispatch(setJsonValue(nodeId, next))
      }}
      className={ax({ role: 'control', surface: 'input', cs: 'sm', textStyle: 'body' })}
    />
  )
}

function StringInput({ nodeId, value }: { nodeId: string, value: string }): ReactElement {
  const ariaCtx = useContext(AriaInternalContext)
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  return (
    <input
      type="text"
      aria-label="value"
      value={local}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) ariaCtx?.dispatch(setJsonValue(nodeId, local))
      }}
      className={ax({ role: 'control', surface: 'input', cs: 'sm', textStyle: 'body' })}
    />
  )
}

// ── Free-mode: type toggle + auto parser ───────────────────────────────

type FreeMode = 'string' | 'object' | 'array' | 'auto'

function currentFreeMode(type: JsonType): FreeMode {
  if (type === 'object' || type === 'array' || type === 'string') return type
  return 'auto'
}

function FreeTypeToggle({
  nodeId,
  current,
}: { nodeId: string, current: FreeMode }): ReactElement {
  const ariaCtx = useContext(AriaInternalContext)
  return (
    <select
      aria-label="type"
      value={current}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value as FreeMode
        if (next === 'auto') {
          // auto 선택 시 string 타입으로 초기 진입 — 실제 타입 결정은 auto input blur에서 일어난다.
          ariaCtx?.dispatch(setJsonType(nodeId, 'string', ''))
          return
        }
        const nextType: JsonType = next
        ariaCtx?.dispatch(setJsonType(nodeId, nextType))
      }}
      className={ax({ role: 'control', surface: 'input', cs: 'sm', textStyle: 'caption' })}
    >
      <option value="string">string</option>
      <option value="object">object</option>
      <option value="array">array</option>
      <option value="auto">auto</option>
    </select>
  )
}

function FreeAutoInput({
  nodeId,
  value,
}: { nodeId: string, value: string | number | boolean | null }): ReactElement {
  const ariaCtx = useContext(AriaInternalContext)
  const initial = value === null ? 'null' : String(value)
  const [local, setLocal] = useState(initial)
  useEffect(() => {
    setLocal(value === null ? 'null' : String(value))
  }, [value])
  return (
    <input
      type="text"
      aria-label="value"
      value={local}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setLocal(e.target.value)}
      onBlur={() => {
        const { type, value: parsedValue } = parseAutoValue(local)
        ariaCtx?.dispatch(setJsonType(nodeId, type, parsedValue))
      }}
      className={ax({ role: 'control', surface: 'input', cs: 'sm', textStyle: 'body' })}
    />
  )
}

// ── axis-aware dispatcher ──────────────────────────────────────────────

function StructureBadge({ label }: { label: string }): ReactElement {
  return (
    <span className={ax({ role: 'badge', surface: 'ghost', textStyle: 'caption', tone: 'neutral-dim' })}>
      {label}
    </span>
  )
}

function renderForAxis(axis: FieldAxis, data: JsonNodeData, nodeId: string): ReactElement {
  switch (axis.kind) {
    case 'enum':
      return (
        <EnumSelect
          nodeId={nodeId}
          value={String(data.value ?? axis.options[0] ?? '')}
          options={axis.options}
        />
      )
    case 'boolean':
      return <BooleanCheckbox nodeId={nodeId} value={Boolean(data.value)} />
    case 'number':
      return <NumberInput nodeId={nodeId} value={Number(data.value ?? 0)} />
    case 'null':
      return <StructureBadge label="null" />
    case 'object':
      return <StructureBadge label="{ }" />
    case 'array':
      return <StructureBadge label="[ ]" />
    case 'string':
    case 'discriminated':
    case 'unknown':
    default:
      return <StringInput nodeId={nodeId} value={String(data.value ?? '')} />
  }
}

function renderFree(data: JsonNodeData, nodeId: string): ReactElement {
  const isStructure = data.type === 'object' || data.type === 'array'
  return (
    <span className={ax({ layout: 'bar' })}>
      <FreeTypeToggle nodeId={nodeId} current={currentFreeMode(data.type)} />
      {!isStructure && <FreeAutoInput nodeId={nodeId} value={data.value ?? ''} />}
    </span>
  )
}

/**
 * @invariant axis.kind='enum' → <select>, 'boolean' → <input type=checkbox>, 'number' → <input type=number>, 'string' → <input type=text>
 * @invariant axis 없을 때: string/object/array/auto 4종 type toggle <select> + auto는 blur 시 JSON.parse
 * @invariant 각 위젯은 change/blur 시 jsonEditor:setValue 또는 jsonEditor:setType command를 dispatch
 *            (history plugin이 undo 단위로 스택)
 * @invariant data.orphan=true면 시각적 warning 인디케이터 (StatusIndicator tone="warning")
 */
export function JsonValueCell({ nodeId, data, axis }: JsonValueCellProps): ReactElement {
  return (
    <span className={ax({ layout: 'bar' })}>
      {data.orphan && <StatusIndicator tone="warning" />}
      {axis
        ? renderForAxis(axis, data, nodeId)
        : renderFree(data, nodeId)}
    </span>
  )
}
