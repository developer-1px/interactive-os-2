/**
 * EntitiesInspectorWidget — entities/chat 엔티티 시각화 디버그 뷰어 (split 2단).
 * /cmux?view=entities 로 진입 시 cmux 캔버스의 tab content 로 주입된다.
 *   왼쪽:  Schema · Value · Commands  (메타 정보)
 *   오른쪽: Components                   (entities/chat fixture → 실제 UI 렌더)
 */
import { useMemo } from 'react'
import { TreeGrid } from '@os/ui/TreeGrid'
import { SessionList } from '@os/ui/SessionList'
import { NavList } from '@os/ui/NavList'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import { ScrollArea } from '@os/ui/ScrollArea'
import { ax } from '@styles/ax'
import { createStore, ROOT_ID } from '@os/schema'
import {
  chatSessionFixtures,
  chatUiStateFixture,
  previewTextFixtures,
  selectCard,
  SessionCard,
} from '@entities/chat'
import type { SessionItemOptions } from '@os/ui/items'
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

const fixtureSessionListData = createStore({
  entities: Object.fromEntries(
    Object.entries(chatSessionFixtures).map(([id, s]) => [
      id,
      { id, data: { label: s.title ?? id.slice(0, 8) } },
    ]),
  ),
  relationships: { [ROOT_ID]: Object.keys(chatSessionFixtures) },
})

function fixtureItemOptions(id: string): SessionItemOptions {
  const s = chatSessionFixtures[id]
  return { status: s?.state === 'running' ? 'running' : 'idle' }
}

const FIXTURE_NOW = 1745000000000 + 5 * 60_000

const fixtureSessionCardData = createStore({
  entities: Object.fromEntries(
    Object.entries(chatSessionFixtures).map(([id, session]) => [
      id,
      {
        id,
        data: {
          card: selectCard({
            session,
            isActive: id === chatUiStateFixture.activeSessionId,
            previewText: previewTextFixtures[id] ?? '',
            now: FIXTURE_NOW,
          }),
        },
      },
    ]),
  ),
  relationships: { [ROOT_ID]: Object.keys(chatSessionFixtures) },
})

function ComponentPreview({ name, source, children }: { name: string; source: string; children: React.ReactNode }) {
  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'stack', width: 'full' })}>
      <div className={ax({ layout: 'bar', width: 'full' })}>
        <span className={ax({ textStyle: 'label', flex: '1' })}>{name}</span>
        <span className={ax({ textStyle: 'caption' })}>{source}</span>
      </div>
      {children}
    </div>
  )
}

export function EntitiesInspectorWidget() {
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
    <SplitPane direction="horizontal" sizes={SPLIT_SIZES} onResize={NOOP_RESIZE} minRatio={0.2}>
      <ScrollArea className={ax({ layout: 'fill' })}>
        <div className={ax({ layout: 'stack', width: 'full' })}>
          <SectionHeader title="Schema" subtitle="@entities/chat — Zod" />
          <TreeGrid
            data={schemaData}
            columns={SCHEMA_COLUMNS}
            header
            aria-label="Chat Zod schemas"
          />

          <SectionHeader title="Value" subtitle={`source: ${valueSource} · sessions: ${sessions.length}`} />
          <TreeGrid
            data={valueData}
            columns={VALUE_COLUMNS}
            header
            aria-label={`Chat ${valueSource} values`}
          />

          <SectionHeader title="Commands" subtitle={`@entities/chat — ${commandCount} commands`} />
          <TreeGrid
            data={commandsData}
            columns={COMMAND_COLUMNS}
            header
            aria-label="Chat commands"
          />
        </div>
      </ScrollArea>

      <ScrollArea className={ax({ layout: 'fill' })}>
        <div className={ax({ layout: 'stack', width: 'full' })}>
          <SectionHeader title="Components" subtitle="entities/chat fixture → renderer" />
          <ComponentPreview name="SessionList (Generic)" source="@os/ui/SessionList ← label + state only">
            <SessionList
              data={fixtureSessionListData}
              itemOptions={fixtureItemOptions}
              aria-label="chat fixture sessions"
            />
          </ComponentPreview>
          <ComponentPreview name="SessionCard (Domain)" source="@entities/chat/ui ← selectCard(SessionCardModel)">
            <NavList
              data={fixtureSessionCardData}
              renderItem={SessionCard}
              aria-label="chat fixture session cards"
            />
          </ComponentPreview>
        </div>
      </ScrollArea>
    </SplitPane>
  )
}

const SPLIT_SIZES: PaneSize[] = [0.5, 'flex']
function NOOP_RESIZE() {}
