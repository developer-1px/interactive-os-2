import { useMemo } from 'react'
import { Sun, Moon } from 'lucide-react'
import { ax } from '@styles/ax'
import { useStore } from '@os/store/useStore'
import './PageThemeCreator.css'
import { TabList } from '@os/ui/TabList'
import { createStore } from '@os/store/createStore'
import { urlSync, getInitialTabFromUrl } from '@os/plugins/urlSync'
import { useTheme } from '../../hooks/useTheme'
import { ThemeTokens } from './ThemeTokens'
import { ThemeAxes } from './ThemeAxes'
import { ThemeComponents } from './ThemeComponents'
import { ThemeScenarios } from './ThemeScenarios'

/* ══ Tab data ══ */

function createTabData() {
  const initialTab = getInitialTabFromUrl() ?? 'tokens'
  return createStore({
    entities: {
      tokens: { id: 'tokens', data: { label: 'Tokens' } },
      axes: { id: 'axes', data: { label: 'Axes' } },
      components: { id: 'components', data: { label: 'Components' } },
      scenarios: { id: 'scenarios', data: { label: 'Scenarios' } },
      __selection__: { id: '__selection__', data: { selectedIds: [initialTab] } },
    },
    relationships: { __root__: ['tokens', 'axes', 'components', 'scenarios'] },
  })
}

/* ══ Theme Panel ══ */

function ThemePanel() {
  const { theme, toggle } = useTheme()
  return (
    <div className={ax({ surface: 'display', layout: 'stack', gap: 'sm', padding: 'md', shape: 'lg', flex: 'none' })}>
      <span className={ax({ textStyle: 'overline', text: 'muted' })}>THEME</span>
      <div className={ax({ layout: 'spread' })}>
        <span className={ax({ textStyle: 'body', text: 'secondary' })}>Appearance</span>
        <button
          className={ax({ role: 'control', surface: 'action', content: 'text', tone: 'neutral' })}
          onClick={toggle}
        >
          {theme === 'dark' ? <><Moon size={12} /> Dark</> : <><Sun size={12} /> Light</>}
        </button>
      </div>
    </div>
  )
}

/* ══ Main ══ */

export default function PageThemeCreator() {
  const initialTab = useMemo(() => getInitialTabFromUrl() ?? 'tokens', [])
  const initialData = useMemo(createTabData, [])
  const [tabs, setTabs] = useStore(initialData)

  const activeTab = useMemo(() => {
    const sel = tabs.entities.__selection__ as Record<string, unknown> | undefined
    const ids = (sel?.selectedIds as string[]) ?? []
    return ids[0] ?? 'tokens'
  }, [tabs])

  return (
    <div className={`${ax({ layout: 'stack', gap: 'lg', padding: 'xl' })} theme-root`}>
      {/* Header */}
      <div className={ax({ layout: 'spread' })}>
        <div className={ax({ layout: 'stack', gap: 'xs' })}>
          <h1 className={ax({ textStyle: 'page', text: 'primary' })}>Axis Styleguide</h1>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>12-axis MECE design system</span>
        </div>
        <ThemePanel />
      </div>

      {/* Tab bar */}
      <TabList data={tabs} onChange={setTabs} plugins={[urlSync()]} initialFocus={initialTab} aria-label="Styleguide sections" />

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
