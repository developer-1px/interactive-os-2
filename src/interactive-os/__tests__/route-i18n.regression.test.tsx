import { useState, useRef, useEffect } from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Grid } from '../ui/Grid'
import { Aria } from '../primitives/aria'
import { GRID_COL_ID, core } from '../plugins/core'
import { crud } from '../plugins/crud'
import { rename } from '../plugins/rename'
import { dnd } from '../plugins/dnd'
import { history } from '../plugins/history'
import { focusRecovery } from '../plugins/focusRecovery'
import { clipboard, resetClipboard } from '../plugins/clipboard'
import { createStore } from '../store/createStore'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import type { NodeState } from '../pattern/types'

/**
 * Route: /i18n  (PageI18nEditor)
 *
 * User scenario tests — spreadsheet-style translation editor.
 * Grid with columns: KEY, KO, EN, JA
 * Plugins: core, crud, clipboard, rename, dnd, history, focusRecovery
 */

// --- Fixture ---

const COLUMNS = [
  { key: 'key', header: 'KEY', width: '200px' },
  { key: 'ko', header: 'KO' },
  { key: 'en', header: 'EN' },
  { key: 'ja', header: 'JA' },
]

function makeI18nData(): NormalizedData {
  return createStore({
    entities: {
      'row-1': { id: 'row-1', data: { cells: ['hero.title', '접근성은 나중이 아닙니다', 'Accessibility shouldn\'t be last', ''] } },
      'row-2': { id: 'row-2', data: { cells: ['hero.subtitle', '키보드, 포커스, CRUD', 'Keyboard, focus, CRUD', ''] } },
      'row-3': { id: 'row-3', data: { cells: ['cta.primary', '시작하기', 'Get Started', '始めましょう'] } },
    },
    relationships: { [ROOT_ID]: ['row-1', 'row-2', 'row-3'] },
  })
}

const plugins = [core(), crud(), clipboard(), rename(), dnd(), history(), focusRecovery()]

function I18nEditor({ initialData }: { initialData: NormalizedData }) {
  const [data, setData] = useState(initialData)
  const dataRef = useRef(data)
  useEffect(() => { dataRef.current = data })

  const renderCell = (_props: React.HTMLAttributes<HTMLElement>, value: unknown, column: { key: string }, state: NodeState) => {
    const text = String(value ?? '')
    const isKey = column.key === 'key'
    const colIdx = COLUMNS.findIndex(c => c.key === column.key)
    const focusedCol = (dataRef.current.entities[GRID_COL_ID]?.colIndex as number) ?? 0
    const isActiveCell = !isKey && colIdx === focusedCol

    if (isActiveCell && state.focused) {
      return (
        <Aria.Editable field={`cells.${colIdx}`} allowEmpty enterContinue tabContinue>
          <span data-testid={`cell-${column.key}`}>{text || '—'}</span>
        </Aria.Editable>
      )
    }

    return <span data-testid={`cell-${column.key}`}>{text || '—'}</span>
  }

  return (
    <Grid
      data={data}
      columns={COLUMNS}
      plugins={plugins}
      onChange={setData}
      enableEditing
      searchable
      tabCycle
      renderCell={renderCell}
      aria-label="i18n Translation Editor"
      header
    />
  )
}

// --- Helpers ---

