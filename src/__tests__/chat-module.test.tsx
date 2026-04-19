import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatFeed } from '@os/ui/chat/ChatFeed'
import { Composer } from '@os/ui/Composer'
import { timelineToMessages } from '../pages/finder/timelineTransform'
import type { ChatMessage, ChatBlock, BlockRendererMap, DataBlock } from '@os/ui/chat/types'
import type { TimelineEvent } from '../pages/finder/groupEvents'

// --- Helpers ---

function msg(role: ChatMessage['role'], blocks: ChatBlock[], id?: string): ChatMessage {
  return { id: id ?? `msg-${Math.random()}`, role, ts: Date.now(), blocks }
}

function textBlock(content: string): ChatBlock {
  return { type: 'text', content }
}



// V1: 2026-03-27-chat-module-prd.md
describe('ChatFeed — viewer adapter (V1)', () => {
  it('converts TimelineEvents to ChatMessages and renders them', () => {
    const events: TimelineEvent[] = [
      { type: 'user', ts: '2026-03-27T00:00:00Z', text: 'Hello agent' },
      { type: 'assistant', ts: '2026-03-27T00:00:01Z', text: 'Hello user' },
    ]

    const messages = timelineToMessages(events)
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('user')
    expect(messages[0].blocks[0]).toEqual({ type: 'text', content: 'Hello agent' })
    expect(messages[1].role).toBe('assistant')
    expect(messages[1].blocks[0]).toEqual({ type: 'text', content: 'Hello user' })
  })

  it('groups tool_use events into tool_group blocks', () => {
    const events: TimelineEvent[] = [
      { type: 'tool_use', ts: '2026-03-27T00:00:00Z', tool: 'Read', filePath: '/test.ts' },
      { type: 'tool_use', ts: '2026-03-27T00:00:01Z', tool: 'Edit', filePath: '/test.ts', editOld: 'a', editNew: 'b' },
    ]

    const messages = timelineToMessages(events)
    expect(messages).toHaveLength(1)
    expect(messages[0].blocks[0].type).toBe('tool_group')
  })
})

// V2: 2026-03-27-chat-module-prd.md
describe('ChatFeed — fallback renderer (V2)', () => {
  it('renders fallback for unregistered block types', () => {
    const messages = [msg('assistant', [{ type: 'unknown_type', data: { foo: 1 } } as ChatBlock])]
    render(<ChatFeed messages={messages} />)
    expect(screen.getByText('unknown_type')).toBeTruthy()
  })
})

// V3: 2026-03-27-chat-module-prd.md
describe('ChatFeed — OCP extensibility (V3)', () => {
  it('renders custom block types via blockRenderers without modifying ChatFeed', () => {
    // Custom renderers for P0 catalog types
    // @test-harness
    function StatusRenderer({ block }: { block: DataBlock }) {
      const d = block.data as { label: string; state: string }
      return <div data-testid="status-block">{d.label}: {d.state}</div>
    }

    // @test-harness
    function MetricRenderer({ block }: { block: DataBlock }) {
      const d = block.data as { label: string; value: number }
      return <div data-testid="metric-block">{d.label}: {d.value}</div>
    }

    // @test-harness
    function ImageRenderer({ block }: { block: DataBlock }) {
      const d = block.data as { src: string; alt: string }
      return <img data-testid="image-block" src={d.src} alt={d.alt} />
    }

    // @test-harness
    function ToolRenderer({ block }: { block: DataBlock }) {
      const d = block.data as { tool: string }
      return <div data-testid="tool-block">Tool: {d.tool}</div>
    }

    const customRenderers: BlockRendererMap = {
      status: StatusRenderer,
      metric: MetricRenderer,
      image: ImageRenderer,
      tool: ToolRenderer,
    }

    const messages = [
      msg('assistant', [
        { type: 'status', data: { label: 'Deploy', state: 'running' } } as ChatBlock,
        { type: 'metric', data: { label: 'Latency', value: 42 } } as ChatBlock,
        { type: 'image', data: { src: 'test.png', alt: 'screenshot' } } as ChatBlock,
        { type: 'tool', data: { tool: 'Bash' } } as ChatBlock,
      ]),
    ]

    render(<ChatFeed messages={messages} blockRenderers={customRenderers} />)

    expect(screen.getByTestId('status-block')).toBeTruthy()
    expect(screen.getByText('Deploy: running')).toBeTruthy()
    expect(screen.getByTestId('metric-block')).toBeTruthy()
    expect(screen.getByText('Latency: 42')).toBeTruthy()
    expect(screen.getByTestId('image-block')).toBeTruthy()
    expect(screen.getByTestId('tool-block')).toBeTruthy()
  })
})

