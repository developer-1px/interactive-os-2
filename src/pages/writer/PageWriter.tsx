// ② 2026-04-05-writer-tree-crud-prd.md
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useWriterData, useWriterDirty, writerState } from './writerStore'
import { mdToStore, storeToMd } from './writerTransform'
import { expandCommands } from '@os/axis/expand'
import { useWriterChatSync, sendWriterMessage, getSessionForFile } from './writerChatBridge'
import { requestAnalysis } from './writerAnalyze'
import type { SentenceRole } from './writerSchema'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import WriterFileBrowser from './WriterFileBrowser'
import { ChatPane } from '../chat/ChatPane'
import { TreeGrid } from '@os/ui/TreeGrid'
import { Aria } from '@os/primitives/aria'
import type { EditKeyContext } from '@os/primitives/aria'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import { history } from '@os/plugins/history'
import { crud } from '@os/plugins/crud'
import { dnd, dndCommands } from '@os/plugins/dnd'
import { rename, renameCommands } from '@os/plugins/rename'
import { clipboard } from '@os/plugins/clipboard'
import { crudCommands } from '@os/plugins/crud'
import { getParent, getChildren, updateEntityData, addEntity, removeEntity, moveNode } from '@os/store/createStore'
import { definePlugin } from '@os/plugins/definePlugin'
import { key } from '@os/axis/types'
import { defineCommands } from '@os/engine/defineCommand'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import type { RouteKeyMap } from '@os/primitives/defineRouteKey'
import { ExpandIndicator } from '@os/ui/indicators'
import { Toolbar } from '@os/ui/Toolbar'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { VisibilityFilter } from '@os/engine/types'
import { ax } from '@styles/ax'
import { createBatchCommand, type Command, type Plugin } from '@os/engine/types'
import type { NodeState } from '@os/pattern/types'
import { getVisibleNodes } from '@os/engine/getVisibleNodes'
import './PageWriter.css'

// ── Writer Commands ──────────────────────────────────────
// ② 2026-04-05-writer-tree-crud-prd.md

