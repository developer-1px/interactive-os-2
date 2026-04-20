import { ax } from '@styles/ax'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { gmailMockupLayout } from './layout'
import {
  TopBarMidfi,
  SidebarMidfi,
  MailListMidfi,
  MailDetailMidfi,
} from './MidfiWidgets'

const registry = createWidgetRegistry({
  TopBar: TopBarMidfi,
  Sidebar: SidebarMidfi,
  MailList: MailListMidfi,
  MailDetail: MailDetailMidfi,
})

export default function PageMid() {
  return (
    <div className={ax({ layout: 'fill' })} data-fidelity="mid">
      <FlatLayout
        data={gmailMockupLayout}
        registry={registry}
        plugins={[]}
        onChange={() => {}}
        aria-label="Gmail mockup — mid fidelity"
      />
    </div>
  )
}
