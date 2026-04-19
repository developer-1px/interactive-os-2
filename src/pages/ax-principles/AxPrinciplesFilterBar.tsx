// ⑦ /do UI — filter bar for ax Principles (status / tag / priority / query)
import { useCallback } from 'react'
import { ax } from '@styles/ax'
import { FilterBar } from '@os/ui/FilterBar'
import { TextInput } from '@os/ui/TextInput'
import type { CommandEngine } from '@os/engine/createCommandEngine'
import { axPrinciplesCommands } from './axPrinciplesStore'
import { selectFilter } from './axPrinciplesState'
import type { NormalizedData } from '@os/store/types'
import type {
  PrincipleFilter, PrincipleStatus, PrincipleTag, PrinciplePriority,
} from './axPrincipleSchema'
import styles from './AxPrinciplesFilterBar.module.css'

const STATUS_OPTIONS: PrincipleStatus[] = ['Locked', 'Exposed', 'Missing', 'Conflicts', 'N/A']
const TAG_OPTIONS: PrincipleTag[] = [
  'locked', 'quantitative', 'adjusted', 'new', 'candidate', 'conditional',
]
const PRIORITY_OPTIONS: PrinciplePriority[] = ['P0', 'P1', 'P2', 'P3']

export interface AxPrinciplesFilterBarProps {
  engine: CommandEngine
  store: NormalizedData
}

export function AxPrinciplesFilterBar({ engine, store }: AxPrinciplesFilterBarProps) {
  const filter = selectFilter(store)

  const setFilter = useCallback(
    (patch: Partial<PrincipleFilter>) => {
      engine.dispatch(axPrinciplesCommands.setFilter(patch))
    },
    [engine],
  )

  const clearAll = useCallback(() => {
    engine.dispatch(axPrinciplesCommands.clearFilter())
  }, [engine])

  // Chip list — active filters
  const chips: { id: string; label: string; value?: string; onRemove: () => void }[] = []
  if (filter.status) chips.push({
    id: `status:${filter.status}`, label: 'status', value: filter.status,
    onRemove: () => setFilter({ status: undefined }),
  })
  if (filter.tag) chips.push({
    id: `tag:${filter.tag}`, label: 'tag', value: filter.tag,
    onRemove: () => setFilter({ tag: undefined }),
  })
  if (filter.priority) chips.push({
    id: `priority:${filter.priority}`, label: 'priority', value: filter.priority,
    onRemove: () => setFilter({ priority: undefined }),
  })

  const hasAny = chips.length > 0 || !!filter.query

  return (
    <div className={ax({ layout: 'stack', width: 'full' })}>
      {/* Query input */}
      <TextInput
        aria-label="Search principles"
        placeholder="Search…"
        value={filter.query ?? ''}
        onChange={(e) => setFilter({ query: (e.target as HTMLInputElement).value })}
      />

      {/* Status / Tag / Priority segmented selectors */}
      <div className={ax({ layout: 'stack' })}>
        <FilterGroup
          label="Status"
          options={STATUS_OPTIONS}
          value={filter.status}
          onChange={(v) => setFilter({ status: v })}
        />
        <FilterGroup
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={filter.priority}
          onChange={(v) => setFilter({ priority: v })}
        />
        <FilterGroup
          label="Tag"
          options={TAG_OPTIONS}
          value={filter.tag}
          onChange={(v) => setFilter({ tag: v })}
        />
      </div>

      {/* Chips */}
      {chips.length > 0 && <FilterBar filters={chips} />}

      {/* Clear-all */}
      {hasAny && (
        <button
          type="button"
          onClick={clearAll}
          className={ax({
            role: 'badge',
            surface: 'ghost',
            interactive: 'button',
            content: 'text',
            textStyle: 'caption',
          })}
        >
          Clear all
        </button>
      )}
    </div>
  )
}

// ── Segmented selector for a single filter field ──

function FilterGroup<T extends string>({
  label, options, value, onChange,
}: {
  label: string
  options: readonly T[]
  value: T | undefined
  onChange: (next: T | undefined) => void
}) {
  return (
    <div className={ax({ layout: 'stack' })}>
      <span className={ax({ textStyle: 'overline' })}>{label}</span>
      <div className={`${ax({ layout: 'bar' })} ${styles.optionsBar}`}>
        {options.map((opt) => {
          const active = value === opt
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? undefined : opt)}
              className={ax({
                role: 'badge',
                surface: active ? 'display' : 'ghost',
                tone: active ? 'accent' : 'neutral',
                interactive: 'button',
                content: 'text',
                textStyle: 'caption',
                clamp: '1',
              })}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
