/**
 * Test: ActivityBar focus state on initial load
 */
import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import AppShell from '../AppShell'

function renderAtPath(path: string) {
  const router = createMemoryRouter(
    [{ element: <AppShell />, children: [{ path: '*', element: <div /> }] }],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

describe('ActivityBar focus on initial load', () => {
  it('/ — exactly one item has --active class', async () => {
    const { container } = renderAtPath('/')
    await waitFor(() => {
      const activeItems = container.querySelectorAll('.activity-bar__item--active')
      expect(activeItems.length).toBe(1)
    })
  })
})
