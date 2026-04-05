import React from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import './PageThemeCreator.css'
import { Divider } from '@os/ui/Divider'
import { Button } from '@os/ui/Button'
import { TextInput } from '@os/ui/TextInput'
import { SwitchGroup } from '@os/ui/SwitchGroup'
import { RadioGroup } from '@os/ui/RadioGroup'
import { TabList } from '@os/ui/TabList'
import { createStore } from '@os/store/createStore'

/* ══ helpers ══ */

function makeStore(items: Record<string, string>) {
  const entities: Record<string, { id: string; data: { label: string } }> = {}
  const rootIds: string[] = []
  for (const [id, label] of Object.entries(items)) {
    entities[id] = { id, data: { label } }
    rootIds.push(id)
  }
  return createStore({ entities, relationships: { __root__: rootIds } })
}

/* ══ Section Card ══ */

function Section({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`${ax({ surface: 'display', layout: 'column', gap: 'sm', padding: 'md', shape: 'lg' })}${className ? ` ${className}` : ''}`}>
      {title && <h3 className={ax({ textStyle: 'overline', text: 'muted' })}>{title}</h3>}
      {children}
    </div>
  )
}

/* ══ 1. Dashboard Scenario ══ */

function DashboardScenario() {
  const stats = [
    { label: 'Total Revenue', value: '$45,231.89', change: '+20.1%', tone: 'success' as const },
    { label: 'Subscriptions', value: '+2,350', change: '+180.1%', tone: 'success' as const },
    { label: 'Active Now', value: '+573', change: '+19%', tone: 'accent' as const },
    { label: 'Bounce Rate', value: '24.3%', change: '-4.5%', tone: 'danger' as const },
  ]
  const transactions = [
    { name: 'Olivia Martin', email: 'olivia@email.com', amount: '+$1,999.00' },
    { name: 'Jackson Lee', email: 'jackson@email.com', amount: '+$39.00' },
    { name: 'Isabella Nguyen', email: 'isabella@email.com', amount: '+$299.00' },
    { name: 'William Kim', email: 'will@email.com', amount: '+$99.00' },
    { name: 'Sofia Davis', email: 'sofia@email.com', amount: '+$39.00' },
  ]

  return (
    <div className={ax({ layout: 'column', gap: 'lg' })}>
      <div className={ax({ layout: 'spread' })}>
        <div className={ax({ layout: 'column', gap: 'xs' })}>
          <h2 className={ax({ textStyle: 'page', text: 'primary' })}>Dashboard</h2>
          <span className={ax({ textStyle: 'body', text: 'muted' })}>Your business at a glance.</span>
        </div>
        <Button variant="accent">Download Report</Button>
      </div>

      {/* Stats row */}
      <div className={ax({ layout: 'row', gap: 'md' })}>
        {stats.map(s => (
          <Section key={s.label} className={ax({ flex: '1' })}>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>{s.label}</span>
            <span className={ax({ textStyle: 'display', text: 'primary' })}>{s.value}</span>
            <span className={ax({ textStyle: 'caption', text: s.tone === 'danger' ? 'muted' : 'secondary' })}>{s.change} from last month</span>
          </Section>
        ))}
      </div>

      {/* Transactions */}
      <Section title="RECENT TRANSACTIONS">
        <div className={ax({ layout: 'column' })}>
          {transactions.map((t, i) => (
            <div key={i} className={`${ax({ layout: 'spread', padding: 'sm', border: 'bottom' })} theme-notif-row`}>
              <div className={ax({ layout: 'column', gap: 'xs' })}>
                <span className={ax({ textStyle: 'body', text: 'primary' })}>{t.name}</span>
                <span className={ax({ textStyle: 'caption', text: 'muted' })}>{t.email}</span>
              </div>
              <span className={ax({ textStyle: 'body', text: 'primary', weight: 'semi' })}>{t.amount}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

/* ══ 2. Settings Scenario ══ */

const settingsTabData = makeStore({ profile: 'Profile', notifications: 'Notifications', appearance: 'Appearance' })
const notifSwitchData = makeStore({ email: 'Email notifications', push: 'Push notifications', sms: 'SMS alerts', digest: 'Weekly digest' })
const themeRadioData = makeStore({ system: 'System', light: 'Light', dark: 'Dark' })

function SettingsScenario() {
  const [notifState, setNotifState] = React.useState(notifSwitchData)
  const [themeState, setThemeState] = React.useState(themeRadioData)

  return (
    <div className={ax({ layout: 'column', gap: 'lg' })}>
      <div className={ax({ layout: 'column', gap: 'xs' })}>
        <h2 className={ax({ textStyle: 'page', text: 'primary' })}>Settings</h2>
        <span className={ax({ textStyle: 'body', text: 'muted' })}>Manage your account preferences.</span>
      </div>

      <TabList data={settingsTabData} aria-label="Settings tabs" />

      <div className="theme-composed-grid">
        <Section title="PROFILE">
          <div className={ax({ layout: 'column', gap: 'sm' })}>
            <div className={ax({ layout: 'column', gap: 'xs' })}>
              <span className={ax({ textStyle: 'caption', text: 'secondary' })}>Display Name</span>
              <TextInput size="md" placeholder="Your name" />
            </div>
            <div className={ax({ layout: 'column', gap: 'xs' })}>
              <span className={ax({ textStyle: 'caption', text: 'secondary' })}>Email</span>
              <TextInput size="md" placeholder="name@company.com" />
            </div>
            <div className={ax({ layout: 'column', gap: 'xs' })}>
              <span className={ax({ textStyle: 'caption', text: 'secondary' })}>Bio</span>
              <textarea className={`${ax({ surface: 'input' })} theme-textarea`} placeholder="Tell us about yourself..." />
            </div>
            <div className={ax({ layout: 'bar', gap: 'sm' })}>
              <Button variant="accent">Save Changes</Button>
              <Button variant="ghost">Cancel</Button>
            </div>
          </div>
        </Section>

        <div className={ax({ layout: 'column', gap: 'lg' })}>
          <Section title="NOTIFICATIONS">
            <SwitchGroup data={notifState} onChange={setNotifState} aria-label="Notification settings" />
          </Section>

          <Section title="APPEARANCE">
            <span className={ax({ textStyle: 'caption', text: 'secondary' })}>Theme</span>
            <RadioGroup data={themeState} onChange={setThemeState} aria-label="Theme preference" />
          </Section>
        </div>
      </div>
    </div>
  )
}

/* ══ 3. Create Form Scenario ══ */

function CreateFormScenario() {
  return (
    <div className={ax({ layout: 'column', gap: 'lg' })}>
      <div className={ax({ layout: 'column', gap: 'xs' })}>
        <h2 className={ax({ textStyle: 'page', text: 'primary' })}>New Component</h2>
        <span className={ax({ textStyle: 'body', text: 'muted' })}>Add a new interactive component to the registry.</span>
      </div>

      <div className="theme-composed-grid">
        <Section title="DETAILS">
          <div className={ax({ layout: 'column', gap: 'sm' })}>
            <div className={ax({ layout: 'column', gap: 'xs' })}>
              <span className={ax({ textStyle: 'caption', text: 'secondary' })}>Component Name</span>
              <TextInput size="lg" placeholder="e.g. DatePicker" />
            </div>
            <div className={ax({ layout: 'column', gap: 'xs' })}>
              <span className={ax({ textStyle: 'caption', text: 'secondary' })}>Pattern</span>
              <TextInput size="md" placeholder="e.g. listbox, treegrid, combobox" />
            </div>
            <div className={ax({ layout: 'column', gap: 'xs' })}>
              <span className={ax({ textStyle: 'caption', text: 'secondary' })}>Description</span>
              <textarea className={`${ax({ surface: 'input' })} theme-textarea`} placeholder="What does this component do?" />
            </div>
            <div className={ax({ layout: 'column', gap: 'xs' })}>
              <span className={ax({ textStyle: 'caption', text: 'secondary' })}>Axes</span>
              <TextInput size="md" placeholder="navigate, select, expand..." />
            </div>
          </div>
        </Section>

        <div className={ax({ layout: 'column', gap: 'lg' })}>
          <Section title="PREVIEW">
            <div className={`${ax({ layout: 'center', shape: 'md', padding: 'xl' })} theme-preview-placeholder`}>
              <span className={ax({ textStyle: 'body', text: 'muted' })}>Component preview will appear here</span>
            </div>
          </Section>

          <div className={ax({ layout: 'bar', gap: 'sm' })}>
            <Button variant="accent" className={ax({ flex: '1' })}>Create Component</Button>
            <Button variant="destructive">Discard</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══ Export ══ */

export function ThemeScenarios() {
  return (
    <div className={ax({ layout: 'column', gap: 'xl' })}>
      <DashboardScenario />
      <Divider />
      <SettingsScenario />
      <Divider />
      <CreateFormScenario />
    </div>
  )
}
