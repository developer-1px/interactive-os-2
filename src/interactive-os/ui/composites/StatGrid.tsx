// ② 2026-04-08-a2ui-composites-prd.md
import type { A2UIRenderContext } from '../a2uiComponentMap'
import { ax } from '@styles/ax'

export function statGridRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const items = (d.items as Array<{ id?: string; value: string; label: string }>) ?? []

  if (items.length === 0) {
    return <div className={ax({ layout: 'row' })} />
  }

  return (
    <div className={ax({ layout: 'row' })}>
      {items.map((item, i) => (
        <div
          key={item.id ?? `stat-${i}`}
          className={ax({ role: 'cell', surface: 'display', flex: '1' })}
        >
          <div className={ax({ layout: 'stack' })}>
            <div className={ax({ textStyle: 'display' })}>{item.value}</div>
            <div className={ax({ textStyle: 'caption',  })}>{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
