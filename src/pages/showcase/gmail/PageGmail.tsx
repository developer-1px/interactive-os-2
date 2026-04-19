import { FlatLayout } from '@os/ui/FlatLayout'
import { defineLayout } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import {
  TopBarWidget,
  SidebarWidget,
  MailListWidget,
  MailDetailWidget,
} from './gmailWidgets'

// ── Registry ──

const registry = createWidgetRegistry({
  TopBar: TopBarWidget,
  Sidebar: SidebarWidget,
  MailList: MailListWidget,
  MailDetail: MailDetailWidget,
})

// ── Layout ──

const gmailLayout = defineLayout({
  entities: {
    root: {
      data: { type: 'split', direction: 'vertical', sizes: [0.06, 'flex'], resizable: false },
      children: ['topbar', 'workspace'],
    },
    topbar: { data: { type: 'widget', widget: 'TopBar' } },
    workspace: {
      data: { type: 'split', direction: 'horizontal', sizes: [0.18, 0.35, 'flex'], resizable: true },
      children: ['sidebar', 'mail-list', 'mail-detail'],
    },
    sidebar: { data: { type: 'widget', widget: 'Sidebar' } },
    'mail-list': { data: { type: 'widget', widget: 'MailList' } },
    'mail-detail': { data: { type: 'widget', widget: 'MailDetail' } },
  },
})

// ── Page ──

export default function PageGmail() {
  return (
    <FlatLayout
      data={gmailLayout}
      registry={registry}
      plugins={[]}
      onChange={() => {}}
      aria-label="Gmail showcase"
    />
  )
}
