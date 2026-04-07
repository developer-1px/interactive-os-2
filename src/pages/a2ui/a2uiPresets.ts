// A2UI v0.9 preset samples — organized by spec category
import type { A2UIComponent } from '@os/ui/a2uiProtocol'

interface A2UIv09Envelope {
  version: string
  updateComponents: {
    surfaceId: string
    components: A2UIComponent[]
  }
  dataModel?: Record<string, unknown>
}

// ── Display ──

const text: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'text_1',
    components: [
      { id: 'root', component: 'Column', children: ['h1', 'h2', 'h3', 'h4', 'h5', 'body', 'caption'] },
      { id: 'h1', component: 'Text', text: 'Heading 1 — Hero', variant: 'h1' },
      { id: 'h2', component: 'Text', text: 'Heading 2 — Display', variant: 'h2' },
      { id: 'h3', component: 'Text', text: 'Heading 3 — Page', variant: 'h3' },
      { id: 'h4', component: 'Text', text: 'Heading 4 — Section', variant: 'h4' },
      { id: 'h5', component: 'Text', text: 'Heading 5 — Label', variant: 'h5' },
      { id: 'body', component: 'Text', text: 'Body text — The quick brown fox jumps over the lazy dog. This is the default variant for paragraph content.' },
      { id: 'caption', component: 'Text', text: 'Caption — secondary metadata text', variant: 'caption' },
    ],
  },
}

const image: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'image_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'row'] },
      { id: 'title', component: 'Text', text: 'Image Component', variant: 'h4' },
      { id: 'row', component: 'Row', children: ['img1', 'img2'] },
      { id: 'img1', component: 'Image', url: 'https://picsum.photos/seed/a2ui-1/400/300', alt: 'Random landscape' },
      { id: 'img2', component: 'Image', url: 'https://picsum.photos/seed/a2ui-2/400/300', alt: 'Random abstract' },
    ],
  },
}

const divider: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'divider_1',
    components: [
      { id: 'root', component: 'Column', children: ['above', 'div', 'below'] },
      { id: 'above', component: 'Text', text: 'Content above the divider', variant: 'body' },
      { id: 'div', component: 'Divider' },
      { id: 'below', component: 'Text', text: 'Content below the divider', variant: 'body' },
    ],
  },
}

// ── Layout ──

const rowColumn: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'layout_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'row1', 'row2'] },
      { id: 'title', component: 'Text', text: 'Row + Column Layout', variant: 'h4' },
      { id: 'row1', component: 'Row', children: ['col-a', 'col-b', 'col-c'] },
      { id: 'col-a', component: 'Column', children: ['a-title', 'a-body'] },
      { id: 'a-title', component: 'Text', text: 'Column A', variant: 'h5' },
      { id: 'a-body', component: 'Text', text: 'First column with stacked content' },
      { id: 'col-b', component: 'Column', children: ['b-title', 'b-body'] },
      { id: 'b-title', component: 'Text', text: 'Column B', variant: 'h5' },
      { id: 'b-body', component: 'Text', text: 'Second column with stacked content' },
      { id: 'col-c', component: 'Column', children: ['c-title', 'c-body'] },
      { id: 'c-title', component: 'Text', text: 'Column C', variant: 'h5' },
      { id: 'c-body', component: 'Text', text: 'Third column with stacked content' },
      { id: 'row2', component: 'Row', children: ['wide', 'narrow'] },
      { id: 'wide', component: 'Card', child: 'wide-text' },
      { id: 'wide-text', component: 'Text', text: 'Wide card' },
      { id: 'narrow', component: 'Card', child: 'narrow-text' },
      { id: 'narrow-text', component: 'Text', text: 'Narrow card' },
    ],
  },
}

const card: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'card_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'cards'] },
      { id: 'title', component: 'Text', text: 'Card Containers', variant: 'h4' },
      { id: 'cards', component: 'Row', children: ['c1', 'c2', 'c3'] },
      { id: 'c1', component: 'Card', child: 'c1-inner' },
      { id: 'c1-inner', component: 'Column', children: ['c1-title', 'c1-body', 'c1-btn'] },
      { id: 'c1-title', component: 'Text', text: 'Basic Card', variant: 'h5' },
      { id: 'c1-body', component: 'Text', text: 'A simple container with border and padding.' },
      { id: 'c1-btn', component: 'Button', label: 'Action' },
      { id: 'c2', component: 'Card', child: 'c2-inner' },
      { id: 'c2-inner', component: 'Column', children: ['c2-title', 'c2-list'] },
      { id: 'c2-title', component: 'Text', text: 'Card with List', variant: 'h5' },
      { id: 'c2-list', component: 'List', children: ['i1', 'i2', 'i3'], 'aria-label': 'Items' },
      { id: 'i1', component: 'Text', text: 'Item one', label: 'Item one' },
      { id: 'i2', component: 'Text', text: 'Item two', label: 'Item two' },
      { id: 'i3', component: 'Text', text: 'Item three', label: 'Item three' },
      { id: 'c3', component: 'Card', child: 'c3-inner' },
      { id: 'c3-inner', component: 'Column', children: ['c3-title', 'c3-field', 'c3-btn'] },
      { id: 'c3-title', component: 'Text', text: 'Card with Form', variant: 'h5' },
      { id: 'c3-field', component: 'TextField', label: 'Email', value: '' },
      { id: 'c3-btn', component: 'Button', label: 'Subscribe', variant: 'primary' },
    ],
  },
}

