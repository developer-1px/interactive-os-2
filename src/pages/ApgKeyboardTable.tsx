import type { ApgPatternData } from './apg-data'
import { components } from './showcaseRegistry'

type ApgKeyboardTableProps = ApgPatternData | { slug: string }

export function ApgKeyboardTable(props: ApgKeyboardTableProps) {
  if ('slug' in props) {
    const entry = components.find((c) => c.slug === props.slug)
    if (!entry?.apg) return null
    return <ApgKeyboardTableInner {...entry.apg} />
  }
  return <ApgKeyboardTableInner {...props} />
}

function ApgKeyboardTableInner({ pattern, url, entries }: ApgPatternData) {
  return (
    <div className="apg-table-wrap">
      <table className="apg-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Function</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={i}>
              <td><kbd>{entry.key}</kbd></td>
              <td>{entry.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="apg-source">
        Source: <a href={url} target="_blank" rel="noopener noreferrer">W3C APG — {pattern}</a>
      </div>
    </div>
  )
}
