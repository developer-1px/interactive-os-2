// Phase 3 page — Low-fi grayscale wireframe.
// Uses FlatLayout + shared definePage (3-pane split). Grayscale filter at page root.

import { ax } from '@styles/ax'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import styles from './PageLow.module.css'
import { gmailMockupLayout } from './layout'
import {
  TopBarWireframe,
  SidebarWireframe,
  MailListWireframe,
  MailDetailWireframe,
} from './WireframeWidgets'

const registry = createWidgetRegistry({
  TopBar: TopBarWireframe,
  Sidebar: SidebarWireframe,
  MailList: MailListWireframe,
  MailDetail: MailDetailWireframe,
})

export default function PageLow() {
  return (
    <div className={`${styles.page} ${ax({ layout: 'fill' })}`} data-fidelity="low">
      <FlatLayout
        data={gmailMockupLayout}
        registry={registry}
        plugins={[]}
        onChange={() => {}}
        aria-label="Gmail mockup — low fidelity"
      />
    </div>
  )
}
