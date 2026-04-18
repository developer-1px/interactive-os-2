/**
 * /chat/entities — 두 단의 디버그 뷰:
 *   상단: Zod 스키마 (Field | Type)
 *   하단: 실제 값 (Key | Value) — 라이브 chatStore 우선, 비어있으면 fixtures 폴백
 */
import { useMemo } from 'react'
import { TreeGrid } from '@os/ui/TreeGrid'
import { ax } from '@styles/ax'
import { useChatSessions, useActiveSession } from './chatStore'
import {
  buildSchemaTree,
  buildLiveStateTree,
  buildFixtureTree,
} from './chatEntityTreeData'

const SCHEMA_COLUMNS = [
  { key: 'field', header: 'Field', width: '320px' },
  { key: 'type', header: 'Type', width: '1fr' },
]

const VALUE_COLUMNS = [
  { key: 'key', header: 'Key', width: '320px' },
  { key: 'value', header: 'Value', width: '1fr' },
]

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className={ax({ role: 'control-group', surface: 'raised', layout: 'row', width: 'full', flex: 'none' })}>
      <div className={ax({ textStyle: 'section', flex: '1' })}>{title}</div>
      <div className={ax({ textStyle: 'caption' })}>{subtitle}</div>
    </div>
  )
}

export default function PageChatEntities() {
  const sessions = useChatSessions()
  const active = useActiveSession()

  const schemaData = useMemo(() => buildSchemaTree(), [])
  const liveData = useMemo(
    () => buildLiveStateTree({
      liveSessions: sessions,
      liveActiveId: active?.id ?? null,
      liveUi: { sidebarMode: 'sessions', bottomVisible: false },
    }),
    [sessions, active],
  )
  const fixtureData = useMemo(() => buildFixtureTree(), [])

  const isEmpty = sessions.length === 0
  const valueSource = isEmpty ? 'fixtures' : 'live'
  const valueData = isEmpty ? fixtureData : liveData

  return (
    <div className={ax({ layout: 'stack', width: 'full' })}>
      {/* Schema 단 */}
      <SectionHeader title="Schema" subtitle="@entities/chat — Zod" />
      <div className={ax({ layout: 'stack', width: 'full' })}>
        <TreeGrid
          data={schemaData}
          columns={SCHEMA_COLUMNS}
          header
          aria-label="Chat Zod schemas"
        />
      </div>

      {/* Value 단 */}
      <SectionHeader title="Value" subtitle={`source: ${valueSource} · sessions: ${sessions.length}`} />
      <div className={ax({ layout: 'stack', width: 'full' })}>
        <TreeGrid
          data={valueData}
          columns={VALUE_COLUMNS}
          header
          aria-label={`Chat ${valueSource} values`}
        />
      </div>
    </div>
  )
}
