/** @catalog 마크다운 frontmatter 메타 카드 */
import { ax } from '@styles/ax'
import { PropertyRow } from './PropertyRow'
import { Badge } from './Badge'

const DATE_KEYS = new Set(['date', 'created', 'updated', 'modified', 'published'])
const TAG_KEYS = new Set(['tags', 'tag', 'keywords', 'categories'])

function renderValue(key: string, value: unknown) {
  if (Array.isArray(value)) {
    return (
      <div className={ax({ layout: 'wrap', gap: 'xs' })}>
        {value.map((v, i) => (
          <Badge key={i} variant="outline">{String(v)}</Badge>
        ))}
      </div>
    )
  }
  if (TAG_KEYS.has(key) && typeof value === 'string') {
    return (
      <div className={ax({ layout: 'wrap', gap: 'xs' })}>
        {value.split(/[,\s]+/).filter(Boolean).map((v, i) => (
          <Badge key={i} variant="outline">{v}</Badge>
        ))}
      </div>
    )
  }
  if (DATE_KEYS.has(key)) {
    const s = value instanceof Date ? value.toISOString().slice(0, 10) : String(value)
    return <Badge tone="accent" variant="outline">{s}</Badge>
  }
  if (value === null || value === undefined) return null
  if (typeof value === 'object') {
    return (
      <span className={ax({ textStyle: 'caption', text: 'muted' })}>
        {JSON.stringify(value)}
      </span>
    )
  }
  return (
    <span className={ax({ textStyle: 'body', text: 'primary' })}>
      {String(value)}
    </span>
  )
}

export function FrontmatterCard({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (entries.length === 0) return null
  return (
    <section
      className={ax({
        surface: 'raised',
        border: 'default',
        shape: 'md',
        padding: 'md',
        layout: 'stack',
        gap: 'xs',
      })}
    >
      {entries.map(([key, value]) => (
        <PropertyRow key={key} label={key}>
          {renderValue(key, value)}
        </PropertyRow>
      ))}
    </section>
  )
}