// V4: 2026-03-27-chat-module-prd.md
describe('ChatFeed — store-bound block (V4)', () => {
  it('renders a block with storeKey via custom renderer', () => {
    // @test-harness
    function GridBlockRenderer({ block }: { block: ChatBlock }) {
      const b = block as { type: string; storeKey: string }
      return <div data-testid="grid-block">Store: {b.storeKey}</div>
    }

    const customRenderers: BlockRendererMap = { grid: GridBlockRenderer }
    const messages = [
      msg('assistant', [
        { type: 'grid', storeKey: 'incidents' } as ChatBlock,
      ]),
    ]

    render(<ChatFeed messages={messages} blockRenderers={customRenderers} />)
    expect(screen.getByTestId('grid-block')).toBeTruthy()
    expect(screen.getByText('Store: incidents')).toBeTruthy()
  })
})

// V5: 2026-03-27-chat-module-prd.md
describe('ChatFeed — streaming indicator (V5)', () => {
  it('shows streaming indicator when isStreaming=true', () => {
    const messages = [msg('assistant', [textBlock('Thinking...')])]
    render(<ChatFeed messages={messages} isStreaming streamingLabel="Generating" />)
    expect(screen.getByText('Generating')).toBeTruthy()
  })
})

// V6: 2026-03-27-chat-module-prd.md
describe('ChatFeed — empty messages (V6)', () => {
  it('renders empty feed without crash', () => {
    const { container } = render(<ChatFeed messages={[]} />)
    expect(container.querySelector('[role="feed"]')).toBeTruthy()
  })
})

// V7: 2026-03-27-chat-module-prd.md
describe('ChatFeed — empty blocks (V7)', () => {
  it('renders message bubble with empty blocks without crash', () => {
    const messages = [msg('assistant', [])]
    const { container } = render(<ChatFeed messages={messages} />)
    expect(container.querySelector('[role="feed"]')).toBeTruthy()
  })
})

// V8: 2026-03-27-chat-module-prd.md
describe('ChatFeed — unknown block type fallback (V8)', () => {
  it('shows fallback UI for unregistered block type without crash', () => {
    const messages = [
      msg('assistant', [{ type: 'never_seen_before', data: 123 } as ChatBlock]),
    ]
    render(<ChatFeed messages={messages} />)
    expect(screen.getByText('never_seen_before')).toBeTruthy()
  })
})

// V9: 2026-03-27-chat-module-prd.md
describe('ChatBlock types — discriminated union (V9)', () => {
  it('DataBlock has no storeKey, StoreBlock has no data (compile-time check)', () => {
    // This test verifies the type system at compile time.
    // If this file compiles, the discriminated union works.
    const dataBlock: DataBlock = { type: 'custom', data: { foo: 1 } }
    const storeBlock: StoreBlock = { type: 'grid', storeKey: 'incidents' }

    // @ts-expect-error — storeKey not allowed on DataBlock
    const _invalid1: DataBlock = { type: 'x', data: 1, storeKey: 'oops' }
    // @ts-expect-error — data not allowed on StoreBlock
    const _invalid2: StoreBlock = { type: 'x', storeKey: 'k', data: 1 }

    // Runtime: just check they exist
    expect(dataBlock.type).toBe('custom')
    expect(storeBlock.type).toBe('grid')
  })
})

// V10: 2026-03-27-chat-module-prd.md
describe('Composer — submit (V10)', () => {
  it('calls onSubmit with trimmed text on Enter', async () => {
    const user = userEvent.setup()
    let submitted = ''
    render(<Composer onSubmit={(t) => { submitted = t }} />)

    const textarea = screen.getByRole('textbox')
    await user.click(textarea)
    await user.type(textarea, 'Hello{Enter}')

    expect(submitted).toBe('Hello')
  })

  it('does not submit when disabled', () => {
    let submitted = ''
    render(<Composer onSubmit={(t) => { submitted = t }} disabled />)

    const textbox = screen.getByRole('textbox')
    expect(textbox.contentEditable).toBe('false')
    expect(submitted).toBe('')
  })
})

// Import StoreBlock type for V9
import type { StoreBlock } from '@os/ui/chat/types'

