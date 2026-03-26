// ② 2026-03-26-unified-navigation-prd.md
import { useLocation } from 'react-router-dom'
import MdPage from './MdPage'

export default function PageAreaViewer() {
  const { pathname } = useLocation()
  const md = pathname.replace(/^\/internals\/?/, '') || 'overview'

  return <MdPage md={md} />
}
