import { ax } from '@styles/ax'

interface DocLinkCellProps {
  docs: { label: string; path: string }[]
}

export function DocLinkCell({ docs }: DocLinkCellProps) {
  if (docs.length === 0) return <span />
  return (
    <span className={ax({ layout: 'bar', gap: 'xs' })}>
      {docs.map((doc) => (
        <span key={doc.path} className={ax({ tone: 'accent' })}>
          {doc.label}
        </span>
      ))}
    </span>
  )
}
