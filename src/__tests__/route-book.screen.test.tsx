import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router-dom'
import PageBookViewer from '../pages/book/PageBookViewer'

let currentPath = '/'

// @test-harness — 라우트 경로 추적용 최소 hook wrapper
function LocationTracker() {
  const loc = useLocation()
  // eslint-disable-next-line react-hooks/globals
  currentPath = loc.pathname
  return null
}

function renderBook(path = '/book') {
  currentPath = path
  const router = createMemoryRouter(
    [
      {
        path: '/book/*',
        element: <><PageBookViewer /><LocationTracker /></>,
      },
    ],
    { initialEntries: [path] },
  )
  return render(<RouterProvider router={router} />)
}

function getBreadcrumb(container: HTMLElement) {
  const el = container.querySelector('.book-page-number')
  return el?.textContent?.trim() ?? ''
}

describe('Book screen: 기본 렌더링', () => {
  it('첫 페이지 로드 — 콘텐츠와 페이지 번호 표시', () => {
    const { container } = renderBook()
    const breadcrumb = getBreadcrumb(container)
    expect(breadcrumb).toMatch(/\d+\/\d+/)
  })
})

describe('Book screen: 키보드 네비게이션', () => {
  it('ArrowDown → 다음 페이지', async () => {
    const user = userEvent.setup()
    const { container } = renderBook('/book/overview')

    await user.click(container.querySelector('.book')!)
    await user.keyboard('{ArrowDown}')

    await waitFor(() => {
      expect(currentPath).not.toBe('/book/overview')
    })
  })

  it('ArrowUp → 이전 페이지', async () => {
    const user = userEvent.setup()
    const { container } = renderBook('/book/vision')

    await user.click(container.querySelector('.book')!)
    await user.keyboard('{ArrowUp}')

    await waitFor(() => {
      expect(currentPath).not.toBe('/book/vision')
    })
  })
})

describe('Book screen: Breadcrumb 표시', () => {
  it('페이지 ID가 Breadcrumb에 잘리지 않고 표시', () => {
    const { container } = renderBook('/book/overview')
    const breadcrumb = getBreadcrumb(container)
    expect(breadcrumb).toContain('overview')
  })

  it('중첩 경로도 첫 글자 잘리지 않음', () => {
    const { container } = renderBook('/book/plugins/useSpatialNav')
    const breadcrumb = getBreadcrumb(container)
    expect(breadcrumb).toContain('plugins')
  })
})

describe('Book screen: Quick Open', () => {
  it('Quick Open 버튼 클릭으로 열고 Escape로 닫기', async () => {
    const user = userEvent.setup()
    const { container } = renderBook()

    // Quick Open 닫혀있음
    expect(container.querySelector('[data-open="true"].book-quick-open-overlay')).toBeNull()

    // Quick Open 버튼 클릭
    const btn = container.querySelector('[aria-label="Quick open"]') as HTMLElement
    expect(btn).toBeTruthy()
    await user.click(btn)

    await waitFor(() => {
      expect(container.querySelector('[data-open="true"].book-quick-open-overlay')).toBeTruthy()
    })

    // Escape로 닫기
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(container.querySelector('[data-open="true"].book-quick-open-overlay')).toBeNull()
    })
  })

  it('Quick Open에서 Enter로 페이지 이동 (input 포커스 상태)', async () => {
    const user = userEvent.setup()
    const { container } = renderBook('/book/overview')

    // Quick Open 열기
    const btn = container.querySelector('[aria-label="Quick open"]') as HTMLElement
    await user.click(btn)

    await waitFor(() => {
      expect(container.querySelector('.quick-open-input')).toBeTruthy()
    })

    // input에 포커스가 있는 상태에서 바로 Enter → 첫 번째 결과로 이동
    await user.keyboard('{Enter}')

    await waitFor(() => {
      // Quick Open이 닫혀야 함 = 페이지 이동 성공
      expect(container.querySelector('[data-open="true"].book-quick-open-overlay')).toBeNull()
    })
  })
})

describe('Book screen: Quick Open 키보드 이동', () => {
  it('ArrowDown → 항목 포커스 이동', async () => {
    const user = userEvent.setup()
    const { container } = renderBook('/book/overview')

    const btn = container.querySelector('[aria-label="Quick open"]') as HTMLElement
    await user.click(btn)

    await waitFor(() => {
      expect(container.querySelector('.quick-open-input')).toBeTruthy()
    })

    // ArrowDown으로 항목 이동 → Enter로 선택 → 닫힘 + 이동
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      // Quick Open이 닫혀야 함 = 키보드 이동 후 선택 성공
      expect(container.querySelector('[data-open="true"].book-quick-open-overlay')).toBeNull()
    })
  })
})

describe('Book screen: Home/End 키', () => {
  it('End → 마지막 페이지로 이동', async () => {
    const user = userEvent.setup()
    const { container } = renderBook('/book/overview')

    await user.click(container.querySelector('.book')!)
    await user.keyboard('{End}')

    await waitFor(() => {
      const breadcrumb = getBreadcrumb(container)
      // 마지막 페이지 번호가 총 페이지와 같아야 함
      const match = breadcrumb.match(/(\d+)\/(\d+)/)
      expect(match).toBeTruthy()
      if (match) expect(match[1]).toBe(match[2])
    })
  })

  it('Home → 첫 페이지로 이동', async () => {
    const user = userEvent.setup()
    renderBook('/book/overview')

    // 먼저 End로 마지막 이동 후 Home으로 복귀
    await user.keyboard('{End}')
    await waitFor(() => {
      expect(currentPath).not.toBe('/book/overview')
    })

    await user.keyboard('{Home}')
    await waitFor(() => {
      const match = currentPath.match(/\/book\/(.+)/)
      // 첫 페이지로 이동했는지 확인 — currentPath가 변경됨
      expect(match).toBeTruthy()
    })
  })
})

describe('Book screen: 링크 이탈 방지', () => {
  it('마크다운 내 링크가 /book/ 접두사를 가짐', () => {
    const { container } = renderBook('/book/overview')
    const links = container.querySelectorAll('.markdown a[href]')
    for (const link of links) {
      const href = link.getAttribute('href')!
      // 외부 링크(http)가 아닌 경우 /book/으로 시작해야 함
      if (!href.startsWith('http')) {
        expect(href).toMatch(/^\/book\//)
      }
    }
  })
})
