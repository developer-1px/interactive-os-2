import { ax } from '@styles/ax'

interface SummaryCellProps {
  summary: string
}

export function SummaryCell({ summary }: SummaryCellProps) {
  return (
    <span className={ax({ textStyle: 'caption', text: 'secondary', clamp: '1' })}>
      {summary}
    </span>
  )
}
