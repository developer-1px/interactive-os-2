/**
 * Test: ActivityBar focus + click navigation
 */
import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom'
import AppShell from '../AppShell'

let currentPath = '/'

// @test-harness — router location tracking requires component inside RouterProvider
function LocationTracker() {
  const { pathname } = useLocation()
  // eslint-disable-next-line react-hooks/globals -- test-only location tracker
  currentPath = pathname
  return null
}

function renderAtPath(path: string) {
  const router = createMemoryRouter(
    [{ element: <AppShell />, children: [{ path: '*', element: <LocationTracker /> }] }],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

describe('ActivityBar focus on initial load', () => {
  it('/ — exactly one item has --active class', async () => {
    const { container } = renderAtPath('/')
    await waitFor(() => {
      const activeItems = container.querySelectorAll('.item-indicator--active-rail')
      expect(activeItems.length).toBe(1)
    })
  })
})

describe('ActivityBar click navigation', () => {
  it('clicking an item navigates to its route', async () => {
    const user = userEvent.setup()
    const { container } = renderAtPath('/')

    // Find the "finder" item by data-node-id
    const finderItem = container.querySelector('[data-node-id="finder"]') as HTMLElement
    expect(finderItem).not.toBeNull()

    await user.click(finderItem)

    // Verify route changed — the user sees a different page
    await waitFor(() => {
      expect(currentPath).toBe('/finder')
    })
  })
})
