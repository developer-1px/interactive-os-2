// ② cmux-layout-prd.md
// ChatKeybindings — cmux 전역 단축키 widget.
// FlatLayoutContext에서 store/dispatch/getNodeElement를 pull 받아 useGlobalTrap에 선언적으로 바인딩.
// 날코딩 이벤트 리스너 대신 useGlobalTrap primitive를 사용한다.
// 렌더되는 DOM은 없다 (순수 side-effect widget). FlatLayout 내부 widget으로 mount돼야 컨텍스트 접근 가능.
import { useCallback, useMemo } from 'react'
import { useFlatLayout } from '@os/ui/useFlatLayout'
import { getEntityData } from '@os/schema'
import { useGlobalTrap, type GlobalTrapKeyMap } from '@os/primitives/useGlobalTrap'
import { workspaceCommands } from '@os/plugins/workspaceStore'
import {
  layoutCommands,
  focusDirCommand,
  flashPaneEffect,
  FOCUS_STATE_ID,
  type FocusStateData,
  type FocusDir,
} from '@os/layout/layoutCommands'
import { useChat } from './chatContext'

const FOCUS_DIRS: Record<string, FocusDir> = {
  'Mod+Alt+ArrowLeft':  'left',
  'Mod+Alt+ArrowRight': 'right',
  'Mod+Alt+ArrowUp':    'up',
  'Mod+Alt+ArrowDown':  'down',
}

const GOTO_KEYS = ['Mod+1', 'Mod+2', 'Mod+3', 'Mod+4', 'Mod+5', 'Mod+6', 'Mod+7', 'Mod+8', 'Mod+9']

export function ChatKeybindingsWidget() {
  const { store, dispatch, getNodeElement } = useFlatLayout()
  const { activeSessionId } = useChat()

  /** 현재 포커스된 tabgroup id — 모든 tabgroup-scoped 단축키의 대상. */
  const getFocusedTg = useCallback((): string | null => {
    const focus = getEntityData<FocusStateData>(store, FOCUS_STATE_ID)
    return focus?.focusedTabgroupId ?? null
  }, [store])

  const keyMap = useMemo<GlobalTrapKeyMap>(() => {
    const map: GlobalTrapKeyMap = {
      // ── Split ───────────────────────────────────────
      'Mod+d':       () => dispatch(layoutCommands.splitHere('horizontal')),
      'Mod+Shift+d': () => dispatch(layoutCommands.splitHere('vertical')),

      // ── Tab lifecycle ───────────────────────────────
      'Mod+t': () => {
        const tgId = getFocusedTg()
        if (!tgId) return
        const tabId = `t-${Date.now()}`
        dispatch(workspaceCommands.addTab(tgId, {
          id: tabId,
          data: { type: 'tab', label: 'Chat', contentType: 'chat', contentRef: activeSessionId ?? '' },
        }))
      },
      'Mod+w': () => dispatch(layoutCommands.closeHere()),

      // ── Tab navigation ──────────────────────────────
      'Mod+Shift+[': () => {
        const tgId = getFocusedTg()
        if (tgId) dispatch(workspaceCommands.prevTab(tgId))
      },
      'Mod+Shift+]': () => {
        const tgId = getFocusedTg()
        if (tgId) dispatch(workspaceCommands.nextTab(tgId))
      },
      'Ctrl+Tab': () => {
        const tgId = getFocusedTg()
        if (tgId) dispatch(workspaceCommands.nextTab(tgId))
      },
      'Ctrl+Shift+Tab': () => {
        const tgId = getFocusedTg()
        if (tgId) dispatch(workspaceCommands.prevTab(tgId))
      },

      // ── Sidebar toggle ──────────────────────────────
      'Mod+b': () => {
        const sb = getEntityData<{ hidden?: boolean }>(store, 'sidebar')
        dispatch(layoutCommands.setHidden('sidebar', !sb?.hidden))
      },

      // ── Flash focused pane ──────────────────────────
      'Mod+Shift+h': () => flashPaneEffect(store, getNodeElement),
    }

    // ── Spatial focus ─────────────────────────────────
    for (const [combo, dir] of Object.entries(FOCUS_DIRS)) {
      map[combo] = () => {
        const cmd = focusDirCommand(store, dir, getNodeElement)
        if (cmd) dispatch(cmd)
      }
    }

    // ── gotoTab — Mod+1..9 (cmux 표준은 ⌃N, cross-platform은 Mod+N) ──
    GOTO_KEYS.forEach((combo, i) => {
      map[combo] = () => {
        const tgId = getFocusedTg()
        if (tgId) dispatch(workspaceCommands.gotoTab(tgId, i))
      }
    })

    // ── Workspace shortcuts (ii stub) ────────────────
    // TODO(ii): Mod+n / Mod+Shift+w / Mod+Shift+r — cmux workspace CRUD.
    // 현재는 workspace 1개 고정이므로 no-op.

    return map
  }, [store, dispatch, getNodeElement, activeSessionId, getFocusedTg])

  // passthrough 모드: 매칭 안 된 키는 일반 입력으로 흘려보낸다 (composer typing 보존).
  useGlobalTrap(true, keyMap, { trap: false })

  return null
}
