// Phase 5 — Hi-fi widgets. Full ax axis applied: role/surface/textStyle/tone/interactive/content.
// Hierarchy from Phase 2 Importance Matrix:
//   1st gaze: sender → textStyle 'label' + width fixed
//   2nd gaze: subject + unread → unread row surface 'display' + textStyle 'label'
//   3rd gaze: preview/date/chip/attach → textStyle 'caption' + tone dim

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

function FolderRow({ label, count, selected }: { label: string; count: number | null; selected?: boolean }) {
  return (
    <div
      className={ax({
        role: 'item',
        surface: selected ? 'display' : 'ghost',
        interactive: 'item',
        content: 'text',
        layout: 'spread',
        textStyle: 'body',
      })}
    >
      <span>{label}</span>
      {count != null && (
        <Badge tone="accent-dim">{count}</Badge>
      )}
    </div>
  )
}

function MailRow({ mail }: { mail: MailEntry }) {
  return (
    <div
      className={ax({
        role: 'item',
        surface: mail.unread ? 'display' : 'ghost',
        interactive: 'item',
        content: 'text',
        layout: 'bar',
        textStyle: mail.unread ? 'label' : 'body',
      })}
    >
      <Square size={14} />
      <Star size={14} fill={mail.starred ? 'currentColor' : 'none'} />
      <Avatar name={mail.from} size="sm" />
      <span className={ax({ width: 'sm', flex: 'none', clamp: '1' })}>{mail.from}</span>
      <span className={ax({ clamp: '1', flex: 'none' })}>{mail.subject}</span>
      {mail.labels.map((l) => (
        <Badge key={l} tone="accent-dim" variant="outline">{l}</Badge>
      ))}
      <span className={ax({ flex: '1', clamp: '1', textStyle: 'caption' })}>— {mail.preview}</span>
      {mail.hasAttachment && <Paperclip size={12} />}
      <span className={ax({ width: 'sm', flex: 'none', textStyle: 'caption' })}>{mail.date}</span>
    </div>
  )
}

export function TopBarHifi() {
  return (
    <div className={ax({ role: 'control-group', surface: 'base', layout: 'bar', flex: 'none' })}>
      <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon', layout: 'center' })}>
        <Menu size={18} />
      </div>
      <div className={ax({ layout: 'bar' })}>
        <Mail size={20} />
        <span className={ax({ textStyle: 'section' })}>Gmail</span>
      </div>
      <div className={ax({ flex: '1', layout: 'center' })}>
        <div className={ax({ role: 'control', surface: 'input', interactive: 'input', content: 'text', layout: 'bar', width: 'lg' })}>
          <Search size={14} />
          <span className={ax({ textStyle: 'body' })}>Search mail</span>
        </div>
      </div>
      <div className={ax({ layout: 'bar' })}>
        <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon', layout: 'center' })}>
          <Grid size={16} />
        </div>
        <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon', layout: 'center' })}>
          <Bell size={16} />
        </div>
        <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon', layout: 'center' })}>
          <SettingsIcon size={16} />
        </div>
        <Avatar name="Me" size="sm" />
      </div>
    </div>
  )
}

export function SidebarHifi() {
  const systemFolders = FOLDERS.filter((f) => f.kind === 'system')
  const labelFolders = FOLDERS.filter((f) => f.kind === 'label')
  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'stack', width: 'full', flex: '1' })}>
      <div className={ax({ role: 'control', surface: 'action', tone: 'accent', interactive: 'button', content: 'text', layout: 'bar' })}>
        <Pencil size={14} />
        <span>Compose</span>
      </div>
      <div className={ax({ textStyle: 'overline' })}>Mailbox</div>
      {systemFolders.map((f) => (
        <FolderRow key={f.id} label={f.label} count={f.unreadCount} selected={f.id === 'inbox'} />
      ))}
      <div className={ax({ textStyle: 'overline' })}>Labels</div>
      {labelFolders.map((f) => (
        <FolderRow key={f.id} label={f.label} count={f.unreadCount} />
      ))}
    </div>
  )
}

