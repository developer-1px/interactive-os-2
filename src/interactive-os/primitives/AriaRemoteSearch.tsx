/** Registry 기반 원격 검색 — Aria 트리 바깥에서 engine의 search plugin에 연결 */
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { Search, X } from 'lucide-react'
import { ax } from '@styles/ax'
import { getAriaActions, subscribeRegistry } from './ariaRegistry'
import { SEARCH_ID, searchCommands } from '../plugins/search'

interface AriaRemoteSearchProps {
  /** 연결할 Aria 엔진의 aria-label (registry key) */
  engineId: string
  placeholder?: string
}

export function AriaRemoteSearch({ engineId, placeholder = 'Search...' }: AriaRemoteSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  // registry 변경 시 re-render → getAriaActions가 값을 반환하도록
  const actions = useSyncExternalStore(
    subscribeRegistry,
    () => getAriaActions(engineId),
  )

  const store = useSyncExternalStore(
    actions?.subscribe ?? (() => () => {}),
    () => actions?.getStore(),
  )

  const searchEntity = store?.entities[SEARCH_ID] as Record<string, unknown> | undefined
  const active = !!(searchEntity?.active)
  const filterText = (searchEntity?.filterText as string) ?? ''

  useEffect(() => {
    if (active && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [active])

  const focusFirstItem = () => {
    const el = actions?.getElement()
    if (!el) return
    const firstItem = el.querySelector<HTMLElement>('[role="row"],[role="option"],[role="treeitem"],[role="menuitem"]')
    firstItem?.focus()
  }

  const handleClear = () => {
    actions?.dispatch(searchCommands.clearFilter())
    inputRef.current?.focus()
  }

  if (!actions) return null

  return (
    <div className={ax({
        role: 'control-group',
        layout: 'bar', surface: 'raised' })}>
      <Search size={14} className={ax({ flex: 'none' })} aria-hidden />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${ax({ flex: '1' })} bg-transparent border-none outline-none`}
        value={filterText}
        onChange={(e) => actions.dispatch(searchCommands.setFilter(e.target.value))}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape') {
            e.preventDefault()
            actions.dispatch(searchCommands.clearFilter())
            focusFirstItem()
          } else if (e.key === 'Enter') {
            e.preventDefault()
            focusFirstItem()
          }
        }}
      />
      {filterText && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={ax({ role: 'control', surface: 'ghost', layout: 'center', flex: 'none', interactive: 'button' })}
        >
          <X size={14} aria-hidden />
        </button>
      )}
      <kbd className={ax({
          role: 'badge',
        surface: 'display', textStyle: 'code', content: 'text' })}>
        {filterText ? 'ESC' : '⌘F'}
      </kbd>
    </div>
  )
}
