import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { treegrid } from '../../pattern/roles/treegrid'
import { EXPANDED_ID } from '../../axis/expand'
import styles from './treegrid.module.css'

// APG #66: Treegrid Email Inbox
// https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-1/

const threads = [
  {
    id: 'thread-1',
    subject: 'Treegrids are awesome',
    summary: 'Want to learn how to use them?',
    sender: 'Mailer Daemon',
    children: [
      { id: 'thread-1-reply', subject: 'Re: Treegrids are awesome', summary: 'I sure do!', sender: 'Recipient' },
    ],
  },
  {
    id: 'thread-2',
    subject: 'Your Coverage Renewal',
    summary: 'Your policy is up for renewal',
    sender: 'John Smith',
    children: [],
  },
  {
    id: 'thread-3',
    subject: 'Lunch Meeting',
    summary: 'Want to grab lunch Thursday?',
    sender: 'Janet Jones',
    children: [
      { id: 'thread-3-reply-1', subject: 'Re: Lunch Meeting', summary: 'Sure, how about noon?', sender: 'Recipient' },
      { id: 'thread-3-reply-2', subject: 'Re: Lunch Meeting', summary: 'Sounds great!', sender: 'Janet Jones' },
    ],
  },
]

const data: NormalizedData = createStore({
  entities: {
    ...Object.fromEntries(
      threads.map(t => [t.id, { id: t.id, data: { subject: t.subject, summary: t.summary, sender: t.sender } }]),
    ),
    ...Object.fromEntries(
      threads.flatMap(t =>
        t.children.map(c => [c.id, { id: c.id, data: { subject: c.subject, summary: c.summary, sender: c.sender } }]),
      ),
    ),
    [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: ['thread-1'] },
  },
  relationships: {
    [ROOT_ID]: threads.map(t => t.id),
    ...Object.fromEntries(
      threads
        .filter(t => t.children.length > 0)
        .map(t => [t.id, t.children.map(c => c.id)]),
    ),
  },
})

const renderRow = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const nodeData = node.data as Record<string, unknown>
  const subject = nodeData?.subject as string
  const summary = nodeData?.summary as string
  const sender = nodeData?.sender as string
  const isThread = state.expanded !== undefined

  return (
    <div
      {...props}
      className={styles.row}
      data-focused={state.focused || undefined}
      style={{ paddingLeft: `calc(var(--space-md) * ${(state.level ?? 1) - 1})` }}
    >
      <span className={styles.indicator} aria-hidden="true">
        {isThread ? (state.expanded ? '\u25BE' : '\u25B8') : '\u00A0'}
      </span>
      <span className={styles.subject}>{subject}</span>
      <span className={styles.summary}>{summary}</span>
      <span className={styles.sender}>{sender}</span>
    </div>
  )
}

export function TreegridEmail() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => treegrid(), [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Inbox"
    >
      <Aria.Item render={renderRow} />
    </Aria>
  )
}
