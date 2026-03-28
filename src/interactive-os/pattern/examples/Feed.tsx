import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { feed } from '../../pattern/roles/feed'
import styles from './feed.module.css'

// APG #24: Feed
// https://www.w3.org/WAI/ARIA/apg/patterns/feed/

const articles = [
  { id: 'article-1', label: 'Introduction to ARIA', body: 'ARIA defines semantics that can be applied to elements to give meaning to otherwise generic markup.' },
  { id: 'article-2', label: 'Web Accessibility', body: 'Web accessibility means that websites, tools, and technologies are designed so that people with disabilities can use them.' },
  { id: 'article-3', label: 'Screen Readers', body: 'A screen reader is a form of assistive technology that renders text and image content as speech or braille output.' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    articles.map(a => [a.id, { id: a.id, data: { label: a.label, body: a.body } }]),
  ),
  relationships: { [ROOT_ID]: articles.map(a => a.id) },
})

const renderArticle = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const nodeData = node.data as Record<string, unknown>
  const label = nodeData?.label as string
  const body = nodeData?.body as string

  return (
    <div
      {...props}
      className={styles.article}
      data-focused={state.focused || undefined}
    >
      <h3 className={styles.title}>{label}</h3>
      <p className={styles.body}>{body}</p>
    </div>
  )
}

export function Feed() {
  const [store, setStore] = useState<NormalizedData>(data)
  const pattern = useMemo(() => feed, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      pattern={pattern}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Articles"
    >
      <Aria.Item render={renderArticle} />
    </Aria>
  )
}
