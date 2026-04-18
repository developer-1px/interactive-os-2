var e=`// ② 2026-04-08-a2ui-composites-prd.md
import { useState, useMemo } from 'react'
import type { A2UIRenderContext } from '../a2uiComponentMap'
import { ax } from '@styles/ax'
import { ListBox } from '../ListBox'
import { TextInput } from '../TextInput'
import { ROOT_ID } from '@os/store/types'
import { createStore } from '@os/store/createStore'

export function SearchableListRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const searchLabel = (d.searchLabel as string) ?? 'Search'
  const ariaLabel = (d['aria-label'] as string) ?? 'List'
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const items = (d.items as Array<{ id: string; label: string; sublabel?: string }>) ?? []
    if (!query) return items
    const q = query.toLowerCase()
    return items.filter((item) =>
      item.label.toLowerCase().includes(q) ||
      (item.sublabel?.toLowerCase().includes(q) ?? false),
    )
  }, [d.items, query])

  const listStore = useMemo(() => createStore({
    entities: Object.fromEntries(
      filtered.map((item) => [
        item.id,
        { id: item.id, data: { label: item.sublabel ? \`\${item.label} — \${item.sublabel}\` : item.label } },
      ]),
    ),
    relationships: { [ROOT_ID]: filtered.map((item) => item.id) },
  }), [filtered])

  return (
    <div className={ax({ layout: 'stack', gap: 'md' })}>
      <TextInput
        aria-label={searchLabel}
        placeholder={searchLabel}
        value={query}
        onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
      />
      <hr className={ax({ width: 'full' })} />
      {filtered.length > 0 ? (
        <ListBox
          data={listStore}
          plugins={[]}
          aria-label={ariaLabel}
        />
      ) : (
        <div className={ax({ textStyle: 'caption', text: 'muted', padding: 'md' })}>
          No results
        </div>
      )}
    </div>
  )
}
`;export{e as default};