const modal: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'modal_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'modal'] },
      { id: 'title', component: 'Text', text: 'Modal (inline preview)', variant: 'h4' },
      { id: 'modal', component: 'Modal', contentChild: 'modal-content' },
      { id: 'modal-content', component: 'Column', children: ['modal-title', 'modal-body', 'modal-actions'] },
      { id: 'modal-title', component: 'Text', text: 'Confirm Action', variant: 'h4' },
      { id: 'modal-body', component: 'Text', text: 'Are you sure you want to proceed? This action cannot be undone.' },
      { id: 'modal-actions', component: 'Row', children: ['cancel-btn', 'confirm-btn'] },
      { id: 'cancel-btn', component: 'Button', label: 'Cancel' },
      { id: 'confirm-btn', component: 'Button', label: 'Confirm', variant: 'primary' },
    ],
  },
}

// ── Input ──

const textField: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'textfield_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'basic', 'prefilled', 'bound'] },
      { id: 'title', component: 'Text', text: 'TextField Variants', variant: 'h4' },
      { id: 'basic', component: 'TextField', label: 'Empty field', value: '' },
      { id: 'prefilled', component: 'TextField', label: 'Pre-filled', value: 'Hello A2UI' },
      { id: 'bound', component: 'TextField', label: 'Data-bound', value: { path: '/form/name' } },
    ],
  },
  dataModel: { form: { name: 'Alice Kim' } },
}

const checkbox: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'checkbox_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'c1', 'c2', 'c3'] },
      { id: 'title', component: 'Text', text: 'CheckBox', variant: 'h4' },
      { id: 'c1', component: 'CheckBox', label: 'Enable notifications' },
      { id: 'c2', component: 'CheckBox', label: 'Dark mode' },
      { id: 'c3', component: 'CheckBox', label: 'Auto-save drafts' },
    ],
  },
}

const slider: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'slider_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 's1', 's2', 's3'] },
      { id: 'title', component: 'Text', text: 'Slider', variant: 'h4' },
      { id: 's1', component: 'Slider', label: 'Volume', minValue: 0, maxValue: 100, step: 1, value: 75 },
      { id: 's2', component: 'Slider', label: 'Brightness', minValue: 0, maxValue: 100, step: 5, value: 50 },
      { id: 's3', component: 'Slider', label: 'Priority (1-5)', minValue: 1, maxValue: 5, step: 1, value: 3 },
    ],
  },
}

const dateTimeInput: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'datetime_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'd1', 'd2'] },
      { id: 'title', component: 'Text', text: 'DateTimeInput', variant: 'h4' },
      { id: 'd1', component: 'DateTimeInput', label: 'Start Date' },
      { id: 'd2', component: 'DateTimeInput', label: 'End Date' },
    ],
  },
}

// ── Selection ──

const list: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'list_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'desc', 'list'] },
      { id: 'title', component: 'Text', text: 'List (keyboard: ↑↓ navigate, Space select)', variant: 'h4' },
      { id: 'desc', component: 'Text', text: 'Click an item then use arrow keys to navigate.', variant: 'caption' },
      { id: 'list', component: 'List', children: ['l1', 'l2', 'l3', 'l4', 'l5'], 'aria-label': 'Frameworks' },
      { id: 'l1', component: 'Text', text: 'React', label: 'React' },
      { id: 'l2', component: 'Text', text: 'Vue', label: 'Vue' },
      { id: 'l3', component: 'Text', text: 'Svelte', label: 'Svelte' },
      { id: 'l4', component: 'Text', text: 'Solid', label: 'Solid' },
      { id: 'l5', component: 'Text', text: 'Angular', label: 'Angular' },
    ],
  },
}

const tabs: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'tabs_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'desc', 'tabs'] },
      { id: 'title', component: 'Text', text: 'Tabs (keyboard: ←→ switch tabs)', variant: 'h4' },
      { id: 'desc', component: 'Text', text: 'Click a tab then use arrow keys to navigate.', variant: 'caption' },
      { id: 'tabs', component: 'Tabs', 'aria-label': 'Sections', tabItems: [
        { title: 'Overview', child: 'p-overview' },
        { title: 'Features', child: 'p-features' },
        { title: 'Pricing', child: 'p-pricing' },
      ] },
      { id: 'p-overview', component: 'Text', text: 'A2UI is a declarative protocol for agent-driven interfaces. AI agents generate JSON, clients render native interactive UI.' },
      { id: 'p-features', component: 'Column', children: ['f1', 'f2', 'f3'] },
      { id: 'f1', component: 'Text', text: '15 built-in components' },
      { id: 'f2', component: 'Text', text: 'Full keyboard/ARIA accessibility' },
      { id: 'f3', component: 'Text', text: 'Streaming progressive render' },
      { id: 'p-pricing', component: 'Column', children: ['price-title', 'price-body'] },
      { id: 'price-title', component: 'Text', text: 'Free & Open Source', variant: 'h3' },
      { id: 'price-body', component: 'Text', text: 'Apache 2.0 License' },
    ],
  },
}

