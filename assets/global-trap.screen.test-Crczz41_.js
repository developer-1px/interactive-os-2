var e=`// @test-harness — useGlobalTrap 요구사항 검증
// 요구사항: 글로벌 키 트랩이 활성화되면 매칭된 키만 실행하고 나머지는 삼킨다
import { describe, it, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { useState } from 'react' // @useState-hatch — test fixture
import { useGlobalTrap, type GlobalTrapKeyMap } from '../primitives/useGlobalTrap'

// ---------------------------------------------------------------------------
// Helper: useGlobalTrap을 사용하는 최소 컴포넌트
// 핸들러가 실행되면 data-triggered 속성이 변경되어 DOM에서 관찰 가능
// ---------------------------------------------------------------------------

function TrapHost({ active, keyMap: keyMapFactory, trap }: {
  active: boolean
  keyMap: (onTrigger: (key: string) => void) => GlobalTrapKeyMap
  trap?: boolean
}) {
  const [triggered, setTriggered] = useState('') // @useState-hatch
  const keyMap = keyMapFactory((key) => setTriggered(key))
  useGlobalTrap(active, keyMap, trap !== undefined ? { trap } : undefined)
  return <div data-testid="trap-host" data-triggered={triggered} />
}

function fireKey(key: string, modifiers: { metaKey?: boolean; shiftKey?: boolean; ctrlKey?: boolean; altKey?: boolean } = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...modifiers,
  })
  window.dispatchEvent(event)
  return event
}

// ---------------------------------------------------------------------------
// 1. 트랩 모드: 매칭된 키만 실행, 나머지 삼킴
// ---------------------------------------------------------------------------

describe('useGlobalTrap — 키 트랩', () => {
  it('매칭된 키는 핸들러를 실행한다 (DOM 상태 변경)', () => {
    const { getByTestId } = render(
      <TrapHost active={true} keyMap={(onTrigger) => ({ 'Escape': () => onTrigger('escape') })} />,
    )

    act(() => { fireKey('Escape') })

    expect(getByTestId('trap-host').getAttribute('data-triggered')).toBe('escape')
  })

  it('매칭되지 않은 키는 preventDefault로 삼킨다', () => {
    const { getByTestId } = render(
      <TrapHost active={true} keyMap={(onTrigger) => ({ 'Escape': () => onTrigger('escape') })} />,
    )

    let event: KeyboardEvent
    act(() => { event = fireKey('ArrowDown') })

    expect(event!.defaultPrevented).toBe(true)
    // 핸들러는 실행되지 않음
    expect(getByTestId('trap-host').getAttribute('data-triggered')).toBe('')
  })

  it('modifier 키 조합도 트랩한다 (Cmd+K → 삼킴)', () => {
    render(
      <TrapHost active={true} keyMap={(onTrigger) => ({ 'Escape': () => onTrigger('escape') })} />,
    )

    let event: KeyboardEvent
    act(() => { event = fireKey('k', { metaKey: true }) })

    expect(event!.defaultPrevented).toBe(true)
  })

  it('modifier 키 조합이 keyMap에 있으면 실행한다 (Mod+o)', () => {
    const { getByTestId } = render(
      <TrapHost active={true} keyMap={(onTrigger) => ({ 'Mod+o': () => onTrigger('open') })} />,
    )

    act(() => { fireKey('o', { metaKey: true }) })

    expect(getByTestId('trap-host').getAttribute('data-triggered')).toBe('open')
  })

  it('Shift+문자는 소문자로 정규화하여 매칭한다 (Mod+Shift+d)', () => {
    const { getByTestId } = render(
      <TrapHost active={true} keyMap={(onTrigger) => ({ 'Mod+Shift+d': () => onTrigger('toggle') })} />,
    )

    // 실제 키보드에서 Shift+D → e.key === 'D' (대문자)
    act(() => { fireKey('D', { metaKey: true, shiftKey: true }) })

    expect(getByTestId('trap-host').getAttribute('data-triggered')).toBe('toggle')
  })

  it('active=false이면 키를 가로채지 않는다', () => {
    const { getByTestId } = render(
      <TrapHost active={false} keyMap={(onTrigger) => ({ 'Escape': () => onTrigger('escape') })} />,
    )

    let event: KeyboardEvent
    act(() => { event = fireKey('ArrowDown') })

    expect(event!.defaultPrevented).toBe(false)
    expect(getByTestId('trap-host').getAttribute('data-triggered')).toBe('')
  })

  it('modifier 단독 입력(Meta, Shift)은 무시한다', () => {
    render(
      <TrapHost active={true} keyMap={(onTrigger) => ({ 'Escape': () => onTrigger('escape') })} />,
    )

    let event: KeyboardEvent
    act(() => { event = fireKey('Meta', { metaKey: true }) })

    expect(event!.defaultPrevented).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 2. 패스스루 모드: 매칭된 키만 가로채고 나머지 통과
// ---------------------------------------------------------------------------

describe('useGlobalTrap — 패스스루 (trap: false)', () => {
  it('매칭된 키는 실행하고 preventDefault한다', () => {
    const { getByTestId } = render(
      <TrapHost active={true} keyMap={(onTrigger) => ({ 'Mod+Shift+d': () => onTrigger('toggle') })} trap={false} />,
    )

    let event: KeyboardEvent
    act(() => { event = fireKey('D', { metaKey: true, shiftKey: true }) })

    expect(getByTestId('trap-host').getAttribute('data-triggered')).toBe('toggle')
    expect(event!.defaultPrevented).toBe(true)
  })

  it('매칭되지 않은 키는 통과시킨다 (preventDefault 안 함)', () => {
    render(
      <TrapHost active={true} keyMap={() => ({ 'Mod+Shift+d': () => {} })} trap={false} />,
    )

    let event: KeyboardEvent
    act(() => { event = fireKey('ArrowDown') })

    expect(event!.defaultPrevented).toBe(false)
  })

  it('매칭되지 않은 modifier 조합도 통과시킨다', () => {
    render(
      <TrapHost active={true} keyMap={() => ({ 'Mod+Shift+d': () => {} })} trap={false} />,
    )

    let event: KeyboardEvent
    act(() => { event = fireKey('k', { metaKey: true }) })

    expect(event!.defaultPrevented).toBe(false)
  })
})
`;export{e as default};