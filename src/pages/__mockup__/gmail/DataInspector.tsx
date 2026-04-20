// DataInspector — Phase 1 artifact.
// Renders schema + fixtures as readable sections so user and LLM can look at
// the data inventory at a single glance before any UI design.

import { ax } from '@styles/ax'
import { MAILS, FOLDERS, THREAD, ATTACHMENTS, LOADING_ROW_COUNT, ERROR_MESSAGE } from './fixtures'
import type { MailEntry } from './schema'

function measure(values: string[]): { min: number; typical: number; max: number } {
  const lens = values.map((v) => v.length).sort((a, b) => a - b)
  return {
    min: lens[0] ?? 0,
    typical: lens[Math.floor(lens.length / 2)] ?? 0,
    max: lens[lens.length - 1] ?? 0,
  }
}

function Row({ field, range, example }: { field: string; range: string; example: string }) {
  return (
    <div className={ax({ role: 'item', surface: 'ghost', interactive: 'item', content: 'text', layout: 'bar' })}>
      <span className={ax({ textStyle: 'label', width: 'sm', flex: 'none' })}>{field}</span>
      <span className={ax({ textStyle: 'caption', width: 'md', flex: 'none' })}>{range}</span>
      <span className={ax({ textStyle: 'body', clamp: '1', flex: '1' })}>{example}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={ax({ role: 'control-group', surface: 'base', layout: 'stack' })}>
      <h2 className={ax({ textStyle: 'section' })}>{title}</h2>
      {children}
    </section>
  )
}

export default function DataInspector() {
  const fromRange = measure(MAILS.map((m) => m.from))
  const subjectRange = measure(MAILS.map((m) => m.subject))
  const previewRange = measure(MAILS.map((m) => m.preview))
  const labelCounts = MAILS.map((m) => m.labels.length)
  const labelRange = { min: Math.min(...labelCounts), max: Math.max(...labelCounts) }
  const labelChipLen = measure(MAILS.flatMap((m) => m.labels))

  const unreadCount = MAILS.filter((m) => m.unread).length
  const starredCount = MAILS.filter((m) => m.starred).length
  const attachCount = MAILS.filter((m) => m.hasAttachment).length

  const example = MAILS[0] as MailEntry

  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'stack', width: 'prose' })}>
      <div className={ax({ layout: 'stack' })}>
        <h1 className={ax({ textStyle: 'page' })}>Gmail mockup — Data Inventory</h1>
        <p className={ax({ textStyle: 'body' })}>
          Phase 1 of /mockup. Every field that appears on screen, with measured ranges and example values. This is the data contract for Phases 2–5.
        </p>
      </div>

      <Section title={`MailEntry — primary schema (${MAILS.length} fixtures)`}>
        <Row field="Field" range="Range / shape" example="Example (first fixture)" />
        <Row field="id" range="string" example={example.id} />
        <Row field="from" range={`${fromRange.min}–${fromRange.max} ch (typical ${fromRange.typical})`} example={example.from} />
        <Row field="email" range="string, @domain" example={example.email} />
        <Row field="subject" range={`${subjectRange.min}–${subjectRange.max} ch (typical ${subjectRange.typical})`} example={example.subject} />
        <Row field="preview" range={`${previewRange.min}–${previewRange.max} ch (typical ${previewRange.typical})`} example={example.preview} />
        <Row field="date" range="7–8 ch, 'Apr 14' or '12:43 PM'" example={example.date} />
        <Row field="starred" range={`bool (${starredCount}/${MAILS.length} true)`} example={String(example.starred)} />
        <Row field="unread" range={`bool (${unreadCount}/${MAILS.length} true)`} example={String(example.unread)} />
        <Row field="hasAttachment" range={`bool (${attachCount}/${MAILS.length} true)`} example={String(example.hasAttachment)} />
        <Row field="labels" range={`${labelRange.min}–${labelRange.max} chips, each ${labelChipLen.min}–${labelChipLen.max} ch`} example={example.labels.join(', ') || '—'} />
        <Row field="important" range="bool" example={String(example.important)} />
      </Section>

      <Section title="Edge cases (hand-crafted)">
        <div className={ax({ textStyle: 'body' })}>
          <strong>edge-max</strong> — Subject {MAILS[0]?.subject.length}ch, 3 labels, starred+unread+attach. Tests truncation and chip overflow.
        </div>
        <div className={ax({ textStyle: 'body' })}>
          <strong>edge-loaded</strong> — Mid-range subject with 2 labels, all booleans on. Tests normal "busy" row.
        </div>
        <div className={ax({ textStyle: 'body' })}>
          <strong>edge-min</strong> — 3-char sender, 2-char subject, no labels. Tests skeletal row min-height.
        </div>
      </Section>

      <Section title={`Folders (sidebar) — ${FOLDERS.length} entries`}>
        <Row field="Label" range="Unread" example="Kind" />
        {FOLDERS.map((f) => (
          <Row key={f.id} field={f.label} range={f.unreadCount == null ? '—' : String(f.unreadCount)} example={f.kind} />
        ))}
      </Section>

      <Section title={`Thread (detail view) — ${THREAD.length} messages`}>
        <Row field="From" range="Date" example="Body length" />
        {THREAD.map((m) => (
          <Row key={m.id} field={m.from} range={m.date} example={`${m.body.length} ch`} />
        ))}
      </Section>

      <Section title={`Attachments (detail view) — ${ATTACHMENTS.length} files`}>
        {ATTACHMENTS.map((a) => (
          <div key={a.id} className={ax({ textStyle: 'body' })}>{a.name} · {a.size} · {a.kind}</div>
        ))}
      </Section>

      <Section title="State fixtures">
        <div className={ax({ textStyle: 'body' })}><strong>populated</strong> — {MAILS.length} rows</div>
        <div className={ax({ textStyle: 'body' })}><strong>empty</strong> — 0 rows</div>
        <div className={ax({ textStyle: 'body' })}><strong>loading</strong> — {LOADING_ROW_COUNT} skeleton rows</div>
        <div className={ax({ textStyle: 'body' })}><strong>error</strong> — message: "{ERROR_MESSAGE}"</div>
      </Section>
    </div>
  )
}
