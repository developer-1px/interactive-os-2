import { Link } from 'react-router-dom'
import { ax } from '@styles/ax'
import { PanelHeader } from '@os/ui/PanelHeader'
import { NavList } from '@os/ui/NavList'
import { Panel } from '@os/ui/panels'
import MdPage from './MdPage'
import { useShowcase } from './showcaseContext'

export function ShowcaseSidebarWidget() {
  const { sidebarData, handleActivate } = useShowcase()
  return (
    <nav className={ax({ layout: 'stack', flex: '1' })}>
      <PanelHeader axes={{ layout: 'spread' }}>UI Components</PanelHeader>
      <div className={ax({ })}>
        <Link to="/ui/progress" className={ax({ textStyle: 'caption', tone: 'accent' })}>
          Progress Dashboard
        </Link>
      </div>
      <div className={ax({ flex: '1' })}>
        <NavList data={sidebarData} onActivate={handleActivate} aria-label="UI Components" />
      </div>
    </nav>
  )
}

export function ShowcaseContentWidget() {
  const { activeSlug, mdFile } = useShowcase()
  return (
    <Panel>
      <div className={ax({ flex: '1' })}>
        {mdFile ? (
          <MdPage key={activeSlug} md={`ui/${mdFile}`} />
        ) : (
          <div className={ax({ })}>Unknown component: {activeSlug}</div>
        )}
      </div>
    </Panel>
  )
}
