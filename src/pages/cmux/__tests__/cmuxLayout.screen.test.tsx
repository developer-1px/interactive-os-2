// V1: cmux-layout-prd.md
//
// Seo's product-level screen test for cmux layout (Wave A~D1 통합 검증).
//
// 검증 범위 — PageCmux이 실제 브라우저에서 보여주는 DOM/ARIA 변화로만 판정.
//   1) 마운트 직후 cmux 초기 레이아웃 (sidebar + 1 tabgroup + 1 tab) 이 보인다
//   2) ⌘D 로 현재 tabgroup이 split 된다 (separator 개수 증가)
//   3) ⌘T 로 focused tabgroup에 새 tab이 추가되고 그 tab이 active 된다
//   4) ⌘⇧] 로 active tab이 다음 tab으로 순환한다 (aria-selected 이동)
//   5) ⌘D 후 ⌥⌘→ 로 포커스가 우측 tabgroup으로 이동한다 (jsdom layout=none → skip)
//   6) 2 탭 상태에서 ⌘W 로 active tab이 사라진다 (role=tab 개수 -1)
//
// jsdom / happy-dom 한계로 일부 DOM 측정이 불안정할 경우에만 skip 하고 이유 주석.
// mock 호출 검증(`toHaveBeenCalled`)은 사용하지 않는다 — DOM · aria-selected · role=tab 로만 판정.

import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PageCmux from '../PageCmux'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getTablists(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="tablist"]'))
}

function getTabs(scope: HTMLElement | Document): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>('[role="tab"]'))
}

function getSelectedTabs(scope: HTMLElement | Document): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>('[role="tab"][aria-selected="true"]'))
}

function getSeparators(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[role="separator"]'))
}

/**
 * useGlobalTrap은 window에 capture-phase 'keydown' 리스너를 설치한다.
 * happy-dom에서 userEvent의 `{Meta>}d{/Meta}` 시퀀스는 modifier 전파가 불안정하므로
 * global-trap.screen.test.tsx와 동일하게 KeyboardEvent를 직접 디스패치한다.
 * 이건 우회가 아니라 "cmux 단축키 = window.keydown(metaKey=true, key='d')" 이라는
 * 실제 브라우저 계약과 동형이다.
 */
interface Modifiers { metaKey?: boolean; shiftKey?: boolean; ctrlKey?: boolean; altKey?: boolean }
function fireKey(key: string, mods: Modifiers = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods })
  window.dispatchEvent(event)
  return event
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. 마운트 — cmux 초기 레이아웃
// ─────────────────────────────────────────────────────────────────────────────