const writerCommands = defineCommands({
  updateContent: {
    type: 'writer:update-content' as const,
    create: (nodeId: string, content: string) => ({ nodeId, content }),
    handler: (store, { nodeId, content }) => updateEntityData(store, nodeId, { content }),
  },

  insertAfter: {
    type: 'writer:insert-after' as const,
    create: (afterNodeId: string, newId: string, data: Record<string, unknown>) => ({ afterNodeId, newId, data }),
    handler: (store, { afterNodeId, newId, data }) => {
      const parentId = getParent(store, afterNodeId) ?? ROOT_ID
      const siblings = getChildren(store, parentId)
      const idx = siblings.indexOf(afterNodeId)
      return addEntity(store, { id: newId, data }, parentId, idx + 1)
    },
  },

  merge: {
    type: 'writer:merge' as const,
    create: (targetId: string, mergedContent: string, removeId: string) => ({ targetId, mergedContent, removeId }),
    handler: (store, { targetId, mergedContent, removeId }) => {
      let s = updateEntityData(store, targetId, { content: mergedContent })
      s = removeEntity(s, removeId)
      return s
    },
  },

  wrapInList: {
    type: 'writer:wrap-list' as const,
    create: (nodeIds: string[], listId: string, ordered: boolean) => ({ nodeIds, listId, ordered }),
    handler: (store, { nodeIds, listId, ordered }) => {
      if (nodeIds.length === 0) return store
      const firstId = nodeIds[0]!
      const parentId = getParent(store, firstId) ?? ROOT_ID
      const siblings = getChildren(store, parentId)
      const firstIdx = siblings.indexOf(firstId)

      // Create list entity
      let s = addEntity(store, { id: listId, data: { type: 'list', ordered } }, parentId, firstIdx)

      // Move each node into list, converting to listItem
      for (const id of nodeIds) {
        const entity = s.entities[id]
        if (!entity) continue
        const d = entity.data as Record<string, unknown> | undefined
        // Only wrap leaf types (sentence, listItem, paragraph children)
        if (d?.type === 'heading') continue
        s = moveNode(s, id, listId)
        s = updateEntityData(s, id, { type: 'listItem' })
      }
      return s
    },
  },

  unwrapFromList: {
    type: 'writer:unwrap-list' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const listId = getParent(store, nodeId)
      if (!listId) return store
      const listEntity = store.entities[listId]
      if ((listEntity?.data as Record<string, unknown>)?.type !== 'list') return store

      const grandparentId = getParent(store, listId) ?? ROOT_ID
      const gpChildren = getChildren(store, grandparentId)
      const listIdx = gpChildren.indexOf(listId)
      const listChildren = [...getChildren(store, listId)]

      let s = store
      // Move all list children out to grandparent
      for (let i = 0; i < listChildren.length; i++) {
        const childId = listChildren[i]!
        s = moveNode(s, childId, grandparentId, listIdx + 1 + i)
        // Convert listItem → sentence
        const childData = s.entities[childId]?.data as Record<string, unknown> | undefined
        if (childData?.type === 'listItem') {
          s = updateEntityData(s, childId, { type: 'sentence' })
        }
      }

      // Remove empty list
      if (getChildren(s, listId).length === 0) {
        s = removeEntity(s, listId)
      }
      return s
    },
  },

  visibleSwap: {
    type: 'writer:visible-swap' as const,
    create: (nodeId: string, adjacentId: string, direction: -1 | 1) => ({ nodeId, adjacentId, direction }),
    handler: (store, { nodeId, adjacentId, direction }) => {
      const nodeParent = getParent(store, nodeId) ?? ROOT_ID
      const adjParent = getParent(store, adjacentId) ?? ROOT_ID

      if (nodeParent === adjParent) {
        // Same parent — simple reorder
        const siblings = getChildren(store, nodeParent)
        const adjIdx = siblings.indexOf(adjacentId)
        return moveNode(store, nodeId, nodeParent, direction === -1 ? adjIdx : adjIdx + 1)
      }

      // Cross-parent — move to adjacent node's parent, next to the adjacent node
      const adjSiblings = getChildren(store, adjParent)
      const adjIdx = adjSiblings.indexOf(adjacentId)
      return moveNode(store, nodeId, adjParent, direction === -1 ? adjIdx : adjIdx + 1)
    },
  },

  convertType: {
    type: 'writer:convert-type' as const,
    create: (nodeId: string, toType: 'heading' | 'paragraph') => ({ nodeId, toType }),
    handler: (store, { nodeId, toType }) => {
      const entity = store.entities[nodeId]
      if (!entity) return store
      const d = entity.data as Record<string, unknown> | undefined
      const fromType = d?.type as string

      if (fromType === 'heading' && toType === 'paragraph') {
        // heading → paragraph: children move to heading's parent
        const parentId = getParent(store, nodeId) ?? ROOT_ID
        const siblings = getChildren(store, parentId)
        const idx = siblings.indexOf(nodeId)
        const children = [...getChildren(store, nodeId)]
        let s = store
        for (let i = 0; i < children.length; i++) {
          s = moveNode(s, children[i]!, parentId, idx + 1 + i)
        }
        s = updateEntityData(s, nodeId, { type: 'paragraph', level: undefined })
        return s
      }

      if (fromType === 'paragraph' && toType === 'heading') {
        // paragraph → heading: level derived from tree depth (parent heading level + 1, or 1 if under document)
        const parentId = getParent(store, nodeId) ?? ROOT_ID
        const parentData = store.entities[parentId]?.data as Record<string, unknown> | undefined
        const parentLevel = (parentData?.type === 'heading' ? parentData.level as number : 0) ?? 0
        const level = Math.min(parentLevel + 1, 6)
        return updateEntityData(store, nodeId, { type: 'heading', level, content: d?.content ?? '' })
      }

      return store
    },
  },
})

// ── Navigate Filter ──────────────────────────────────────
// Skip container nodes (paragraph, list, document) — only focusable: heading, sentence, listItem, hr

const CONTAINER_TYPES = new Set(['paragraph', 'list', 'document'])

const writerNavigateFilter: VisibilityFilter = {
  isFocusable: (nodeId: string, store: NormalizedData) => {
    const entity = store.entities[nodeId]
    const type = (entity?.data as Record<string, unknown> | undefined)?.type as string | undefined
    return !type || !CONTAINER_TYPES.has(type)
  },
}

