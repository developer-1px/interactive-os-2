import { describe, it, expect } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import { useState } from 'react'
import { Aria } from '../primitives/aria'
import { listbox } from '../pattern/listbox'
import { core } from '../plugins/core'
import { rename, renameCommands } from '../plugins/rename'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

const plugins = [core(), rename()]

function TestListBox({ initialData, keyMap }: {
  initialData: NormalizedData
  keyMap?: Record<string, (ctx: import('../axis/types').PatternContext) => import('../engine/types').Command | void>
}) {
  const [data, setData] = useState(initialData)
  return (
    <Aria behavior={listbox()} data={data} plugins={plugins} onChange={setData} keyMap={keyMap}>
      <Aria.Item render={(props, node: Record<string, unknown>, _state: NodeState) => (
        <div {...props} data-testid={`item-${node.id}`}>
          <Aria.Editable field="label" placeholder="Enter text...">
            <span>{(node.data as Record<string, unknown>)?.label as string}</span>
          </Aria.Editable>
        </div>
      )} />
    </Aria>
  )
}

describe('Aria.Editable placeholder', () => {
  it('renders data-placeholder attribute when placeholder prop is provided', () => {
    const store = createStore({
      entities: { a: { id: 'a', data: { label: 'Alpha' } } },
      relationships: { [ROOT_ID]: ['a'] },
    })
    const { container } = render(<TestListBox initialData={store} />)
    const wrapper = container.querySelector('[data-node-id="a"] span')
    expect(wrapper?.getAttribute('data-placeholder')).toBe('Enter text...')
  })

  it('does not render data-placeholder when prop is omitted', () => {
    const store = createStore({
      entities: { a: { id: 'a', data: { label: 'Alpha' } } },
      relationships: { [ROOT_ID]: ['a'] },
    })
    function NoPlaceholder() {
      const [data, setData] = useState(store)
      return (
        <Aria behavior={listbox()} data={data} plugins={plugins} onChange={setData}>
          <Aria.Item render={(props, node: Record<string, unknown>, _state) => (
            <Aria.Editable {...props} field="label">
              <span>{(node.data as Record<string, unknown>)?.label as string}</span>
            </Aria.Editable>
          )} />
        </Aria>
      )
    }
    const { container } = render(<NoPlaceholder />)
    const wrapper = container.querySelector('[data-node-id="a"] span')
    expect(wrapper?.hasAttribute('data-placeholder')).toBe(false)
  })

  it('data-placeholder persists on contenteditable span during rename', () => {
    const store = createStore({
      entities: { a: { id: 'a', data: { label: 'Alpha' } } },
      relationships: { [ROOT_ID]: ['a'] },
    })
    const keyMap = {
      F2: (ctx: import('../axis/types').PatternContext) => renameCommands.startRename(ctx.focused),
    }
    const { container } = render(<TestListBox initialData={store} keyMap={keyMap} />)
    const node = container.querySelector('[data-node-id="a"]')!
    act(() => { fireEvent.keyDown(node, { key: 'F2' }) })

    const editable = container.querySelector('[contenteditable]')
    expect(editable?.getAttribute('data-placeholder')).toBe('Enter text...')
  })
})
