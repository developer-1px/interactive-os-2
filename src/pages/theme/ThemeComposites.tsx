import type React from 'react'
import { ax } from '@styles/ax'
import './PageThemeCreator.css'
import { statGridRenderer } from '@os/ui/composites/StatGrid'
import { formSectionRenderer } from '@os/ui/composites/FormSection'
import { masterDetailRenderer } from '@os/ui/composites/MasterDetail'
import { StepWizardRenderer } from '@os/ui/composites/StepWizard'
import { SearchableListRenderer } from '@os/ui/composites/SearchableList'
import type { A2UIRenderContext } from '@os/ui/a2uiComponentMap'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'

/* ══ Section ══ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={ax({ layout: 'column', gap: 'sm' })}>
      <h3 className={ax({ textStyle: 'overline', text: 'muted' })}>{title}</h3>
      {children}
    </div>
  )
}

/* ══ Mock context helpers ══ */

function makeCtx(data: Record<string, unknown>): A2UIRenderContext {
  const emptyStore = createStore({ entities: {}, relationships: { [ROOT_ID]: [] } })
  return {
    entity: { id: 'root', data },
    store: emptyStore,
    depth: 0,
    renderNode: () => null,
    renderChildren: () => null,
  }
}

/* ══ 1. StatGrid ══ */

function StatGridDemo() {
  const ctx = makeCtx({
    items: [
      { id: 'users', value: '12,847', label: 'Total Users' },
      { id: 'revenue', value: '$84.2K', label: 'Revenue (MTD)' },
      { id: 'conversion', value: '3.24%', label: 'Conversion Rate' },
      { id: 'sessions', value: '48.1K', label: 'Active Sessions' },
    ],
  })
  return statGridRenderer(ctx)
}

/* ══ 2. FormSection ══ */

function FormSectionDemo() {
  const store = createStore({
    entities: {
      'f-name': { id: 'f-name', data: { label: 'Display Name' } },
      'f-email': { id: 'f-email', data: { label: 'Email' } },
      'f-bio': { id: 'f-bio', data: { label: 'Bio' } },
    },
    relationships: { [ROOT_ID]: ['f-name', 'f-email', 'f-bio'] },
  })
  const ctx: A2UIRenderContext = {
    entity: {
      id: 'root',
      data: {
        title: 'Profile',
        fields: ['f-name', 'f-email', 'f-bio'],
        actions: [{ label: 'Save Changes', variant: 'primary' }, { label: 'Cancel' }],
      },
    },
    store,
    depth: 0,
    renderNode: (id: string) => (
      <div key={id} className={ax({ surface: 'input', padding: 'sm', shape: 'sm', width: 'full', textStyle: 'caption', text: 'muted' })}>
        {store.entities[id]?.data?.label as string ?? id}
      </div>
    ),
    renderChildren: () => null,
  }
  return formSectionRenderer(ctx)
}

/* ══ 3. MasterDetail ══ */

function MasterDetailDemo() {
  const store = createStore({
    entities: {
      master: { id: 'master', data: {} },
      detail: { id: 'detail', data: {} },
    },
    relationships: { [ROOT_ID]: ['master', 'detail'] },
  })

  const members = [
    { name: 'Alice Kim', role: 'Engineer' },
    { name: 'Bob Park', role: 'Designer' },
    { name: 'Carol Lee', role: 'PM' },
  ]

  const ctx: A2UIRenderContext = {
    entity: { id: 'root', data: { master: 'master', detail: 'detail' } },
    store,
    depth: 0,
    renderNode: (id: string) => {
      if (id === 'master') {
        return (
          <div className={ax({ layout: 'column', gap: 'xs' })}>
            {members.map((m) => (
              <div key={m.name} className={ax({ surface: 'display', padding: 'sm', shape: 'sm', layout: 'spread' })}>
                <span className={ax({ textStyle: 'body' })}>{m.name}</span>
                <span className={ax({ textStyle: 'caption', text: 'secondary' })}>{m.role}</span>
              </div>
            ))}
          </div>
        )
      }
      return (
        <div className={ax({ layout: 'column', gap: 'sm' })}>
          <div className={ax({ textStyle: 'section' })}>Alice Kim</div>
          <div className={ax({ textStyle: 'caption', text: 'secondary' })}>Engineer — Frontend</div>
          <div className={ax({ textStyle: 'body', text: 'muted' })}>alice@company.com</div>
          <div className={ax({ textStyle: 'caption', text: 'muted' })}>Joined: 2024-03-15</div>
        </div>
      )
    },
    renderChildren: () => null,
  }
  return masterDetailRenderer(ctx)
}

/* ══ 4. StepWizard ══ */

function StepWizardDemo() {
  const store = createStore({
    entities: {
      'step-profile': { id: 'step-profile', data: { label: 'Profile' } },
      'step-team': { id: 'step-team', data: { label: 'Team' } },
      'step-prefs': { id: 'step-prefs', data: { label: 'Preferences' } },
    },
    relationships: { [ROOT_ID]: ['step-profile', 'step-team', 'step-prefs'] },
  })

  const ctx: A2UIRenderContext = {
    entity: {
      id: 'root',
      data: {
        title: 'Create Your Workspace',
        subtitle: 'Set up your team workspace in 3 steps',
        steps: [
          { title: '1. Profile', content: 'step-profile' },
          { title: '2. Team', content: 'step-team' },
          { title: '3. Preferences', content: 'step-prefs' },
        ],
      },
    },
    store,
    depth: 0,
    renderNode: (id: string) => (
      <div className={ax({ surface: 'display', padding: 'md', shape: 'sm', textStyle: 'caption', text: 'muted' })}>
        {store.entities[id]?.data?.label as string ?? id}
      </div>
    ),
    renderChildren: () => null,
  }
  return <StepWizardRenderer {...ctx} />
}

/* ══ 5. SearchableList ══ */

function SearchableListDemo() {
  const ctx = makeCtx({
    'aria-label': 'Commands',
    searchLabel: 'Type a command...',
    items: [
      { id: 'c1', label: 'New File', sublabel: 'Create a new file' },
      { id: 'c2', label: 'Open File', sublabel: 'Open an existing file' },
      { id: 'c3', label: 'Save', sublabel: 'Save current file' },
      { id: 'c4', label: 'Find', sublabel: 'Search in file' },
      { id: 'c5', label: 'Git Commit', sublabel: 'Commit staged changes' },
    ],
  })
  return <SearchableListRenderer {...ctx} />
}

/* ══ Main ══ */

export function ThemeComposites() {
  return (
    <div className={ax({ layout: 'column', gap: 'xl' })}>
      <div className={ax({ layout: 'column', gap: 'xs' })}>
        <h2 className={ax({ textStyle: 'page', text: 'primary' })}>Composites</h2>
        <p className={ax({ textStyle: 'body', text: 'secondary' })}>
          Design reference for higher-order layout patterns built from core ui/ components.
        </p>
      </div>

      <Section title="StatGrid — KPI Dashboard">
        <StatGridDemo />
      </Section>

      <Section title="FormSection — Profile Form">
        <FormSectionDemo />
      </Section>

      <Section title="MasterDetail — List + Detail">
        <MasterDetailDemo />
      </Section>

      <Section title="StepWizard — 3-Step Onboarding">
        <StepWizardDemo />
      </Section>

      <Section title="SearchableList — Command Palette">
        <SearchableListDemo />
      </Section>
    </div>
  )
}