const choicePicker: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'choice_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'cp1', 'div', 'cp2'] },
      { id: 'title', component: 'Text', text: 'ChoicePicker (RadioGroup)', variant: 'h4' },
      { id: 'cp1', component: 'ChoicePicker', label: 'Deploy Target', options: [
        { id: 'vercel', label: 'Vercel' },
        { id: 'aws', label: 'AWS' },
        { id: 'gcp', label: 'Google Cloud' },
        { id: 'self', label: 'Self-hosted' },
      ] },
      { id: 'div', component: 'Divider' },
      { id: 'cp2', component: 'ChoicePicker', label: 'Theme', options: [
        { id: 'light', label: 'Light' },
        { id: 'dark', label: 'Dark' },
        { id: 'system', label: 'System' },
      ] },
    ],
  },
}

// ── Action ──

const button: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'button_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'row1', 'row2'] },
      { id: 'title', component: 'Text', text: 'Button Variants', variant: 'h4' },
      { id: 'row1', component: 'Row', children: ['b1', 'b2'] },
      { id: 'b1', component: 'Button', label: 'Primary Action', variant: 'primary' },
      { id: 'b2', component: 'Button', label: 'Ghost Action' },
      { id: 'row2', component: 'Row', children: ['b3', 'b4', 'b5'] },
      { id: 'b3', component: 'Button', label: 'Save' },
      { id: 'b4', component: 'Button', label: 'Cancel' },
      { id: 'b5', component: 'Button', label: 'Delete', variant: 'primary' },
    ],
  },
}

// ── Data Binding ──

const dataBinding: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'binding_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'desc', 'card'] },
      { id: 'title', component: 'Text', text: 'Data Binding (JSON Pointer)', variant: 'h4' },
      { id: 'desc', component: 'Text', text: 'Values resolved from dataModel via {path: "/..."}', variant: 'caption' },
      { id: 'card', component: 'Card', child: 'card-inner' },
      { id: 'card-inner', component: 'Column', children: ['greeting', 'role', 'div', 'status', 'div2', 'input'] },
      { id: 'greeting', component: 'Text', text: { path: '/user/name' }, variant: 'h3' },
      { id: 'role', component: 'Text', text: { path: '/user/role' } },
      { id: 'div', component: 'Divider' },
      { id: 'status', component: 'Text', text: { path: '/user/status' }, variant: 'caption' },
      { id: 'div2', component: 'Divider' },
      { id: 'input', component: 'TextField', label: 'Edit name', value: { path: '/user/name' } },
    ],
  },
  dataModel: {
    user: {
      name: 'Alice Kim',
      role: 'Senior Engineer — Platform Team',
      status: 'Online — last active 2 minutes ago',
    },
  },
}

// ── Composite Scenarios ──

