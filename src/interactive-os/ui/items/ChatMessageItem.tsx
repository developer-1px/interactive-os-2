// Chat message bubble used by the Slides app copilot.
// 3 variants: user / assistant(text|diff) / system.
import type React from 'react'
import type { AxInteractive } from '@styles/ax'
import { ax } from '@styles/ax'
import { Button } from '../Button'
import { Badge } from '../Badge'
import { MarkdownViewer } from '../MarkdownViewer'

export type ChatMessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessageDiff {
  summary: string
  ops: Array<{ op: string; target?: string }>
  status: 'pending' | 'accepted' | 'rejected'
  onAccept?: () => void
  onReject?: () => void
}

export interface ChatMessageItemProps {
  role: ChatMessageRole
  content: string
  variant?: 'text' | 'diff'
  diff?: ChatMessageDiff
  ts?: number
  interactive?: AxInteractive
  // Rest — ARIA props (getItemProps(id))
  [key: string]: unknown
}

export function ChatMessageItem({
  role,
  content,
  variant = 'text',
  diff,
  ts: _ts,
  interactive,
  ...rest
}: ChatMessageItemProps): React.ReactElement {
  // ── user ─────────────────────────────────────────────
  if (role === 'user') {
    return (
      <div
        {...rest}
        data-chat-role="user"
        className={`${ax({
          role: 'item',
          interactive,
          content: 'text',
          layout: 'self-end',
          width: 'fit',
        })} ${ax.raw({ padding: 'sm', shape: 'md' })}`}
      >
        <span
          className={`${ax({ surface: 'display', role: 'badge', content: 'text' })} ${ax.raw({ padding: 'sm', shape: 'md' })}`}
        >
          {content}
        </span>
      </div>
    )
  }

  // ── system ───────────────────────────────────────────
  if (role === 'system') {
    return (
      <div
        {...rest}
        data-chat-role="system"
        role="status"
        className={`${ax({
          role: 'utility',
          layout: 'center',
          width: 'full',
          textStyle: 'caption',
        })} ${ax.raw({ padding: 'xs' })}`}
      >
        {content}
      </div>
    )
  }

  // ── assistant / diff ─────────────────────────────────
  if (variant === 'diff' && diff) {
    const { summary, ops, status, onAccept, onReject } = diff
    return (
      <div
        {...rest}
        data-chat-role="assistant"
        data-chat-variant="diff"
        data-diff-status={status}
        className={`${ax({
          role: 'item',
          interactive,
          layout: 'stack',
          width: 'full',
          surface: 'display',
        })} ${ax.raw({ padding: 'sm', gap: 'sm', border: 'subtle', shape: 'md' })}`}
      >
        <span className={`${ax({ layout: 'bar', width: 'full' })} ${ax.raw({ gap: 'sm' })}`}>
          <span className={ax({ flex: '1', textStyle: 'label', clamp: '2' })}>{summary}</span>
          {status === 'accepted' && <Badge tone="success">Accepted</Badge>}
          {status === 'rejected' && <Badge tone="danger">Rejected</Badge>}
        </span>

        <ul
          className={`${ax({ layout: 'stack', width: 'full', textStyle: 'caption' })} ${ax.raw({ gap: 'xs' })}`}
        >
          {ops.map((o, i) => (
            <li key={i} className={ax({ layout: 'bar' })}>
              <span className={ax({ flex: 'none', textStyle: 'code' })}>{o.op}</span>
              {o.target && (
                <span className={`${ax({ flex: '1', clamp: '1' })} ${ax.raw({ padding: 'none' })}`}>
                  {' '}{o.target}
                </span>
              )}
            </li>
          ))}
        </ul>

        {status === 'pending' && (
          <span
            className={`${ax({ layout: 'bar', placement: 'anchor-end' })} ${ax.raw({ gap: 'sm' })}`}
          >
            <Button variant="ghost" onClick={onReject}>Reject</Button>
            <Button variant="accent" onClick={onAccept}>Accept</Button>
          </span>
        )}
      </div>
    )
  }

  // ── assistant / text ─────────────────────────────────
  return (
    <div
      {...rest}
      data-chat-role="assistant"
      data-chat-variant="text"
      className={`${ax({
        role: 'item',
        interactive,
        layout: 'stack',
        width: 'full',
      })} ${ax.raw({ padding: 'sm', gap: 'xs' })}`}
    >
      <MarkdownViewer content={content} />
    </div>
  )
}
