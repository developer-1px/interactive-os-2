import { ax } from '@styles/ax'
import { A2UISurface } from '@os/ui/A2UISurface'
import { ChatFeed } from '@os/ui/chat/ChatFeed'
import { A2UIBlock } from '@os/ui/chat/A2UIBlock'
import type { A2UIPayload } from '@os/ui/a2uiAdapter'
import type { ChatMessage } from '@os/ui/chat/types'
import type { BlockRendererMap } from '@os/ui/chat/types'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'

// ── A2UI block renderer registration ──

const a2uiRenderers: BlockRendererMap = {
  a2ui: A2UIBlock,
}

// ── A2UI Payloads ──

const dashboardLayout: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['header', 'stats', 'chart-card'] },
    { id: 'header', component: 'Text', text: 'Project Dashboard', variant: 'h3' },
    { id: 'stats', component: 'Row', children: ['stat1', 'stat2', 'stat3'] },
    { id: 'stat1', component: 'Card', child: 'stat1-content' },
    { id: 'stat1-content', component: 'Column', children: ['stat1-label', 'stat1-value'] },
    { id: 'stat1-label', component: 'Text', text: 'Active Users', variant: 'caption' },
    { id: 'stat1-value', component: 'Text', text: '2,847', variant: 'h2' },
    { id: 'stat2', component: 'Card', child: 'stat2-content' },
    { id: 'stat2-content', component: 'Column', children: ['stat2-label', 'stat2-value'] },
    { id: 'stat2-label', component: 'Text', text: 'Response Time', variant: 'caption' },
    { id: 'stat2-value', component: 'Text', text: '142ms', variant: 'h2' },
    { id: 'stat3', component: 'Card', child: 'stat3-content' },
    { id: 'stat3-content', component: 'Column', children: ['stat3-label', 'stat3-value'] },
    { id: 'stat3-label', component: 'Text', text: 'Uptime', variant: 'caption' },
    { id: 'stat3-value', component: 'Text', text: '99.97%', variant: 'h2' },
    { id: 'chart-card', component: 'Card', child: 'chart-inner' },
    { id: 'chart-inner', component: 'Column', children: ['chart-title', 'chart-placeholder'] },
    { id: 'chart-title', component: 'Text', text: 'Traffic (last 24h)', variant: 'h5' },
    { id: 'chart-placeholder', component: 'Text', text: '▁▂▃▅▇▆▅▃▂▃▅▇█▇▅▃▂▁▂▃▅▆▇▅', variant: 'h3' },
  ],
}

const taskList: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['title', 'tasks', 'add-row'] },
    { id: 'title', component: 'Text', text: 'Sprint Backlog', variant: 'h4' },
    { id: 'tasks', component: 'List', children: ['t1', 't2', 't3', 't4', 't5'], 'aria-label': 'Tasks' },
    { id: 't1', component: 'Text', text: '✅ Auth middleware rewrite', label: 'Auth middleware rewrite' },
    { id: 't2', component: 'Text', text: '✅ Database migration v3', label: 'Database migration v3' },
    { id: 't3', component: 'Text', text: '🔄 A2UI adapter integration', label: 'A2UI adapter integration' },
    { id: 't4', component: 'Text', text: '⬚ Keyboard shortcut overlay', label: 'Keyboard shortcut overlay' },
    { id: 't5', component: 'Text', text: '⬚ Dark mode refinement', label: 'Dark mode refinement' },
    { id: 'add-row', component: 'Row', children: ['add-btn'] },
    { id: 'add-btn', component: 'Button', label: '+ Add Task' },
  ],
}

