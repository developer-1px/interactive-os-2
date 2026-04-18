import { createBrowserRouter, Navigate } from 'react-router-dom'
import PublicShell from './PublicShell'

const base = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export const publicRouter = createBrowserRouter(
  [
    {
      element: <PublicShell />,
      children: [
        { index: true, lazy: () => import('./pages/public/PagePublicLanding').then(m => ({ Component: m.default })) },
        { path: 'ui/*', lazy: () => import('./pages/showcase/PageUiShowcase').then(m => ({ Component: m.default })) },
        { path: 'catalog', lazy: () => import('./pages/catalog/PageCatalog').then(m => ({ Component: m.default })) },
        { path: 'ax-principles', lazy: () => import('./pages/ax-principles/PageAxPrinciples').then(m => ({ Component: m.default })) },
        { path: 'showcase/gmail', lazy: () => import('./pages/showcase/gmail/PageGmail').then(m => ({ Component: m.default })) },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: base },
)
