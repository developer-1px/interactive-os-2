// ② 2026-03-26-unified-navigation-prd.md
import { useLocation } from 'react-router-dom'
import { AreaSidebar } from './pages/area/AreaSidebar'
import PageAreaViewer from './pages/area/PageAreaViewer'

export default function InternalsLayout() {
  const { pathname } = useLocation()
  // /internals/axis/navigate → "axis/navigate"
  // /internals/overview → "overview"
  const rest = pathname.replace(/^\/internals\/?/, '') || 'overview'
  const layer = rest.split('/')[0]

  return (
    <div className="sidebar-layout flex-row flex-1 overflow-hidden">
      <AreaSidebar layer={layer} />
      <main className="content flex-1 overflow-y-auto">
        <PageAreaViewer />
      </main>
    </div>
  )
}
