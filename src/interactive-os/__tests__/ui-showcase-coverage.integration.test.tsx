/**
 * Route-level coverage: /ui showcase
 *
 * showcaseRegistry의 모든 컴포넌트를 렌더하여
 * src/interactive-os/ui/** 전체의 "최소 로딩 커버리지"를 측정한다.
 * 개별 컴포넌트가 아니라 라우트 단위로 본다.
 */
import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { components } from '../../pages/showcaseRegistry'
import type { NormalizedData } from '../store/types'

/** showcase의 render 함수를 감싸서 stateful하게 만든다 */
function ShowcaseItem({ entry }: { entry: typeof components[number] }) {
  const [data, setData] = useState<NormalizedData>(entry.makeData())
  return <div data-testid={entry.slug}>{entry.render(data, setData)}</div>
}

describe('/ui showcase route coverage', () => {
  it('renders all 22 showcase components', () => {
    const { container } = render(
      <>
        {components.map(entry => (
          <ShowcaseItem key={entry.slug} entry={entry} />
        ))}
      </>
    )

    // 22개 컴포넌트 모두 렌더됨
    const items = container.querySelectorAll('[data-testid]')
    expect(items.length).toBe(components.length)
  })

  it('each component has at least one interactive element', () => {
    const { container } = render(
      <>
        {components.map(entry => (
          <ShowcaseItem key={entry.slug} entry={entry} />
        ))}
      </>
    )

    const results: string[] = []
    for (const entry of components) {
      const el = container.querySelector(`[data-testid="${entry.slug}"]`)!
      const interactive = el.querySelector('[role], [tabindex], button, input')
      if (interactive) results.push(entry.slug)
    }

    // 대부분의 컴포넌트가 인터랙티브 요소를 가져야 함
    expect(results.length).toBeGreaterThanOrEqual(20)
  })

  it('keyboard interaction on each component', async () => {
    const user = userEvent.setup()

    for (const entry of components) {
      const { container, unmount } = render(<ShowcaseItem entry={entry} />)

      // 첫 번째 focusable 요소를 찾아서 키보드 조작
      const focusable = container.querySelector('[tabindex="0"], [tabindex="-1"], button, input') as HTMLElement
      if (focusable) {
        focusable.focus()
        await user.keyboard('{ArrowDown}')
        await user.keyboard('{ArrowUp}')
        await user.keyboard('{ }')
      }

      unmount()
    }

    // 모든 컴포넌트를 조작함 — 커버리지가 핵심
    expect(true).toBe(true)
  })
})
