// @useState-hatch — store/loading: async docs tree fetch
import { useState, useEffect, useCallback } from 'react'
import { MillerColumns } from '@os/ui/MillerColumns'
import { SpinnerIndicator } from '@os/ui/indicators'
import { EmptyState } from '@os/ui/EmptyState'
import { ax } from '@styles/ax'
import { scroll } from '@os/plugins/scroll'
import { fetchTree } from '../viewer/fsClient'
import { treeToStore } from '../viewer/treeTransform'
import { DocsPreview } from '../viewer/widgets/DocsPreview'

const DOCS_ROOT = '/Users/user/Desktop/aria/docs'

export default function PageDocs() {
  const [store, setStore] = useState<ReturnType<typeof treeToStore> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTree(DOCS_ROOT).then((tree) => {
      setStore(treeToStore(tree))
      setLoading(false)
    })
  }, [])

  const renderPreview = useCallback((nodeId: string) => {
    return <DocsPreview nodeId={nodeId} />
  }, [])

  if (loading || !store) {
    return (
      <div className={ax({ layout: 'center', gap: 'sm', textStyle: 'body', text: 'muted', flex: '1' })}>
        <SpinnerIndicator size="sm" />
        <span>Loading docs...</span>
      </div>
    )
  }

  if (Object.keys(store.entities).length === 0) {
    return <EmptyState title="No docs" description="No documents found in docs/" />
  }

  return (
    <div className={ax({ layout: 'fill' })}>
      <MillerColumns
        data={store}
        onChange={setStore}
        plugins={[scroll()]}
        renderPreview={renderPreview}
        aria-label="Docs browser"
      />
    </div>
  )
}
