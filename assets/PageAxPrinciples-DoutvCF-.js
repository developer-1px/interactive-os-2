var e=`// ⑦ /do UI — /ax-principles route entry (FlatLayout + ax Principles store)
import { useMemo } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { useEngine } from '@os/engine/useEngine'
import { definePlugin } from '@os/plugins/definePlugin'
import { axPrinciplesStore, axPrinciplesCommands } from './axPrinciplesStore'
import { axPrinciplesLayout } from './axPrinciplesDefinePage'
import { AxPrinciplesProvider } from './axPrinciplesContext'
import {
  AxPrinciplesHeader,
  AxPrinciplesMaster,
  AxPrinciplesDetail,
} from './axPrinciplesWidgets'

// ── Plugin: register axPrinciples commands into the engine ──

const axPrinciplesPlugin = definePlugin({
  name: 'axPrinciples',
  commands: {
    select: axPrinciplesCommands.select,
    setFilter: axPrinciplesCommands.setFilter,
    clearFilter: axPrinciplesCommands.clearFilter,
  },
})

// ── Widget registry ──

const axPrinciplesWidgets = createWidgetRegistry({
  AxPrinciplesHeader,
  AxPrinciplesMaster,
  AxPrinciplesDetail,
})

export default function PageAxPrinciples() {
  const { engine, store } = useEngine({
    data: axPrinciplesStore,
    plugins: [axPrinciplesPlugin],
  })

  const ctx = useMemo(() => ({ engine, store }), [engine, store])

  return (
    <AxPrinciplesProvider value={ctx}>
      <FlatLayout
        data={axPrinciplesLayout}
        registry={axPrinciplesWidgets}
        aria-label="ax Principles"
      />
    </AxPrinciplesProvider>
  )
}
`;export{e as default};