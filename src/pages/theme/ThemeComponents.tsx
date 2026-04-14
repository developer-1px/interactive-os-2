import type React from 'react'
import { ax } from '@styles/ax'
import { useStore } from '@os/store/useStore'
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
import { Select } from '@os/ui/Select'
import { Pagination } from '@os/ui/Pagination'
import { Card } from '@os/ui/Card'
import { Textarea } from '@os/ui/Textarea'
import { Rating } from '@os/ui/Rating'
import { Popover } from '@os/ui/Popover'
import { Stepper } from '@os/ui/Stepper'
import { Timeline } from '@os/ui/Timeline'
import { Carousel } from '@os/ui/Carousel'

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

const selectData = makeStore({ apple: 'Apple', banana: 'Banana', cherry: 'Cherry', grape: 'Grape' })
const ratingData = createStore({
  entities: {
    s1: { id: 's1', data: { label: '1' } },
    s2: { id: 's2', data: { label: '2' } },
    s3: { id: 's3', data: { label: '3' } },
    s4: { id: 's4', data: { label: '4' } },
    s5: { id: 's5', data: { label: '5' } },
  },
  relationships: { __root__: ['s1', 's2', 's3', 's4', 's5'] },
})
const stepperData = createStore({
  entities: {
    step1: { id: 'step1', data: { label: 'Account', step: 1, completed: true } },
    step2: { id: 'step2', data: { label: 'Profile', step: 2 } },
    step3: { id: 'step3', data: { label: 'Review', step: 3 } },
  },
  relationships: { __root__: ['step1', 'step2', 'step3'] },
})
const timelineData = createStore({
  entities: {
    ev1: { id: 'ev1', data: { label: 'Project created', time: '09:00', detail: 'Initial setup' } },
    ev2: { id: 'ev2', data: { label: 'First commit', time: '10:30', detail: 'Added core files' } },
    ev3: { id: 'ev3', data: { label: 'v1.0 released', time: '14:00', detail: 'Production deployment' } },
  },
  relationships: { __root__: ['ev1', 'ev2', 'ev3'] },
})
const carouselData = createStore({
  entities: {
    slide1: { id: 'slide1', data: { label: 'Welcome to aria-os' } },
    slide2: { id: 'slide2', data: { label: 'Keyboard-first interaction' } },
    slide3: { id: 'slide3', data: { label: '90+ components' } },
  },
  relationships: { __root__: ['slide1', 'slide2', 'slide3'] },
})

/* ══ Section Card ══ */

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`${ax({ surface: 'display', layout: 'stack', gap: 'sm', padding: 'md', shape: 'lg' })}${className ? ` ${className}` : ''}`}>
      <h3 className={ax({ textStyle: 'overline', text: 'muted' })}>{title}</h3>
      {children}
    </div>
  )
}

function CategoryHeader({ title }: { title: string }) {
  return (
    <div className={`${ax({ layout: 'stack', gap: 'xs', padding: 'xs', border: 'bottom' })} theme-masonry-head`}>
      <h2 className={ax({ textStyle: 'section', text: 'primary', weight: 'semi' })}>{title}</h2>
    </div>
  )
}

/* ══ Components Tab ══ */

