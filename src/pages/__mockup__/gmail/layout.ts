// Shared layout for Phase 3–5 of the gmail mockup.
// The split structure (topbar + 3-pane) is decided ONCE at Phase 3 and reused
// by Mid-fi and Hi-fi. Only the widget registry changes per fidelity.

import { defineLayout } from '@os/layout/flatLayout'

export const gmailMockupLayout = defineLayout({
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
