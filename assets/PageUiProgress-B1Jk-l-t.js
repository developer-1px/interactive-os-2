var e=`// ── UI Component Progress Dashboard ──
// Displays all ui/ components × completion stages (recipe/demo/test/doc) as a TreeGrid matrix
// @useState-hatch -- cellFocus: cell-level followFocus preview; sizes: SplitPane local
import { useCallback, useState } from 'react'
import { useStore } from '@os/store/useStore'
import { PipelineGrid } from '@os/ui/PipelineGrid'
import type { CellFocusInfo } from '@os/ui/PipelineGrid'
import { PanelHeader } from '@os/ui/PanelHeader'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import { Panel } from '@os/ui/panels'
import { ScrollArea } from '@os/ui/ScrollArea'
import { StatusIndicator } from '@os/ui/indicators'
import { ax } from '@styles/ax'
import { progressStore, PROGRESS_COLUMNS, getProgressStats } from './uiProgressStore'

const SIZES: PaneSize[] = [0.65, 0.35]

const STAGE_TONE = {
  done: 'success',
  missing: 'info',
} as const

// ── Detail Panel ──

function DetailPanel({ data, rowId, colKey }: { data: Parameters<typeof getProgressStats>[0]; rowId: string | null; colKey: string | null }) {
  if (!rowId) {
    return (
      <div className={ax({ padding: 'lg', text: 'muted', textStyle: 'body' })}>
        Select a cell to see details
      </div>
    )
  }

  const entity = data.entities[rowId]
  if (!entity) return null

  const nodeData = entity.data as Record<string, unknown>
  const label = nodeData.label as string
  const catalog = nodeData.catalog as string | undefined
  const stages = nodeData.stages as Record<string, { status: 'done' | 'missing' }> | undefined
  const tier = nodeData.tier as string

  return (
    <div className={ax({ layout: 'stack', gap: 'md', padding: 'md' })}>
      <span className={ax({ textStyle: 'label', weight: 'semi', text: 'bright' })}>{label}</span>
      {catalog && <span className={ax({ textStyle: 'body', text: 'secondary' })}>{catalog}</span>}
      {tier === 'component' && stages && (
        <div className={ax({ layout: 'stack', gap: 'sm' })}>
          {colKey && colKey !== 'feature' && (
            <span className={ax({ textStyle: 'caption', tone: stages[colKey]?.status === 'done' ? 'success' : 'neutral' })}>
              {colKey}: {stages[colKey]?.status ?? 'unknown'}
            </span>
          )}
          <div className={ax({ layout: 'stack', gap: 'xs' })}>
            {(['recipe', 'demo', 'test', 'doc'] as const).map(key => (
              <span key={key} className={ax({ layout: 'bar', gap: 'xs', textStyle: 'caption', text: stages[key]?.status === 'done' ? 'primary' : 'muted' })}>
                <StatusIndicator tone={STAGE_TONE[stages[key]?.status ?? 'missing']} />
                {key}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Summary Bar ──

function SummaryBar({ data }: { data: Parameters<typeof getProgressStats>[0] }) {
  const stats = getProgressStats(data)
  const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <span className={ax({ layout: 'bar', gap: 'md' })}>
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>
        {stats.done}/{stats.total} ({pct}%)
      </span>
      {(['recipe', 'demo', 'test', 'doc'] as const).map(key => {
        const s = stats.byStage[key]
        return (
          <span key={key} className={ax({ textStyle: 'caption', text: 'muted' })}>
            {key}: {s.done}/{s.total}
          </span>
        )
      })}
    </span>
  )
}

// ── Page ──

export default function PageUiProgress() {
  const [data, setData] = useStore(progressStore)
  const [cellFocus, setCellFocus] = useState<CellFocusInfo | null>(null)
  const [sizes, setSizes] = useState<PaneSize[]>(SIZES)

  const handleActivate = useCallback((_nodeId: string) => {}, [])
  const handleCellFocus = useCallback((info: CellFocusInfo | null) => {
    setCellFocus(info)
  }, [])

  const panelTitle = cellFocus
    ? \`\${(data.entities[cellFocus.rowId]?.data as Record<string, unknown>)?.label ?? ''} / \${PROGRESS_COLUMNS.find(c => c.key === cellFocus.colKey)?.header ?? cellFocus.colKey}\`
    : 'Detail'

  return (
    <div className={ax({ layout: 'stack', flex: '1' })}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ textStyle: 'label', weight: 'semi' })}>UI Component Progress</span>
        <SummaryBar data={data} />
      </PanelHeader>

      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes} minRatio={0.3}>
        <ScrollArea className={ax({ flex: '1' })}>
          <PipelineGrid
            data={data}
            columns={PROGRESS_COLUMNS}
            onChange={setData}
            onActivate={handleActivate}
            onCellFocus={handleCellFocus}
            header
            aria-label="UI component progress"
          />
        </ScrollArea>

        <Panel header={panelTitle} surface="display">
          <ScrollArea className={ax({ flex: '1' })}>
            <DetailPanel
              data={data}
              rowId={cellFocus?.rowId ?? null}
              colKey={cellFocus ? PROGRESS_COLUMNS[cellFocus.colIndex]?.key ?? null : null}
            />
          </ScrollArea>
        </Panel>
      </SplitPane>
    </div>
  )
}
`;export{e as default};