describe('cmux screen: 마운트', () => {
  it('사이드바 + 1 tabgroup + 1 탭이 active 상태로 렌더된다', () => {
    const { container } = render(<MemoryRouter><PageCmux /></MemoryRouter>)

    // 1-a. tablist 1개
    const tablists = getTablists(container)
    expect(tablists).toHaveLength(1)

    // 1-b. 그 tablist 안에 탭 1개
    const tabs = getTabs(tablists[0]!)
    expect(tabs).toHaveLength(1)

    // 1-c. aria-selected="true" 탭이 정확히 1개 (tabs 패턴 = followFocus)
    const selected = getSelectedTabs(tablists[0]!)
    expect(selected).toHaveLength(1)
    expect(selected[0]).toBe(tabs[0])

    // 1-d. WorkspaceSidebar 존재 — NavList가 컨테이너에 aria-label="Workspaces"로 렌더
    const sidebarList = container.querySelector('[aria-label="Workspaces"]')
    expect(sidebarList).not.toBeNull()

    // 1-e. Sidebar에 SessionCard(= 'Claude' 워크스페이스) 노드가 보인다
    expect(sidebarList!.textContent).toContain('Claude')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. ⌘D — split here
// ─────────────────────────────────────────────────────────────────────────────

describe('cmux screen: ⌘D split', () => {
  it('focused tabgroup이 horizontal split으로 분기되어 separator가 추가된다', () => {
    const { container } = render(<MemoryRouter><PageCmux /></MemoryRouter>)

    const separatorsBefore = getSeparators(container).length

    act(() => { fireKey('d', { metaKey: true }) })

    // splitPane은 새 tabgroup을 만든다. 빈 tg 자체는 tabgroup renderer의
    // `childIds.length === 0 → return null` 때문에 tablist를 새로 그리지는 않지만,
    // SplitPane(resizable=true)은 모든 자식 pane + 그 사이 [role="separator"]를 렌더하므로
    // separator 개수가 +1 되어야 한다. cmux-layout-prd 의 "split된 구조"를 DOM로 증명.
    const separatorsAfter = getSeparators(container).length
    expect(separatorsAfter).toBeGreaterThan(separatorsBefore)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. ⌘T — new tab in focused tabgroup
// ─────────────────────────────────────────────────────────────────────────────

describe('cmux screen: ⌘T new tab', () => {
  it('focused tabgroup의 role=tab 개수가 +1 되고 새 tab이 aria-selected=true', () => {
    const { container } = render(<MemoryRouter><PageCmux /></MemoryRouter>)

    const before = getTabs(container)
    expect(before).toHaveLength(1)
    const prevId = before[0]!.getAttribute('data-node-id')
    expect(prevId).toBeTruthy()

    act(() => { fireKey('t', { metaKey: true }) })

    const after = getTabs(container)
    expect(after.length).toBe(before.length + 1)

    // 새 탭이 active — tabs 패턴은 followFocus=true, useTabList가 initialFocus=activeTabId로
    // 설정하므로 DOM상 aria-selected=true 탭이 새로 추가된 tab이어야 한다.
    const selected = getSelectedTabs(container)
    expect(selected).toHaveLength(1)
    const activeId = selected[0]!.getAttribute('data-node-id')
    expect(activeId).toBeTruthy()
    expect(activeId).not.toBe(prevId)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. ⌘⇧] — next tab
// ─────────────────────────────────────────────────────────────────────────────

describe('cmux screen: ⌘⇧] next tab', () => {
  it('2개 탭 상태에서 active tab이 다음으로 순환한다 (aria-selected 이동)', () => {
    const { container } = render(<MemoryRouter><PageCmux /></MemoryRouter>)

    // 먼저 탭 하나 더 추가 → 2개
    act(() => { fireKey('t', { metaKey: true }) })
    expect(getTabs(container)).toHaveLength(2)

    const activeBeforeId = getSelectedTabs(container)[0]!.getAttribute('data-node-id')

    act(() => { fireKey(']', { metaKey: true, shiftKey: true }) })

    const selectedAfter = getSelectedTabs(container)
    expect(selectedAfter).toHaveLength(1)
    const activeAfterId = selectedAfter[0]!.getAttribute('data-node-id')
    expect(activeAfterId).not.toBe(activeBeforeId)
    expect(getTabs(container)).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. ⌥⌘→ — spatial focus move
// ─────────────────────────────────────────────────────────────────────────────

describe('cmux screen: ⌥⌘→ spatial focus', () => {
  // @jsdom-limit
  // focusDirCommand는 getBoundingClientRect() 로 모든 tabgroup의 rect를 수집하여
  // findBestInDirection 알고리즘을 돌린다. happy-dom/jsdom은 layout 계산을 하지 않아서
  // 모든 rect가 {x:0,y:0,w:0,h:0} 이다 → 방향 판정이 불가능 → 커맨드는 null을 반환한다.
  //
  // 이 시나리오는 브라우저에서만 유효하다. mock 호출 검증으로 대체하면 의미가 없으므로
  // skip 하고 이유를 남긴다. `computeFocusDirTarget`의 단위 테스트(순수 함수 입력 rect 배열)
  // 는 별도 엔진-레벨 테스트에서 이미 커버된다.
  it.skip('⌘D 후 ⌥⌘→ 로 포커스가 우측 tabgroup으로 이동한다 — [jsdom layout=none]', () => {
    const { container } = render(<MemoryRouter><PageCmux /></MemoryRouter>)
    act(() => { fireKey('d', { metaKey: true }) })
    act(() => { fireKey('ArrowRight', { metaKey: true, altKey: true }) })
    // 실제 브라우저: 우측 tg가 focused → 후속 ⌘T의 타겟이 바뀜. jsdom에선 검증 불가.
    expect(container).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. ⌘W — close active tab
// ─────────────────────────────────────────────────────────────────────────────

describe('cmux screen: ⌘W close tab', () => {
  it('2개 탭 상태에서 ⌘W로 active tab이 제거되어 1개로 줄어든다', () => {
    const { container } = render(<MemoryRouter><PageCmux /></MemoryRouter>)

    // 2 tab 상태 세팅
    act(() => { fireKey('t', { metaKey: true }) })
    expect(getTabs(container)).toHaveLength(2)

    const activeBeforeId = getSelectedTabs(container)[0]!.getAttribute('data-node-id')

    act(() => { fireKey('w', { metaKey: true }) })

    const tabsAfter = getTabs(container)
    expect(tabsAfter).toHaveLength(1)

    // 남은 탭의 node-id는 삭제된 active의 node-id가 아니어야 한다.
    const remainingId = tabsAfter[0]!.getAttribute('data-node-id')
    expect(remainingId).toBeTruthy()
    expect(remainingId).not.toBe(activeBeforeId)
  })
})
