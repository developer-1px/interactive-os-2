import type React from 'react'
import { ax } from '@styles/ax'
import './PageThemeCreator.css'
import { Divider } from '@os/ui/Divider'
import { Button } from '@os/ui/Button'
import { TextInput } from '@os/ui/TextInput'
import { Textarea } from '@os/ui/Textarea'
import { SwitchGroup } from '@os/ui/SwitchGroup'
import { RadioGroup } from '@os/ui/RadioGroup'
import { TabList } from '@os/ui/TabList'
import { createStore, useStore, ROOT_ID } from '@os/schema'
import { statGridRenderer } from '@os/ui/composites/StatGrid'
import { formSectionRenderer } from '@os/ui/composites/FormSection'
import type { A2UIRenderContext } from '@os/ui/a2uiComponentMap'

/* ══ helpers ══ */

function makeTabStore(items: Record<string, string>) {
  const entities: Record<string, { id: string; data: { label: string } }> = {}
  const rootIds: string[] = []
  for (const [id, label] of Object.entries(items)) {
    entities[id] = { id, data: { label } }
    rootIds.push(id)
  }
  return createStore({ entities, relationships: { __root__: rootIds } })
}

type FieldData = { label: string; placeholder?: string; kind: 'input' | 'textarea' }

function makeFormCtx(
  rootData: Record<string, unknown>,
  fields: Record<string, FieldData>,
): A2UIRenderContext {
  const entities: Record<string, { id: string; data: FieldData }> = {}
  for (const [id, data] of Object.entries(fields)) entities[id] = { id, data }
  const store = createStore({
    entities: { ...entities, root: { id: 'root', data: rootData } },
    relationships: { [ROOT_ID]: ['root'] },
  })
  return {
    entity: { id: 'root', data: rootData },
    store,
    depth: 0,
    renderNode: (id: string) => {
      const f = entities[id]?.data
      if (!f) return null
      return (
        <div key={id} className={ax({ layout: 'stack' })}>
          <span className={ax({ textStyle: 'caption' })}>{f.label}</span>
          {f.kind === 'textarea' ? (
            <Textarea value="" onChange={() => {}} placeholder={f.placeholder} rows={3} />
          ) : (
            <TextInput placeholder={f.placeholder} />
          )}
        </div>
      )
    },
    renderChildren: () => null,
  }
}

/* ══ Section Card ══ */

function Section({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`${ax({ surface: 'display', layout: 'stack' })}${className ? ` ${className}` : ''}`}>
      {title && <h3 className={ax({ textStyle: 'overline' })}>{title}</h3>}
      {children}
    </div>
  )
}

/* ══ 1. Dashboard Scenario — stats via statGridRenderer ══ */

