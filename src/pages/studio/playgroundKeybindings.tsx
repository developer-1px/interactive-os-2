// PlaygroundKeybindings — /playground 전역 단축키 widget.
// Mod+D / Mod+Shift+D / Mod+T / Mod+W / Mod+Alt+Arrow 를 layoutCommands로 선언 바인딩.
// FlatLayout 내부에 자식으로 mount되어 context를 pull 받는다. 렌더 DOM 없음.
import { useCallback, useMemo } from 'react'
import { useFlatLayout } from '@os/ui/useFlatLayout'
import { useGlobalTrap, type GlobalTrapKeyMap } from '@os/primitives/useGlobalTrap'
import { getEntityData } from '@os/schema'
import { workspaceCommands } from '@os/plugins/workspaceStore'
import type { TabGroupData } from '@os/plugins/workspaceStore'
import {
  layoutCommands,
  focusDirCommand,
  FOCUS_STATE_ID,
  type FocusStateData,
  type FocusDir,
} from '@os/layout/layoutCommands'
import { PICKER_STATE_ID } from './studioLayout'

const FOCUS_DIRS: Record<string, FocusDir> = {
  'Mod+Alt+ArrowLeft':  'left',
  'Mod+Alt+ArrowRight': 'right',
  'Mod+Alt+ArrowUp':    'up',
  'Mod+Alt+ArrowDown':  'down',
}

export function PlaygroundKeybindingsWidget() {
  const { store, dispatch, getNodeElement } = useFlatLayout()

  const getFocusedTg = useCallback((): string | null => {
    const focus = getEntityData<FocusStateData>(store, FOCUS_STATE_ID)
    return focus?.focusedTabgroupId ?? null
  }, [store])

  const keyMap = useMemo<GlobalTrapKeyMap>(() => {
    const map: GlobalTrapKeyMap = {
      // Split — Chrome ⌘D/⌘P accelerator를 피해 non-accelerator 키로 변경.
      // 새 pane은 항상 빈 슬롯(seed.contentRef='').
      // ⌘\    = 가로 분할 (옆으로 슬래시)
      // ⌘Enter = 세로 분할 (아래로 줄바꿈 메타포)
      'Mod+\\':    () => dispatch(layoutCommands.splitHere('horizontal', { label: 'Untitled', contentType: 'widget', contentRef: '' })),
      'Mod+Enter': () => dispatch(layoutCommands.splitHere('vertical',   { label: 'Untitled', contentType: 'widget', contentRef: '' })),

      // 새 탭 — focused tabgroup에 빈 슬롯 탭 추가. (⌘T는 Chrome이 가로챔)
      'Mod+Shift+\\': () => {
        const tgId = getFocusedTg()
        if (!tgId) return
        const tabId = `t-${Date.now().toString(36)}`
        dispatch(workspaceCommands.addTab(tgId, {
          id: tabId,
          data: { type: 'tab', label: 'Untitled', contentType: 'widget', contentRef: '' },
        }))
      },

      // ⌘L = 채팅 로그 floating 토글. 평소엔 자막(subtitle)만 보이고 필요할 때 좌상단 팝업으로 전체 로그 확인.
      'Mod+l': () => {
        const current = getEntityData<{ hidden?: boolean }>(store, 'chatlog-float')
        dispatch(layoutCommands.setHidden('chatlog-float', !current?.hidden))
      },

      'Mod+w':    () => dispatch(layoutCommands.closeHere()),
      'Delete':    () => dispatch(layoutCommands.closeHere()),
      'Backspace': () => dispatch(layoutCommands.closeHere()),

      // 컴포넌트 교체 picker 열기. (⌘P는 Chrome 인쇄 accelerator이므로 ⌘K로)
      'Mod+k': () => {
        const focus = getEntityData<FocusStateData>(store, FOCUS_STATE_ID)
        const tgId = focus?.focusedTabgroupId
        if (!tgId) return
        const tg = getEntityData<TabGroupData>(store, tgId)
        const activeTabId = tg?.activeTabId
        if (!activeTabId) return
        dispatch(layoutCommands.updateNode(PICKER_STATE_ID, { targetTabId: activeTabId }))
      },

      'Mod+Shift+[': () => {
        const tgId = getFocusedTg()
        if (tgId) dispatch(workspaceCommands.prevTab(tgId))
      },
      'Mod+Shift+]': () => {
        const tgId = getFocusedTg()
        if (tgId) dispatch(workspaceCommands.nextTab(tgId))
      },
    }

    for (const [combo, dir] of Object.entries(FOCUS_DIRS)) {
      map[combo] = () => {
        const cmd = focusDirCommand(store, dir, getNodeElement)
        if (cmd) dispatch(cmd)
      }
    }

    return map
  }, [store, dispatch, getNodeElement, getFocusedTg])

  useGlobalTrap(true, keyMap, { trap: false })

  return null
}