// ── Edit Key Handler (runs during editing) ───────────────

let _splitCounter = 0

function getAdjacentVisible(store: NormalizedData, nodeId: string, filters: VisibilityFilter[], direction: -1 | 1): string | undefined {
  const visible = getVisibleNodes(store, filters)
  const idx = visible.indexOf(nodeId)
  const target = idx + direction
  return target >= 0 && target < visible.length ? visible[target] : undefined
}

function getPrevVisibleNode(store: NormalizedData, nodeId: string, filters: VisibilityFilter[]): string | undefined {
  return getAdjacentVisible(store, nodeId, filters, -1)
}

function writerEditKeyDown(store: NormalizedData, e: React.KeyboardEvent, ctx: EditKeyContext): Command | void {
  const { nodeId, field, content, cursorOffset } = ctx
  const entity = store.entities[nodeId]
  const d = entity?.data as Record<string, unknown> | undefined
  const type = d?.type as string

  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    const firstHalf = content.slice(0, cursorOffset)
    const secondHalf = content.slice(cursorOffset)
    const newId = `ws${++_splitCounter}`
    return createBatchCommand([
      renameCommands.confirmRename(nodeId, field, firstHalf),
      writerCommands.insertAfter(nodeId, newId, { type, content: secondHalf }),
      renameCommands.startRename(newId),
    ])
  }

  if (e.key === 'Backspace' && cursorOffset === 0 && !e.metaKey && !e.ctrlKey) {
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed) return undefined

    const prevId = getPrevVisibleNode(store, nodeId, [writerNavigateFilter])
    if (!prevId) return undefined
    const prevData = store.entities[prevId]?.data as Record<string, unknown> | undefined
    const prevContent = (prevData?.content as string) ?? ''
    // hr has no content field — can't merge into it
    if (prevData?.type === 'hr') return undefined

    const mergedContent = prevContent + content
    return createBatchCommand([
      renameCommands.cancelRename(),
      writerCommands.merge(prevId, mergedContent, nodeId),
      renameCommands.startRename(prevId),
    ])
  }

  if (e.key === 'Tab' && !e.shiftKey) {
    return createBatchCommand([
      renameCommands.confirmRename(nodeId, field, content),
      dndCommands.moveIn(nodeId),
    ])
  }

  if (e.key === 'Tab' && e.shiftKey) {
    return createBatchCommand([
      renameCommands.confirmRename(nodeId, field, content),
      dndCommands.moveOut(nodeId),
    ])
  }

  return undefined
}

// ── Visual ───────────────────────────────────────────────

const headingStyle = ['display', 'page', 'section', 'label', 'label', 'label'] as const


const roleLabel: Record<SentenceRole, string> = {
  fact: '사실',
  interpretation: '해석',
  evidence: '근거',
  opinion: '의견',
}

const roleText: Record<SentenceRole, 'accent' | 'warning' | 'success' | 'danger'> = {
  fact: 'accent',
  interpretation: 'warning',
  evidence: 'success',
  opinion: 'danger',
}

function RoleBadge({ role }: { role: SentenceRole }) {
  return (
    <span className={`${ax({ textStyle: 'caption', text: roleText[role] })} ml-auto`}>
      {roleLabel[role]}
    </span>
  )
}

/** Prose preview — reuses the shared MarkdownViewer with storeToMd() */
function ProseView({ data: storeData }: { data: NormalizedData }) {
  const md = useMemo(() => storeToMd(storeData), [storeData])
  return <MarkdownViewer content={md} />
}

const handleEditKeyDown = (e: React.KeyboardEvent, ctx: EditKeyContext) => writerEditKeyDown(writerState.getData(), e, ctx)