function DashboardScenario() {
  // GAP: statGridRenderer는 value/label만 지원. change/tone(delta 추이)는 미지원 → label에 섞어 넣음.
  const statCtx: A2UIRenderContext = {
    entity: {
      id: 'root',
      data: {
        items: [
          { id: 'revenue', value: '$45,231.89', label: 'Total Revenue  +20.1%' },
          { id: 'subs', value: '+2,350', label: 'Subscriptions  +180.1%' },
          { id: 'active', value: '+573', label: 'Active Now  +19%' },
          { id: 'bounce', value: '24.3%', label: 'Bounce Rate  -4.5%' },
        ],
      },
    },
    store: createStore({ entities: {}, relationships: { [ROOT_ID]: [] } }),
    depth: 0,
    renderNode: () => null,
    renderChildren: () => null,
  }

  const transactions = [
    { name: 'Olivia Martin', email: 'olivia@email.com', amount: '+$1,999.00' },
    { name: 'Jackson Lee', email: 'jackson@email.com', amount: '+$39.00' },
    { name: 'Isabella Nguyen', email: 'isabella@email.com', amount: '+$299.00' },
    { name: 'William Kim', email: 'will@email.com', amount: '+$99.00' },
    { name: 'Sofia Davis', email: 'sofia@email.com', amount: '+$39.00' },
  ]

  return (
    <div className={ax({ layout: 'stack' })}>
      <div className={ax({ layout: 'spread' })}>
        <div className={ax({ layout: 'stack' })}>
          <h2 className={ax({ textStyle: 'page' })}>Dashboard</h2>
          <span className={ax({ textStyle: 'body' })}>Your business at a glance.</span>
        </div>
        <Button variant="accent">Download Report</Button>
      </div>

      {statGridRenderer(statCtx)}

      <Section title="RECENT TRANSACTIONS">
        <div className={ax({ layout: 'stack' })}>
          {transactions.map((t, i) => (
            <div key={i} className={`${ax({ layout: 'spread' })} theme-notif-row`}>
              <div className={ax({ layout: 'stack' })}>
                <span className={ax({ textStyle: 'body' })}>{t.name}</span>
                <span className={ax({ textStyle: 'caption' })}>{t.email}</span>
              </div>
              <span className={ax({ textStyle: 'body' })}>{t.amount}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

/* ══ 2. Settings Scenario — Profile via formSectionRenderer ══ */

const settingsTabData = makeTabStore({ profile: 'Profile', notifications: 'Notifications', appearance: 'Appearance' })
const notifSwitchData = makeTabStore({ email: 'Email notifications', push: 'Push notifications', sms: 'SMS alerts', digest: 'Weekly digest' })
const themeRadioData = makeTabStore({ system: 'System', light: 'Light', dark: 'Dark' })

function SettingsScenario() {
  const [notifState, setNotifState] = useStore(notifSwitchData)
  const [themeState, setThemeState] = useStore(themeRadioData)

  const profileCtx = makeFormCtx(
    {
      title: 'Profile',
      fields: ['p-name', 'p-email', 'p-bio'],
      actions: [{ label: 'Save Changes', variant: 'primary' }, { label: 'Cancel' }],
    },
    {
      'p-name': { label: 'Display Name', placeholder: 'Your name', kind: 'input' },
      'p-email': { label: 'Email', placeholder: 'name@company.com', kind: 'input' },
      'p-bio': { label: 'Bio', placeholder: 'Tell us about yourself...', kind: 'textarea' },
    },
  )

  return (
    <div className={ax({ layout: 'stack' })}>
      <div className={ax({ layout: 'stack' })}>
        <h2 className={ax({ textStyle: 'page' })}>Settings</h2>
        <span className={ax({ textStyle: 'body' })}>Manage your account preferences.</span>
      </div>

      <TabList data={settingsTabData} aria-label="Settings tabs" />

      <div className="theme-composed-grid">
        {formSectionRenderer(profileCtx)}

        {/* GAP: Switch/Radio 섹션은 formSectionRenderer의 field 렌더링 모델과 맞지 않음 — ax+ui 수동 조립 유지 */}
        <div className={ax({ layout: 'stack' })}>
          <Section title="NOTIFICATIONS">
            <SwitchGroup data={notifState} onChange={setNotifState} aria-label="Notification settings" />
          </Section>

          <Section title="APPEARANCE">
            <span className={ax({ textStyle: 'caption' })}>Theme</span>
            <RadioGroup data={themeState} onChange={setThemeState} aria-label="Theme preference" />
          </Section>
        </div>
      </div>
    </div>
  )
}

/* ══ 3. Create Form Scenario — Details via formSectionRenderer ══ */

function CreateFormScenario() {
  const detailsCtx = makeFormCtx(
    {
      title: 'Details',
      fields: ['c-name', 'c-pattern', 'c-desc', 'c-axes'],
      actions: [],
    },
    {
      'c-name': { label: 'Component Name', placeholder: 'e.g. DatePicker', kind: 'input' },
      'c-pattern': { label: 'Pattern', placeholder: 'e.g. listbox, treegrid, combobox', kind: 'input' },
      'c-desc': { label: 'Description', placeholder: 'What does this component do?', kind: 'textarea' },
      'c-axes': { label: 'Axes', placeholder: 'navigate, select, expand...', kind: 'input' },
    },
  )

  return (
    <div className={ax({ layout: 'stack' })}>
      <div className={ax({ layout: 'stack' })}>
        <h2 className={ax({ textStyle: 'page' })}>New Component</h2>
        <span className={ax({ textStyle: 'body' })}>Add a new interactive component to the registry.</span>
      </div>

      <div className="theme-composed-grid">
        {formSectionRenderer(detailsCtx)}

        {/* GAP: Preview 플레이스홀더 + 화면-외곽 action bar는 FormSection 범위 밖 */}
        <div className={ax({ layout: 'stack' })}>
          <Section title="PREVIEW">
            <div className={`${ax({ layout: 'center' })} theme-preview-placeholder`}>
              <span className={ax({ textStyle: 'body' })}>Component preview will appear here</span>
            </div>
          </Section>

          <div className={ax({ layout: 'bar' })}>
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
    <div className={ax({ layout: 'stack' })}>
      <DashboardScenario />
      <Divider />
      <SettingsScenario />
      <Divider />
      <CreateFormScenario />
    </div>
  )
}
