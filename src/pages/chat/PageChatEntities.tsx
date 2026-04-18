/**
 * /chat/entities — 라이브 chatStore + UI page state 를 TreeGrid 로 출력하는 디버그 화면.
 * key:value 2 컬럼. 라이브 비어있으면 entities/chat fixtures 를 폴백으로 표시.
 */
import { useMemo } from 'react'
import { TreeGrid } from '@os/ui/TreeGrid'
import { ax } from '@styles/ax'
import { useChatSessions, useActiveSession } from './chatStore'
import { buildLiveStateTree, buildFixtureTree } from './chatEntityTreeData'

const COLUMNS = [
  { key: 'k', header: 'Key', width: '260px' },
  { key: 'v', header: 'Value', width: '1fr' },
]

export default function PageChatEntities() {
  const sessions = useChatSessions()
  const active = useActiveSession()

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
  const source: 'live' | 'fixtures' = isEmpty ? 'fixtures' : 'live'
  const data = isEmpty ? fixtureData : liveData

  return (
    <div className={ax({ layout: 'stack', width: 'full' })}>
      <div className={ax({ role: 'control-group', surface: 'raised', layout: 'row', width: 'full', flex: 'none' })}>
        <div className={ax({ textStyle: 'section', flex: '1' })}>Chat State Debug</div>
        <div className={ax({ textStyle: 'caption' })}>
          source: {source} · sessions: {sessions.length}
        </div>
      </div>
      <div className={ax({ layout: 'stack', width: 'full', flex: '1' })}>
        <TreeGrid
          data={data}
          columns={COLUMNS}
          header
          aria-label={`Chat ${source} state`}
        />
      </div>
    </div>
  )
}
