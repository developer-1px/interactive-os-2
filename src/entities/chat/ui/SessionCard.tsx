// SessionCard — chat 엔티티 전용 도메인 UI.
// input: selectCard()의 SessionCardModel. 외부 store/context 의존 없음.
// NavList/ListBox의 renderItem으로 전달 가능한 render function.
import type React from 'react'
import type { NodeState } from '@os/pattern/types'
import { ax } from '@styles/ax'
import { StatusIndicator } from '@os/ui/indicators/StatusIndicator'
import type { SessionCardModel, SessionUiState } from '../chatTypes'
import styles from './SessionCard.module.css'

const STATUS_TONE: Record<SessionUiState, 'success' | 'warning' | 'info' | 'error'> = {
  active: 'success',
  running: 'success',
  waiting: 'warning',
  idle: 'info',
  error: 'error',
}

interface SessionCardNodeData {
  card: SessionCardModel
}

export function SessionCard(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement {
  const data = (node.data ?? {}) as SessionCardNodeData
  const card = data.card

  return (
    <div
      {...props}
      className={ax({
        role: 'item',
        interactive: 'item',
        layout: 'stack',
        width: 'full',
      })}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
      data-glow={card.hasGlow || undefined}
    >
      <div className={ax({ layout: 'bar', width: 'full' })}>
        <StatusIndicator tone={STATUS_TONE[card.uiState]} variant={card.hasGlow ? 'ring' : 'filled'} />
        <span className={ax({ flex: '1', clamp: '1' })}>{card.title}</span>
        {card.unreadCount > 0 && (
          <span className={`${ax({ textStyle: 'caption' })} ${styles.unread}`}>
            {card.unreadCount}
          </span>
        )}
      </div>
      <div className={ax({ textStyle: 'caption', clamp: '1' })}>
        {card.cwd}{card.branch ? ` · ${card.branch}` : ''}
      </div>
      {card.previewText && (
        <div className={ax({ textStyle: 'caption', clamp: '1' })}>
          {card.previewText}
        </div>
      )}
      <div className={ax({ textStyle: 'caption' })}>
        {card.msgCount} msgs · {card.lastUpdatedAgo}
      </div>
    </div>
  )
}
