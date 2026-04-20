import { ax } from '@styles/ax'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { gmailMockupLayout } from './layout'
import {
  TopBarHifi,
  SidebarHifi,
  MailListHifi,
  MailDetailHifi,
} from './HifiWidgets'

const registry = createWidgetRegistry({
  TopBar: TopBarHifi,
  Sidebar: SidebarHifi,
  MailList: MailListHifi,
  MailDetail: MailDetailHifi,
})

export default function PageHi() {
  return (
    <div className={ax({ layout: 'fill' })} data-fidelity="hi">
      <FlatLayout
        data={gmailMockupLayout}
        registry={registry}
        plugins={[]}
        onChange={() => {}}
        aria-label="Gmail mockup — hi fidelity"
      />
    </div>
  )
}
