/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { SpatialView } from './SpatialView'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'spatial-view',
  category: 'ui',
  label: 'SpatialView',
}

const data: NormalizedData = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Top-Left' } },
    b: { id: 'b', data: { label: 'Top-Right' } },
    c: { id: 'c', data: { label: 'Bottom-Left' } },
    d: { id: 'd', data: { label: 'Bottom-Right' } },
  },
  relationships: { [ROOT_ID]: ['a', 'b', 'c', 'd'] },
})

export function Demo() {
  return (
    <SpatialView data={data} aria-label="Spatial demo">
      {(ctx) => (
        <div className={ax({ layout: 'grid-2', gap: 'sm' })}>
          {['a', 'b', 'c', 'd'].map((id) => (
            <div
              key={id}
              {...(ctx.getNodeProps(id) as React.HTMLAttributes<HTMLDivElement>)}
              className={ax({ recipe: 'item', interactive: 'item', padding: 'md', gap: 'sm', shape: '2xs', layout: 'row', width: 'full' })}
              data-focused={ctx.getNodeState(id).focused || undefined}
            >
              {(data.entities[id]?.data as Record<string, string>)?.label}
            </div>
          ))}
        </div>
      )}
    </SpatialView>
  )
}
