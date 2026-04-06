import React from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import './PageThemeCreator.css'
import { Button } from '@os/ui/Button'
import { TextInput } from '@os/ui/TextInput'
import { TabList } from '@os/ui/TabList'
import { Checkbox } from '@os/ui/Checkbox'
import { RadioGroup } from '@os/ui/RadioGroup'
import { SwitchGroup } from '@os/ui/SwitchGroup'
import { Toggle } from '@os/ui/Toggle'
import { Slider } from '@os/ui/Slider'
import { DisclosureGroup } from '@os/ui/DisclosureGroup'
import { Accordion } from '@os/ui/Accordion'
import { ToggleGroup } from '@os/ui/ToggleGroup'
import { Spinbutton } from '@os/ui/Spinbutton'
import { createStore } from '@os/store/createStore'
import { Avatar } from '@os/ui/Avatar'
import { Badge } from '@os/ui/Badge'
import { Progress } from '@os/ui/Progress'
import { Skeleton } from '@os/ui/Skeleton'
import { Kbd } from '@os/ui/Kbd'

/* ══ Demo data factories ══ */

function makeStore(items: Record<string, string>) {
  const entities: Record<string, { id: string; data: { label: string } }> = {}
  const rootIds: string[] = []
  for (const [id, label] of Object.entries(items)) {
    entities[id] = { id, data: { label } }
    rootIds.push(id)
  }
  return createStore({ entities, relationships: { __root__: rootIds } })
}

const tabsData = makeStore({ overview: 'Overview', billing: 'Billing', team: 'Team', settings: 'Settings' })
const checkboxData = makeStore({ notifications: 'Email notifications', marketing: 'Marketing emails', updates: 'Product updates' })
const radioData = makeStore({ small: 'Small', medium: 'Medium', large: 'Large' })
const switchData = makeStore({ wifi: 'Wi-Fi', bluetooth: 'Bluetooth', airplane: 'Airplane mode' })
const toggleData = makeStore({ darkMode: 'Dark mode', sounds: 'Sounds', haptics: 'Haptics' })
const disclosureData = createStore({
  entities: {
    section1: { id: 'section1', data: { label: 'What is interactive-os?' } },
    section2: { id: 'section2', data: { label: 'How does the axis system work?' } },
    section3: { id: 'section3', data: { label: 'Can I use custom patterns?' } },
  },
  relationships: { __root__: ['section1', 'section2', 'section3'] },
})
const accordionData = createStore({
  entities: {
    personal: { id: 'personal', data: { label: 'Personal Information' } },
    security: { id: 'security', data: { label: 'Security Settings' } },
    billing: { id: 'billing', data: { label: 'Billing & Plans' } },
  },
  relationships: { __root__: ['personal', 'security', 'billing'] },
})
const toggleGroupData = makeStore({ bold: 'B', italic: 'I', underline: 'U' })
const sliderData = createStore({
  entities: { volume: { id: 'volume', data: { label: 'Volume', value: 50 } } },
  relationships: { __root__: ['volume'] },
})
const spinbuttonData = createStore({
  entities: { quantity: { id: 'quantity', data: { label: 'Quantity', value: 1 } } },
  relationships: { __root__: ['quantity'] },
})

/* ══ Section Card ══ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={ax({ surface: 'display', layout: 'column', gap: 'sm', padding: 'md', shape: 'lg' })}>
      <h3 className={ax({ textStyle: 'overline', text: 'muted' })}>{title}</h3>
      {children}
    </div>
  )
}

/* ══ Components Tab ══ */