const projectDashboard: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'dashboard_1',
    components: [
      { id: 'root', component: 'Column', children: ['header', 'stats', 'main-row'] },
      // Header
      { id: 'header', component: 'Row', children: ['title-col', 'header-actions'] },
      { id: 'title-col', component: 'Column', children: ['title', 'subtitle'] },
      { id: 'title', component: 'Text', text: { path: '/project/name' }, variant: 'h3' },
      { id: 'subtitle', component: 'Text', text: { path: '/project/description' }, variant: 'caption' },
      { id: 'header-actions', component: 'Row', children: ['filter-env', 'refresh-btn'] },
      { id: 'filter-env', component: 'ChoicePicker', label: 'Environment', options: [
        { id: 'prod', label: 'Production' },
        { id: 'staging', label: 'Staging' },
        { id: 'dev', label: 'Development' },
      ] },
      { id: 'refresh-btn', component: 'Button', label: 'Refresh' },
      // KPI stats
      { id: 'stats', component: 'Row', children: ['stat1', 'stat2', 'stat3', 'stat4'] },
      { id: 'stat1', component: 'Card', child: 's1' },
      { id: 's1', component: 'Column', children: ['s1-val', 's1-label'] },
      { id: 's1-val', component: 'Text', text: '2,847', variant: 'h2' },
      { id: 's1-label', component: 'Text', text: 'Active Users', variant: 'caption' },
      { id: 'stat2', component: 'Card', child: 's2' },
      { id: 's2', component: 'Column', children: ['s2-val', 's2-label'] },
      { id: 's2-val', component: 'Text', text: '142ms', variant: 'h2' },
      { id: 's2-label', component: 'Text', text: 'Avg Response', variant: 'caption' },
      { id: 'stat3', component: 'Card', child: 's3' },
      { id: 's3', component: 'Column', children: ['s3-val', 's3-label'] },
      { id: 's3-val', component: 'Text', text: '99.97%', variant: 'h2' },
      { id: 's3-label', component: 'Text', text: 'Uptime', variant: 'caption' },
      { id: 'stat4', component: 'Card', child: 's4' },
      { id: 's4', component: 'Column', children: ['s4-val', 's4-label'] },
      { id: 's4-val', component: 'Text', text: '0', variant: 'h2' },
      { id: 's4-label', component: 'Text', text: 'Open Incidents', variant: 'caption' },
      // Main content: traffic chart + recent activity
      { id: 'main-row', component: 'Row', children: ['chart-card', 'activity-card'] },
      { id: 'chart-card', component: 'Card', child: 'chart-inner' },
      { id: 'chart-inner', component: 'Column', children: ['chart-title', 'chart-sparkline', 'chart-range'] },
      { id: 'chart-title', component: 'Text', text: 'Traffic (last 24h)', variant: 'h5' },
      { id: 'chart-sparkline', component: 'Text', text: '▁▂▃▅▇▆▅▃▂▃▅▇█▇▅▃▂▁▂▃▅▆▇▅▃▂▄▆▇█▇▅▃▁▂▃▅▇', variant: 'h3' },
      { id: 'chart-range', component: 'Slider', label: 'Time range (hours)', minValue: 1, maxValue: 72, step: 1, value: 24 },
      { id: 'activity-card', component: 'Card', child: 'activity-inner' },
      { id: 'activity-inner', component: 'Column', children: ['activity-title', 'activity-list'] },
      { id: 'activity-title', component: 'Text', text: 'Recent Activity', variant: 'h5' },
      { id: 'activity-list', component: 'List', children: ['a1', 'a2', 'a3', 'a4', 'a5'], 'aria-label': 'Activity' },
      { id: 'a1', component: 'Text', text: 'Deploy v2.4.1 to production', label: 'Deploy v2.4.1 to production' },
      { id: 'a2', component: 'Text', text: 'Database migration completed', label: 'Database migration completed' },
      { id: 'a3', component: 'Text', text: 'SSL certificate renewed', label: 'SSL certificate renewed' },
      { id: 'a4', component: 'Text', text: 'Cache invalidation triggered', label: 'Cache invalidation triggered' },
      { id: 'a5', component: 'Text', text: 'Auto-scaling event: 3→5 instances', label: 'Auto-scaling event' },
    ],
  },
  dataModel: {
    project: {
      name: 'interactive-os',
      description: 'Production environment — Seoul region (ap-northeast-2)',
    },
  },
}

