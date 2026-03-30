// @test-harness — birdseye 화면 수준 검증
// PRD: 2026-03-30-birdseye-improve-prd.md
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { TreeNode } from '../pages/viewer/fsClient'

// ── Fixture: 미니 프로젝트 트리 ──

const ROOT = '/test/project'

// 루트에 하위 폴더 3개를 가진 "src" 디렉토리 — 첫 폴더 자동 선택 시 src가 선택됨
const mockTree: TreeNode[] = [
  {
    id: `${ROOT}/src`, name: 'src', type: 'directory', children: [
      {
        id: `${ROOT}/src/alpha`, name: 'alpha', type: 'directory', children: [
          { id: `${ROOT}/src/alpha/core.ts`, name: 'core.ts', type: 'file', loc: 200 },
          { id: `${ROOT}/src/alpha/types.ts`, name: 'types.ts', type: 'file', loc: 30 },
        ],
      },
      {
        id: `${ROOT}/src/beta`, name: 'beta', type: 'directory', children: [
          { id: `${ROOT}/src/beta/main.ts`, name: 'main.ts', type: 'file', loc: 150 },
          { id: `${ROOT}/src/beta/index.ts`, name: 'index.ts', type: 'file', loc: 10 },
        ],
      },
      {
        id: `${ROOT}/src/gamma`, name: 'gamma', type: 'directory', children: [
          { id: `${ROOT}/src/gamma/app.tsx`, name: 'app.tsx', type: 'file', loc: 300 },
        ],
      },
    ],
  },
]

const mockDepCounts: Record<string, { imports: number; importedBy: number }> = {
  [`${ROOT}/src/alpha/core.ts`]: { imports: 0, importedBy: 3 },
  [`${ROOT}/src/alpha/types.ts`]: { imports: 0, importedBy: 5 },
  [`${ROOT}/src/beta/main.ts`]: { imports: 2, importedBy: 1 },
  [`${ROOT}/src/beta/index.ts`]: { imports: 1, importedBy: 0 },
  [`${ROOT}/src/gamma/app.tsx`]: { imports: 3, importedBy: 0 },
}

// edges: gamma→beta→alpha (gamma가 beta를 import, beta가 alpha를 import)
// 위상 정렬 결과: alpha, beta, gamma
const mockFolderDeps = {
  dirs: ['alpha', 'beta', 'gamma'],
  edges: [
    { from: 'gamma', to: 'beta' },
    { from: 'beta', to: 'alpha' },
  ],
}

// ── Mock ──

vi.mock('../pages/viewer/types', () => ({ DEFAULT_ROOT: '/test/project' }))

function mockFetch(url: string): Promise<Response> {
  const u = new URL(url, 'http://localhost')

  if (u.pathname === '/api/fs/tree') {
    return Promise.resolve(new Response(JSON.stringify(mockTree)))
  }
  if (u.pathname === '/api/fs/dep-counts') {
    return Promise.resolve(new Response(JSON.stringify(mockDepCounts)))
  }
  if (u.pathname === '/api/fs/folder-deps') {
    return Promise.resolve(new Response(JSON.stringify(mockFolderDeps)))
  }
  if (u.pathname === '/api/fs/file') {
    const path = u.searchParams.get('path') ?? ''
    if (path.endsWith('_meta.yaml')) {
      // _meta.yaml 없음 → fetch reject (catch 분기로)
      return Promise.reject(new Error('Not found'))
    }
    return Promise.resolve(new Response(`// contents of ${path}`))
  }
  if (u.pathname === '/api/fs/imports') {
    return Promise.resolve(new Response(JSON.stringify({ imports: [], importedBy: [] })))
  }

  return Promise.resolve(new Response('', { status: 404 }))
}

// ── Render helper ──

async function renderBirdseye(path = '/birdseye') {
  const BirdseyeLayout = (await import('../pages/birdseye/BirdseyeLayout')).default

  const router = createMemoryRouter(
    [{ path: '/birdseye/*', element: <BirdseyeLayout /> }],
    { initialEntries: [path] },
  )
  const result = render(<RouterProvider router={router} />)

  // 로딩 완료 대기
  await waitFor(() => {
    expect(result.container.textContent).not.toContain('Loading project')
  }, { timeout: 3000 })

  return result
}

// ── Tests ──

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn((input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    return mockFetch(url)
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('화면: Birdseye', () => {
  // V1: 컬럼이 의존 순서로 정렬
  it('F1: 컬럼이 import 의존 순서로 정렬된다 (알파벳순이 아님)', async () => {
    const { container } = await renderBirdseye()

    // 칸반 보드가 렌더링됐는지 확인 — role="group" (kanbanPreset)
    await waitFor(() => {
      const board = container.querySelector('[role="group"][data-aria-container]')
      expect(board).toBeTruthy()
      const cols = board!.querySelectorAll(':scope > div')
      expect(cols.length).toBeGreaterThanOrEqual(3)
    })

    // 컬럼 순서 확인: alpha → beta → gamma (의존 순서)
    const board = container.querySelector('[role="group"][data-aria-container]')!
    const cols = board.querySelectorAll(':scope > div')
    const colTexts = Array.from(cols).map(c => c.textContent ?? '')

    const alphaIdx = colTexts.findIndex(t => t.includes('alpha'))
    const betaIdx = colTexts.findIndex(t => t.includes('beta'))
    const gammaIdx = colTexts.findIndex(t => t.includes('gamma'))

    expect(alphaIdx).toBeGreaterThanOrEqual(0)
    expect(betaIdx).toBeGreaterThanOrEqual(0)
    expect(gammaIdx).toBeGreaterThanOrEqual(0)
    expect(alphaIdx).toBeLessThan(betaIdx)
    expect(betaIdx).toBeLessThan(gammaIdx)
  })

  // V3: treemap 토글 시 블록 표시
  it('F2: treemap 토글로 LOC 비례 블록이 표시된다', async () => {
    const user = userEvent.setup()
    const { container } = await renderBirdseye()

    // treemap 토글 버튼 찾기
    const toggleBtn = container.querySelector('[title="Treemap view"]') as HTMLElement
    expect(toggleBtn).toBeTruthy()

    await user.click(toggleBtn)

    // treemap이 렌더링됨
    await waitFor(() => {
      const treemap = container.querySelector('[aria-label*="treemap"]')
      expect(treemap).toBeTruthy()
    })

    // treemap 안에 블록(button)이 존재 (선택된 폴더의 파일들)
    const treemap = container.querySelector('[aria-label*="treemap"]')!
    const blocks = treemap.querySelectorAll('button')
    expect(blocks.length).toBeGreaterThan(0)
  })

  // V4: treemap 블록 클릭 → 칸반 모드로 전환
  it('F2: treemap 블록 클릭 시 칸반 모드로 돌아온다', async () => {
    const user = userEvent.setup()
    const { container } = await renderBirdseye()

    // treemap으로 전환
    const toggleBtn = container.querySelector('[title="Treemap view"]') as HTMLElement
    await user.click(toggleBtn)

    await waitFor(() => {
      expect(container.querySelector('[aria-label*="treemap"]')).toBeTruthy()
    })

    // 첫 번째 블록 클릭
    const block = container.querySelector('[aria-label*="treemap"] button') as HTMLElement
    await user.click(block)

    // 칸반 모드로 복귀 — treemap이 사라지고 토글 버튼이 "Kanban view"로 바뀜
    await waitFor(() => {
      expect(container.querySelector('[aria-label*="treemap"]')).toBeFalsy()
      expect(container.querySelector('[title="Treemap view"]')).toBeTruthy()
    })
  })
})
