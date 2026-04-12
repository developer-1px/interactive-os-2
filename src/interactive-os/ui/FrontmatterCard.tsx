/** @catalog 마크다운 frontmatter 메타 카드 — Notion 스타일 페이지 프로퍼티 */
import { ax } from '@styles/ax'
import { Badge } from './Badge'
import styles from './FrontmatterCard.module.css'

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
    return <span className={ax({ textStyle: 'body', text: 'primary' })}>{s}</span>
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
    <section className={ax({ surface: 'sunken', shape: 'md', layout: 'stack', gap: 'xs', padding: 'md' })}>
      {entries.map(([key, value]) => (
        <div key={key} className={ax({ layout: 'row', gap: 'md' })}>
          <span className={`${styles.label} ${ax({ textStyle: 'caption', text: 'muted' })}`}>
            {key}
          </span>
          <div className={ax({ flex: '1' })}>{renderValue(key, value)}</div>
        </div>
      ))}
    </section>
  )
}
