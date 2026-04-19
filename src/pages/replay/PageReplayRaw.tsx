// ② replay-raw-discuss — 세션별 raw JSON을 1초 간격으로 자동 순회 (visual 없음)
// @useState-hatch — fetch된 docs, 재생 상태(playing/index)는 os 축에 없어 로컬 상태로 보유
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CodeViewer } from '@os/ui/CodeViewer'
import { Button } from '@os/ui/Button'
import { ScrollArea } from '@os/ui/ScrollArea'
import { DirectionIndicator } from '@os/ui/indicators'
import { ax } from '@styles/ax'

const jsonLoaders = import.meta.glob<Record<string, unknown>>('./sessions/*.json', { import: 'default' })
const jsonlLoaders = import.meta.glob<string>('./sessions/*.jsonl', { query: '?raw', import: 'default' })

const STEP_MS = 1000

interface SessionDoc {
  id: string
  entries: unknown[]
}

async function loadSessions(): Promise<SessionDoc[]> {
  const docs: SessionDoc[] = []

  for (const [path, load] of Object.entries(jsonLoaders)) {
    const id = path.match(/\/([^/]+)\.json$/)?.[1] ?? path
    const raw = await load()
    const messages = (raw as { messages?: unknown[] }).messages
    docs.push({ id, entries: Array.isArray(messages) ? messages : [raw] })
  }

  for (const [path, load] of Object.entries(jsonlLoaders)) {
    const id = path.match(/\/([^/]+)\.jsonl$/)?.[1] ?? path
    const text = await load()
    const entries = text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => {
        try { return JSON.parse(line) as unknown } catch { return line }
      })
    docs.push({ id, entries })
  }

  docs.sort((a, b) => a.id.localeCompare(b.id))
  return docs
}

export default function PageReplayRaw() {
  const [docs, setDocs] = useState<SessionDoc[] | null>(null) // @useState-hatch
  const [sessionId, setSessionId] = useState<string | null>(null) // @useState-hatch
  const [index, setIndex] = useState(0) // @useState-hatch
  const [playing, setPlaying] = useState(true) // @useState-hatch

  useEffect(() => {
    void loadSessions().then((loaded) => {
      setDocs(loaded)
      if (loaded[0] && sessionId === null) setSessionId(loaded[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const session = useMemo(
    () => docs?.find(d => d.id === sessionId) ?? null,
    [docs, sessionId],
  )
  const total = session?.entries.length ?? 0
  const entry = session?.entries[index]

  useEffect(() => {
    if (!playing || total === 0) return
    const timer = setInterval(() => {
      setIndex((i) => {
        if (i + 1 >= total) { setPlaying(false); return i }
        return i + 1
      })
    }, STEP_MS)
    return () => clearInterval(timer)
  }, [playing, total])

  const selectSession = useCallback((id: string) => {
    setSessionId(id)
    setIndex(0)
    setPlaying(true)
  }, [])

  if (!docs) {
    return <div className={ax({ layout: 'center', flex: '1' })}>Loading sessions…</div>
  }

  const code = entry === undefined ? '' : JSON.stringify(entry, null, 2)

  return (
    <div className={ax({ layout: 'stack', flex: '1' })}>
      <div className={ax({ layout: 'bar' })}>
        {docs.map(doc => (
          <Button
            key={doc.id}
            variant={doc.id === sessionId ? 'accent' : 'ghost'}
            onClick={() => selectSession(doc.id)}
          >
            {doc.id}
          </Button>
        ))}
      </div>

      <div className={ax({ layout: 'bar' })}>
        <Button variant="secondary" onClick={() => setPlaying(p => !p)}>
          {playing ? 'Pause' : 'Play'}
        </Button>
        <Button variant="ghost" onClick={() => setIndex(i => Math.max(0, i - 1))}>
          <DirectionIndicator direction="prev" />
          Prev
        </Button>
        <Button variant="ghost" onClick={() => setIndex(i => Math.min(total - 1, i + 1))}>
          Next
          <DirectionIndicator direction="next" />
        </Button>
        <span className={ax({ textStyle: 'caption' })}>
          {total === 0 ? '—' : `${index + 1} / ${total}`}
        </span>
      </div>

      <ScrollArea>
        <CodeViewer code={code} filename={`${sessionId ?? 'entry'}.json`} preset="doc" wrap />
      </ScrollArea>
    </div>
  )
}
