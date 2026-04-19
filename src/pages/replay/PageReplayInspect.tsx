// ② replay-inspect-discuss — Live(SSE) + Fixture 통합 raw data inspector
// @useState-hatch — fixture docs와 focus 포인터는 OS 축에 없어 로컬 보유
import { useEffect, useMemo, useState } from 'react'
import { MillerColumns } from '@os/ui/MillerColumns'
import { CodeViewer } from '@os/ui/CodeViewer'
import { createStore } from '@os/store/createStore'
import { ROOT_ID, type NormalizedData, type Entity } from '@os/store/types'
import { ax } from '@styles/ax'
import { useActiveSessions } from './useActiveSessions'
import { useTimeline } from '../viewer/viewerStore'
import type { TimelineEvent } from '../viewer/groupEvents'

type JsonValue = unknown

const jsonLoaders = import.meta.glob<Record<string, unknown>>('./sessions/*.json', { import: 'default' })
const jsonlLoaders = import.meta.glob<string>('./sessions/*.jsonl', { query: '?raw', import: 'default' })

const LIVE_GROUP = '__g_live__'
const FIXTURE_GROUP = '__g_fixture__'

interface FixtureEntry { id: string; label: string; json: JsonValue }
interface FixtureDoc { id: string; label: string; entries: FixtureEntry[] }

function previewOf(obj: unknown, index: number): string {
  if (!obj || typeof obj !== 'object') return `[${index}] ${String(obj).slice(0, 40)}`
  const o = obj as Record<string, unknown>
  const msg = o['message'] as Record<string, unknown> | undefined
  const role = (msg?.['role'] ?? o['role'] ?? o['type'] ?? '?') as string
  const tsRaw = o['timestamp'] ?? o['ts']
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

function previewOfEvent(evt: TimelineEvent, index: number): string {
  const ts = evt.ts ? ` ${evt.ts.slice(11, 19)}` : ''
  const tool = evt.tool ? ` · ${evt.tool}` : ''
  return `[${index}]${ts} ${evt.type}${tool}`
}

async function loadFixtureDocs(): Promise<FixtureDoc[]> {
  const docs: FixtureDoc[] = []

  for (const [path, load] of Object.entries(jsonLoaders)) {
    const id = path.match(/\/([^/]+)\.json$/)?.[1] ?? path
    const raw = await load()
    const messages = (raw as { messages?: unknown[] }).messages
    const items = Array.isArray(messages) ? messages : [raw]
    const entries = items.map((item, i) => ({
      id: `e:fixture:${id}:${i}`,
      label: previewOf(item, i),
      json: item as JsonValue,
    }))
    docs.push({ id: `s:fixture:${id}`, label: `${id}  ·  json(${entries.length})`, entries })
  }

  for (const [path, load] of Object.entries(jsonlLoaders)) {
    const id = path.match(/\/([^/]+)\.jsonl$/)?.[1] ?? path
    const text = await load()
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const entries = lines.map((line, i) => {
      let parsed: JsonValue = line
      try { parsed = JSON.parse(line) as JsonValue } catch { /* keep raw */ }
      return { id: `e:fixture:${id}:${i}`, label: previewOf(parsed, i), json: parsed }
    })
    docs.push({ id: `s:fixture:${id}`, label: `${id}  ·  jsonl(${entries.length})`, entries })
  }

  docs.sort((a, b) => a.label.localeCompare(b.label))
  return docs
}

interface LiveSessionMeta { id: string; label: string; mtime: number; active: boolean }

interface BuildArgs {
  liveSessions: LiveSessionMeta[]
  liveEvents: TimelineEvent[]
  liveEventsSessionId: string
  fixtureDocs: FixtureDoc[]
}

function buildData({ liveSessions, liveEvents, liveEventsSessionId, fixtureDocs }: BuildArgs): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [LIVE_GROUP, FIXTURE_GROUP] }

  // ── Live group ──
  entities[LIVE_GROUP] = {
    id: LIVE_GROUP,
    data: { name: `Live  ·  ${liveSessions.length}`, type: 'folder' },
  }
  const liveChildren: string[] = []
  for (const s of liveSessions) {
    const sid = `s:live:${s.id}`
    entities[sid] = {
      id: sid,
      data: { name: s.label, type: 'folder' },
    }
    liveChildren.push(sid)
    if (s.id === liveEventsSessionId && liveEvents.length > 0) {
      const entryIds: string[] = []
      liveEvents.forEach((evt, i) => {
        const eid = `e:live:${s.id}:${i}`
        entities[eid] = {
          id: eid,
          data: { name: previewOfEvent(evt, i), type: 'file', json: evt as unknown as Record<string, unknown> },
        }
        entryIds.push(eid)
      })
      relationships[sid] = entryIds
    } else {
      relationships[sid] = []
    }
  }
  relationships[LIVE_GROUP] = liveChildren

  // ── Fixture group ──
  entities[FIXTURE_GROUP] = {
    id: FIXTURE_GROUP,
    data: { name: `Fixture  ·  ${fixtureDocs.length}`, type: 'folder' },
  }
  const fixChildren: string[] = []
  for (const doc of fixtureDocs) {
    entities[doc.id] = { id: doc.id, data: { name: doc.label, type: 'folder' } }
    fixChildren.push(doc.id)
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
  relationships[FIXTURE_GROUP] = fixChildren

  return createStore({ entities, relationships })
}

function extractLiveSessionId(focusedId: string | null): string {
  if (!focusedId) return ''
  if (focusedId.startsWith('s:live:')) return focusedId.slice('s:live:'.length)
  if (focusedId.startsWith('e:live:')) {
    const rest = focusedId.slice('e:live:'.length)
    const sep = rest.lastIndexOf(':')
    return sep === -1 ? '' : rest.slice(0, sep)
  }
  return ''
}

export default function PageReplayInspect() {
  const active = useActiveSessions({ activeOnly: true })
  const [fixtureDocs, setFixtureDocs] = useState<FixtureDoc[] | null>(null) // @useState-hatch
  const [focusedId, setFocusedId] = useState<string | null>(null) // @useState-hatch

  useEffect(() => {
    void loadFixtureDocs().then(setFixtureDocs)
  }, [])

  const liveSessionId = extractLiveSessionId(focusedId)
  const liveEvents = useTimeline(liveSessionId)

  const data = useMemo(() => buildData({
    liveSessions: active.map(s => ({ id: s.id, label: s.label, mtime: s.mtime, active: s.active })),
    liveEvents,
    liveEventsSessionId: liveSessionId,
    fixtureDocs: fixtureDocs ?? [],
  }), [active, liveEvents, liveSessionId, fixtureDocs])

  if (!fixtureDocs) {
    return <div className={ax({ layout: 'center', flex: '1' })}>Loading…</div>
  }

  return (
    <MillerColumns
      data={data}
      onChange={() => { /* read-only inspector */ }}
      onFocusChange={setFocusedId}
      aria-label="Replay session inspector"
      renderPreview={(nodeId) => {
        const entity = data.entities[nodeId]
        const json = (entity?.data as { json?: JsonValue } | undefined)?.json
        if (json === undefined) {
          return <div className={ax({ layout: 'center', flex: '1' })}>No data</div>
        }
        const code = JSON.stringify(json, null, 2)
        return <CodeViewer code={code} filename="entry.json" preset="doc" wrap />
      }}
    />
  )
}
