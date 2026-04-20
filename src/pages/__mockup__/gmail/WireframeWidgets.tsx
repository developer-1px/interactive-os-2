// Phase 3 widgets — Low-fi using ax-based MockupBar primitive.

import { ax } from '@styles/ax'
import type { AxWidth } from '@styles/ax'
import { MockupBar } from '@os/ui/MockupBar'
import { FOLDERS, MAILS, THREAD, ATTACHMENTS } from './fixtures'
import type { MailEntry } from './schema'
import {
  Menu, Mail, Search, Grid, Bell, Settings as SettingsIcon,
  Pencil, Star, Paperclip, Square,
} from 'lucide-react'

function senderWidth(len: number): AxWidth {
  if (len < 10) return 'sm'
  if (len < 16) return 'md'
  return 'lg'
}

function subjectWidth(len: number): AxWidth {
  if (len < 15) return 'sm'
  if (len < 40) return 'md'
  if (len < 70) return 'lg'
  return 'xl'
}

function previewWidth(len: number): AxWidth {
  if (len < 40) return 'sm'
  if (len < 90) return 'md'
  if (len < 130) return 'lg'
  return 'xl'
}

function RegionLabel({ children }: { children: React.ReactNode }) {
  return <div className={ax({ textStyle: 'label' })}>{children}</div>
}

function FolderRow({ label, count }: { label: string; count: number | null }) {
  return (
    <div className={ax({ role: 'item', surface: 'ghost', interactive: 'item', content: 'text', layout: 'spread', textStyle: 'body' })}>
      <span>{label}</span>
      {count != null && <span className={ax({ textStyle: 'caption' })}>{count}</span>}
    </div>
  )
}

function MailRow({ mail }: { mail: MailEntry }) {
  return (
    <div className={ax({ role: 'item', surface: 'ghost', interactive: 'item', content: 'text', layout: 'bar' })}>
      <Square size={14} />
      <Star size={14} />
      <MockupBar shape="dot" />
      <MockupBar width={senderWidth(mail.from.length)} />
      <MockupBar width={subjectWidth(mail.subject.length)} />
      {mail.labels.map((_, i) => <MockupBar key={i} width="sm" />)}
      <div className={ax({ flex: '1' })}>
        <MockupBar width={previewWidth(mail.preview.length)} />
      </div>
      {mail.hasAttachment && <Paperclip size={12} />}
      <MockupBar width="sm" />
    </div>
  )
}

export function TopBarWireframe() {
  return (
    <div className={ax({ role: 'control-group', surface: 'base', layout: 'bar', flex: 'none' })}>
      <Menu size={18} />
      <Mail size={18} />
      <span className={ax({ textStyle: 'label' })}>Gmail</span>
      <div className={ax({ flex: '1', layout: 'center' })}>
        <MockupBar width="xl" />
      </div>
      <Search size={16} />
      <Grid size={16} />
      <Bell size={16} />
      <SettingsIcon size={16} />
      <MockupBar shape="dot" />
    </div>
  )
}

export function SidebarWireframe() {
  const systemFolders = FOLDERS.filter((f) => f.kind === 'system')
  const labelFolders = FOLDERS.filter((f) => f.kind === 'label')
  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'stack', width: 'full', flex: '1' })}>
      <div className={ax({ layout: 'bar' })}>
        <Pencil size={14} />
        <span className={ax({ textStyle: 'label' })}>Compose</span>
      </div>
      <RegionLabel>Mailbox</RegionLabel>
      {systemFolders.map((f) => <FolderRow key={f.id} label={f.label} count={f.unreadCount} />)}
      <RegionLabel>Labels</RegionLabel>
      {labelFolders.map((f) => <FolderRow key={f.id} label={f.label} count={f.unreadCount} />)}
    </div>
  )
}

export function MailListWireframe() {
  return (
    <div className={ax({ role: 'control-group', surface: 'base', layout: 'stack', width: 'full', flex: '1' })}>
      <div className={ax({ layout: 'bar' })}>
        <span className={ax({ textStyle: 'label' })}>Primary</span>
        <span className={ax({ textStyle: 'caption' })}>Social</span>
        <span className={ax({ textStyle: 'caption' })}>Promotions</span>
      </div>
      <div className={ax({ layout: 'spread' })}>
        <div className={ax({ layout: 'bar' })}>
          <Square size={14} />
          <MockupBar width="sm" />
          <MockupBar width="sm" />
        </div>
        <span className={ax({ textStyle: 'caption' })}>1–{MAILS.length} of {MAILS.length}</span>
      </div>
      <div className={ax({ layout: 'stack', flex: '1' })}>
        {MAILS.map((m) => <MailRow key={m.id} mail={m} />)}
      </div>
      <div className={ax({ layout: 'center' })}>
        <MockupBar width="md" />
      </div>
    </div>
  )
}

export function MailDetailWireframe() {
  const latest = THREAD[THREAD.length - 1]!
  const bodyLines = Math.min(3, Math.max(1, Math.ceil(latest.body.length / 80)))
  const bodyWidths: AxWidth[] = ['xl', 'lg', 'md']
  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'stack', width: 'full', flex: '1' })}>
      <div className={ax({ layout: 'bar' })}>
        {['Archive', 'Delete', 'Spam', 'Move', 'Labels', 'Snooze', 'Forward'].map((label) => (
          <span key={label} className={ax({ textStyle: 'caption' })}>{label}</span>
        ))}
      </div>
      <div className={ax({ layout: 'bar' })}>
        <MockupBar width={subjectWidth(MAILS[0]!.subject.length)} />
        <Star size={14} />
        <MockupBar width="sm" />
        <MockupBar width="sm" />
      </div>
      <div className={ax({ layout: 'bar' })}>
        <MockupBar shape="dot" />
        <div className={ax({ flex: '1' })}>
          <MockupBar width="lg" />
        </div>
        <MockupBar width="sm" />
      </div>
      {THREAD.length > 1 && (
        <div className={ax({ layout: 'bar' })}>
          <span className={ax({ textStyle: 'caption' })}>{THREAD.length - 1} earlier messages</span>
        </div>
      )}
      <div className={ax({ layout: 'stack' })}>
        {Array.from({ length: bodyLines }, (_, i) => (
          <MockupBar key={i} width={bodyWidths[i] ?? 'sm'} />
        ))}
      </div>
      {ATTACHMENTS.length > 0 && (
        <div className={ax({ layout: 'bar' })}>
          <Paperclip size={12} />
          {ATTACHMENTS.map((a) => <MockupBar key={a.id} width="md" />)}
        </div>
      )}
      <div className={ax({ layout: 'bar' })}>
        <span className={ax({ textStyle: 'label' })}>Reply</span>
        <span className={ax({ textStyle: 'caption' })}>Reply all</span>
        <span className={ax({ textStyle: 'caption' })}>Forward</span>
      </div>
    </div>
  )
}
