import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tooltip } from '../ui/Tooltip'

describe('Tooltip', () => {
  it('trigger와 tooltip을 동일 id로 연결하고 popover="hint"를 렌더한다', () => {
    render(
      <Tooltip content="저장합니다">
        <button>Save</button>
      </Tooltip>,
    )

    const trigger = screen.getByRole('button', { name: 'Save' })
    const tooltip = screen.getByRole('tooltip', { hidden: true })

    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id)
    expect(trigger.getAttribute('interestfor')).toBe(tooltip.id)
    expect(tooltip.getAttribute('popover')).toBe('hint')
    expect(tooltip.textContent).toBe('저장합니다')
  })

  it('content가 빈 문자열이면 tooltip을 렌더하지 않는다', () => {
    render(
      <Tooltip content="">
        <button>Save</button>
      </Tooltip>,
    )

    const trigger = screen.getByRole('button', { name: 'Save' })
    const tooltip = screen.queryByRole('tooltip', { hidden: true })

    expect(tooltip).toBeNull()
    expect(trigger.getAttribute('interestfor')).toBeNull()
    expect(trigger.getAttribute('aria-describedby')).toBeNull()
  })

  it('children의 기존 props를 보존한다', () => {
    render(
      <Tooltip content="저장합니다">
        <button className="primary" data-testid="save-btn">
          Save
        </button>
      </Tooltip>,
    )

    const trigger = screen.getByTestId('save-btn')

    expect(trigger.className).toBe('primary')
    expect(trigger.getAttribute('interestfor')).toBeTruthy()
  })
})