const settingsForm: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['title', 'name-field', 'email-field', 'volume', 'agree', 'choices'] },
    { id: 'title', component: 'Text', text: 'Project Settings', variant: 'h4' },
    { id: 'name-field', component: 'TextField', label: 'Project Name', value: 'interactive-os' },
    { id: 'email-field', component: 'TextField', label: 'Notification Email', value: '' },
    { id: 'volume', component: 'Slider', label: 'Log Level', minValue: 0, maxValue: 4, step: 1, value: 2 },
    { id: 'agree', component: 'CheckBox', label: 'Enable telemetry' },
    { id: 'choices', component: 'ChoicePicker', label: 'Environment', options: [
      { id: 'dev', label: 'Development' },
      { id: 'staging', label: 'Staging' },
      { id: 'prod', label: 'Production' },
    ] },
  ],
}

const settingsTabs: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['tabs'] },
    { id: 'tabs', component: 'Tabs', 'aria-label': 'Settings', tabItems: [
      { title: 'General', child: 'panel-general' },
      { title: 'Build', child: 'panel-build' },
      { title: 'Deploy', child: 'panel-deploy' },
    ] },
    { id: 'panel-general', component: 'Column', children: ['gen-name', 'gen-desc'] },
    { id: 'gen-name', component: 'TextField', label: 'App Name', value: 'My App' },
    { id: 'gen-desc', component: 'TextField', label: 'Description', value: '' },
    { id: 'panel-build', component: 'Column', children: ['build-cmd', 'build-toggle'] },
    { id: 'build-cmd', component: 'TextField', label: 'Build Command', value: 'pnpm build' },
    { id: 'build-toggle', component: 'CheckBox', label: 'Enable source maps' },
    { id: 'panel-deploy', component: 'Column', children: ['deploy-target', 'deploy-btn'] },
    { id: 'deploy-target', component: 'ChoicePicker', label: 'Target', options: [
      { id: 'vercel', label: 'Vercel' },
      { id: 'aws', label: 'AWS' },
      { id: 'self', label: 'Self-hosted' },
    ] },
    { id: 'deploy-btn', component: 'Button', label: 'Deploy Now', variant: 'primary' },
  ],
}

const dataBindingProfile: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['card'] },
    { id: 'card', component: 'Card', child: 'card-inner' },
    { id: 'card-inner', component: 'Column', children: ['greeting', 'role', 'divider', 'status'] },
    { id: 'greeting', component: 'Text', text: { path: '/user/greeting' } as unknown as string, variant: 'h3' },
    { id: 'role', component: 'Text', text: { path: '/user/role' } as unknown as string },
    { id: 'divider', component: 'Divider' },
    { id: 'status', component: 'Text', text: { path: '/user/status' } as unknown as string, variant: 'caption' },
  ],
  dataModel: {
    user: {
      greeting: 'Welcome back, Alice',
      role: 'Senior Engineer — Platform Team',
      status: 'Last active 2 minutes ago',
    },
  },
}