const onboardingWizard: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'onboarding_1',
    components: [
      { id: 'root', component: 'Column', children: ['header', 'tabs'] },
      { id: 'header', component: 'Column', children: ['title', 'desc'] },
      { id: 'title', component: 'Text', text: 'Create Your Workspace', variant: 'h3' },
      { id: 'desc', component: 'Text', text: 'Set up your team workspace in 3 steps', variant: 'caption' },
      { id: 'tabs', component: 'Tabs', 'aria-label': 'Setup steps', tabItems: [
        { title: '1. Profile', child: 'step-profile' },
        { title: '2. Team', child: 'step-team' },
        { title: '3. Preferences', child: 'step-prefs' },
      ] },
      // Step 1: Profile
      { id: 'step-profile', component: 'Card', child: 'profile-form' },
      { id: 'profile-form', component: 'Column', children: ['pf-row', 'pf-email', 'pf-role', 'pf-bio', 'pf-next'] },
      { id: 'pf-row', component: 'Row', children: ['pf-first', 'pf-last'] },
      { id: 'pf-first', component: 'TextField', label: 'First Name', value: { path: '/user/firstName' } },
      { id: 'pf-last', component: 'TextField', label: 'Last Name', value: { path: '/user/lastName' } },
      { id: 'pf-email', component: 'TextField', label: 'Work Email', value: { path: '/user/email' } },
      { id: 'pf-role', component: 'ChoicePicker', label: 'Role', options: [
        { id: 'eng', label: 'Engineer' },
        { id: 'design', label: 'Designer' },
        { id: 'pm', label: 'Product Manager' },
        { id: 'other', label: 'Other' },
      ] },
      { id: 'pf-bio', component: 'TextField', label: 'Short bio', value: '' },
      { id: 'pf-next', component: 'Button', label: 'Continue to Team Setup', variant: 'primary' },
      // Step 2: Team
      { id: 'step-team', component: 'Card', child: 'team-form' },
      { id: 'team-form', component: 'Column', children: ['tf-name', 'tf-size', 'tf-invite', 'tf-div', 'tf-members', 'tf-next'] },
      { id: 'tf-name', component: 'TextField', label: 'Team Name', value: 'My Team' },
      { id: 'tf-size', component: 'Slider', label: 'Expected team size', minValue: 1, maxValue: 50, step: 1, value: 5 },
      { id: 'tf-invite', component: 'TextField', label: 'Invite by email (comma-separated)', value: '' },
      { id: 'tf-div', component: 'Divider' },
      { id: 'tf-members', component: 'List', children: ['m1', 'm2', 'm3'], 'aria-label': 'Pending invites' },
      { id: 'm1', component: 'Text', text: 'bob@company.com — Engineer', label: 'bob@company.com' },
      { id: 'm2', component: 'Text', text: 'carol@company.com — Designer', label: 'carol@company.com' },
      { id: 'm3', component: 'Text', text: 'dave@company.com — PM', label: 'dave@company.com' },
      { id: 'tf-next', component: 'Button', label: 'Continue to Preferences', variant: 'primary' },
      // Step 3: Preferences
      { id: 'step-prefs', component: 'Card', child: 'prefs-form' },
      { id: 'prefs-form', component: 'Column', children: ['pr-theme', 'pr-lang', 'pr-div', 'pr-notif', 'pr-auto', 'pr-done'] },
      { id: 'pr-theme', component: 'ChoicePicker', label: 'Theme', options: [
        { id: 'light', label: 'Light' },
        { id: 'dark', label: 'Dark' },
        { id: 'system', label: 'System' },
      ] },
      { id: 'pr-lang', component: 'ChoicePicker', label: 'Language', options: [
        { id: 'en', label: 'English' },
        { id: 'ko', label: 'Korean' },
        { id: 'ja', label: 'Japanese' },
      ] },
      { id: 'pr-div', component: 'Divider' },
      { id: 'pr-notif', component: 'CheckBox', label: 'Enable email notifications' },
      { id: 'pr-auto', component: 'CheckBox', label: 'Enable auto-save' },
      { id: 'pr-done', component: 'Button', label: 'Create Workspace', variant: 'primary' },
    ],
  },
  dataModel: {
    user: {
      firstName: 'Alice',
      lastName: 'Kim',
      email: 'alice@company.com',
    },
  },
}

const bookingFlow: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'booking_1',
    components: [
      { id: 'root', component: 'Column', children: ['header', 'main-row'] },
      { id: 'header', component: 'Text', text: 'Book a Meeting Room', variant: 'h3' },
      // Left: form, Right: summary card
      { id: 'main-row', component: 'Row', children: ['form-col', 'summary-card'] },
      // Form
      { id: 'form-col', component: 'Column', children: ['room-list', 'div1', 'date-row', 'attendees', 'div2', 'options'] },
      { id: 'room-list', component: 'List', children: ['r1', 'r2', 'r3', 'r4'], 'aria-label': 'Available rooms' },
      { id: 'r1', component: 'Text', text: 'Falcon — 4F, 8 seats, display + whiteboard', label: 'Falcon' },
      { id: 'r2', component: 'Text', text: 'Eagle — 4F, 12 seats, video conferencing', label: 'Eagle' },
      { id: 'r3', component: 'Text', text: 'Sparrow — 3F, 4 seats, standing desk', label: 'Sparrow' },
      { id: 'r4', component: 'Text', text: 'Condor — 5F, 20 seats, auditorium', label: 'Condor' },
      { id: 'div1', component: 'Divider' },
      { id: 'date-row', component: 'Row', children: ['date-start', 'date-end'] },
      { id: 'date-start', component: 'DateTimeInput', label: 'Start' },
      { id: 'date-end', component: 'DateTimeInput', label: 'End' },
      { id: 'attendees', component: 'TextField', label: 'Attendees (email)', value: '' },
      { id: 'div2', component: 'Divider' },
      { id: 'options', component: 'Column', children: ['opt-catering', 'opt-record', 'opt-priority'] },
      { id: 'opt-catering', component: 'CheckBox', label: 'Catering service' },
      { id: 'opt-record', component: 'CheckBox', label: 'Record meeting' },
      { id: 'opt-priority', component: 'Slider', label: 'Priority level', minValue: 1, maxValue: 5, step: 1, value: 3 },
      // Summary
      { id: 'summary-card', component: 'Card', child: 'summary-inner' },
      { id: 'summary-inner', component: 'Column', children: ['sum-title', 'sum-room', 'sum-time', 'sum-host', 'sum-div', 'sum-recurrence', 'sum-actions'] },
      { id: 'sum-title', component: 'Text', text: 'Booking Summary', variant: 'h4' },
      { id: 'sum-room', component: 'Text', text: { path: '/booking/room' }, variant: 'h5' },
      { id: 'sum-time', component: 'Text', text: { path: '/booking/time' }, variant: 'caption' },
      { id: 'sum-host', component: 'Text', text: { path: '/booking/host' } },
      { id: 'sum-div', component: 'Divider' },
      { id: 'sum-recurrence', component: 'ChoicePicker', label: 'Repeat', options: [
        { id: 'once', label: 'One-time' },
        { id: 'weekly', label: 'Weekly' },
        { id: 'biweekly', label: 'Bi-weekly' },
        { id: 'monthly', label: 'Monthly' },
      ] },
      { id: 'sum-actions', component: 'Row', children: ['cancel-btn', 'book-btn'] },
      { id: 'cancel-btn', component: 'Button', label: 'Cancel' },
      { id: 'book-btn', component: 'Button', label: 'Confirm Booking', variant: 'primary' },
    ],
  },
  dataModel: {
    booking: {
      room: 'Eagle — 4F',
      time: 'Today 2:00 PM – 3:30 PM',
      host: 'Hosted by Alice Kim',
    },
  },
}

