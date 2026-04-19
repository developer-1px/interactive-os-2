// ② 2026-04-04-inspector-zone-keymap-prd.md
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { InspectorWindow } from './InspectorWindow'

let inspectorWin: Window | null = null

export function openInspectorWindow(): void {
  // E2: 중복 창 방지
  if (inspectorWin && !inspectorWin.closed) {
    inspectorWin.focus()
    return
  }

  const win = window.open('', 'aria-inspector', 'width=960,height=800')
  if (!win) return

  inspectorWin = win
  win.document.title = 'Aria Inspector'

  // E5: 새 창에 필요한 CSS 주입
  const cssFiles = ['palette.css', 'reset.css', 'tokens.css', 'ax.css', 'interactive.css']
  for (const file of cssFiles) {
    const link = win.document.createElement('link')
    link.rel = 'stylesheet'
    // Resolve from Vite dev server — same origin
    const existing = document.querySelector<HTMLLinkElement>(`link[href*="${file}"]`)
    if (existing) {
      link.href = existing.href
      win.document.head.appendChild(link)
    }
  }

  // Also copy Vite-injected style tags (module CSS, ax.css compiled)
  for (const style of document.querySelectorAll('style[data-vite-dev-id]')) {
    const clone = win.document.createElement('style')
    clone.textContent = style.textContent
    clone.setAttribute('data-vite-dev-id', style.getAttribute('data-vite-dev-id') ?? '')
    win.document.head.appendChild(clone)
  }

  // Set color scheme to match main window
  win.document.documentElement.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') ?? 'dark')

  const container = win.document.createElement('div')
  container.id = 'inspector-root'
  // body height:100% 체인을 잇기 위해 container도 100% + flex column.
  // FlatLayout 루트(.ly-fill flex:1)가 이 container 안에서 viewport 높이에 캡된다.
  container.style.cssText = 'height: 100%; display: flex; flex-direction: column;'
  win.document.body.appendChild(container)

  const root = createRoot(container)
  root.render(createElement(InspectorWindow))

  win.addEventListener('beforeunload', () => {
    root.unmount()
    inspectorWin = null
  })

  // S4: 메인 창 닫힘 → inspector도 닫기
  const closeOnMainUnload = () => { win.close() }
  window.addEventListener('beforeunload', closeOnMainUnload)
}