const componentShowcase: A2UIPayload = {
  components: [
    { id: 'root', component: 'Column', children: ['title', 'row1', 'divider', 'row2'] },
    { id: 'title', component: 'Text', text: 'Component Showcase', variant: 'h4' },
    { id: 'row1', component: 'Row', children: ['card-btn', 'card-input'] },
    { id: 'card-btn', component: 'Card', child: 'btn-col' },
    { id: 'btn-col', component: 'Column', children: ['btn-label', 'btn-primary', 'btn-ghost'] },
    { id: 'btn-label', component: 'Text', text: 'Buttons', variant: 'h5' },
    { id: 'btn-primary', component: 'Button', label: 'Primary', variant: 'primary' },
    { id: 'btn-ghost', component: 'Button', label: 'Ghost' },
    { id: 'card-input', component: 'Card', child: 'input-col' },
    { id: 'input-col', component: 'Column', children: ['input-label', 'text-input', 'slider-input'] },
    { id: 'input-label', component: 'Text', text: 'Inputs', variant: 'h5' },
    { id: 'text-input', component: 'TextField', label: 'Search', value: '' },
    { id: 'slider-input', component: 'Slider', label: 'Opacity', minValue: 0, maxValue: 100, step: 1, value: 75 },
    { id: 'divider', component: 'Divider' },
    { id: 'row2', component: 'Row', children: ['card-check', 'card-list'] },
    { id: 'card-check', component: 'Card', child: 'check-col' },
    { id: 'check-col', component: 'Column', children: ['check-label', 'check1', 'check2'] },
    { id: 'check-label', component: 'Text', text: 'Toggles', variant: 'h5' },
    { id: 'check1', component: 'CheckBox', label: 'Dark mode' },
    { id: 'check2', component: 'CheckBox', label: 'Notifications' },
    { id: 'card-list', component: 'Card', child: 'list-col' },
    { id: 'list-col', component: 'Column', children: ['list-label', 'color-list'] },
    { id: 'list-label', component: 'Text', text: 'Selection', variant: 'h5' },
    { id: 'color-list', component: 'List', children: ['red', 'green', 'blue'], 'aria-label': 'Colors' },
    { id: 'red', component: 'Text', text: '🔴 Red', label: 'Red' },
    { id: 'green', component: 'Text', text: '🟢 Green', label: 'Green' },
    { id: 'blue', component: 'Text', text: '🔵 Blue', label: 'Blue' },
  ],
}

// ── Mock chat scenario ──

const allMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    ts: 0,
    blocks: [{ type: 'text', content: '프로젝트 대시보드를 만들어줘' }],
  },
  {
    id: 'msg-2',
    role: 'assistant',
    ts: 0,
    blocks: [
      { type: 'text', content: '대시보드를 만들었습니다. 핵심 지표 3개와 트래픽 차트를 배치했어요.' },
      { type: 'a2ui', data: dashboardLayout },
    ],
  },
  {
    id: 'msg-3',
    role: 'user',
    ts: 0,
    blocks: [{ type: 'text', content: '스프린트 백로그도 추가해줘' }],
  },
  {
    id: 'msg-4',
    role: 'assistant',
    ts: 0,
    blocks: [
      { type: 'text', content: '백로그 목록을 만들었습니다. ↑↓ 키로 탐색하고 Space로 선택할 수 있어요.' },
      { type: 'a2ui', data: taskList },
    ],
  },
  {
    id: 'msg-5',
    role: 'user',
    ts: 0,
    blocks: [{ type: 'text', content: '프로젝트 설정 폼을 만들어줘' }],
  },
  {
    id: 'msg-6',
    role: 'assistant',
    ts: 0,
    blocks: [
      { type: 'text', content: '설정 폼입니다. 텍스트 필드, 슬라이더, 체크박스, 라디오 그룹 — 모두 키보드로 조작 가능합니다.' },
      { type: 'a2ui', data: settingsForm },
    ],
  },
  {
    id: 'msg-7',
    role: 'user',
    ts: 0,
    blocks: [{ type: 'text', content: '섹션별로 탭으로 나눠줘' }],
  },
  {
    id: 'msg-8',
    role: 'assistant',
    ts: 0,
    blocks: [
      { type: 'text', content: 'General / Build / Deploy 3개 탭으로 분리했습니다. ←→ 키로 탭을 전환하세요.' },
      { type: 'a2ui', data: settingsTabs },
    ],
  },
  {
    id: 'msg-9',
    role: 'user',
    ts: 0,
    blocks: [{ type: 'text', content: '사용자 프로필 카드를 데이터 바인딩으로 만들어봐' }],
  },
  {
    id: 'msg-10',
    role: 'assistant',
    ts: 0,
    blocks: [
      { type: 'text', content: 'dataModel에서 JSON Pointer로 값을 바인딩했습니다. 서버 데이터가 바뀌면 UI도 자동 반영됩니다.' },
      { type: 'a2ui', data: dataBindingProfile },
    ],
  },
]

// ── Progressive message reveal hook ──

