// ② replay-inspect-discuss — sessions/ raw data inspector (visual 파이프와 분리)
import { useMemo, useState, useEffect } from 'react'
import { MillerColumns } from '@os/ui/MillerColumns'
import { JsonEditor } from '@os/ui/JsonEditor/JsonEditor'
import { createStore } from '@os/store/createStore'
import { ROOT_ID, type NormalizedData, type Entity } from '@os/store/types'
import type { JsonValue } from '@os/ui/JsonEditor/jsonToNormalized'
import { ax } from '@styles/ax'

const jsonLoaders = import.meta.glob<Record<string, unknown>>('./sessions/*.json', { import: 'default' })
const jsonlLoaders = import.meta.glob<string>('./sessions/*.jsonl', { query: '?raw', import: 'default' })

interface Entry {
  id: string
  label: string
  json: JsonValue
}

interface SessionDoc {
  id: string
  label: string
  entries: Entry[]
}

function previewOf(obj: unknown, index: number): string {
  if (!obj || typeof obj !== 'object') return `[${index}] ${String(obj).slice(0, 40)}`
  const o = obj as Record<string, unknown>
  const msg = o['message'] as Record<string, unknown> | undefined
  const role = (msg?.['role'] ?? o['role'] ?? o['type'] ?? '?') as string
  const tsRaw = o['timestamp']
  const ts = typeof tsRaw === 'string' ? ` ${tsRaw.slice(11, 19)}` : ''
  const content = msg?.['content']
  let blocks = ''
  if (Array.isArray(content)) {
    blocks = content.map(b => (b as { type?: string }).type ?? '?').join('/')
  } else if (typeof content === 'string') {
    blocks = 'text'
  }
  return `[${index}]${ts} ${role}${blocks ? ` · ${blocks}` : ''}`
}

async function loadSessions(): Promise<SessionDoc[]> {
  const docs: SessionDoc[] = []

  for (const [path, load] of Object.entries(jsonLoaders)) {
    const id = path.match(/\/([^/]+)\.json$/)?.[1] ?? path
    const raw = await load()
    const messages = (raw as { messages?: unknown[] }).messages
    const items = Array.isArray(messages) ? messages : [raw]
    const entries = items.map((item, i) => ({
      id: `e:${id}:${i}`,
      label: previewOf(item, i),
      json: item as JsonValue,
    }))
    docs.push({ id: `s:${id}`, label: `${id}  ·  json(${entries.length})`, entries })
  }

  for (const [path, load] of Object.entries(jsonlLoaders)) {
    const id = path.match(/\/([^/]+)\.jsonl$/)?.[1] ?? path
    const text = await load()
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const entries = lines.map((line, i) => {
      let parsed: JsonValue = line
      try { parsed = JSON.parse(line) as JsonValue } catch { /* keep raw */ }
      return { id: `e:${id}:${i}`, label: previewOf(parsed, i), json: parsed }
    })
    docs.push({ id: `s:${id}`, label: `${id}  ·  jsonl(${entries.length})`, entries })
  }

  docs.sort((a, b) => a.label.localeCompare(b.label))
  return docs
}

function buildData(docs: SessionDoc[]): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  for (const doc of docs) {
    entities[doc.id] = { id: doc.id, data: { name: doc.label, type: 'folder' } }
    relationships[ROOT_ID]!.push(doc.id)
    const entryIds: string[] = []
    for (const entry of doc.entries) {
      entities[entry.id] = {
        id: entry.id,
        data: { name: entry.label, type: 'file', json: entry.json as unknown as Record<string, unknown> },
      }
      entryIds.push(entry.id)
    }
    relationships[doc.id] = entryIds
  }

  return createStore({ entities, relationships })
}

export default function PageReplayInspect() {
  const [docs, setDocs] = useState<SessionDoc[] | null>(null)

  useEffect(() => {
    void loadSessions().then(setDocs)
  }, [])

  const data = useMemo(() => (docs ? buildData(docs) : null), [docs])

  if (!data) {
    return (
      <div className={ax({ layout: 'center', flex: '1' })}>
        Loading sessions…
      </div>
    )
  }

  return (
    <MillerColumns
      data={data}
      onChange={() => { /* read-only inspector */ }}
      aria-label="Replay session inspector"
      renderPreview={(nodeId) => {
        const entity = data.entities[nodeId]
        const json = (entity?.data as { json?: JsonValue } | undefined)?.json
        if (json === undefined) {
          return <div className={ax({ layout: 'center', flex: '1' })}>No data</div>
        }
        return <JsonEditor value={json} onChange={() => { /* read-only */ }} aria-label="Raw JSON" />
      }}
    />
  )
}
