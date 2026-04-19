import { ax } from '@styles/ax'

interface SummaryCellProps {
  summary: string
}

export function SummaryCell({ summary }: SummaryCellProps) {
  return (
    <span className={ax({ role: 'cell', surface: 'display', clamp: '1' })}>
      {summary}
    </span>
  )
}
