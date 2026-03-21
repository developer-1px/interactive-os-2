import { useState, useEffect, type ComponentType } from 'react'
import { useLocation } from 'react-router-dom'

const mdxModules = import.meta.glob<{ default: ComponentType }>('/docs/2-areas/**/*.mdx')

export default function PageAreaViewer() {
  const location = useLocation()
  const [Content, setContent] = useState<ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setContent(null)
    setError(null)

    // /area/axes → /docs/2-areas/axes.mdx
    // /area/axes/navigate → /docs/2-areas/axes/navigate.mdx
    const segments = location.pathname.replace(/^\/area\/?/, '')
    const mdxPath = segments
      ? `/docs/2-areas/${segments}.mdx`
      : '/docs/2-areas/axes.mdx'

    const loader = mdxModules[mdxPath]
    if (!loader) {
      setError(`Not found: ${mdxPath}`)
      return
    }

    loader().then((mod) => setContent(() => mod.default)).catch((e) => setError(String(e)))
  }, [location.pathname])

  if (error) return <div className="page-header"><p className="page-desc">{error}</p></div>
  if (!Content) return <div className="page-header"><p className="page-desc">Loading...</p></div>

  return (
    <div className="area-viewer">
      <Content />
    </div>
  )
}
