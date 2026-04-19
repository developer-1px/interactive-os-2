// @test-harness — Inspector Cmd+O 전체 코드 뷰어 요구사항 검증
// 요구사항:
// 1. Cmd+Shift+D → 인스펙터 ON (body.debug-mode-active)
// 2. 요소 클릭 → lock (LOCKED 표시)
// 3. Cmd+O → QuickLookModal 열림 (dialog[open])
// 4. ESC → 모달 닫힘 → ESC → unlock → ESC → 인스펙터 OFF
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { ComponentInspector } from '../devtools/inspector/ComponentInspector'

// QuickLookModal이 /api/fs/file을 호출하므로 fetch mock 필요
const originalFetch = globalThis.fetch
// happy-dom의 elementFromPoint가 동작하지 않으므로 mock — hover 추적용
let elementFromPointTarget: HTMLElement | null = null
const originalElementFromPoint = document.elementFromPoint.bind(document)
beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve('const x = 1;\nconst y = 2;\nconst z = 3;\n'),
  }) as unknown as typeof fetch
  document.elementFromPoint = () => elementFromPointTarget
})
afterEach(() => {
  globalThis.fetch = originalFetch
  document.elementFromPoint = originalElementFromPoint
  document.body.classList.remove('debug-mode-active')
  elementFromPointTarget = null
})

function fireKey(key: string, modifiers: { metaKey?: boolean; shiftKey?: boolean } = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...modifiers,
  })
  window.dispatchEvent(event)
  return event
}

function fireMouseMove(target: HTMLElement) {
  elementFromPointTarget = target
  const event = new MouseEvent('mousemove', { bubbles: true, clientX: 100, clientY: 100 })
  window.dispatchEvent(event)
}

function fireClick(target: HTMLElement) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: 100, clientY: 100 })
  target.dispatchEvent(event)
}

describe('Inspector Cmd+O → QuickLookModal', () => {
  it('Cmd+Shift+D → 인스펙터 ON → body에 debug-mode-active 클래스', () => {
    render(<ComponentInspector />)

    act(() => { fireKey('D', { metaKey: true, shiftKey: true }) })

    expect(document.body.classList.contains('debug-mode-active')).toBe(true)
  })

  it('인스펙터 ON → 요소 lock → Cmd+O → dialog 열림', async () => {
    // 1. data-inspector-line 속성을 가진 요소 생성
    const target = document.createElement('div')
    target.setAttribute('data-inspector-line', '/test/file.tsx:10:1')
    target.setAttribute('data-inspector-loc', '50')
    target.textContent = 'Test Element'
    document.body.appendChild(target)

    render(<ComponentInspector />)

    // 2. 인스펙터 ON
    act(() => { fireKey('D', { metaKey: true, shiftKey: true }) })
    expect(document.body.classList.contains('debug-mode-active')).toBe(true)

    // 3. hover → lock (mousemove로 hover 설정 후 click)
    act(() => { fireMouseMove(target) })
    act(() => { fireClick(target) })

    // 4. Cmd+O → QuickLookModal 열림
    act(() => { fireKey('o', { metaKey: true }) })

    // QuickLookModal이 filePath를 받으면 dialog.showModal()을 호출
    await waitFor(() => {
      const dialog = document.querySelector('dialog')
      expect(dialog).not.toBeNull()
    })

    // Cleanup
    document.body.removeChild(target)
  })

  it('hover → click → lock 상태에서 toast에 소스 경로 표시', () => {
    const target = document.createElement('div')
    target.setAttribute('data-inspector-line', '/test/file.tsx:10:1')
    target.textContent = 'Test Element'
    document.body.appendChild(target)

    render(<ComponentInspector />)

    act(() => { fireKey('D', { metaKey: true, shiftKey: true }) })
    act(() => { fireMouseMove(target) })
    act(() => { fireClick(target) })

    const toast = document.getElementById('component-inspector-toast')
    expect(toast?.textContent).toContain('/test/file.tsx')

    document.body.removeChild(target)
  })

  it('ESC 3단계: 모달 닫기 → unlock → 인스펙터 OFF', async () => {
    const target = document.createElement('div')
    target.setAttribute('data-inspector-line', '/test/file.tsx:10:1')
    target.textContent = 'Test Element'
    document.body.appendChild(target)

    render(<ComponentInspector />)

    // 인스펙터 ON → hover → lock → Cmd+O
    act(() => { fireKey('D', { metaKey: true, shiftKey: true }) })
    act(() => { fireMouseMove(target) })
    act(() => { fireClick(target) })
    act(() => { fireKey('o', { metaKey: true }) })

    await waitFor(() => {
      expect(document.querySelector('dialog')).not.toBeNull()
    })

    // ESC 1: 모달 닫기 (sourceModalFile → null)
    act(() => { fireKey('Escape') })

    // 인스펙터는 여전히 활성
    expect(document.body.classList.contains('debug-mode-active')).toBe(true)

    // ESC 2: unlock
    act(() => { fireKey('Escape') })

    // 인스펙터는 여전히 활성 (unlock만 됨)
    expect(document.body.classList.contains('debug-mode-active')).toBe(true)

    // ESC 3: 인스펙터 OFF
    act(() => { fireKey('Escape') })
    expect(document.body.classList.contains('debug-mode-active')).toBe(false)

    document.body.removeChild(target)
  })

  it('인스펙터 모드에서 앱 키바인딩 차단 (ArrowDown → defaultPrevented)', () => {
    render(<ComponentInspector />)

    // 인스펙터 ON
    act(() => { fireKey('D', { metaKey: true, shiftKey: true }) })

    // ArrowDown → 트랩으로 삼켜야 함
    let event: KeyboardEvent
    act(() => { event = fireKey('ArrowDown') })

    expect(event!.defaultPrevented).toBe(true)
  })

  it('인스펙터 모드에서 Cmd+K 등 modifier 조합도 차단', () => {
    render(<ComponentInspector />)

    act(() => { fireKey('D', { metaKey: true, shiftKey: true }) })

    let event: KeyboardEvent
    act(() => { event = fireKey('k', { metaKey: true }) })

    expect(event!.defaultPrevented).toBe(true)
  })
})
