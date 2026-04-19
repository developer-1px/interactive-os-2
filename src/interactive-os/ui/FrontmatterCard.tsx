/** @catalog 마크다운 frontmatter 메타 카드 — 의도별 티어(title header / body) + 카드 전체 접기 */
import { useState, Fragment } from 'react'
import { ChevronDown } from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ax } from '@styles/ax'
import { usePersistedState } from '../primitives/usePersistedState'
import { Badge } from './Badge'
import styles from './FrontmatterCard.module.css'

// 동의어 집합 — Jekyll/Hugo/Docusaurus/Astro/Obsidian/Hashnode/Dev.to 호환
const TITLE_KEYS = new Set(['title'])
const SUBTITLE_KEYS = new Set(['description', 'subtitle', 'summary', 'excerpt'])
const DATE_KEYS = new Set([
  'date',
  'created', 'created_at', 'createdAt',
  'published', 'published_at', 'publishedAt', 'publish_date', 'publishDate',
  'updated', 'updated_at', 'updatedAt',
  'modified', 'modified_at', 'modifiedAt',
  'last_update', 'lastUpdate', 'lastmod',
])
const PEOPLE_KEYS = new Set(['author', 'authors', 'by'])
const TAG_KEYS = new Set(['tags', 'tag', 'categories', 'keywords'])
// 라우팅/SEO/내부 — 읽는 사람에게 의미 없음
const HIDDEN_KEYS = new Set([
  'id', 'slug', 'aliases', 'permalink', 'url', 'path',
  'draft', 'unlisted', 'published',
  'image', 'cover', 'banner', 'thumbnail', 'og_image', 'social_image',
  'layout', 'template',
  'legacy',
])

const LONG_TEXT_THRESHOLD = 140
const PERSIST_KEY = 'frontmatter-card-open'

type Category = 'title' | 'subtitle' | 'date' | 'people' | 'tags' | 'hidden' | 'other'

function classify(key: string): Category {
  if (TITLE_KEYS.has(key)) return 'title'
  if (SUBTITLE_KEYS.has(key)) return 'subtitle'
  if (DATE_KEYS.has(key)) return 'date'
  if (PEOPLE_KEYS.has(key)) return 'people'
  if (TAG_KEYS.has(key)) return 'tags'
  if (HIDDEN_KEYS.has(key)) return 'hidden'
  return 'other'
}

function formatDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
}

function toTagArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') return value.split(/[,\s]+/).filter(Boolean)
  return []
}

function TagList({ value }: { value: unknown }) {
  const tags = toTagArray(value)
  if (tags.length === 0) return null
  return (
    <div className={ax({ layout: 'wrap' })}>
      {tags.map((v, i) => <Badge key={i} variant="outline">{v}</Badge>)}
    </div>
  )
}

function PeopleList({ value }: { value: unknown }) {
  const list = Array.isArray(value) ? value : [value]
  const names = list.map((p) =>
    typeof p === 'object' && p !== null
      ? ((p as { name?: string }).name ?? JSON.stringify(p))
      : String(p),
  )
  return <span className={ax({ textStyle: 'caption' })}>{names.join(', ')}</span>
}

function ExpandableText({ value }: { value: string }) {
  const [open, setOpen] = useState(false)
  if (value.length <= LONG_TEXT_THRESHOLD) {
    return <span className={ax({ textStyle: 'body' })}>{value}</span>
  }
  const display = open ? value : `${value.slice(0, LONG_TEXT_THRESHOLD)}…`
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className={`text-left ${ax({ role: 'control', interactive: 'button', surface: 'ghost', textStyle: 'body' })}`}
    >
      {display}
    </button>
  )
}

function renderValue(_key: string, value: unknown, cat: Category) {
  if (value === null || value === undefined) return null

  if (cat === 'tags') return <TagList value={value} />
  if (cat === 'people') return <PeopleList value={value} />
  if (cat === 'date') return <span className={ax({ textStyle: 'caption' })}>{formatDate(value)}</span>

  if (Array.isArray(value)) {
    return (
      <div className={ax({ layout: 'wrap' })}>
        {value.map((v, i) => <Badge key={i} variant="outline">{String(v)}</Badge>)}
      </div>
    )
  }
  if (typeof value === 'object') {
    return <span className={ax({ textStyle: 'caption' })}>{JSON.stringify(value)}</span>
  }
  return <ExpandableText value={String(value)} />
}

function Row({ keyName, value, cat }: { keyName: string; value: unknown; cat: Category }) {
  return (
    <div className={ax({ layout: 'row' })}>
      <span className={`${styles.label} ${ax({ textStyle: 'caption', flex: 'none' })}`}>{keyName}</span>
      <div className={ax({ flex: '1' })}>{renderValue(keyName, value, cat)}</div>
    </div>
  )
}

export function FrontmatterCard({ data }: { data: Record<string, unknown> }) {
  const [open, setOpen] = usePersistedState<boolean>(PERSIST_KEY, true)

  const entries = Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([key, value]) => ({ key, value, cat: classify(key) }))

  if (entries.length === 0) return null

  const title = entries.find((e) => e.cat === 'title')?.value
  const subtitle = entries.find((e) => e.cat === 'subtitle')?.value
  const byline = entries.filter((e) => e.cat === 'date' || e.cat === 'people' || e.cat === 'tags')
  const others = entries.filter((e) => e.cat === 'other')
  // hidden은 전부 숨김

  const hasBody = Boolean(subtitle) || byline.length > 0 || others.length > 0
  if (!title && !hasBody) return null

  const handleToggle = () => setOpen((prev) => !prev)

  const headerLabel = typeof title === 'string' ? title : 'Properties'

  return (
    <section className={ax({
        role: 'control-group',
        surface: 'sunken', layout: 'stack' })}>
      <button
        type="button"
        onClick={handleToggle}
        data-expanded={open ? '' : undefined}
        aria-expanded={open}
        className={`${styles.header} ${ax({ role: 'control', interactive: 'button', surface: 'ghost', layout: 'spread', textStyle: 'section' })}`}
      >
        <span>{headerLabel}</span>
        {hasBody && <ChevronDown size={14} className={styles.chevron} />}
      </button>

      {open && hasBody && (
        <>
          {typeof subtitle === 'string' && (
            <div className={ax({ textStyle: 'caption' })}>
              <Markdown remarkPlugins={[remarkGfm]} components={{ p: Fragment }}>{subtitle}</Markdown>
            </div>
          )}
          {(byline.length > 0 || others.length > 0) && (
            <div className={ax({ layout: 'stack' })}>
              {[...byline, ...others].map(({ key, value, cat }) => (
                <Row key={key} keyName={key} value={value} cat={cat} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