export function ThemeComponents() {
  const [checkboxState, setCheckboxState] = React.useState(checkboxData)
  const [radioState, setRadioState] = React.useState(radioData)
  const [switchState, setSwitchState] = React.useState(switchData)
  const [toggleState, setToggleState] = React.useState(toggleData)
  const [disclosureState, setDisclosureState] = React.useState(disclosureData)
  const [accordionState, setAccordionState] = React.useState(accordionData)
  const [toggleGroupState, setToggleGroupState] = React.useState(toggleGroupData)
  const [sliderState, setSliderState] = React.useState(sliderData)
  const [spinbuttonState, setSpinbuttonState] = React.useState(spinbuttonData)

  return (
    <div className={ax({ layout: 'column', gap: 'xl' })}>
      {/* Row 1: Buttons */}
      <Section title="BUTTONS">
        <div className={ax({ layout: 'column', gap: 'sm' })}>
          {(['accent', 'danger', 'success', 'warning', 'neutral'] as const).map(tone => (
            <div key={tone} className={ax({ layout: 'bar', gap: 'sm' })}>
              <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>{tone}</span>
              <Button variant="accent" tone={tone} size="sm">{tone}</Button>
              <Button variant="accent" tone={tone} size="md">{tone}</Button>
              <Button variant="accent" tone={tone} size="lg">{tone}</Button>
              <Button variant="accent" tone={tone} size="md" disabled>disabled</Button>
            </div>
          ))}
          <div className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>ghost</span>
            <Button variant="ghost" size="sm">ghost sm</Button>
            <Button variant="ghost" size="md">ghost md</Button>
            <Button variant="ghost" size="lg">ghost lg</Button>
          </div>
          <div className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>dialog</span>
            <Button variant="dialog" size="sm">cancel</Button>
            <Button variant="dialog" size="md">cancel</Button>
            <Button variant="dialog" size="lg">cancel</Button>
          </div>
        </div>
      </Section>

      {/* 3-column grid: inputs, selections, controls */}
      <div className="theme-page-grid">
        {/* Column 1: Text inputs */}
        <div className={ax({ layout: 'column', gap: 'md' })}>
          <Section title="TEXT INPUT">
            <div className={ax({ layout: 'column', gap: 'sm' })}>
              <TextInput size="sm" placeholder="Small input" />
              <TextInput size="md" placeholder="Medium input" />
              <TextInput size="lg" placeholder="Large input" />
              <div className={ax({ layout: 'column', gap: 'xs' })}>
                <span className={ax({ textStyle: 'caption', text: 'secondary' })}>Email Address</span>
                <TextInput size="lg" placeholder="name@company.com" />
              </div>
              <div className={ax({ layout: 'bar', gap: 'sm' })}>
                <TextInput size="md" placeholder="Search..." className={ax({ flex: '1' })} />
                <Button variant="accent" size="md">Search</Button>
              </div>
            </div>
          </Section>

          <Section title="TABS">
            <TabList data={tabsData} aria-label="Demo tabs" />
          </Section>

          <Section title="SLIDER">
            <Slider data={sliderState} min={0} max={100} step={1} onChange={setSliderState} aria-label="Volume" />
          </Section>

          <Section title="SPINBUTTON">
            <Spinbutton data={spinbuttonState} min={0} max={99} step={1} onChange={setSpinbuttonState} aria-label="Quantity" />
          </Section>
        </div>

        {/* Column 2: Selection controls */}
        <div className={ax({ layout: 'column', gap: 'md' })}>
          <Section title="CHECKBOX">
            <Checkbox data={checkboxState} onChange={setCheckboxState} aria-label="Notifications" />
          </Section>

          <Section title="RADIO GROUP">
            <RadioGroup data={radioState} onChange={setRadioState} aria-label="Size" />
          </Section>

          <Section title="SWITCH GROUP">
            <SwitchGroup data={switchState} onChange={setSwitchState} aria-label="Connectivity" />
          </Section>

          <Section title="TOGGLE">
            <Toggle data={toggleState} onChange={setToggleState} />
          </Section>

          <Section title="TOGGLE GROUP">
            <ToggleGroup data={toggleGroupState} onChange={setToggleGroupState} aria-label="Text formatting" />
          </Section>
        </div>

        {/* Column 3: Disclosure / Composite */}
        <div className={ax({ layout: 'column', gap: 'md' })}>
          <Section title="DISCLOSURE GROUP">
            <DisclosureGroup data={disclosureState} onChange={setDisclosureState} aria-label="FAQ" />
          </Section>

          <Section title="ACCORDION">
            <Accordion data={accordionState} onChange={setAccordionState} aria-label="Settings" />
          </Section>

          <Section title="ALERTS">
            {([
              { tone: 'success', text: 'Changes saved successfully.' },
              { tone: 'accent', text: 'New feature available — try the component creator.' },
              { tone: 'warning', text: 'Your session will expire in 5 minutes.' },
              { tone: 'danger', text: 'Failed to save. Check your connection.' },
            ] as const).map(a => (
              <div key={a.tone} className={`${ax({ surface: 'display', layout: 'bar', gap: 'sm', padding: 'sm', shape: 'md' })} theme-alert`} data-tone={a.tone}>
                <span className={ax({ textStyle: 'body', text: 'primary' })}>{a.text}</span>
              </div>
            ))}
          </Section>

          <Section title="CHIPS">
            <div className={ax({ layout: 'row', gap: 'xs' })}>
              {(['accent', 'danger', 'success', 'warning', 'neutral'] as const).map(tone => (
                <Button key={tone} variant="accent" tone={tone} size="sm">{tone}</Button>
              ))}
            </div>
            <div className={ax({ layout: 'row', gap: 'xs' })}>
              {(['accent-dim', 'danger-dim', 'success-dim', 'warning-dim', 'neutral-dim'] as const).map(tone => (
                <Button key={tone} variant="accent" tone={tone} size="sm">{tone.replace('-dim', '')}</Button>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* Row 3: Avatar, Badge, Progress */}
      <div className="theme-page-grid">
        <Section title="AVATAR">
          <div className={ax({ layout: 'bar', gap: 'md' })}>
            <Avatar name="Alice Brown" size="sm" />
            <Avatar name="Bob Carter" size="md" />
            <Avatar name="Dana Kim" size="lg" />
            <Avatar name="Single" size="md" />
          </div>
          <div className={ax({ layout: 'bar', gap: 'xs' })}>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>sm / md / lg / single-word</span>
          </div>
        </Section>

        <Section title="BADGE">
          <div className={ax({ layout: 'row', gap: 'xs' })}>
            {(['accent', 'danger', 'success', 'warning', 'neutral'] as const).map(tone => (
              <Badge key={tone} tone={tone} variant="solid">{tone}</Badge>
            ))}
          </div>
          <div className={ax({ layout: 'row', gap: 'xs' })}>
            {(['accent', 'danger', 'success', 'warning', 'neutral'] as const).map(tone => (
              <Badge key={tone} tone={tone} variant="outline">{tone}</Badge>
            ))}
          </div>
        </Section>

        <Section title="PROGRESS">
          <div className={ax({ layout: 'column', gap: 'sm' })}>
            <Progress value={25} tone="accent" aria-label="25%" />
            <Progress value={50} tone="success" aria-label="50%" />
            <Progress value={75} tone="warning" aria-label="75%" />
            <Progress value={100} tone="danger" aria-label="100%" />
          </div>
        </Section>
      </div>

      {/* Row 4: Skeleton, Kbd */}
      <div className="theme-page-grid">
        <Section title="SKELETON">
          <div className={ax({ layout: 'column', gap: 'sm' })}>
            <Skeleton shape="text" height="xs" width="md" />
            <Skeleton shape="rect" height="sm" width="full" />
            <Skeleton shape="rect" height="md" width="full" />
            <div className={ax({ layout: 'bar', gap: 'sm' })}>
              <Skeleton shape="circle" height="md" />
              <Skeleton shape="circle" height="lg" />
              <Skeleton shape="circle" height="xl" />
            </div>
          </div>
        </Section>

        <Section title="KBD">
          <div className={ax({ layout: 'row', gap: 'sm' })}>
            <Kbd>⌘K</Kbd>
            <Kbd>⌘S</Kbd>
            <Kbd>Ctrl+Z</Kbd>
            <Kbd>Esc</Kbd>
            <Kbd>Tab</Kbd>
            <Kbd>↵</Kbd>
          </div>
          <div className={ax({ layout: 'bar', gap: 'xs' })}>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>Press</span>
            <Kbd>⌘</Kbd>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>+</span>
            <Kbd>K</Kbd>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>to open command palette</span>
          </div>
        </Section>
      </div>
    </div>
  )
}