const incidentResponse: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'incident_1',
    components: [
      { id: 'root', component: 'Column', children: ['header-row', 'body-row'] },
      // Header
      { id: 'header-row', component: 'Row', children: ['header-info', 'header-actions'] },
      { id: 'header-info', component: 'Column', children: ['inc-title', 'inc-meta'] },
      { id: 'inc-title', component: 'Text', text: 'INC-2847: API Gateway 5xx Spike', variant: 'h3' },
      { id: 'inc-meta', component: 'Text', text: 'Severity: P1 — Started 14:23 UTC — Duration: 47 min', variant: 'caption' },
      { id: 'header-actions', component: 'Row', children: ['ack-btn', 'escalate-btn'] },
      { id: 'ack-btn', component: 'Button', label: 'Acknowledge', variant: 'primary' },
      { id: 'escalate-btn', component: 'Button', label: 'Escalate' },
      // Body: timeline + actions panel
      { id: 'body-row', component: 'Row', children: ['timeline-card', 'actions-card'] },
      // Timeline
      { id: 'timeline-card', component: 'Card', child: 'timeline-inner' },
      { id: 'timeline-inner', component: 'Column', children: ['tl-title', 'tl-list', 'tl-note'] },
      { id: 'tl-title', component: 'Text', text: 'Timeline', variant: 'h5' },
      { id: 'tl-list', component: 'List', children: ['ev1', 'ev2', 'ev3', 'ev4', 'ev5', 'ev6'], 'aria-label': 'Incident timeline' },
      { id: 'ev1', component: 'Text', text: '14:23 — Alert triggered: 5xx rate > 5%', label: '14:23 Alert triggered' },
      { id: 'ev2', component: 'Text', text: '14:25 — PagerDuty notified on-call (Alice Kim)', label: '14:25 PagerDuty notified' },
      { id: 'ev3', component: 'Text', text: '14:28 — Alice acknowledged', label: '14:28 Acknowledged' },
      { id: 'ev4', component: 'Text', text: '14:35 — Root cause: connection pool exhaustion', label: '14:35 Root cause identified' },
      { id: 'ev5', component: 'Text', text: '14:42 — Hotfix deployed: pool size 50 → 200', label: '14:42 Hotfix deployed' },
      { id: 'ev6', component: 'Text', text: '15:10 — 5xx rate back to < 0.1%', label: '15:10 Recovered' },
      { id: 'tl-note', component: 'TextField', label: 'Add timeline note', value: '' },
      // Actions panel
      { id: 'actions-card', component: 'Card', child: 'actions-inner' },
      { id: 'actions-inner', component: 'Column', children: ['act-title', 'act-status', 'act-div1', 'act-assign', 'act-severity', 'act-div2', 'act-checks', 'act-resolve'] },
      { id: 'act-title', component: 'Text', text: 'Incident Actions', variant: 'h5' },
      { id: 'act-status', component: 'ChoicePicker', label: 'Status', options: [
        { id: 'investigating', label: 'Investigating' },
        { id: 'identified', label: 'Identified' },
        { id: 'monitoring', label: 'Monitoring' },
        { id: 'resolved', label: 'Resolved' },
      ] },
      { id: 'act-div1', component: 'Divider' },
      { id: 'act-assign', component: 'TextField', label: 'Assign to', value: 'alice@company.com' },
      { id: 'act-severity', component: 'Slider', label: 'Severity (1=P1, 4=P4)', minValue: 1, maxValue: 4, step: 1, value: 1 },
      { id: 'act-div2', component: 'Divider' },
      { id: 'act-checks', component: 'Column', children: ['chk1', 'chk2', 'chk3', 'chk4'] },
      { id: 'chk1', component: 'CheckBox', label: 'Customer communication sent' },
      { id: 'chk2', component: 'CheckBox', label: 'Runbook followed' },
      { id: 'chk3', component: 'CheckBox', label: 'Post-mortem scheduled' },
      { id: 'chk4', component: 'CheckBox', label: 'Monitoring updated' },
      { id: 'act-resolve', component: 'Button', label: 'Resolve Incident', variant: 'primary' },
    ],
  },
}