export function MailListHifi() {
  return (
    <div className={ax({ role: 'control-group', surface: 'base', layout: 'stack', width: 'full', flex: '1' })}>
      {/* tabs */}
      <div className={ax({ role: 'control-group', surface: 'base', layout: 'bar' })}>
        <div className={ax({ role: 'control', surface: 'ghost', interactive: 'tab', content: 'text', textStyle: 'label' })}>Primary</div>
        <div className={ax({ role: 'control', surface: 'ghost', interactive: 'tab', content: 'text', textStyle: 'body' })}>Social</div>
        <div className={ax({ role: 'control', surface: 'ghost', interactive: 'tab', content: 'text', textStyle: 'body' })}>Promotions</div>
      </div>
      {/* toolbar */}
      <div className={ax({ role: 'control-group', surface: 'base', layout: 'spread' })}>
        <div className={ax({ layout: 'bar' })}>
          <div className={ax({ role: 'control', surface: 'ghost', interactive: 'check', content: 'icon', layout: 'center' })}>
            <Square size={14} />
          </div>
          <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon', layout: 'center' })}>
            <RotateCw size={14} />
          </div>
          <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon', layout: 'center' })}>
            <MoreHorizontal size={14} />
          </div>
        </div>
        <div className={ax({ layout: 'bar' })}>
          <span className={ax({ textStyle: 'caption' })}>1–{MAILS.length} of {MAILS.length}</span>
          <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon', layout: 'center' })}>
            <ChevronLeft size={14} />
          </div>
          <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon', layout: 'center' })}>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
      {/* rows */}
      <div className={ax({ layout: 'stack', flex: '1' })}>
        {MAILS.map((m) => <MailRow key={m.id} mail={m} />)}
      </div>
    </div>
  )
}

export function MailDetailHifi() {
  const latest = THREAD[THREAD.length - 1]!
  const earlierCount = THREAD.length - 1
  const subjectMail = MAILS[0]!
  return (
    <div className={ax({ role: 'control-group', surface: 'sunken', layout: 'stack', width: 'full', flex: '1' })}>
      {/* detail toolbar — ghost icon buttons */}
      <div className={ax({ role: 'control-group', surface: 'base', layout: 'spread' })}>
        <div className={ax({ layout: 'bar' })}>
          {['Archive', 'Delete', 'Spam', 'Move', 'Labels', 'Snooze'].map((label) => (
            <div key={label} className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'text', textStyle: 'caption' })}>{label}</div>
          ))}
        </div>
        <div className={ax({ layout: 'bar' })}>
          <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon', layout: 'center' })}>
            <ChevronLeft size={14} />
          </div>
          <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'icon', layout: 'center' })}>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
      {/* subject header */}
      <div className={ax({ layout: 'bar' })}>
        <span className={ax({ textStyle: 'page', clamp: '2' })}>{subjectMail.subject}</span>
        <Star size={16} fill={subjectMail.starred ? 'currentColor' : 'none'} />
        {subjectMail.labels.map((l) => (
          <Badge key={l} tone="accent-dim" variant="outline">{l}</Badge>
        ))}
      </div>
      {/* from row */}
      <div className={ax({ layout: 'bar' })}>
        <Avatar name={latest.from} size="md" />
        <div className={ax({ flex: '1', layout: 'stack' })}>
          <div className={ax({ layout: 'bar' })}>
            <span className={ax({ textStyle: 'label' })}>{latest.from}</span>
            <span className={ax({ textStyle: 'caption' })}>&lt;{latest.email}&gt;</span>
          </div>
          <div className={ax({ layout: 'bar' })}>
            <span className={ax({ textStyle: 'caption' })}>to {latest.to}</span>
            <ChevronDown size={12} />
          </div>
        </div>
        <span className={ax({ textStyle: 'caption' })}>{latest.date}</span>
      </div>
      {/* thread collapsed */}
      {earlierCount > 0 && (
        <div
          className={ax({ role: 'control-group', surface: 'raised', layout: 'bar' })}
        >
          <ChevronRight size={12} />
          <span className={ax({ textStyle: 'caption' })}>
            {earlierCount} earlier message{earlierCount === 1 ? '' : 's'}
          </span>
        </div>
      )}
      {/* body */}
      <div className={ax({ textStyle: 'body', width: 'prose' })}>
        {latest.body.split('\n').map((line, i) => (
          <p key={i}>{line || '\u00A0'}</p>
        ))}
      </div>
      {/* attachments */}
      {ATTACHMENTS.length > 0 && (
        <div className={ax({ role: 'control-group', surface: 'base', layout: 'stack' })}>
          <div className={ax({ textStyle: 'caption' })}>{ATTACHMENTS.length} attachments</div>
          <div className={ax({ layout: 'bar' })}>
            {ATTACHMENTS.map((a) => (
              <div key={a.id} className={ax({ role: 'cell', surface: 'display', layout: 'bar', content: 'text', textStyle: 'body' })}>
                <Paperclip size={12} />
                <span className={ax({ textStyle: 'label' })}>{a.name}</span>
                <span className={ax({ textStyle: 'caption' })}>{a.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* actions */}
      <div className={ax({ layout: 'bar' })}>
        <div className={ax({ role: 'control', surface: 'action', tone: 'accent', interactive: 'button', content: 'text' })}>Reply</div>
        <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'text' })}>Reply all</div>
        <div className={ax({ role: 'control', surface: 'ghost', interactive: 'button', content: 'text' })}>Forward</div>
      </div>
    </div>
  )
}
