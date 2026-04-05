import React, { useEffect, useRef } from 'react'
import { AriaInternalContext } from './AriaInternalContext'
import { SEARCH_ID, searchCommands } from '../plugins/search'

function AriaSearch({ placeholder, className }: { placeholder?: string; className?: string }) {
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

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={className}
      value={filterText}
      onChange={(e) => {
        ariaCtx.dispatch(searchCommands.setFilter(e.target.value))
      }}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape') {
          e.preventDefault()
          ariaCtx.dispatch(searchCommands.clearFilter())
          // Find the Aria container and focus a collection item
          const container = inputRef.current?.closest('.ax-interactive') as HTMLElement | null
          if (container) {
            const firstItem = container.querySelector<HTMLElement>('[role="row"],[role="option"],[role="treeitem"],[role="menuitem"],[tabindex="0"]')
            firstItem?.focus()
          }
        } else if (e.key === 'Enter') {
          e.preventDefault()
          // Focus first visible item without clearing filter
          const container = inputRef.current?.closest('.ax-interactive') as HTMLElement | null
          if (container) {
            const firstItem = container.querySelector<HTMLElement>('[role="row"],[role="option"],[role="treeitem"],[role="menuitem"]')
            firstItem?.focus()
          }
        }
      }}
    />
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
