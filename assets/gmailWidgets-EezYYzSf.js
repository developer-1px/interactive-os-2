var e=`import { NavList } from '@os/ui/NavList'
import { TabList } from '@os/ui/TabList'
import { ListBox } from '@os/ui/ListBox'
import { Combobox } from '@os/ui/Combobox'
import { ButtonToolbar } from '@os/ui/ButtonToolbar'
import { PanelHeader } from '@os/ui/PanelHeader'
import type { ItemSlots } from '@os/ui/types'
import { ax } from '@styles/ax'
import { Mail, Pencil } from 'lucide-react'
import { StarIndicator } from '@os/ui/indicators'
import {
  makeFolderData,
  makeTabData,
  makeMailListData,
  makeSearchData,
  makeTopBarToolbarData,
  makeActionToolbarData,
  MAIL_DETAIL,
} from './gmailFixtures'

// ═══════════════════════════════════════════
// TopBar
// ═══════════════════════════════════════════

const searchData = makeSearchData()
const topBarToolbarData = makeTopBarToolbarData()

export function TopBarWidget() {
  return (
    <div className={ax({ surface: 'base', layout: 'spread', padding: 'sm', flex: 'none', border: 'bottom' })}>
      <div className={ax({ layout: 'bar', gap: 'sm', flex: 'none' })}>
        <Mail size={20} />
        <span className={ax({ weight: 'semi', textStyle: 'body' })}>Gmail</span>
      </div>
      <div className={ax({ flex: '1', width: 'lg' })}>
        <Combobox
          data={searchData}
          placeholder="Search mail"
          editable
          aria-label="Search mail"
        />
      </div>
      <ButtonToolbar
        data={topBarToolbarData}
        onActivate={() => {}}
        aria-label="Settings"
      />
    </div>
  )
}

// ═══════════════════════════════════════════
// Sidebar
// ═══════════════════════════════════════════

const folderData = makeFolderData()

export function SidebarWidget() {
  return (
    <div className={ax({ layout: 'stack', flex: '1', padding: 'sm' })}>
      <div className={ax({ interactive: 'button', surface: 'action', tone: 'accent', role: 'control', layout: 'bar', gap: 'sm', content: 'text', shape: 'xl' })}>
        <Pencil size={14} />
        <span>Compose</span>
      </div>
      <NavList
        data={folderData}
        onActivate={() => {}}
        aria-label="Mail folders"
      />
    </div>
  )
}

// ═══════════════════════════════════════════
// MailList
// ═══════════════════════════════════════════

const tabData = makeTabData()
const mailListData = makeMailListData()

const mailSlots: ItemSlots = {
  icon: (node) => {
    const data = node.data as Record<string, unknown> | undefined
    const starred = data?.starred as boolean
    return <StarIndicator filled={starred} />
  },
  rightContent: (node) => {
    const data = node.data as Record<string, unknown> | undefined
    const date = (data?.date as string) ?? ''
    return <span className={ax({ textStyle: 'caption', text: 'muted' })}>{date}</span>
  },
}

export function MailListWidget() {
  return (
    <div className={ax({ layout: 'stack', flex: '1', border: 'end' })}>
      <TabList
        data={tabData}
        aria-label="Mail categories"
      />
      <ListBox
        data={mailListData}
        plugins={[]}
        itemSlots={mailSlots}
        onActivate={() => {}}
        aria-label="Mail list"
      />
    </div>
  )
}

// ═══════════════════════════════════════════
// MailDetail
// ═══════════════════════════════════════════

const actionToolbarData = makeActionToolbarData()

const paragraphs = MAIL_DETAIL.body.split('\\n')

export function MailDetailWidget() {
  return (
    <div className={ax({ layout: 'stack', flex: '1' })}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ weight: 'semi' })}>{MAIL_DETAIL.subject}</span>
      </PanelHeader>
      <div className={ax({ layout: 'stack', gap: 'md', padding: 'md', flex: '1', scroll: 'auto' })}>
        <div className={ax({ layout: 'stack', gap: 'xs' })}>
          <div className={ax({ layout: 'spread' })}>
            <span className={ax({ weight: 'semi' })}>{MAIL_DETAIL.from}</span>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>{MAIL_DETAIL.date}</span>
          </div>
          <div className={ax({ textStyle: 'caption', text: 'muted' })}>To: {MAIL_DETAIL.to}</div>
        </div>
        <div className={ax({ border: 'top' })} />
        <div className={ax({ textStyle: 'body', text: 'primary' })}>
          {paragraphs.map((line, i) => (
            <p key={i}>{line || '\\u00A0'}</p>
          ))}
        </div>
      </div>
      <div className={ax({ layout: 'bar', gap: 'sm', padding: 'sm', flex: 'none', border: 'top' })}>
        <ButtonToolbar
          data={actionToolbarData}
          onActivate={() => {}}
          aria-label="Mail actions"
        />
      </div>
    </div>
  )
}
`;export{e as default};