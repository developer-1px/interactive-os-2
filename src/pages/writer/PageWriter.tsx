// ② 2026-04-04-md-writer-prd.md
import { useCallback, useMemo, useState } from 'react'
import { useWriterData, useWriterDirty, writerState } from './writerStore'
import { mdToStore, storeToMd } from './writerTransform'
import WriterPreview from './WriterPreview'
import WriterFileBrowser from './WriterFileBrowser'
import { TreeGrid } from '@os/ui/TreeGrid'
import { history } from '@os/plugins/history'
import { crud } from '@os/plugins/crud'
import { dnd } from '@os/plugins/dnd'
import { rename } from '@os/plugins/rename'
import { AriaRoute } from '@os/primitives/AriaRoute'
import type { RouteKeyMap } from '@os/primitives/AriaRoute'
import { ExpandIndicator } from '@os/ui/indicators'
import { ax } from '@styles/ax'
import type { Plugin } from '@os/engine/types'
import type { NodeState } from '@os/pattern/types'
import css from './PageWriter.module.css'

const writerRenderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const data = node.data as Record<string, unknown> | undefined
  const content = (data?.content as string) ?? node.id as string
  const type = data?.type as string
  const level = data?.level as number | undefined
  const hasChildren = state.expanded !== undefined
  const prefix = type === 'heading' && level ? `H${level}` : type === 'document' ? 'DOC' : ''

  return (
    <div {...props} className={ax({ surface: 'ghost', controlSize: 'md', layout: 'bar', gap: 'xs' })}>
      <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
      {prefix && <span className={ax({ text: 'muted' })}>{prefix}</span>}
      <span className={ax({ text: state.focused ? 'primary' : 'secondary' })}>{content}</span>
    </div>
  )
}

const writerPlugins: Plugin[] = [
  crud(),
  dnd(),
  history(),
  rename(),
]

export default function PageWriter() {
  const [data, setData] = useWriterData()
  const dirty = useWriterDirty()
  const [view, setView] = useState<'tree' | 'preview'>('tree')

  const loadDocument = useCallback((store: ReturnType<typeof mdToStore>, filePath?: string) => {
    writerState.setFilePath(filePath)
    setData(store)
    writerState.markClean()
  }, [setData])

  const handleFileSelect = useCallback(async (filePath: string) => {
    try {
      const res = await fetch(`/api/writer/read?file=${encodeURIComponent(filePath)}`)
      if (!res.ok) throw new Error(await res.text())
      const md = await res.text()
      loadDocument(mdToStore(md, filePath), filePath)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }, [loadDocument])

  const handleNew = useCallback(() => {
    loadDocument(mdToStore(''))
  }, [loadDocument])

  const handleSave = useCallback(async () => {
    let filePath = writerState.getFilePath()
    if (!filePath) {
      const name = prompt('Save as (relative to docs/):')
      if (!name) return
      filePath = name.endsWith('.md') ? name : `${name}.md`
      writerState.setFilePath(filePath)
    }
    const md = storeToMd(writerState.getData())
    try {
      const res = await fetch('/api/writer/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: filePath, content: md }),
      })
      if (!res.ok) throw new Error(await res.text())
      writerState.markClean()
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }, [])

  const writerKeyMap: RouteKeyMap = useMemo(() => ({
    'Mod+S': () => {
      handleSave()
      return { type: 'writer:save' }
    },
  }), [handleSave])

  const currentFile = writerState.getFilePath()

  return (
    <AriaRoute keyMap={writerKeyMap} label="Writer">
      <div className={`${ax({ flex: '1' })} ${css.writerLayout}`}>
        <div className={ax({ layout: 'fill', surface: 'sunken' })}>
          <div className={ax({ layout: 'bar', padding: 'sm' })}>
            <span className={ax({ text: 'muted' })}>Files</span>
          </div>
          <WriterFileBrowser onFileSelect={handleFileSelect} />
        </div>

        <div className={ax({ layout: 'fill' })}>
          <div className={ax({ layout: 'bar', gap: 'sm', padding: 'sm' })}>
            <button onClick={handleNew} className={ax({ controlSize: 'sm', surface: 'ghost' })}>New</button>
            <button onClick={handleSave} disabled={!dirty} className={ax({ controlSize: 'sm', surface: 'ghost' })}>
              Save{dirty ? ' *' : ''}
            </button>
            {currentFile && <span className={ax({ text: 'muted' })}>{currentFile}</span>}
            <div className={ax({ layout: 'fill' })} />
            <button
              onClick={() => setView(v => v === 'tree' ? 'preview' : 'tree')}
              className={ax({ controlSize: 'sm', surface: 'ghost' })}
            >
              {view === 'tree' ? 'Preview' : 'Edit'}
            </button>
          </div>

          <div className={ax({ layout: 'scroll' })}>
            {view === 'tree' ? (
              <TreeGrid
                data={data}
                plugins={writerPlugins}
                onChange={setData}
                enableEditing
                renderItem={writerRenderItem}
                aria-label="Document structure"
              />
            ) : (
              <WriterPreview data={data} />
            )}
          </div>
        </div>
      </div>
    </AriaRoute>
  )
}
