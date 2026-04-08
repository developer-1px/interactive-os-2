import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { EXPANDED_ID } from '../../axis/expand'
import { GRID_COL_ID } from '../../axis/navigate'
import { TreeGrid, Cell } from '../../ui/TreeGrid'
import { ax } from '@styles/ax'

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
    [GRID_COL_ID]: { id: GRID_COL_ID, colIndex: -1 },  // APG: rows focused first
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
      className={`${ax({ textStyle: 'body', text: 'primary', gap: 'sm', padding: 'xs', content: 'text', interactive: 'item', border: 'bottom' })} flex-row items-center whitespace-nowrap outline-none cursor-default`}
      data-focused={state.focused || undefined}
      style={{ paddingLeft: `calc(var(--space-md) * ${(state.level ?? 1) - 1})` }}
    >
      <Cell index={0}>
        <span className={`${ax({ textStyle: 'caption', text: 'secondary' })} shrink-0`} aria-hidden="true">
          {isThread ? (state.expanded ? '\u25BE' : '\u25B8') : '\u00A0'}
        </span>
        <span className={`${ax({ weight: 'semi' })} flex-1 overflow-hidden`}>{subject}</span>
      </Cell>
      <Cell index={1}>
        <span className={`${ax({ text: 'secondary', flex: '1' })} overflow-hidden`}>{summary}</span>
      </Cell>
      <Cell index={2}>
        <span className={`${ax({ textStyle: 'caption', text: 'secondary' })} shrink-0`}>{sender}</span>
      </Cell>
    </div>
  )
}

export function TreegridEmail() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <TreeGrid
      data={store}
      plugins={[]}
      onChange={onChange}
      renderItem={renderRow}
      columns={3}
      aria-label="Inbox"
    />
  )
}