export function ThemeComponents() {
  const [checkboxState, setCheckboxState] = useStore(checkboxData)
  const [radioState, setRadioState] = useStore(radioData)
  const [switchState, setSwitchState] = useStore(switchData)
  const [toggleState, setToggleState] = useStore(toggleData)
  const [disclosureState, setDisclosureState] = useStore(disclosureData)
  const [accordionState, setAccordionState] = useStore(accordionData)
  const [toggleGroupState, setToggleGroupState] = useStore(toggleGroupData)
  const [sliderState, setSliderState] = useStore(sliderData)
  const [spinbuttonState, setSpinbuttonState] = useStore(spinbuttonData)

  return (
    <div className={`${ax({ gap: 'lg' })} theme-masonry-grid`}>
      <CategoryHeader title="Actions" />

      <Section title="BUTTONS" className="theme-masonry-wide">
        <div className={ax({ layout: 'stack', gap: 'sm' })}>
          {(['accent', 'danger', 'success', 'warning', 'neutral'] as const).map(tone => (
            <div key={tone} className={ax({ layout: 'bar', gap: 'sm' })}>
              <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>{tone}</span>
              <Button variant="accent" tone={tone}>{tone}</Button>
              <Button variant="accent" tone={tone} disabled>disabled</Button>
            </div>
          ))}
          <div className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>ghost</span>
            <Button variant="ghost">ghost</Button>
          </div>
          <div className={ax({ layout: 'bar', gap: 'sm' })}>
            <span className={`${ax({ textStyle: 'code', text: 'muted' })} theme-btn-label`}>dialog</span>
            <Button variant="dialog">cancel</Button>
          </div>
        </div>
      </Section>

      <Section title="CHIPS">
        <div className={ax({ layout: 'wrap', gap: 'xs' })}>
          {(['accent', 'danger', 'success', 'warning', 'neutral'] as const).map(tone => (
            <Button key={tone} variant="accent" tone={tone}>{tone}</Button>
          ))}
        </div>
        <div className={ax({ layout: 'wrap', gap: 'xs' })}>
          {(['accent-dim', 'danger-dim', 'success-dim', 'warning-dim', 'neutral-dim'] as const).map(tone => (
            <Button key={tone} variant="accent" tone={tone}>{tone.replace('-dim', '')}</Button>
          ))}
        </div>
      </Section>

      <CategoryHeader title="Inputs" />

      <Section title="TEXT INPUT">
        <div className={ax({ layout: 'stack', gap: 'sm' })}>
          <TextInput placeholder="Small input" />
          <TextInput placeholder="Medium input" />
          <TextInput placeholder="Large input" />
          <div className={ax({ layout: 'stack', gap: 'xs' })}>
            <span className={ax({ textStyle: 'caption', text: 'secondary' })}>Email Address</span>
            <TextInput placeholder="name@company.com" />
          </div>
          <div className={ax({ layout: 'bar', gap: 'sm' })}>
            <TextInput placeholder="Search..." className={ax({ flex: '1' })} />
            <Button variant="accent">Search</Button>
          </div>
        </div>
      </Section>

      <Section title="SLIDER">
        <Slider data={sliderState} min={0} max={100} step={1} onChange={setSliderState} aria-label="Volume" />
      </Section>

      <Section title="SPINBUTTON">
        <Spinbutton data={spinbuttonState} min={0} max={99} step={1} onChange={setSpinbuttonState} aria-label="Quantity" />
      </Section>

      <Section title="TEXTAREA">
        <Textarea value="" onChange={() => {}} placeholder="Write something..." rows={3} aria-label="Demo textarea" />
      </Section>

      <CategoryHeader title="Selections" />

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

      <Section title="TABS">
        <TabList data={tabsData} aria-label="Demo tabs" />
      </Section>

      <Section title="SELECT">
        <Select data={selectData} placeholder="Choose fruit..." aria-label="Fruit select" />
      </Section>

      <Section title="RATING">
        <Rating data={ratingData} aria-label="Rating" />
      </Section>

      <CategoryHeader title="Disclosure" />

      <Section title="DISCLOSURE GROUP">
        <DisclosureGroup data={disclosureState} onChange={setDisclosureState} aria-label="FAQ" />
      </Section>

      <Section title="ACCORDION">
        <Accordion data={accordionState} onChange={setAccordionState} aria-label="Settings" />
      </Section>

      <Section title="POPOVER">
        <Popover content={<div className={ax({ layout: 'stack', gap: 'xs' })}><span className={ax({ weight: 'medium' })}>Popover Title</span><span className={ax({ text: 'secondary', textStyle: 'caption' })}>Interactive content</span></div>}>
          <Button>Open Popover</Button>
        </Popover>
      </Section>

      <CategoryHeader title="Feedback" />

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

      <Section title="PROGRESS">
        <div className={ax({ layout: 'stack', gap: 'sm' })}>
          <Progress value={25} tone="accent" aria-label="25%" />
          <Progress value={50} tone="success" aria-label="50%" />
          <Progress value={75} tone="warning" aria-label="75%" />
          <Progress value={100} tone="danger" aria-label="100%" />
        </div>
      </Section>

      <Section title="SKELETON">
        <div className={ax({ layout: 'stack', gap: 'sm' })}>
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

      <CategoryHeader title="Display" />

      <Section title="AVATAR">
        <div className={ax({ layout: 'bar', gap: 'md' })}>
          <Avatar name="Alice Brown" />
          <Avatar name="Bob Carter" size="md" />
          <Avatar name="Dana Kim" size="lg" />
          <Avatar name="Single" size="md" />
        </div>
        <div className={ax({ layout: 'bar', gap: 'xs' })}>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>sm / md / lg / single-word</span>
        </div>
      </Section>

      <Section title="BADGE">
        <div className={ax({ layout: 'wrap', gap: 'xs' })}>
          {(['accent', 'danger', 'success', 'warning', 'neutral'] as const).map(tone => (
            <Badge key={tone} tone={tone} variant="solid">{tone}</Badge>
          ))}
        </div>
        <div className={ax({ layout: 'wrap', gap: 'xs' })}>
          {(['accent', 'danger', 'success', 'warning', 'neutral'] as const).map(tone => (
            <Badge key={tone} tone={tone} variant="outline">{tone}</Badge>
          ))}
        </div>
      </Section>

      <Section title="KBD">
        <div className={ax({ layout: 'wrap', gap: 'sm' })}>
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

      <Section title="CARD">
        <div className={ax({ layout: 'stack', gap: 'sm' })}>
          <Card variant="outlined"><Card.Header>Outlined</Card.Header><Card.Body>Default card style</Card.Body></Card>
          <Card variant="elevated"><Card.Header>Elevated</Card.Header><Card.Body>Raised surface</Card.Body></Card>
          <Card variant="filled"><Card.Header>Filled</Card.Header><Card.Body>Sunken surface</Card.Body></Card>
        </div>
      </Section>

      <Section title="TIMELINE">
        <Timeline data={timelineData} aria-label="Project timeline" />
      </Section>

      <CategoryHeader title="Navigation" />

      <Section title="PAGINATION">
        <Pagination totalPages={10} currentPage={3} onPageChange={() => {}} />
      </Section>

      <Section title="STEPPER">
        <Stepper data={stepperData} orientation="horizontal" aria-label="Setup steps" />
      </Section>

      <Section title="CAROUSEL">
        <Carousel data={carouselData} showDots aria-label="Feature showcase" />
      </Section>
    </div>
  )
}
