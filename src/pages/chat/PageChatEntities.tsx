/**
 * /chat/entities — entities/chat 엔티티 시각화 디버그 뷰어 (3단):
 *   1) Schema  (Field | Type)         — Zod introspection
 *   2) Value   (Key | Value)          — 라이브 chatStore 우선, fixtures 폴백
 *   3) Commands (Name | Type)         — defineCommands 로 등록된 모든 명령
 */
import { useMemo } from 'react'
import { TreeGrid } from '@os/ui/TreeGrid'
import { ax } from '@styles/ax'
import { useChatSessions, useActiveSession } from './chatStore'
import {
  buildSchemaTree,
  buildLiveStateTree,
  buildFixtureTree,
  buildCommandsTree,
} from './chatEntityTreeData'

const SCHEMA_COLUMNS = [
  { key: 'field', header: 'Field', width: '320px' },
  { key: 'type', header: 'Type', width: '1fr' },
]

const VALUE_COLUMNS = [
  { key: 'key', header: 'Key', width: '320px' },
  { key: 'value', header: 'Value', width: '1fr' },
]

const COMMAND_COLUMNS = [
  { key: 'name', header: 'Name', width: '200px' },
  { key: 'type', header: 'Type', width: '260px' },
  { key: 'create', header: 'Create', width: '1fr' },
  { key: 'handler', header: 'Handler', width: '1fr' },
  { key: 'meta', header: 'Meta', width: '60px' },
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
  const commandsData = useMemo(() => buildCommandsTree(), [])

  const isEmpty = sessions.length === 0
  const valueSource = isEmpty ? 'fixtures' : 'live'
  const valueData = isEmpty ? fixtureData : liveData
  const commandCount = useMemo(() => Object.keys(commandsData.entities).filter(k => k.startsWith('cmd:') && !k.includes('.')).length, [commandsData])

  return (
    <div className={ax({ layout: 'stack', width: 'full' })}>
      <SectionHeader title="Schema" subtitle="@entities/chat — Zod" />
      <div className={ax({ layout: 'stack', width: 'full' })}>
        <TreeGrid
          data={schemaData}
          columns={SCHEMA_COLUMNS}
          header
          aria-label="Chat Zod schemas"
        />
      </div>

      <SectionHeader title="Value" subtitle={`source: ${valueSource} · sessions: ${sessions.length}`} />
      <div className={ax({ layout: 'stack', width: 'full' })}>
        <TreeGrid
          data={valueData}
          columns={VALUE_COLUMNS}
          header
          aria-label={`Chat ${valueSource} values`}
        />
      </div>

      <SectionHeader title="Commands" subtitle={`@entities/chat — ${commandCount} commands`} />
      <div className={ax({ layout: 'stack', width: 'full' })}>
        <TreeGrid
          data={commandsData}
          columns={COMMAND_COLUMNS}
          header
          aria-label="Chat commands"
        />
      </div>
    </div>
  )
}
