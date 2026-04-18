var e=`// ② 2026-04-08-a2ui-composites-prd.md
import type { A2UIRenderContext } from '../a2uiComponentMap'
import { ax } from '@styles/ax'
import { Button } from '../Button'

export function formSectionRenderer({ entity, renderNode, depth }: A2UIRenderContext) {
  const d = entity.data as Record<string, unknown>
  const title = d.title as string | undefined
  const fields = (d.fields as string[]) ?? []
  const actions = (d.actions as Array<{ label: string; variant?: string }>) ?? []

  return (
    <div className={ax({ surface: 'raised', border: 'ring', padding: 'lg', shape: 'md' })}>
      <div className={ax({ layout: 'stack', gap: 'md' })}>
        {title && <div className={ax({ textStyle: 'section' })}>{title}</div>}
        {fields.map((childId) => (
          <div key={childId}>{renderNode(childId, depth + 1)}</div>
        ))}
        {actions.length > 0 && (
          <>
            <hr className={ax({ width: 'full' })} />
            <div className={ax({ layout: 'row', gap: 'sm' })}>
              {actions.map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant === 'primary' ? 'accent' : 'ghost'}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
`;export{e as default};