// ② 2026-03-26-unified-navigation-prd.md
import { createBrowserRouter, Navigate } from 'react-router-dom'

import AppShell from './AppShell'
import InternalsLayout from './InternalsLayout'

// Prefetch heavy lazy chunks on idle
const bookChunk = () => import('./pages/book/PageBookViewer')
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => { bookChunk() })
}

const ROUTER_BASE = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', lazy: () => import('./pages/cms/PageCms').then(m => ({ Component: m.default })) },
      { path: '/finder/*', lazy: () => import('./pages/finder/PageFinder').then(m => ({ Component: m.default })) },
      {
        path: '/book/*',
        lazy: async () => {
          const m = await bookChunk()
          return { Component: m.default, loader: m.loader }
        },
      },
      { path: '/chat', lazy: () => import('./pages/chat/PageAgentChat').then(m => ({ Component: m.default })) },
      { path: '/chat/entities', lazy: () => import('./pages/chat/PageChatEntities').then(m => ({ Component: m.default })) },
      { path: '/cmux/preview', lazy: () => import('./pages/cmux-preview/PageCmuxPreview').then(m => ({ Component: m.default })) },
      { path: '/replay/raw', lazy: () => import('./pages/replay/PageReplayRaw').then(m => ({ Component: m.default })) },
      { path: '/replay/inspect', lazy: () => import('./pages/replay/PageReplayInspect').then(m => ({ Component: m.default })) },
      { path: '/replay', lazy: () => import('./pages/replay/PageReplay').then(m => ({ Component: m.default })) },
      { path: '/i18n', lazy: () => import('./pages/i18n/PageI18nEditor').then(m => ({ Component: m.default })) },
      { path: '/incident', lazy: () => import('./pages/incident/PageIncidentFlat').then(m => ({ Component: m.default })) },
      { path: '/slides', lazy: () => import('./pages/slides/PageSlides').then(m => ({ Component: m.default })) },
      { path: '/internals/theme', lazy: () => import('./pages/theme/PageThemeCreator').then(m => ({ Component: m.default })) },
      { path: '/creator/*', lazy: () => import('./pages/creator/PageComponentCreator').then(m => ({ Component: m.default })) },
      { path: '/json-editor', lazy: () => import('./pages/jsonEditor/PageJsonEditor').then(m => ({ Component: m.default })) },
      { path: '/studio', lazy: () => import('./pages/studio/PageStudio').then(m => ({ Component: m.default })) },

      {
        path: '/internals/*',
        element: <InternalsLayout />,
      },

      { path: '/pipeline', lazy: () => import('./pages/pipeline/PagePipeline').then(m => ({ Component: m.default })) },
      { path: '/project', lazy: () => import('./pages/project/PageProject').then(m => ({ Component: m.default })) },
      { path: '/writer/*', lazy: () => import('./pages/writer/PageWriter').then(m => ({ Component: m.default })) },
      { path: '/stories', lazy: () => import('./pages/stories/PageStories').then(m => ({ Component: m.default })) },
      { path: '/catalog', lazy: () => import('./pages/catalog/PageCatalog').then(m => ({ Component: m.default })) },
      { path: '/features', lazy: () => import('./pages/features/PageFeatures').then(m => ({ Component: m.default })) },
      { path: '/showcase/gmail', lazy: () => import('./pages/showcase/gmail/PageGmail').then(m => ({ Component: m.default })) },
      { path: '/test/keyline', lazy: () => import('./pages/keyline/PageKeylineTest').then(m => ({ Component: m.default })) },
      { path: '/ax-principles', lazy: () => import('./pages/ax-principles/PageAxPrinciples').then(m => ({ Component: m.default })) },
      { path: '/todo', lazy: () => import('./pages/todo/PageTodo').then(m => ({ Component: m.default })) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
], { basename: ROUTER_BASE })
