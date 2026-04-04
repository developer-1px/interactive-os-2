// @test-harness — birdseye Mermaid viewer 화면 수준 검증
// PRD: 2026-04-04-birdseye-mermaid-prd.md
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { TreeNode } from '../pages/viewer/fsClient'

// ── Mock: fetchTree + mermaid ──

const MOCK_TREE: TreeNode[] = [
  {
    id: 'ios', name: 'interactive-os', type: 'directory', children: [
      {
        id: 'store', name: 'store', type: 'directory', children: [
          { id: 's1', name: 'NormalizedData.ts', type: 'file' },
          { id: 's2', name: 'createStore.ts', type: 'file' },
        ],
      },
      {
        id: 'engine', name: 'engine', type: 'directory', children: [
          { id: 'e1', name: 'createCommandEngine.ts', type: 'file' },
          { id: 'e2', name: 'useEngine.ts', type: 'file' },
          {
            id: 'plugins', name: 'plugins', type: 'directory', children: [
              { id: 'p1', name: 'definePlugin.ts', type: 'file' },
            ],
          },
        ],
      },
      {
        id: 'axis', name: 'axis', type: 'directory', children: [
          { id: 'a1', name: 'navigate.ts', type: 'file' },
        ],
      },
      {
        id: 'pattern', name: 'pattern', type: 'directory', children: [
          { id: 'pt1', name: 'composePattern.ts', type: 'file' },
        ],
      },
      {
        id: 'primitives', name: 'primitives', type: 'directory', children: [
          { id: 'pr1', name: 'useAria.ts', type: 'file' },
        ],
      },
      {
        id: 'ui', name: 'ui', type: 'directory', children: [
          { id: 'u1', name: 'TreeView.tsx', type: 'file' },
          { id: 'u2', name: 'ListBox.tsx', type: 'file' },
        ],
      },
    ],
  },
]

vi.mock('../pages/viewer/fsClient', () => ({
  fetchTree: vi.fn(() => Promise.resolve(MOCK_TREE)),
}))

vi.mock('mermaid', () => {
  let counter = 0
  return {
    default: {
      initialize: vi.fn(),
      render: vi.fn(() => {
        counter++
        return Promise.resolve({
          svg: `<svg id="mock-${counter}" xmlns="http://www.w3.org/2000/svg"><g class="cluster" id="store"><rect x="0" y="0" width="100" height="50"/></g><g class="cluster" id="engine"><rect x="0" y="60" width="100" height="50"/></g></svg>`,
        })
      }),
    },
  }
})

// ── Render helper ──

async function renderBirdseye(path = '/birdseye') {
  const PageBirdseye = (await import('../pages/birdseye/PageBirdseye')).default

  const router = createMemoryRouter(
    [{ path: '/birdseye/*', element: <PageBirdseye /> }],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

// ── Tests ──

afterEach(() => {
  vi.restoreAllMocks()
})

describe('화면: Birdseye Mermaid Viewer', () => {
  // V1: 2026-04-04-birdseye-mermaid-prd.md
  it('L1 다이어그램이 SVG로 렌더링된다', async () => {
    const { container } = await renderBirdseye()

    await waitFor(() => {
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    }, { timeout: 5000 })
  })

  // V5+V6: 2026-04-04-birdseye-mermaid-prd.md
  it('?layer=unknown 접속 시 KNOWN_LAYERS에 없으면 L1 fallback', async () => {
    const { container } = await renderBirdseye('/birdseye?layer=nonexistent')

    await waitFor(() => {
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    }, { timeout: 5000 })

    // breadcrumb에 layer 이름이 없음 (L1이므로 Overview만)
    expect(container.textContent).not.toContain('nonexistent')
  })

  // V3: 2026-04-04-birdseye-mermaid-prd.md
  it('breadcrumb Overview 클릭으로 L1 복귀', async () => {
    const { container } = await renderBirdseye('/birdseye?layer=engine')

    // L2 로드 대기
    await waitFor(() => {
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    }, { timeout: 5000 })

    // Overview breadcrumb 클릭
    const user = userEvent.setup()
    const overviewBtn = container.querySelector('button')
    expect(overviewBtn?.textContent).toContain('Overview')
    await user.click(overviewBtn!)

    // L1으로 복귀 — breadcrumb에 layer 이름이 사라짐
    await waitFor(() => {
      expect(container.textContent).not.toContain('engine')
    }, { timeout: 5000 })
  })
})
