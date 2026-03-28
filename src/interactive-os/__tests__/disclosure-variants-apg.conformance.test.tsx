// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Disclosure Variants (FAQ, Image Description)
 * https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-faq/
 * https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-image-description/
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Aria } from '../primitives/aria'
import { disclosure } from '../pattern/examples/disclosure'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'
import { extractRoleHierarchy } from './helpers/ariaTreeSnapshot'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function faqData(): NormalizedData {
  return createStore({
    entities: {
      q1: { id: 'q1', data: { name: 'What is WAI-ARIA?' } },
      q2: { id: 'q2', data: { name: 'What is WCAG?' } },
      q3: { id: 'q3', data: { name: 'How do I meet WCAG?' } },
    },
    relationships: {
      [ROOT_ID]: ['q1', 'q2', 'q3'],
    },
  })
}

function imageData(): NormalizedData {
  return createStore({
    entities: {
      img1: { id: 'img1', data: { name: 'Image 1 Description' } },
      img2: { id: 'img2', data: { name: 'Image 2 Description' } },
    },
    relationships: {
      [ROOT_ID]: ['img1', 'img2'],
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderDisclosure(data: NormalizedData) {
  return render(
    <Aria behavior={disclosure} data={data} plugins={[]}>
      <Aria.Item render={(props, item, _state: NodeState) => (
        <span {...props} data-testid={`disc-${item.id}`}>
          {(item.data as Record<string, unknown>)?.name as string}
        </span>
      )} />
    </Aria>,
  )
}

function getNode(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function isExpanded(container: HTMLElement, id: string): boolean {
  return getNode(container, id)?.getAttribute('aria-expanded') === 'true'
}

// ---------------------------------------------------------------------------
// 1. Disclosure FAQ (#20)
// ---------------------------------------------------------------------------

describe('APG Disclosure FAQ — ARIA Structure', () => {
  it('role hierarchy: group > button', () => {
    const { container } = renderDisclosure(faqData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('group')
    expect(hierarchy).toContain('button')
  })

  it('all disclosures collapsed initially', () => {
    const { container } = renderDisclosure(faqData())
    expect(isExpanded(container, 'q1')).toBe(false)
    expect(isExpanded(container, 'q2')).toBe(false)
    expect(isExpanded(container, 'q3')).toBe(false)
  })
})

describe('APG Disclosure FAQ — Keyboard', () => {
  it('Enter toggles disclosure', async () => {
    const user = userEvent.setup()
    const { container } = renderDisclosure(faqData())

    getNode(container, 'q1')!.focus()
    await user.keyboard('{Enter}')

    expect(isExpanded(container, 'q1')).toBe(true)
  })

  it('Space toggles disclosure', async () => {
    const user = userEvent.setup()
    const { container } = renderDisclosure(faqData())

    getNode(container, 'q2')!.focus()
    await user.keyboard('{ }')

    expect(isExpanded(container, 'q2')).toBe(true)
  })

  it('toggle back to collapsed', async () => {
    const user = userEvent.setup()
    const { container } = renderDisclosure(faqData())

    getNode(container, 'q1')!.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')

    expect(isExpanded(container, 'q1')).toBe(false)
  })

  it('each disclosure toggles independently', async () => {
    const user = userEvent.setup()
    const { container } = renderDisclosure(faqData())

    getNode(container, 'q1')!.focus()
    await user.keyboard('{Enter}')
    getNode(container, 'q3')!.focus()
    await user.keyboard('{Enter}')

    expect(isExpanded(container, 'q1')).toBe(true)
    expect(isExpanded(container, 'q2')).toBe(false)
    expect(isExpanded(container, 'q3')).toBe(true)
  })
})

describe('APG Disclosure FAQ — Click', () => {
  it('click toggles disclosure', async () => {
    const user = userEvent.setup()
    const { container } = renderDisclosure(faqData())

    await user.click(getNode(container, 'q1')!)

    expect(isExpanded(container, 'q1')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 2. Disclosure Image Description (#21)
// ---------------------------------------------------------------------------

describe('APG Disclosure Image Description — ARIA Structure', () => {
  it('role hierarchy matches disclosure pattern', () => {
    const { container } = renderDisclosure(imageData())
    const hierarchy = extractRoleHierarchy(container)
    expect(hierarchy).toContain('group')
    expect(hierarchy).toContain('button')
  })

  it('collapsed initially', () => {
    const { container } = renderDisclosure(imageData())
    expect(isExpanded(container, 'img1')).toBe(false)
  })
})

describe('APG Disclosure Image Description — Keyboard', () => {
  it('Enter toggles', async () => {
    const user = userEvent.setup()
    const { container } = renderDisclosure(imageData())

    getNode(container, 'img1')!.focus()
    await user.keyboard('{Enter}')

    expect(isExpanded(container, 'img1')).toBe(true)
  })
})
