/* eslint-disable react-refresh/only-export-components */
// ② component-catalog-prd.md
import { AriaZone } from './AriaZone'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { useEngine } from '@os/engine/useEngine'
import { listbox } from '@os/pattern/roles/listbox'
import { ax } from '@styles/ax'

export const meta = {
  slug: 'aria-zone',
  category: 'ui',
  label: 'AriaZone',
}

const initialData: NormalizedData = createStore({
  entities: {
    a: { id: 'a', data: { label: 'Alpha' } },
    b: { id: 'b', data: { label: 'Bravo' } },
    c: { id: 'c', data: { label: 'Charlie' } },
  },
  relationships: { [ROOT_ID]: ['a', 'b', 'c'] },
})

export function Demo() {
  const { engine, store } = useEngine({ data: initialData })

  return (
    <AriaZone engine={engine} store={store} pattern={listbox()} scope="demo">
      {(ctx) => (
        <div {...ctx.containerProps} className={ax({ layout: 'column' })}>
          {['a', 'b', 'c'].map((id) => {
            const state = ctx.getNodeState(id)
            return (
              <div
                key={id}
                {...ctx.getNodeProps(id)}
                className={ax({ role: 'item', interactive: 'item', content: 'text', text: state.focused ? 'primary' : 'secondary', layout: 'row', width: 'full' })}
              >
                {(store.entities[id]?.data as Record<string, unknown>)?.label as string}
              </div>
            )
          })}
        </div>
      )}
    </AriaZone>
  )
}
