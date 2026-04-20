import { faker } from '@faker-js/faker'
import type { MailEntry, ThreadMessage, AttachmentEntry, FolderEntry } from './schema'

faker.seed(42)

const LABEL_POOL = ['Work', 'Important', 'Personal', 'Priority-1', 'Draft', 'Team', 'Travel', 'Finance']

// ── Hand-crafted edge cases (3) ──
// These test boundary conditions that random faker output might miss.

const EDGE_MIN: MailEntry = {
  id: 'edge-min',
  from: 'Ada',                                          // 3ch — shorter than stated minimum
  email: 'a@x.io',
  subject: 'Hi',                                         // 2ch
  preview: 'ok',                                         // 2ch
  date: 'Apr 14',
  starred: false,
  unread: false,
  hasAttachment: false,
  labels: [],
  important: false,
}

const EDGE_MAX: MailEntry = {
  id: 'edge-max',
  from: 'Alexandra Chen-Goodwin',                        // 23ch — longer than stated max
  email: 'alexandra.chen-goodwin@verylongcompanyname.co',
  subject: 'Q2 Sprint Planning: OKR alignment, platform migration, and WCAG 2.2 AA accessibility audit findings', // 105ch
  preview: 'Hi team, attached is the full proposal covering Q2 OKRs, the platform migration plan from v2 to v3, and our WCAG 2.2 AA audit with 47 findings across the product surface.', // 166ch
  date: '12:43 PM',
  starred: true,
  unread: true,
  hasAttachment: true,
  labels: ['Work', 'Important', 'Priority-1'],           // 3 chips, one at max length
  important: true,
}

const EDGE_LOADED: MailEntry = {
  id: 'edge-loaded',
  from: 'Bob Martinez',
  email: 'bob@example.com',
  subject: 'Design review feedback',
  preview: 'Great work on the dashboard. A few notes on color and spacing.',
  date: 'Apr 13',
  starred: true,
  unread: true,
  hasAttachment: true,
  labels: ['Work', 'Team'],
  important: true,
}

// ── Bulk via faker (15) ──
function makeRandomMail(i: number): MailEntry {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const from = `${firstName} ${lastName}`
  return {
    id: `m${i}`,
    from,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    subject: faker.lorem.sentence({ min: 3, max: 10 }).replace(/\.$/, ''),
    preview: faker.lorem.sentence({ min: 8, max: 18 }),
    date: i < 8 ? faker.date.recent({ days: 7 }).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : faker.date.recent({ days: 1 }).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    starred: faker.datatype.boolean(0.3),
    unread: faker.datatype.boolean(0.45),
    hasAttachment: faker.datatype.boolean(0.35),
    labels: faker.helpers.arrayElements(LABEL_POOL, { min: 0, max: 3 }),
    important: faker.datatype.boolean(0.2),
  }
}

export const MAILS: MailEntry[] = [
  EDGE_MAX,
  EDGE_LOADED,
  ...Array.from({ length: 15 }, (_, i) => makeRandomMail(i)),
  EDGE_MIN,  // place at end — tests min-height behavior for empty-looking row
]

// ── State fixtures ──

export const MAILS_EMPTY: MailEntry[] = []
export const MAILS_LOADING: MailEntry[] = []  // UI renders skeleton; data is irrelevant
export const LOADING_ROW_COUNT = 8
export const ERROR_MESSAGE = "Can't load mail. Check your connection and retry."

// ── Folders (sidebar) ──

export const FOLDERS: FolderEntry[] = [
  { id: 'inbox', label: 'Inbox', unreadCount: 12, kind: 'system' },
  { id: 'starred', label: 'Starred', unreadCount: null, kind: 'system' },
  { id: 'snoozed', label: 'Snoozed', unreadCount: 2, kind: 'system' },
  { id: 'sent', label: 'Sent', unreadCount: null, kind: 'system' },
  { id: 'drafts', label: 'Drafts', unreadCount: 3, kind: 'system' },
  { id: 'all', label: 'All Mail', unreadCount: null, kind: 'system' },
  { id: 'spam', label: 'Spam', unreadCount: null, kind: 'system' },
  { id: 'trash', label: 'Trash', unreadCount: null, kind: 'system' },
  { id: 'work', label: 'Work', unreadCount: 5, kind: 'label' },
  { id: 'personal', label: 'Personal', unreadCount: null, kind: 'label' },
  { id: 'important', label: 'Important', unreadCount: 8, kind: 'label' },
]

// ── Thread (detail) ──

export const THREAD: ThreadMessage[] = [
  {
    id: 't1',
    from: 'Alice Chen',
    email: 'alice.chen@example.com',
    to: 'Me, Bob',
    date: 'April 14, 2026 at 10:23 AM',
    body: `Hi team,\n\nI've drafted the Q2 sprint goals. Please review before tomorrow's sync.\n\n- API v3 migration\n- Dashboard launch\n- P95 latency under 100ms\n- WCAG 2.2 AA fixes`,
  },
  {
    id: 't2',
    from: 'Bob Martinez',
    email: 'bob@example.com',
    to: 'Alice, Me',
    date: 'April 14, 2026 at 11:02 AM',
    body: '+1 on all points. Can we also add a bundle-size goal (-15%)?',
  },
  {
    id: 't3',
    from: 'Me',
    email: 'me@example.com',
    to: 'Alice, Bob',
    date: 'April 14, 2026 at 11:47 AM',
    body: 'Agreed. See you at 2 PM.',
  },
]

export const ATTACHMENTS: AttachmentEntry[] = [
  { id: 'a1', name: 'Q2-sprint-board.pdf', size: '2.4 MB', kind: 'pdf' },
  { id: 'a2', name: 'okr-draft-v2.docx', size: '186 KB', kind: 'doc' },
]
