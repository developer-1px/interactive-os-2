import React from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import './PageThemeCreator.css'
import { TabList } from '@os/ui/TabList'
import { createStore } from '@os/store/createStore'
import { useTheme } from '../../hooks/useTheme'
import type { NodeState } from '@os/pattern/types'
import { ThemeTokens } from './ThemeTokens'
import { ThemeAxes } from './ThemeAxes'
import { ThemeComponents } from './ThemeComponents'
import { ThemeScenarios } from './ThemeScenarios'

/* ══ Tab data ══ */

const tabData = createStore({
  entities: {
    tokens: { id: 'tokens', data: { label: 'Tokens' } },
    axes: { id: 'axes', data: { label: 'Axes' } },
    components: { id: 'components', data: { label: 'Components' } },
    scenarios: { id: 'scenarios', data: { label: 'Scenarios' } },
  },
  relationships: { __root__: ['tokens', 'axes', 'components', 'scenarios'] },
})

const renderTab = (_props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => {
  const label = (item.data as Record<string, unknown>)?.label as string
  return (
    <span className={ax({ text: state.selected ? 'primary' : 'muted', weight: state.selected ? 'semi' : undefined })}>
      {label}
    </span>
  )
}

/* ══ Theme Panel ══ */

function ThemePanel() {
  const { theme, toggle } = useTheme()
  return (
    <div className={ax({ surface: 'display', layout: 'column', gap: 'sm', padding: 'md', shape: 'lg', flex: 'none' })}>
      <span className={ax({ textStyle: 'overline', text: 'muted' })}>THEME</span>
      <div className={ax({ layout: 'spread' })}>
        <span className={ax({ textStyle: 'body', text: 'secondary' })}>Appearance</span>
        <button
          className={ax({ surface: 'action', controlSize: 'sm', padding: 'sm', content: 'text', tone: 'neutral', shape: 'xl' })}
          onClick={toggle}
        >
          {theme === 'dark' ? '☾ Dark' : '☀ Light'}
        </button>
      </div>
    </div>
  )
}

/* ══ Main ══ */

export default function PageThemeCreator() {
  const [tabs, setTabs] = React.useState(tabData)

  const activeTab = React.useMemo(() => {
    const sel = tabs.entities.__selection__ as Record<string, unknown> | undefined
    const ids = (sel?.selectedIds as string[]) ?? []
    return ids[0] ?? 'tokens'
  }, [tabs])

  return (
    <div className={`${ax({ layout: 'column', gap: 'lg', padding: 'xl' })} theme-root`}>
      {/* Header */}
      <div className={ax({ layout: 'spread' })}>
        <div className={ax({ layout: 'column', gap: 'xs' })}>
          <h1 className={ax({ textStyle: 'page', text: 'primary' })}>Axis Styleguide</h1>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>12-axis MECE design system</span>
        </div>
        <ThemePanel />
      </div>

      {/* Tab bar */}
      <TabList data={tabs} onChange={setTabs} renderItem={renderTab} aria-label="Styleguide sections" />

      {/* Tab content */}
      <div className="theme-tab-content">
        {activeTab === 'tokens' && <ThemeTokens />}
        {activeTab === 'axes' && <ThemeAxes />}
        {activeTab === 'components' && <ThemeComponents />}
        {activeTab === 'scenarios' && <ThemeScenarios />}
      </div>
    </div>
  )
}