// ── v0.9 Advanced Features ──

const childListTemplate: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'template_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'desc', 'user-list'] },
      { id: 'title', component: 'Text', text: 'ChildList Template (for-each)', variant: 'h4' },
      { id: 'desc', component: 'Text', text: 'List items generated from dataModel array via {path, componentId} template', variant: 'caption' },
      { id: 'user-list', component: 'List', children: { path: '/users', componentId: 'user-item' }, 'aria-label': 'Team members' },
      { id: 'user-item', component: 'Text', text: { path: 'name' }, label: { path: 'name' } },
    ],
  },
  dataModel: {
    users: [
      { name: 'Alice Kim — Engineer' },
      { name: 'Bob Park — Designer' },
      { name: 'Carol Lee — PM' },
      { name: 'Dave Choi — DevOps' },
      { name: 'Eve Jung — Data Scientist' },
    ],
  },
}

const actionSystem: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'action_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'desc', 'actions-row', 'div', 'form-card'] },
      { id: 'title', component: 'Text', text: 'Action System', variant: 'h4' },
      { id: 'desc', component: 'Text', text: 'Buttons dispatch action events with name + context. Check console for events.', variant: 'caption' },
      { id: 'actions-row', component: 'Row', children: ['save-btn', 'delete-btn', 'export-btn'] },
      { id: 'save-btn', component: 'Button', label: 'Save', variant: 'primary', action: { event: { name: 'save', context: { target: 'document' } } } },
      { id: 'delete-btn', component: 'Button', label: 'Delete', action: { event: { name: 'delete', context: { confirm: true } } } },
      { id: 'export-btn', component: 'Button', label: 'Open Docs', action: { functionCall: { call: 'openUrl', args: { url: 'https://a2ui.org' } } } },
      { id: 'div', component: 'Divider' },
      { id: 'form-card', component: 'Card', child: 'form-inner' },
      { id: 'form-inner', component: 'Column', children: ['form-title', 'form-name', 'form-submit'] },
      { id: 'form-title', component: 'Text', text: 'Form with Action', variant: 'h5' },
      { id: 'form-name', component: 'TextField', label: 'Project name', value: { path: '/project/name' } },
      { id: 'form-submit', component: 'Button', label: 'Submit', variant: 'primary', action: { event: { name: 'submit_form', context: { formId: 'project-settings' } } } },
    ],
  },
  dataModel: {
    project: { name: 'interactive-os' },
  },
}

const multiSelectShowcase: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'multiselect_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'row'] },
      { id: 'title', component: 'Text', text: 'ChoicePicker Variants', variant: 'h4' },
      { id: 'row', component: 'Row', children: ['single-card', 'multi-card'] },
      { id: 'single-card', component: 'Card', child: 'single-inner' },
      { id: 'single-inner', component: 'Column', children: ['single-title', 'single-picker'] },
      { id: 'single-title', component: 'Text', text: 'mutuallyExclusive (Radio)', variant: 'h5' },
      { id: 'single-picker', component: 'ChoicePicker', label: 'Priority', variant: 'mutuallyExclusive', options: [
        { id: 'low', label: 'Low' },
        { id: 'med', label: 'Medium' },
        { id: 'high', label: 'High' },
        { id: 'critical', label: 'Critical' },
      ] },
      { id: 'multi-card', component: 'Card', child: 'multi-inner' },
      { id: 'multi-inner', component: 'Column', children: ['multi-title', 'multi-picker'] },
      { id: 'multi-title', component: 'Text', text: 'multiSelect (Checkbox)', variant: 'h5' },
      { id: 'multi-picker', component: 'ChoicePicker', label: 'Features', variant: 'multiSelect', options: [
        { id: 'keyboard', label: 'Keyboard navigation' },
        { id: 'aria', label: 'ARIA attributes' },
        { id: 'streaming', label: 'Streaming render' },
        { id: 'binding', label: 'Data binding' },
      ] },
    ],
  },
}

