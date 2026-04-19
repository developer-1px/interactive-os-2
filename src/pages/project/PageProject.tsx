import { useCallback } from 'react'
import { useStore } from '@os/store/useStore'
import { useNavigate } from 'react-router-dom'
import { Grid } from '@os/ui/Grid'
import { PanelHeader } from '@os/ui/PanelHeader'
import { StatusIndicator, ProgressIndicator } from '@os/ui/indicators'
import type { NodeState } from '@os/pattern/types'
import { ax, type AxTone } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { buildProjectStore, PROJECT_COLUMNS } from './projectStore'
import type { Maturity } from './projectData'

const { store: initialStore, projects, pathMap } = buildProjectStore()

const totalFiles = projects.reduce((sum, p) => sum + p.fileCount, 0)
const totalOpen = projects.reduce((sum, p) => sum + p.openBacklogs, 0)
const totalDone = projects.reduce((sum, p) => sum + p.doneBacklogs, 0)

const MATURITY_TONE: Record<Maturity, AxTone | undefined> = {
  Concept: undefined,
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

const renderCell = (
  _props: React.HTMLAttributes<HTMLElement>,
  value: unknown,
  column: { key: string },
  state: NodeState,
) => {
  void state
  switch (column.key) {
    case 'name': {
      const v = value as { text: string; hasP0: boolean; openBacklogs: number }
      return (
        <span className={ax({ layout: 'bar' })}>
          {v.hasP0
            ? <StatusIndicator tone="error" />
            : <StatusIndicator tone={v.openBacklogs > 0 ? 'warning' : 'success'} />
          }
          <span className={ax({
            role: 'item',
            textStyle: 'body',
            tone: v.hasP0 ? 'danger' : undefined
          })}>
            {v.text}
          </span>
        </span>
      )
    }

    case 'maturity': {
      if (!value) return <span />
      const maturity = value as Maturity
      return (
        <span className={ax({
          role: 'item',
          textStyle: 'caption',
          tone: MATURITY_TONE[maturity]
        })}>
          {maturity}
        </span>
      )
    }

    case 'kind':
      return (
        <span className={ax({ textStyle: 'caption' })}>
          {KIND_LABEL[String(value)] ?? String(value ?? '')}
        </span>
      )

    case 'progress': {
      if (!value) return <span />
      const p = value as { done: number; total: number; open: number }
      return (
        <span className={ax({ layout: 'bar' })}>
          <ProgressIndicator value={p.done} max={p.total} />
          <span className={ax({
            role: 'item',
            textStyle: 'caption',
            tone: p.open > 0 ? 'accent' : 'success',
          })}>
            {p.done}/{p.total}
          </span>
        </span>
      )
    }

    case 'files':
      if (!value) return <span />
      return (
        <span className={ax({ textStyle: 'caption' })}>
          {String(value)}
        </span>
      )

    default:
      return <span>{String(value ?? '')}</span>
  }
}

export default function PageProject() {
  const [data, setData] = useStore(initialStore)
  const navigate = useNavigate()

  const handleActivate = useCallback((nodeId: string) => {
    const path = pathMap[nodeId]
    if (path) navigate(path)
  }, [navigate])

  return (
    <div className={ax({ layout: 'stack', flex: '1' })}>
      <PanelHeader>
        <span className={ax({ textStyle: 'label' })}>Projects</span>
        <span className={ax({ flex: '1' })} />
        <span className={ax({ textStyle: 'caption' })}>
          {projects.length} projects · {totalFiles} files · {totalDone}/{totalDone + totalOpen} done
        </span>
      </PanelHeader>

      <ScrollArea className={ax({ flex: '1' })}>
        <Grid
          data={data}
          columns={PROJECT_COLUMNS}
          onChange={setData}
          onActivate={handleActivate}
          renderCell={renderCell}
          searchable
          header
          aria-label="Project list"
        />
      </ScrollArea>
    </div>
  )
}
