// ② 2026-04-04-a2ui-surface-showcase-prd.md
import { useState } from 'react'
import { A2UISurface } from '@os/ui/A2UISurface'
import type { A2UIPayload } from '@os/ui/a2uiAdapter'
import { ax } from '@styles/ax'

// ── Sample A2UI payloads ──

const basicLayout: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['heading', 'card1', 'actions'] },
    { id: 'heading', component: 'Text', text: 'A2UI → interactive-os', variant: 'h2' },
    { id: 'card1', component: 'Card', child: 'card-content' },
    { id: 'card-content', component: 'Column', children: ['card-title', 'card-body'] },
    { id: 'card-title', component: 'Text', text: 'Card Component', variant: 'h4' },
    { id: 'card-body', component: 'Text', text: 'This card is rendered by our UI system with ax() styling. The A2UI JSON only declares structure — our renderer adds the visuals.' },
    { id: 'actions', component: 'Row', children: ['btn-primary', 'btn-ghost'] },
    { id: 'btn-primary', component: 'Button', label: 'Primary Action', variant: 'primary' },
    { id: 'btn-ghost', component: 'Button', label: 'Secondary' },
  ],
}

const interactiveList: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['title', 'fruit-list'] },
    { id: 'title', component: 'Text', text: 'ListBox (↑↓ navigate, Space select)', variant: 'h4' },
    { id: 'fruit-list', component: 'List', children: ['apple', 'banana', 'cherry', 'grape'], 'aria-label': 'Fruits' },
    { id: 'apple', component: 'Text', text: '🍎 Apple', label: '🍎 Apple' },
    { id: 'banana', component: 'Text', text: '🍌 Banana', label: '🍌 Banana' },
    { id: 'cherry', component: 'Text', text: '🍒 Cherry', label: '🍒 Cherry' },
    { id: 'grape', component: 'Text', text: '🍇 Grape', label: '🍇 Grape' },
  ],
}

const formSample: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['title', 'name-field', 'email-field', 'volume', 'agree', 'choices'] },
    { id: 'title', component: 'Text', text: 'Form Controls', variant: 'h4' },
    { id: 'name-field', component: 'TextField', label: 'Name', value: '' },
    { id: 'email-field', component: 'TextField', label: 'Email', value: '' },
    { id: 'volume', component: 'Slider', label: 'Volume', minValue: 0, maxValue: 100, step: 1, value: 50 },
    { id: 'agree', component: 'CheckBox', label: 'I agree to the terms' },
    { id: 'choices', component: 'ChoicePicker', label: 'Plan', options: [
      { id: 'free', label: 'Free' },
      { id: 'pro', label: 'Pro' },
      { id: 'enterprise', label: 'Enterprise' },
    ] },
  ],
}

const tabsSample: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['title', 'tabs'] },
    { id: 'title', component: 'Text', text: 'Tabs (←→ navigate)', variant: 'h4' },
    { id: 'tabs', component: 'Tabs', 'aria-label': 'Settings', tabItems: [
      { title: 'General', child: 'panel-general' },
      { title: 'Appearance', child: 'panel-appearance' },
      { title: 'Advanced', child: 'panel-advanced' },
    ] },
    { id: 'panel-general', component: 'Text', text: 'General settings panel content.' },
    { id: 'panel-appearance', component: 'Text', text: 'Appearance settings with theme options.' },
    { id: 'panel-advanced', component: 'Text', text: 'Advanced configuration options.' },
  ],
}

const dataBindingSample: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['title', 'greeting', 'detail'] },
    { id: 'title', component: 'Text', text: 'Data Binding', variant: 'h4' },
    { id: 'greeting', component: 'Text', text: { path: '/user/name' } as unknown as string },
    { id: 'detail', component: 'Text', text: { path: '/user/role' } as unknown as string },
  ],
  dataModel: {
    user: { name: 'Hello, Alice!', role: 'Senior Engineer at Acme Corp' },
  },
}

const fallbackSample: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['title', 'unknown'] },
    { id: 'title', component: 'Text', text: 'Fallback (unknown component)', variant: 'h4' },
    { id: 'unknown', component: 'RizzChart3D', chartType: 'donut', data: [1, 2, 3] },
  ],
}

const samples = [
  { title: 'Layout & Card', payload: basicLayout },
  { title: 'Interactive List', payload: interactiveList },
  { title: 'Form Controls', payload: formSample },
  { title: 'Tabs', payload: tabsSample },
  { title: 'Data Binding', payload: dataBindingSample },
  { title: 'Fallback', payload: fallbackSample },
] as const

export default function A2UISurfaceDemo() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = samples[activeIndex]

  return (
    <>
      <div className={ax({ layout: 'row', gap: 'sm' })}>
        {samples.map((s, i) => (
          <button
            key={s.title}
            onClick={() => setActiveIndex(i)}
            className={ax({
              surface: i === activeIndex ? 'action' : 'ghost',
              controlSize: 'sm',
              tone: i === activeIndex ? 'accent' : undefined,
            })}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className={ax({ padding: 'md' })}>
          <A2UISurface payload={active.payload} />
        </div>
      </div>

      <details className={ax({ surface: 'sunken', padding: 'sm', shape: 'sm' })}>
        <summary className={ax({ textStyle: 'label', text: 'secondary' })}>A2UI JSON</summary>
        <pre className={ax({ textStyle: 'code', text: 'muted' })}>
          {JSON.stringify(active.payload, null, 2)}
        </pre>
      </details>
    </>
  )
}