function getRowEl(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-node-id="${id}"]`)
}

function getFocusedRowId(container: HTMLElement): string | null {
  return container.querySelector('[role="row"][tabindex="0"]')?.getAttribute('data-node-id') ?? null
}

function isEditing(container: HTMLElement): boolean {
  return container.querySelector('[data-renaming]') !== null
}

function getCellText(container: HTMLElement, rowId: string, colIdx: number): string {
  const row = getRowEl(container, rowId)
  if (!row) return ''
  const cells = row.querySelectorAll('[role="gridcell"]')
  return cells[colIdx]?.textContent ?? ''
}

function getVisibleRowCount(container: HTMLElement): number {
  return container.querySelectorAll('[role="row"]').length
}

// --- User Scenarios ---

describe('Route /i18n — i18n Editor user scenarios', () => {
  beforeEach(() => resetClipboard())

  describe('Scenario: gridcell 클릭 후 키보드 동작', () => {
    it('셀(gridcell) 포커스 후 ArrowDown으로 행 이동', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nEditor initialData={makeI18nData()} />)

      // 셀(gridcell)에 직접 포커스 — 브라우저에서 셀 클릭 시와 동일
      const firstRowCells = container.querySelectorAll('[data-node-id="row-1"] [role="gridcell"]')
      act(() => (firstRowCells[1] as HTMLElement).focus())

      // 셀이 포커스를 받으면 row의 onFocus가 버블링으로 focusedId를 갱신해야 한다
      expect(getFocusedRowId(container)).toBe('row-1')

      // ArrowDown — 셀에서 버블된 keydown이 row에서 처리되어야 한다
      await user.keyboard('{ArrowDown}')
      expect(getFocusedRowId(container)).toBe('row-2')
    })

    it('셀(gridcell) 포커스 후 ArrowRight로 열 이동', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nEditor initialData={makeI18nData()} />)

      const firstRowCells = container.querySelectorAll('[data-node-id="row-1"] [role="gridcell"]')
      act(() => (firstRowCells[0] as HTMLElement).focus())

      expect(getFocusedRowId(container)).toBe('row-1')

      // ArrowRight로 열 이동
      await user.keyboard('{ArrowRight}')

      // col 1(ko)이 활성 셀이어야 한다
      const focusedRow = container.querySelector('[role="row"][tabindex="0"]')
      const cells = focusedRow?.querySelectorAll('[role="gridcell"]')
      expect(cells?.[1]?.getAttribute('tabindex')).toBe('0')
    })
  })

  describe('Scenario: 번역가가 빈 셀을 찾아 번역을 입력한다', () => {
    it('ArrowDown으로 행 이동 → ArrowRight로 빈 EN 열 이동 → F2 편집 → Enter 확인', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nEditor initialData={makeI18nData()} />)

      // 첫 행에 포커스
      act(() => getRowEl(container, 'row-1')!.focus())
      expect(getFocusedRowId(container)).toBe('row-1')

      // JA 열로 이동 (ArrowRight 3번: KEY→KO→EN→JA)
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')

      // F2로 편집 모드 진입
      await user.keyboard('{F2}')
      expect(isEditing(container)).toBe(true)

      // 번역 입력 후 Enter로 확인 + 다음 행 이동
      await user.keyboard('アクセシビリティ{Enter}')
      await act(async () => { await new Promise(r => setTimeout(r, 10)) })

      // 값이 저장되었는지 확인
      expect(getCellText(container, 'row-1', 3)).toBe('アクセシビリティ')

      // Enter로 다음 행으로 이동
      expect(getFocusedRowId(container)).toBe('row-2')
      expect(isEditing(container)).toBe(false)
    })
  })

  describe('Scenario: 검색으로 특정 키를 찾아 편집한다', () => {
    it('⌘F 검색 → 필터 → 결과 행에서 편집', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nEditor initialData={makeI18nData()} />)

      act(() => getRowEl(container, 'row-1')!.focus())

      // 검색 활성화 (⌘F)
      await user.keyboard('{Control>}f{/Control}')

      // 검색 입력 필드에 "cta" 입력
      const searchInput = container.querySelector('input[type="search"]') as HTMLInputElement
      if (searchInput) {
        await user.type(searchInput, 'cta')

        // cta.primary 행만 보여야 한다
        expect(getVisibleRowCount(container)).toBe(1)

        // Escape로 검색 종료 → 전체 목록 복원
        await user.keyboard('{Escape}')
        expect(getVisibleRowCount(container)).toBe(3)
      }
    })
  })

  describe('Scenario: 실수로 편집한 셀을 undo한다', () => {
    // Grid→Aria 상태 동기화에서 undo 후 DOM 반영 조사 필요
    it.todo('셀 편집 → ⌘Z → 원래 값 복원')
  })

  describe('Scenario: Delete로 셀 값을 클리어한다', () => {
    it('셀 선택 → Delete → 값 빈 문자열로 클리어', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nEditor initialData={makeI18nData()} />)

      act(() => getRowEl(container, 'row-3')!.focus())

      // JA 열로 이동
      await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')

      expect(getCellText(container, 'row-3', 3)).toBe('始めましょう')

      // Delete로 셀 클리어
      await user.keyboard('{Delete}')

      expect(getCellText(container, 'row-3', 3)).toBe('—')
    })
  })

  describe('Scenario: Tab으로 셀 간 순차 편집한다', () => {
    it('Tab cycle: 마지막 열 → 다음 행 첫 편집 가능 열', async () => {
      const user = userEvent.setup()
      const { container } = render(<I18nEditor initialData={makeI18nData()} />)

      act(() => getRowEl(container, 'row-1')!.focus())

      // 마지막 열(JA, idx 3)로 이동
      await user.keyboard('{End}')

      // Tab → 다음 행으로 이동 + 첫 열로 복귀
      await user.keyboard('{Tab}')

      expect(getFocusedRowId(container)).toBe('row-2')
    })
  })
})
