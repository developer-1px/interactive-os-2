// L0: @layer 순서 선언 — 모든 import 보다 먼저 평가되어야 component layer 가 reset 보다 후순위 등록됨
import './styles/layers.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

// 배포 빌드(GITHUB_PAGES=true)는 디자인 시스템 + 목업만 노출.
// BASE_URL이 '/'가 아니면 public mode로 간주 (tree-shaking으로 미사용 router는 제거됨).
const isPublic = import.meta.env.BASE_URL !== '/'

async function boot() {
  const router = isPublic
    ? (await import('./routerPublic')).publicRouter
    : (await import('./router')).router

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

boot()
