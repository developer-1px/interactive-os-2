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
    <div className={ax({ role: 'item', content: 'text', layout: 'bar', width: 'full' })}>
      {filters.map((chip) => (
        <span
          key={chip.id}
          className={ax({ role: 'badge', surface: 'display', content: 'text', clamp: '1' })}
        >
          <span className={ax({  })}>{chip.label}</span>
          {chip.value && (
            <>
              <span className={ax({  })}>:</span>
              <span className={ax({  })}>{chip.value}</span>
            </>
          )}
          {chip.onRemove && (
            <button
              type="button"
              onClick={chip.onRemove}
              className={ax({ role: 'control', surface: 'ghost', content: 'icon' })}
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
          className={ax({ role: 'badge', surface: 'ghost', interactive: 'button', content: 'text', clamp: '1' })}
        >
          +
        </button>
      )}
      {children && (
        <div className={`${ax({ layout: 'bar' })} ml-auto`}>{children}</div>
      )}
    </div>
  )
}
