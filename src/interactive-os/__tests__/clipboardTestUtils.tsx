/**
 * Shared test utilities for clipboard integration tests.
 */
import React, { useState } from 'react'
import { ListBox } from '../ui/ListBox'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { crud } from '../plugins/crud'
import { clipboard } from '../plugins/clipboard'
import { history } from '../plugins/history'
import { Aria } from '../primitives/aria'

export function fixtureData(): NormalizedData {
  return createStore({
    entities: {
      a: { id: 'a', data: { label: 'Alpha' } },
      b: { id: 'b', data: { label: 'Bravo' } },
      c: { id: 'c', data: { label: 'Charlie' } },
      d: { id: 'd', data: { label: 'Delta' } },
    },
    relationships: {
      [ROOT_ID]: ['a', 'b', 'c', 'd'],
    },
  })
}

const plugins = [crud(), clipboard(), history()]

const renderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, _state: NodeState) => (
  <span {...props} data-testid={`item-${item.id}`}>
    <Aria.Editable field="label">
      <span>{(item.data as Record<string, unknown>)?.label as string}</span>
    </Aria.Editable>
  </span>
)

// @test-harness
export function StatefulList() {
  const [data, setData] = useState(fixtureData())
  return (
    <ListBox
      data={data}
      onChange={setData}
      plugins={plugins}
      enableEditing
      renderItem={renderItem}
    />
  )
}

export function getVisibleLabels(container: HTMLElement): string[] {
  const items = container.querySelectorAll('[data-node-id]')
  return Array.from(items)
    .filter((el) => !el.getAttribute('data-node-id')!.startsWith('__'))
    .map((el) => el.textContent?.trim() ?? '')
}

export function getNodeElement(container: HTMLElement, id: string): HTMLElement {
  return container.querySelector(`[data-node-id="${id}"]`)!
}

export function getFocusedNodeId(container: HTMLElement): string | null {
  const focused = container.querySelector('[tabindex="0"]')
  return focused?.getAttribute('data-node-id') ?? null
}
