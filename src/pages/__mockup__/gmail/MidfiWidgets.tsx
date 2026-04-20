// Phase 4 widgets — Mid-fi. Real fixture data, basic typography, NO hierarchy yet.

import { ax } from '@styles/ax'
import { Avatar } from '@os/ui/Avatar'
import { Badge } from '@os/ui/Badge'
import { FOLDERS, MAILS, THREAD, ATTACHMENTS } from './fixtures'
import type { MailEntry } from './schema'
import {
  Menu, Mail, Search, Grid, Bell, Settings as SettingsIcon,
  Pencil, Star, Paperclip, Square,
  ChevronLeft, ChevronRight, ChevronDown, RotateCw, MoreHorizontal,
} from 'lucide-react'

function FolderRow({ label, count }: { label: string; count: number | null }) {
  return (
    <div className={ax({ role: 'item', surface: 'ghost', interactive: 'item', content: 'text', layout: 'spread' })}>
      <span>{label}</span>
      {count != null && <span>{count}</span>}
    </div>
  )
}

function MailRow({ mail }: { mail: MailEntry }) {
  return (
    <div className={ax({ role: 'item', surface: 'ghost', interactive: 'item', content: 'text', layout: 'bar' })}>
      <Square size={14} />
      <Star size={14} />
      <Avatar name={mail.from} size="sm" />
      <span className={ax({ width: 'sm', clamp: '1' })}>{mail.from}</span>
      <span className={ax({ clamp: '1' })}>{mail.subject}</span>
      {mail.labels.map((l) => <Badge key={l} tone="neutral">{l}</Badge>)}
      <span className={ax({ flex: '1', clamp: '1' })}>— {mail.preview}</span>
      {mail.hasAttachment && <Paperclip size={12} />}
      <span>{mail.date}</span>
    </div>
  )
}

export function TopBarMidfi() {
  return (
    <div className={ax({ role: 'control-group', surface: 'base', layout: 'bar', flex: 'none' })}>
      <Menu size={18} />
      <Mail size={18} />
      <span>Gmail</span>
      <div className={ax({ flex: '1', layout: 'center' })}>
        <div className={ax({ role: 'control', surface: 'input', interactive: 'input', content: 'text', layout: 'bar', width: 'lg' })}>
          <Search size={14} />
          <span>Search mail</span>
        </div>
      </div>
      <Grid size={16} />
      <Bell size={16} />
      <SettingsIcon size={16} />
      <Avatar name="Me" size="sm" />
    </div>
  )
}

export function SidebarMidfi() {
  const systemFolders = FOLDERS.filter((f) => f.kind === 'system')
  const labelFolders = FOLDERS.filter((f) => f.kind === 'label')
  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'stack', width: 'full', flex: '1' })}>
      <div className={ax({ role: 'control', surface: 'action', tone: 'accent', interactive: 'button', content: 'text', layout: 'bar' })}>
        <Pencil size={14} />
        <span>Compose</span>
      </div>
      <div className={ax({ textStyle: 'caption' })}>Mailbox</div>
      {systemFolders.map((f) => <FolderRow key={f.id} label={f.label} count={f.unreadCount} />)}
      <div className={ax({ textStyle: 'caption' })}>Labels</div>
      {labelFolders.map((f) => <FolderRow key={f.id} label={f.label} count={f.unreadCount} />)}
    </div>
  )
}

export function MailListMidfi() {
  return (
    <div className={ax({ role: 'control-group', surface: 'base', layout: 'stack', width: 'full', flex: '1' })}>
      <div className={ax({ role: 'control-group', surface: 'base', layout: 'bar' })}>
        <span>Primary</span>
        <span>Social</span>
        <span>Promotions</span>
      </div>
      <div className={ax({ layout: 'spread' })}>
        <div className={ax({ layout: 'bar' })}>
          <Square size={14} />
          <RotateCw size={14} />
          <MoreHorizontal size={14} />
        </div>
        <div className={ax({ layout: 'bar' })}>
          <span>1–{MAILS.length} of {MAILS.length}</span>
          <ChevronLeft size={14} />
          <ChevronRight size={14} />
        </div>
      </div>
      <div className={ax({ layout: 'stack', flex: '1' })}>
        {MAILS.map((m) => <MailRow key={m.id} mail={m} />)}
      </div>
    </div>
  )
}

export function MailDetailMidfi() {
  const latest = THREAD[THREAD.length - 1]!
  const earlierCount = THREAD.length - 1
  const subjectMail = MAILS[0]!
  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'stack', width: 'full', flex: '1' })}>
      <div className={ax({ layout: 'bar' })}>
        <span>Archive</span>
        <span>Delete</span>
        <span>Spam</span>
        <span>Move</span>
        <span>Labels</span>
        <span>Snooze</span>
        <span>Forward all</span>
        <span>Print</span>
      </div>
      <div className={ax({ layout: 'bar' })}>
        <span>{subjectMail.subject}</span>
        <Star size={14} />
        {subjectMail.labels.map((l) => <Badge key={l} tone="neutral">{l}</Badge>)}
      </div>
      <div className={ax({ layout: 'bar' })}>
        <Avatar name={latest.from} size="md" />
        <div className={ax({ flex: '1', layout: 'stack' })}>
          <div className={ax({ layout: 'bar' })}>
            <span>{latest.from}</span>
            <span>&lt;{latest.email}&gt;</span>
          </div>
          <div className={ax({ layout: 'bar' })}>
            <span>to {latest.to}</span>
            <ChevronDown size={12} />
          </div>
        </div>
        <span>{latest.date}</span>
      </div>
      {earlierCount > 0 && (
        <div className={ax({ layout: 'bar' })}>
          <ChevronRight size={12} />
          <span>{earlierCount} earlier message{earlierCount === 1 ? '' : 's'}</span>
        </div>
      )}
      <div className={ax({ textStyle: 'body' })}>
        {latest.body.split('\n').map((line, i) => (
          <p key={i}>{line || '\u00A0'}</p>
        ))}
      </div>
      {ATTACHMENTS.length > 0 && (
        <div className={ax({ layout: 'stack' })}>
          <div className={ax({ textStyle: 'caption' })}>{ATTACHMENTS.length} attachments</div>
          <div className={ax({ layout: 'bar' })}>
            {ATTACHMENTS.map((a) => (
              <div key={a.id} className={ax({ role: 'cell', surface: 'display', layout: 'bar', content: 'text' })}>
                <Paperclip size={12} />
                <span>{a.name}</span>
                <span>{a.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className={ax({ layout: 'bar' })}>
        <div className={ax({ role: 'control', surface: 'action', tone: 'accent', interactive: 'button', content: 'text' })}>Reply</div>
        <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'text' })}>Reply all</div>
        <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'text' })}>Forward</div>
      </div>
    </div>
  )
}
