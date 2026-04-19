// ② 2026-03-26-unified-navigation-prd.md
import { useLocation } from 'react-router-dom'
import { AreaSidebar } from './pages/area/AreaSidebar'
import { ax } from '@styles/ax'
import PageAreaViewer from './pages/area/PageAreaViewer'

export default function InternalsLayout() {
  const { pathname } = useLocation()
  // /internals/axis/navigate → "axis/navigate"
  // /internals/overview → "overview"
  const rest = pathname.replace(/^\/internals\/?/, '') || 'overview'
  const layer = rest.split('/')[0]

  return (
    <div className={`sidebar-layout ${ax({ layout: 'row', flex: '1' })}`}>
      <AreaSidebar layer={layer} />
      <main className={`content ${ax({ flex: '1', layout: 'scroll' })}`}>
        <PageAreaViewer />
      </main>
    </div>
  )
}