function useProgressiveReveal(messages: ChatMessage[], intervalMs: number) {
  const [count, setCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(() => {
    setCount(0)
  }, [])

  useEffect(() => {
    if (count >= messages.length) return
    // First user message appears instantly
    if (count === 0) {
      setCount(1)
      return
    }
    timerRef.current = setTimeout(() => {
      setCount(c => c + 1)
    }, intervalMs)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [count, messages.length, intervalMs])

  const visible = useMemo(() => messages.slice(0, count), [messages, count])
  const isStreaming = count < messages.length && count > 0 && count % 2 === 1

  return { visible, isStreaming, restart: start, done: count >= messages.length }
}

// ── Samples for direct rendering ──

const samples = [
  { title: 'Dashboard', payload: dashboardLayout },
  { title: 'Task List', payload: taskList },
  { title: 'Form', payload: settingsForm },
  { title: 'Tabs', payload: settingsTabs },
  { title: 'Data Binding', payload: dataBindingProfile },
  { title: 'Showcase', payload: componentShowcase },
] as const

type ViewMode = 'chat' | 'components'

export default function PageA2UI() {
  const [mode, setMode] = useState<ViewMode>('chat')
  const [activeIndex, setActiveIndex] = useState(0)
  const active = samples[activeIndex]

  const { visible, isStreaming, restart, done } = useProgressiveReveal(allMessages, 1200)

  return (
    <div className={ax({ layout: 'scroll', padding: 'lg', gap: 'lg' })}>
      <div className={ax({ layout: 'stack', gap: 'sm' })}>
        <h1 className={ax({ textStyle: 'page', text: 'bright' })}>A2UI Surface</h1>
        <p className={ax({ textStyle: 'body', text: 'secondary' })}>
          A2UI protocol JSON → interactive-os UI components with ARIA keyboard support
        </p>
      </div>

      <div className={ax({ layout: 'row', gap: 'sm' })}>
        <button
          onClick={() => setMode('chat')}
          className={ax({
            surface: mode === 'chat' ? 'action' : 'ghost',
            controlSize: 'sm', padding: 'sm', content: 'text',
            tone: mode === 'chat' ? 'accent' : undefined,
          })}
        >
          Agent Chat
        </button>
        <button
          onClick={() => setMode('components')}
          className={ax({
            surface: mode === 'components' ? 'action' : 'ghost',
            controlSize: 'sm', padding: 'sm', content: 'text',
            tone: mode === 'components' ? 'accent' : undefined,
          })}
        >
          Components
        </button>
        {mode === 'chat' && done && (
          <button
            onClick={restart}
            className={ax({ surface: 'ghost', controlSize: 'sm', padding: 'sm', content: 'text' })}
          >
            Replay
          </button>
        )}
      </div>

      {mode === 'chat' ? (
        <div className={ax({ surface: 'sunken', shape: 'md', flex: '1' })}>
          <ChatFeed
            messages={visible}
            blockRenderers={a2uiRenderers}
            isStreaming={isStreaming}
            streamingLabel="Generating UI"
          />
        </div>
      ) : (
        <>
          <div className={ax({ layout: 'row', gap: 'sm' })}>
            {samples.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setActiveIndex(i)}
                className={ax({
                  surface: i === activeIndex ? 'action' : 'ghost',
                  controlSize: 'sm', padding: 'sm', content: 'text',
                  tone: i === activeIndex ? 'accent' : undefined,
                })}
              >
                {s.title}
              </button>
            ))}
          </div>

          <div className={ax({ surface: 'display', padding: 'lg', shape: 'md' })}>
            <A2UISurface payload={active.payload} />
          </div>

          <details className={ax({ surface: 'sunken', padding: 'sm', shape: 'sm' })}>
            <summary className={ax({ textStyle: 'label', text: 'secondary' })}>A2UI JSON</summary>
            <pre className={ax({ textStyle: 'code', text: 'muted' })}>
              {JSON.stringify(active.payload, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  )
}