const mediaComponents: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'media_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'row1', 'div', 'row2'] },
      { id: 'title', component: 'Text', text: 'Media Components', variant: 'h4' },
      { id: 'row1', component: 'Row', children: ['icon-card', 'image-card'] },
      { id: 'icon-card', component: 'Card', child: 'icon-inner' },
      { id: 'icon-inner', component: 'Column', children: ['icon-title', 'icon-row'] },
      { id: 'icon-title', component: 'Text', text: 'Icon', variant: 'h5' },
      { id: 'icon-row', component: 'Row', children: ['i1', 'i2', 'i3', 'i4'] },
      { id: 'i1', component: 'Icon', name: 'home' },
      { id: 'i2', component: 'Icon', name: 'settings' },
      { id: 'i3', component: 'Icon', name: 'search' },
      { id: 'i4', component: 'Icon', name: 'notifications' },
      { id: 'image-card', component: 'Card', child: 'image-inner' },
      { id: 'image-inner', component: 'Column', children: ['image-title', 'image-1'] },
      { id: 'image-title', component: 'Text', text: 'Image', variant: 'h5' },
      { id: 'image-1', component: 'Image', url: 'https://picsum.photos/seed/a2ui-media/400/200', alt: 'Sample' },
      { id: 'div', component: 'Divider' },
      { id: 'row2', component: 'Row', children: ['video-card', 'audio-card'] },
      { id: 'video-card', component: 'Card', child: 'video-inner' },
      { id: 'video-inner', component: 'Column', children: ['video-title', 'video-1'] },
      { id: 'video-title', component: 'Text', text: 'Video', variant: 'h5' },
      { id: 'video-1', component: 'Video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
      { id: 'audio-card', component: 'Card', child: 'audio-inner' },
      { id: 'audio-inner', component: 'Column', children: ['audio-title', 'audio-1'] },
      { id: 'audio-title', component: 'Text', text: 'AudioPlayer', variant: 'h5' },
      { id: 'audio-1', component: 'AudioPlayer', url: 'https://www.w3schools.com/html/horse.mp3' },
    ],
  },
}

const layoutAdvanced: A2UIv09Envelope = {
  version: 'v0.9',
  updateComponents: {
    surfaceId: 'layout_adv_1',
    components: [
      { id: 'root', component: 'Column', children: ['title', 'justify-section', 'div1', 'text-variant', 'div2', 'divider-axis'] },
      { id: 'title', component: 'Text', text: 'Advanced Props', variant: 'h4' },
      // Row justify
      { id: 'justify-section', component: 'Column', children: ['j-title', 'j-start', 'j-end', 'j-between'] },
      { id: 'j-title', component: 'Text', text: 'Row justify', variant: 'h5' },
      { id: 'j-start', component: 'Row', children: ['j-s1', 'j-s2'], justify: 'start' },
      { id: 'j-s1', component: 'Button', label: 'Start A' },
      { id: 'j-s2', component: 'Button', label: 'Start B' },
      { id: 'j-end', component: 'Row', children: ['j-e1', 'j-e2'], justify: 'end' },
      { id: 'j-e1', component: 'Button', label: 'End A' },
      { id: 'j-e2', component: 'Button', label: 'End B' },
      { id: 'j-between', component: 'Row', children: ['j-b1', 'j-b2'], justify: 'spaceBetween' },
      { id: 'j-b1', component: 'Button', label: 'Between A' },
      { id: 'j-b2', component: 'Button', label: 'Between B' },
      { id: 'div1', component: 'Divider' },
      // TextField longText
      { id: 'text-variant', component: 'Column', children: ['tv-title', 'tv-short', 'tv-long'] },
      { id: 'tv-title', component: 'Text', text: 'TextField variant', variant: 'h5' },
      { id: 'tv-short', component: 'TextField', label: 'shortText (default)', value: 'Single line', variant: 'shortText' },
      { id: 'tv-long', component: 'TextField', label: 'longText (textarea)', value: 'Multi-line text area\nfor longer content\nlike descriptions or notes', variant: 'longText' },
      { id: 'div2', component: 'Divider' },
      // Divider axis
      { id: 'divider-axis', component: 'Column', children: ['da-title', 'da-row'] },
      { id: 'da-title', component: 'Text', text: 'Divider axis', variant: 'h5' },
      { id: 'da-row', component: 'Row', children: ['da-left', 'da-vert', 'da-right'] },
      { id: 'da-left', component: 'Text', text: 'Left of vertical divider' },
      { id: 'da-vert', component: 'Divider', axis: 'vertical' },
      { id: 'da-right', component: 'Text', text: 'Right of vertical divider' },
    ],
  },
}

// ── Export: tab categories ──

export interface PresetCategory {
  label: string
  presets: Record<string, A2UIv09Envelope>
}

export type { A2UIv09Envelope }

export const categories: PresetCategory[] = [
  {
    label: 'Composite',
    presets: { Dashboard: projectDashboard, Onboarding: onboardingWizard, Booking: bookingFlow, Incident: incidentResponse },
  },
  {
    label: 'v0.9 Features',
    presets: {
      'ChildList Template': childListTemplate,
      'Action System': actionSystem,
      MultiSelect: multiSelectShowcase,
      Media: mediaComponents,
      'Advanced Props': layoutAdvanced,
    },
  },
  {
    label: 'Display',
    presets: { Text: text, Image: image, Divider: divider },
  },
  {
    label: 'Layout',
    presets: { 'Row + Column': rowColumn, Card: card, Modal: modal },
  },
  {
    label: 'Input',
    presets: { TextField: textField, CheckBox: checkbox, Slider: slider, DateTimeInput: dateTimeInput },
  },
  {
    label: 'Selection',
    presets: { List: list, Tabs: tabs, ChoicePicker: choicePicker },
  },
  {
    label: 'Action',
    presets: { Button: button },
  },
  {
    label: 'Data',
    presets: { 'Data Binding': dataBinding },
  },
]
