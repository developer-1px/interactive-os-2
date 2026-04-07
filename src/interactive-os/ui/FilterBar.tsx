/** @catalog 필터 칩 바 */
import { ax } from '@styles/ax'

interface FilterChip {
  id: string
  label: string
  value?: string
  onRemove?: () => void
}

interface FilterBarProps {
  filters: FilterChip[]
  onAddFilter?: () => void
  children?: React.ReactNode
}

export function FilterBar({ filters, onAddFilter, children }: FilterBarProps) {
  return (
    <div className={ax({ recipe: 'item-sm', layout: 'bar', gap: 'xs' })}>
      {filters.map((chip) => (
        <span
          key={chip.id}
          className={ax({ recipe: 'badge', surface: 'display', border: 'default', layout: 'bar', gap: 'xs' })}
        >
          <span className={ax({ text: 'muted' })}>{chip.label}</span>
          {chip.value && (
            <>
              <span className={ax({ text: 'muted' })}>:</span>
              <span className={ax({ text: 'primary' })}>{chip.value}</span>
            </>
          )}
          {chip.onRemove && (
            <button
              type="button"
              onClick={chip.onRemove}
              className={ax({ surface: 'ghost', interactive: 'button' })}
              aria-label={`Remove ${chip.label} filter`}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {onAddFilter && (
        <button
          type="button"
          onClick={onAddFilter}
          className={ax({ recipe: 'badge', surface: 'ghost', text: 'muted', interactive: 'button' })}
        >
          +
        </button>
      )}
      {children && (
        <div className={`${ax({ layout: 'bar', gap: 'xs' })} ml-auto`}>{children}</div>
      )}
    </div>
  )
}
