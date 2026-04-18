var e=`import { createStore, ROOT_ID } from '@os/schema'
import type { NormalizedData } from '@os/schema'

// ── Folder data (NavList with groups) ──

export function makeFolderData(): NormalizedData {
  return createStore({
    entities: {
      'g-main': { id: 'g-main', data: { type: 'group', label: 'Mailbox' } },
      inbox: { id: 'inbox', data: { label: 'Inbox', badge: '12' } },
      starred: { id: 'starred', data: { label: 'Starred' } },
      sent: { id: 'sent', data: { label: 'Sent' } },
      drafts: { id: 'drafts', data: { label: 'Drafts', badge: '3' } },
      'g-labels': { id: 'g-labels', data: { type: 'group', label: 'Labels' } },
      work: { id: 'work', data: { label: 'Work' } },
      personal: { id: 'personal', data: { label: 'Personal' } },
      important: { id: 'important', data: { label: 'Important' } },
    },
    relationships: {
      [ROOT_ID]: ['g-main', 'g-labels'],
      'g-main': ['inbox', 'starred', 'sent', 'drafts'],
      'g-labels': ['work', 'personal', 'important'],
    },
  })
}

// ── Tab data (TabList) ──

export function makeTabData(): NormalizedData {
  return createStore({
    entities: {
      primary: { id: 'primary', data: { label: 'Primary' } },
      social: { id: 'social', data: { label: 'Social' } },
      promotions: { id: 'promotions', data: { label: 'Promotions' } },
    },
    relationships: { [ROOT_ID]: ['primary', 'social', 'promotions'] },
  })
}

// ── Mail list data (ListBox) ──

interface MailEntry {
  id: string
  from: string
  subject: string
  preview: string
  date: string
  starred: boolean
  unread: boolean
}

const MAILS: MailEntry[] = [
  { id: 'm1', from: 'Alice Chen', subject: 'Q2 Sprint Planning', preview: 'Hi team, I\\'ve drafted the sprint goals for Q2. Please review before our sync tomorrow...', date: 'Apr 14', starred: true, unread: true },
  { id: 'm2', from: 'Bob Martinez', subject: 'Design Review Feedback', preview: 'Great work on the dashboard redesign. A few notes on the color system and spacing...', date: 'Apr 14', starred: false, unread: true },
  { id: 'm3', from: 'Carol Kim', subject: 'API Migration Update', preview: 'The v3 migration is 80% complete. Remaining endpoints: /users, /billing, /webhooks...', date: 'Apr 13', starred: true, unread: false },
  { id: 'm4', from: 'David Park', subject: 'On-call Rotation Schedule', preview: 'Attached is the updated on-call rotation for May. Please swap if needed by Friday...', date: 'Apr 13', starred: false, unread: false },
  { id: 'm5', from: 'Eva Liu', subject: 'Customer Feedback Summary', preview: 'This month we received 142 feedback items. Top themes: performance, dark mode, and...', date: 'Apr 12', starred: false, unread: true },
  { id: 'm6', from: 'Frank O\\'Brien', subject: 'Security Audit Results', preview: 'All critical items have been addressed. Two medium-severity issues remain in the auth...', date: 'Apr 12', starred: true, unread: false },
  { id: 'm7', from: 'Grace Tanaka', subject: 'New Hire Onboarding', preview: 'We have three new engineers starting next Monday. Can you prepare dev environment...', date: 'Apr 11', starred: false, unread: false },
  { id: 'm8', from: 'Henry Zhao', subject: 'Performance Benchmarks', preview: 'P95 latency dropped to 120ms after the caching layer. Full report attached...', date: 'Apr 11', starred: false, unread: false },
  { id: 'm9', from: 'Iris Nakamura', subject: 'Budget Approval Needed', preview: 'We need approval for the additional cloud infrastructure costs. The projected...', date: 'Apr 10', starred: false, unread: true },
  { id: 'm10', from: 'James Wilson', subject: 'Retrospective Action Items', preview: 'From last sprint retro: improve test coverage, reduce PR review time, update docs...', date: 'Apr 10', starred: true, unread: false },
  { id: 'm11', from: 'Kate Novak', subject: 'Conference Talk Accepted', preview: 'Our talk on accessibility patterns got accepted for ReactConf! We should start...', date: 'Apr 9', starred: false, unread: false },
  { id: 'm12', from: 'Leo Santos', subject: 'Dependency Update PR', preview: 'Opened a PR to bump React to 19.1 and TypeScript to 5.8. CI is green, need review...', date: 'Apr 9', starred: false, unread: false },
]

export function makeMailListData(): NormalizedData {
  const entities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const children: string[] = []
  for (const mail of MAILS) {
    entities[mail.id] = {
      id: mail.id,
      data: {
        label: mail.subject,
        from: mail.from,
        subject: mail.subject,
        preview: mail.preview,
        date: mail.date,
        starred: mail.starred,
        unread: mail.unread,
      },
    }
    children.push(mail.id)
  }
  return createStore({
    entities,
    relationships: { [ROOT_ID]: children },
  })
}

// ── Search data (Combobox, empty) ──

export function makeSearchData(): NormalizedData {
  return createStore({
    entities: {},
    relationships: { [ROOT_ID]: [] },
  })
}

// ── Toolbar data (ButtonToolbar) ──

export function makeTopBarToolbarData(): NormalizedData {
  return createStore({
    entities: {
      settings: { id: 'settings', data: { label: 'Settings', icon: 'settings' } },
    },
    relationships: { [ROOT_ID]: ['settings'] },
  })
}

export function makeActionToolbarData(): NormalizedData {
  return createStore({
    entities: {
      reply: { id: 'reply', data: { label: 'Reply' } },
      forward: { id: 'forward', data: { label: 'Forward' } },
    },
    relationships: { [ROOT_ID]: ['reply', 'forward'] },
  })
}

// ── Mail detail (static) ──

export const MAIL_DETAIL = {
  from: 'Alice Chen <alice.chen@example.com>',
  to: 'Me <me@example.com>',
  subject: 'Q2 Sprint Planning',
  date: 'April 14, 2026 at 10:23 AM',
  body: \`Hi team,

I've drafted the sprint goals for Q2 based on our OKR discussions last week. Here's what I'm proposing:

1. Complete the API v3 migration (carry-over from Q1)
2. Launch the new dashboard with real-time metrics
3. Improve P95 latency to under 100ms
4. Ship accessibility audit fixes for WCAG 2.2 AA compliance

For the sprint ceremonies, I'd like to propose we move standups to 10:00 AM to accommodate the APAC team. We'll keep the bi-weekly retros on Fridays.

Please review the attached sprint board and add any items I might have missed. Let's finalize everything in tomorrow's sync at 2 PM.

Looking forward to a productive quarter!

Best,
Alice\`,
}
`;export{e as default};