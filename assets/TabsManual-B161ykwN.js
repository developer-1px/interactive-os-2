var e=`import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { TabList } from '../../ui/TabList'
import { ax } from '@styles/ax'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'

// APG #60: Tabs with Manual Activation
// https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/

const items = [
  { id: 'nils-frahm', label: 'Nils Frahm' },
  { id: 'agnes-obel', label: 'Agnes Obel' },
  { id: 'joke', label: 'Joke' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    items.map(item => [item.id, { id: item.id, data: { label: item.label } }]),
  ),
  relationships: { [ROOT_ID]: items.map(item => item.id) },
})

const renderTab = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const label = (node.data as Record<string, unknown>)?.label as string
  return (
    <div
      {...props}
      className={\`\${ax({ textStyle: 'body', text: 'secondary', layout: 'row', interactive: 'tab' })} cursor-default\`}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      {label}
    </div>
  )
}

export function TabsManual() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <TabList
      data={store}
      plugins={[]}
      onChange={onChange}
      renderItem={renderTab}
      manual
      aria-label="Entertainment"
    />
  )
}
`;export{e as default};