var e=`// ② 2026-04-08-a2ui-composites-prd.md
import type { A2UIRenderContext } from '../a2uiComponentMap'
import { ax } from '@styles/ax'

export function statGridRenderer({ entity }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const items = (d.items as Array<{ id?: string; value: string; label: string }>) ?? []

  if (items.length === 0) {
    return <div className={ax({ layout: 'row', gap: 'md' })} />
  }

  return (
    <div className={ax({ layout: 'row', gap: 'md' })}>
      {items.map((item, i) => (
        <div
          key={item.id ?? \`stat-\${i}\`}
          className={ax({ surface: 'display', padding: 'md', shape: 'md', flex: '1' })}
        >
          <div className={ax({ layout: 'stack', gap: 'xs' })}>
            <div className={ax({ textStyle: 'display' })}>{item.value}</div>
            <div className={ax({ textStyle: 'caption', text: 'secondary' })}>{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
`;export{e as default};