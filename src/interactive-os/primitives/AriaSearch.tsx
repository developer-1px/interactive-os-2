import React, { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { ax } from '@styles/ax'
import { AriaInternalContext } from './AriaInternalContext'
import { SEARCH_ID, searchCommands } from '../plugins/search'

function AriaSearch({ placeholder = 'Search...', className }: { placeholder?: string; className?: string }) {
  const ariaCtx = React.useContext(AriaInternalContext)
  if (!ariaCtx) throw new Error('<Aria.Search> must be inside <Aria>')

  const inputRef = useRef<HTMLInputElement>(null)

  const store = ariaCtx.getStore()
  const searchEntity = store.entities[SEARCH_ID] as Record<string, unknown> | undefined
  const active = !!(searchEntity?.active)
  const filterText = (searchEntity?.filterText as string) ?? ''

  useEffect(() => {
    if (active && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [active])

  const focusFirstItem = () => {
    const container = inputRef.current?.closest('.ax-interactive') as HTMLElement | null
    if (!container) return
    const firstItem = container.querySelector<HTMLElement>('[role="row"],[role="option"],[role="treeitem"],[role="menuitem"]')
    firstItem?.focus()
  }

  const handleClear = () => {
    ariaCtx.dispatch(searchCommands.clearFilter())
    inputRef.current?.focus()
  }

  const wrapperClass = `${ax({
      role: 'control-group',
    layout: 'bar', surface: 'raised' })}${className ? ` ${className}` : ''}`

  return (
    <div className={wrapperClass}>
      <Search size={14} className={ax({ flex: 'none' })} aria-hidden />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        aria-label={placeholder}
        className={`${ax({ flex: '1' })} bg-transparent border-none outline-none`}
        value={filterText}
        onChange={(e) => {
          ariaCtx.dispatch(searchCommands.setFilter(e.target.value))
        }}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape') {
            e.preventDefault()
            ariaCtx.dispatch(searchCommands.clearFilter())
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

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let index = lower.indexOf(queryLower)
  while (index !== -1) {
    if (index > lastIndex) parts.push(text.slice(lastIndex, index))
    parts.push(<mark key={index}>{text.slice(index, index + query.length)}</mark>)
    lastIndex = index + query.length
    index = lower.indexOf(queryLower, lastIndex)
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length > 0 ? <>{parts}</> : text
}

function AriaSearchHighlight({ children }: { children: React.ReactNode }) {
  const ariaCtx = React.useContext(AriaInternalContext)
  const store = ariaCtx?.getStore()
  const filterText = (store?.entities[SEARCH_ID]?.filterText as string) ?? ''

  if (!filterText) return <>{children}</>

  return <>{React.Children.map(children, child => {
    if (typeof child === 'string') return highlightText(child, filterText)
    if (React.isValidElement(child) && (child.props as { children?: React.ReactNode }).children) {
      return React.cloneElement(child as React.ReactElement<{ children?: React.ReactNode }>, {},
        <AriaSearchHighlight>{(child.props as { children?: React.ReactNode }).children}</AriaSearchHighlight>
      )
    }
    return child
  })}</>
}

export { AriaSearch, AriaSearchHighlight }
