import { useState, useEffect, type ComponentType } from 'react'
import areaStyles from '../AreaViewer.module.css'
import styles from '../PageViewer.module.css'
import { DEFAULT_ROOT } from './types'
const mdxModules = import.meta.glob<{ default: ComponentType }>('/docs/**/*.mdx')

export function MdxViewer({ filePath }: { filePath: string }) {
  const [state, setState] = useState<{ content: ComponentType | null; error: string | null }>({
    content: null,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset before async load, pre-existing pattern
    setState({ content: null, error: null })

    // filePath → glob key: /Users/.../aria/docs/foo.mdx → /docs/foo.mdx
    const globKey = filePath.startsWith(DEFAULT_ROOT)
      ? filePath.slice(DEFAULT_ROOT.length)
      : filePath

    const loader = mdxModules[globKey]
    if (!loader) {
      setState({ content: null, error: `MDX not found: ${globKey}` })
      return
    }

    loader()
      .then((mod) => { if (!cancelled) setState({ content: mod.default, error: null }) })
      .catch((e) => { if (!cancelled) setState({ content: null, error: String(e) }) })

    return () => { cancelled = true }
  }, [filePath])

  if (state.error) return <div className={styles.viewerMarkdown}><p>{state.error}</p></div>
  if (!state.content) return <div className={styles.viewerMarkdown}><p>Loading MDX...</p></div>

  const Content = state.content
  return (
    <div className={areaStyles.root}>
      <Content />
    </div>
  )
}
