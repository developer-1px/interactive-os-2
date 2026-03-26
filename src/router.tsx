// ② 2026-03-26-unified-navigation-prd.md
import { createBrowserRouter, Navigate } from 'react-router-dom'

import AppShell from './AppShell'
import InternalsLayout from './InternalsLayout'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', lazy: () => import('./pages/cms/CmsLayout').then(m => ({ Component: m.default })) },
      { path: '/ui/*', lazy: () => import('./pages/PageUiShowcase').then(m => ({ Component: m.default })) },
      { path: '/viewer/*', lazy: () => import('./pages/PageViewer').then(m => ({ Component: m.default })) },
      { path: '/agent/*', lazy: () => import('./pages/PageAgentViewer').then(m => ({ Component: m.default })) },
      { path: '/i18n', lazy: () => import('./pages/PageI18nEditor').then(m => ({ Component: m.default })) },
      { path: '/incident', lazy: () => import('./pages/PageIncidentInterface').then(m => ({ Component: m.default })) },
      { path: '/internals/theme', lazy: () => import('./pages/PageThemeCreator').then(m => ({ Component: m.default })) },

      {
        path: '/internals/*',
        element: <InternalsLayout />,
      },

      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
