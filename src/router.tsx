import { createBrowserRouter, Navigate } from 'react-router-dom'

import AppShell from './AppShell'
import SidebarLayout from './SidebarLayout'
import { routeConfig } from './routeConfig'
import PageAreaViewer from './pages/PageAreaViewer'
import Placeholder from './pages/Placeholder'
import MdPage from './pages/MdPage'

// --- Build internals routes from routeConfig ---

function buildInternalsRoutes() {
  const routes = []

  for (const group of routeConfig) {
    routes.push({
      path: `/${group.id}`,
      element: <Navigate to={group.basePath} replace />,
    })

    for (const item of group.items) {
      routes.push({
        path: `/${group.id}/${item.path}`,
        element: item.md
          ? <MdPage md={item.md} />
          : item.component
            ? <item.component />
            : <Placeholder group={group.label} label={item.label} />,
      })
    }
  }

  routes.push({
    path: '/internals/area/*',
    element: <PageAreaViewer />,
  })

  return routes
}

// --- Router ---

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', lazy: () => import('./pages/cms/CmsLayout').then(m => ({ Component: m.default })) },
      { path: '/ui/*', lazy: () => import('./pages/PageUiShowcase').then(m => ({ Component: m.default })) },
      { path: '/viewer/*', lazy: () => import('./pages/PageViewer').then(m => ({ Component: m.default })) },
      { path: '/agent/*', lazy: () => import('./pages/PageAgentViewer').then(m => ({ Component: m.default })) },
      { path: '/internals/theme', lazy: () => import('./pages/PageThemeCreator').then(m => ({ Component: m.default })) },

      {
        element: <SidebarLayout />,
        children: buildInternalsRoutes(),
      },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
