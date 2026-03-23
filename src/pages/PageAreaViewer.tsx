import { useLocation } from 'react-router-dom'
import MdPage from './MdPage'

export default function PageAreaViewer() {
  const { pathname } = useLocation()
  const segments = pathname.replace(/^\/area\/?/, '')
  const md = segments || 'overview'

  return <MdPage md={md} />
}