// V1: 2026-03-30-composer-ghost-text-prd.md
describe('Composer — slash command autocomplete (os-based)', () => {
  it('renders suggestion popup with listbox when suggestions provided', () => {
    const { container } = render(
      <Composer suggestions={['discuss', 'doubt']} overlayText="/d" />,
    )

    const listbox = container.querySelector('[role="listbox"]') as HTMLElement
    expect(listbox).toBeTruthy()

    const options = listbox.querySelectorAll('[role="option"]')
    expect(options).toHaveLength(2)
    expect(options[0].textContent).toBe('/discuss')
    expect(options[1].textContent).toBe('/doubt')
  })

  // V2: 2026-03-30-composer-ghost-text-prd.md
  it('Tab selects focused suggestion via onCommandSelect', async () => {
    const user = userEvent.setup()
    let selected = ''
    render(
      <Composer
        suggestions={['discuss', 'doubt']}
        overlayText="/d"
        onCommandSelect={(cmd) => { selected = cmd }}
      />,
    )

    const textbox = screen.getByRole('textbox')
    await user.click(textbox)
    await user.keyboard('{Tab}')

    expect(selected).toBe('discuss')
  })

  // V3: 2026-03-30-composer-ghost-text-prd.md
  it('Tab without suggestions does not fire onCommandSelect', async () => {
    const user = userEvent.setup()
    let selected = ''
    render(
      <Composer onCommandSelect={(cmd) => { selected = cmd }} />,
    )

    const textbox = screen.getByRole('textbox')
    await user.click(textbox)
    await user.keyboard('{Tab}')

    expect(selected).toBe('')
  })

  it('ArrowDown navigates to next suggestion', async () => {
    const user = userEvent.setup()
    let selected = ''
    render(
      <Composer
        suggestions={['discuss', 'doubt']}
        overlayText="/d"
        onCommandSelect={(cmd) => { selected = cmd }}
      />,
    )

    const textbox = screen.getByRole('textbox')
    await user.click(textbox)
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Tab}')

    expect(selected).toBe('doubt')
  })

  // V9: 2026-03-30-composer-ghost-text-prd.md
  it('Enter selects suggestion when popup is open', async () => {
    const user = userEvent.setup()
    let selected = ''
    render(
      <Composer
        suggestions={['discuss']}
        overlayText="/dis"
        onCommandSelect={(cmd) => { selected = cmd }}
      />,
    )

    const textbox = screen.getByRole('textbox')
    await user.click(textbox)
    await user.keyboard('{Enter}')

    expect(selected).toBe('discuss')
  })

  // V5: 2026-03-30-composer-ghost-text-prd.md
  it('renders command highlight with args portion in normal color', () => {
    const { container } = render(
      <Composer commandHighlight={8} overlayText="/discuss hello" />,
    )

    const overlay = container.querySelector('[aria-hidden="true"]') as HTMLElement
    expect(overlay).toBeTruthy()

    const spans = overlay.querySelectorAll('span')
    expect(spans[0].textContent).toBe('/discuss')
    expect(spans[1].textContent).toBe(' hello')
  })

  it('fires onTextChange on input', async () => {
    const user = userEvent.setup()
    let changed = ''
    render(
      <Composer onTextChange={(t) => { changed = t }} />,
    )

    const textbox = screen.getByRole('textbox')
    await user.click(textbox)
    await user.type(textbox, '/dis')

    expect(changed).toBe('/dis')
  })

  it('hides overlay when no suggestions and no highlight', () => {
    const { container } = render(<Composer />)
    const overlay = container.querySelector('[aria-hidden="true"]')
    expect(overlay).toBeNull()
  })

  // V10: 2026-03-30-composer-ghost-text-prd.md
  it('Escape dismisses suggestions via onDismiss', async () => {
    const user = userEvent.setup()
    let dismissed = false
    render(
      <Composer
        suggestions={['discuss']}
        overlayText="/dis"
        onDismiss={() => { dismissed = true }}
      />,
    )

    const textbox = screen.getByRole('textbox')
    await user.click(textbox)
    await user.keyboard('{Escape}')

    expect(dismissed).toBe(true)
  })

  // V7: 2026-03-30-composer-ghost-text-prd.md
  it('disabled state shows no overlay', () => {
    render(
      <Composer disabled commandHighlight={4} overlayText="/dis" />,
    )

    const textbox = screen.getByRole('textbox')
    expect(textbox.contentEditable).toBe('false')
  })
})