const writerRenderItem = (props: React.HTMLAttributes<HTMLElement>, node: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const data = node.data as Record<string, unknown> | undefined
  const content = (data?.content as string) ?? ''
  const type = data?.type as string
  const level = data?.level as number | undefined
  const hasChildren = state.expanded !== undefined
  const depth = (state.level ?? 1) - 1
  const depthStyle = { paddingLeft: `calc(${depth} * var(--space-md) + var(--space-xs))` }
  const surface = state.selected ? 'action' as const : 'ghost' as const

  if (type === 'document') {
    return (
      <div {...props} className={ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>{data?.path as string || 'Untitled'}</span>
      </div>
    )
  }

  if (type === 'heading' && level) {
    const marginCls = level === 1 ? 'writer-heading-l1' : 'writer-heading'
    return (
      <div {...props} className={`${ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} ${marginCls}`} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <Aria.Editable field="content" selection="end" editKeyDown={handleEditKeyDown}><span className={ax({ textStyle: headingStyle[level - 1], text: state.focused ? 'primary' : 'secondary' })}>{content}</span></Aria.Editable>
      </div>
    )
  }

  if (type === 'paragraph') {
    return (
      <div {...props} className={`${ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} ${'writer-paragraph'}`} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>¶{state.index + 1}</span>
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div {...props} className={ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} style={depthStyle}>
        <ExpandIndicator expanded={state.expanded} hasChildren={hasChildren} />
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>{(data?.ordered as boolean) ? 'ol' : 'ul'}</span>
      </div>
    )
  }

  if (type === 'listItem') {
    return (
      <div {...props} className={ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} style={depthStyle}>
        <ExpandIndicator hasChildren={false} />
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>{state.index + 1}</span>
        <Aria.Editable field="content" selection="end" editKeyDown={handleEditKeyDown}><span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{content}</span></Aria.Editable>
      </div>
    )
  }

  if (type === 'hr') {
    return <div {...props} className={`${ax({ surface, padding: 'xs' })} ${'writer-hr'}`} style={depthStyle} />
  }

  // sentence
  const role = data?.role as SentenceRole | undefined
  return (
    <div {...props} className={ax({ surface, padding: 'xs', layout: 'row', gap: 'xs' })} style={depthStyle}>
      <ExpandIndicator hasChildren={false} />
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>{state.index + 1}</span>
      <Aria.Editable field="content" selection="end" editKeyDown={handleEditKeyDown}><span className={ax({ textStyle: 'body', text: state.focused ? 'primary' : 'secondary' })}>{content}</span></Aria.Editable>
      {role && <RoleBadge role={role} />}
    </div>
  )
}

let _insertCounter = 0

function writerKeys(): Plugin {
  return definePlugin({
    name: 'writerKeys',
    visibilityFilter: writerNavigateFilter,
    commands: {
      insertAfter: writerCommands.insertAfter,
      merge: writerCommands.merge,
      updateContent: writerCommands.updateContent,
      wrapInList: writerCommands.wrapInList,
      unwrapFromList: writerCommands.unwrapFromList,
      convertType: writerCommands.convertType,
      visibleSwap: writerCommands.visibleSwap,
    },
    keyMap: {
      // Enter → edit (rename)
      'Enter': key(['rename:start'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        // hr has no content — skip
        if (d?.type === 'hr') return undefined
        return renameCommands.startRename(ctx.focused)
      }),

      // Cmd+Enter (non-editing) → new sibling + edit
      'Mod+Enter': key(['writer:insert-after', 'rename:start'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        if (!d) return undefined
        const type = d.type as string
        const parentId = ctx.getParent(ctx.focused)
        if (!parentId) return undefined
        const newId = `wi${++_insertCounter}`

        let newData: Record<string, unknown>
        if (type === 'heading') {
          newData = { type: 'heading', level: d.level, content: '' }
        } else if (type === 'sentence') {
          newData = { type: 'sentence', content: '' }
        } else if (type === 'listItem') {
          newData = { type: 'listItem', content: '' }
        } else {
          return undefined
        }

        return createBatchCommand([
          writerCommands.insertAfter(ctx.focused, newId, newData),
          renameCommands.startRename(newId),
        ])
      }),

      // Cmd+Shift+Enter → insert first child sentence + edit
      'Mod+Shift+Enter': key(['crud:create', 'rename:start'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        if (d?.type !== 'heading') return undefined
        const newId = `wi${++_insertCounter}`
        return createBatchCommand([
          crudCommands.create({ id: newId, data: { type: 'sentence', content: '' } }, ctx.focused, 0),
          renameCommands.startRename(newId),
        ])
      }),

      // Tab → indent (reparent under previous sibling)
      'Tab': key(['dnd:move-in'], (ctx) => dndCommands.moveIn(ctx.focused)),

      // Shift+Tab → outdent (reparent to grandparent)
      'Shift+Tab': key(['dnd:move-out'], (ctx) => dndCommands.moveOut(ctx.focused)),

      // Alt+↑↓ → reorder in visible order (crosses paragraph boundaries)
      'Alt+ArrowUp': key(['writer:visible-swap'], (ctx) => {
        const prev = getAdjacentVisible(writerState.getData(), ctx.focused, [writerNavigateFilter], -1)
        if (!prev) return undefined
        return writerCommands.visibleSwap(ctx.focused, prev, -1)
      }),
      'Alt+ArrowDown': key(['writer:visible-swap'], (ctx) => {
        const next = getAdjacentVisible(writerState.getData(), ctx.focused, [writerNavigateFilter], 1)
        if (!next) return undefined
        return writerCommands.visibleSwap(ctx.focused, next, 1)
      }),

      // Backspace (non-editing) → delete node
      'Backspace': key(['crud:delete', 'rename:start'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        const content = (d?.content as string) ?? ''
        // If empty content node, just delete
        if (!content || content.trim() === '') {
          return crudCommands.remove(ctx.focused)
        }
        // If has content, enter edit mode instead of deleting
        return renameCommands.startRename(ctx.focused)
      }),

      // Mod+L → wrap selection in list
      'Mod+l': key(['writer:wrap-list'], (ctx) => {
        const selectedIds = ctx.selected?.ids ?? []
        const nodeIds = selectedIds.length > 0 ? selectedIds : [ctx.focused]
        const listId = `wl${++_insertCounter}`
        return writerCommands.wrapInList(nodeIds, listId, false)
      }),

      // Mod+Shift+L → unwrap from list
      'Mod+Shift+l': key(['writer:unwrap-list'], (ctx) => writerCommands.unwrapFromList(ctx.focused)),

      // Mod+0 → heading → paragraph
      'Mod+Digit0': key(['writer:convert-type'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        if (d?.type !== 'heading') return undefined
        return writerCommands.convertType(ctx.focused, 'paragraph')
      }),

      // Mod+Shift+H → paragraph → heading
      'Mod+Shift+h': key(['writer:convert-type'], (ctx) => {
        const d = ctx.getEntity(ctx.focused)?.data as Record<string, unknown> | undefined
        if (d?.type !== 'paragraph') return undefined
        return writerCommands.convertType(ctx.focused, 'heading')
      }),
    },
  })
}

// ② 2026-04-04-clipboard-serialize-prd.md
const writerPlugins: Plugin[] = [
  crud(),
  clipboard({
    serialize: (subtree) => storeToMd(subtree),
    deserialize: (text) => mdToStore(text),
  }),
  dnd(),
  history(),
  rename(),
  writerKeys(),
]

export default function PageWriter() {
  const [data, setData] = useWriterData()
  const dirty = useWriterDirty()
  const [prose, setProse] = useState(false)
  const [sizes, setSizes] = useState<PaneSize[]>([0.15, 'flex', 0.30])

  const location = useLocation()
  const navigate = useNavigate()

  // Extract file path from URL: /writer/path/to/file.md → path/to/file.md
  const urlFilePath = location.pathname.replace(/^\/writer\/?/, '') || undefined

  // File-specific persistent chat session
  const currentFile = writerState.getFilePath()
  const [chatSessionId, setChatSessionId] = useState(() => getSessionForFile(currentFile))

  // Update chat session when file changes
  useEffect(() => {
    setChatSessionId(getSessionForFile(currentFile))
  }, [currentFile])

  // Sync AI responses → writerState
  useWriterChatSync(chatSessionId)

  const loadDocument = useCallback((store: ReturnType<typeof mdToStore>, filePath?: string) => {
    writerState.setFilePath(filePath)
    setData(expandCommands.expandAll.reduce(store))
    writerState.markClean()
  }, [setData])

  // Load file from URL on mount
  useEffect(() => {
    if (urlFilePath && urlFilePath !== writerState.getFilePath()) {
      fetch(`/api/writer/read?file=${encodeURIComponent(urlFilePath)}`)
        .then(res => { if (!res.ok) throw new Error(); return res.text() })
        .then(md => loadDocument(mdToStore(md, urlFilePath), urlFilePath))
        .catch(() => console.error('Failed to load file from URL:', urlFilePath))
    }
  }, [urlFilePath]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileSelect = useCallback(async (filePath: string) => {
    try {
      const res = await fetch(`/api/writer/read?file=${encodeURIComponent(filePath)}`)
      if (!res.ok) throw new Error(await res.text())
      const md = await res.text()
      loadDocument(mdToStore(md, filePath), filePath)
      navigate(`/writer/${filePath}`, { replace: true })
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }, [loadDocument, navigate])

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
    const md = writerState.getMd()
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

  // Auto-save on edit (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    if (!dirty) return
    const filePath = writerState.getFilePath()
    if (!filePath) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const md = writerState.getMd()
      try {
        const res = await fetch('/api/writer/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: filePath, content: md }),
        })
        if (res.ok) writerState.markClean()
      } catch { /* silent */ }
    }, 500)
    return () => clearTimeout(saveTimerRef.current)
  }, [dirty, data])

  const handleAnalyze = useCallback(() => {
    requestAnalysis(chatSessionId)
  }, [chatSessionId])

  const toolbarData = useMemo(() => createStore({
    entities: {
      new: { id: 'new', data: { label: 'New', icon: 'add' } },
      save: { id: 'save', data: { label: dirty ? 'Save *' : 'Save' } },
      analyze: { id: 'analyze', data: { label: 'Analyze', icon: 'search' } },
    },
    relationships: { [ROOT_ID]: ['new', 'save', 'analyze'] },
  }), [dirty])

  const handleToolbarActivate = useCallback((nodeId: string) => {
    if (nodeId === 'new') handleNew()
    else if (nodeId === 'save') handleSave()
    else if (nodeId === 'analyze') handleAnalyze()
  }, [handleNew, handleSave, handleAnalyze])

  const writerKeyMap: RouteKeyMap = useMemo(() => ({
    'Mod+S': defineRouteKey('writer:save', () => handleSave(), 'Writer'),
    'Mod+\\': defineRouteKey('writer:toggle-prose', () => setProse(p => !p), 'Writer'),
  }), [handleSave])

  return (
    <AriaRoute keyMap={writerKeyMap} label="Writer">
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.1} noScroll={[0, 1, 2]}>
        <div className={ax({ layout: 'fill', surface: 'sunken' })}>
          <div className={ax({ layout: 'spread', padding: 'sm' })}>
            <span className={ax({ textStyle: 'overline', text: 'muted' })}>Files</span>
          </div>
          <div className={ax({ layout: 'scroll' })}>
            <WriterFileBrowser onFileSelect={handleFileSelect} />
          </div>
        </div>

        <div className={ax({ layout: 'fill' })}>
          <div className={ax({ layout: 'bar', gap: 'sm', padding: 'sm' })}>
            <Toolbar data={toolbarData} onActivate={handleToolbarActivate} aria-label="Writer toolbar" />
            {urlFilePath && <span className={ax({ textStyle: 'caption', text: 'muted' })}>{urlFilePath}</span>}
          </div>

          <div className={ax({ layout: 'scroll', padding: 'md' })}>
            {prose ? (
              <ProseView data={data} />
            ) : (
              <TreeGrid
                data={data}
                plugins={writerPlugins}
                onChange={setData}
                renderItem={writerRenderItem}
                aria-label="Document structure"
              />
            )}
          </div>
        </div>

        <div className={ax({ layout: 'fill', surface: 'sunken' })}>
          <div className={ax({ layout: 'spread', padding: 'sm' })}>
            <span className={ax({ textStyle: 'overline', text: 'muted' })}>Chat</span>
          </div>
          <ChatPane sessionId={chatSessionId} onSend={sendWriterMessage} />
        </div>
      </SplitPane>
    </AriaRoute>
  )
}
