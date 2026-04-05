import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListBox } from '@os/ui/ListBox'
import { PanelHeader } from '@os/ui/PanelHeader'
import { StatusIndicator, ProgressIndicator } from '@os/ui/indicators'
import type { RenderItem } from '@os/ui/types'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { buildProjectStore } from './projectStore'
import type { Maturity } from './projectData'

const { store: initialStore, projects, pathMap } = buildProjectStore()

const totalFiles = projects.reduce((sum, p) => sum + p.fileCount, 0)
const totalOpen = projects.reduce((sum, p) => sum + p.openBacklogs, 0)
const totalDone = projects.reduce((sum, p) => sum + p.doneBacklogs, 0)

const MATURITY_TONE: Record<Maturity, 'neutral' | 'warning' | 'accent' | 'success'> = {
  Concept: 'neutral',
  Prototype: 'warning',
  Validated: 'accent',
  Integrated: 'success',
  Production: 'accent',
}

const KIND_LABEL: Record<string, string> = {
  os: 'OS',
  app: 'App',
  infra: 'Infra',
}

const renderItem: RenderItem = (props, node, state) => {
  const data = node.data as Record<string, unknown> | undefined
  const label = data?.label as string
  const kind = data?.kind as string
  const fileCount = data?.fileCount as number
  const openBacklogs = data?.openBacklogs as number
  const doneBacklogs = data?.doneBacklogs as number
  const totalBacklogs = data?.totalBacklogs as number
  const maturity = data?.maturity as Maturity | null
  const hasP0 = data?.hasP0 as boolean

  return (
    <div
      {...props}
      className={ax({
        surface: state.focused ? 'display' : 'ghost',
        controlSize: 'lg',
        padding: 'md',
        content: 'text',
        layout: 'bar',
        gap: 'md',
      })}
    >
      {/* Status dot */}
      {hasP0
        ? <StatusIndicator tone="error" />
        : <StatusIndicator tone={openBacklogs > 0 ? 'warning' : 'success'} />
      }

      {/* Name */}
      <span className={ax({
        textStyle: 'body',
        text: hasP0 ? 'danger' : state.focused ? 'bright' : 'primary',
        weight: 'semi',
      })}>
        {label}
      </span>

      {/* Maturity badge */}
      {maturity && (
        <span className={ax({
          surface: 'sunken',
          textStyle: 'caption',
          text: MATURITY_TONE[maturity] === 'neutral' ? 'muted' : MATURITY_TONE[maturity] as 'accent' | 'success' | 'warning',
          padding: 'xs',
          shape: 'sm',
          content: 'text',
        })}>
          {maturity}
        </span>
      )}

      {/* Kind tag */}
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>
        {KIND_LABEL[kind] ?? kind}
      </span>

      {/* Spacer */}
      <span className={ax({ flex: '1' })} />

      {/* Backlog progress */}
      {totalBacklogs > 0 && (
        <span className={ax({ layout: 'bar', gap: 'sm', width: 'sm' })}>
          <ProgressIndicator value={doneBacklogs} max={totalBacklogs} />
          <span className={ax({ textStyle: 'caption', text: openBacklogs > 0 ? 'accent' : 'success', clamp: '1' })}>
            {doneBacklogs}/{totalBacklogs}
          </span>
        </span>
      )}

      {/* File count */}
      {fileCount > 0 && (
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>
          {fileCount}f
        </span>
      )}
    </div>
  )
}

export default function PageProject() {
  const [data, setData] = useState(initialStore)
  const navigate = useNavigate()

  const handleActivate = useCallback((nodeId: string) => {
    const path = pathMap[nodeId]
    if (path) navigate(path)
  }, [navigate])

  return (
    <div className={ax({ layout: 'column', flex: '1' })}>
      <PanelHeader>
        <span className={ax({ textStyle: 'label', weight: 'semi' })}>Projects</span>
        <span className={ax({ flex: '1' })} />
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>
          {projects.length} projects · {totalFiles} files · {totalDone}/{totalDone + totalOpen} done
        </span>
      </PanelHeader>

      <div className={ax({ layout: 'scroll', flex: '1' })}>
        <ListBox
          data={data}
          onChange={setData}
          onActivate={handleActivate}
          renderItem={renderItem}
          searchable
          aria-label="Project list"
        />
      </div>
    </div>
  )
}
