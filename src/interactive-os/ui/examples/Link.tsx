import { useState, useMemo, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { Aria } from '../../primitives/aria'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { link } from '../../pattern/roles/link'
import styles from './link.module.css'

// APG #35: Link
// https://www.w3.org/WAI/ARIA/apg/patterns/link/

const links = [
  { id: 'w3c', label: 'W3C Website', href: 'https://www.w3.org/' },
  { id: 'aria', label: 'ARIA Practices', href: 'https://www.w3.org/WAI/ARIA/apg/' },
  { id: 'wai', label: 'WAI Homepage', href: 'https://www.w3.org/WAI/' },
]

const data: NormalizedData = createStore({
  entities: Object.fromEntries(
    links.map(l => [l.id, { id: l.id, data: { label: l.label, href: l.href } }]),
  ),
  relationships: { [ROOT_ID]: links.map(l => l.id) },
})

const renderLink = (
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
): React.ReactElement => {
  const nodeData = node.data as Record<string, unknown>
  const label = nodeData?.label as string
  const href = nodeData?.href as string

  return (
    <div
      {...props}
      className={styles.link}
      data-focused={state.focused || undefined}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.url}>{href}</span>
    </div>
  )
}

export function Link() {
  const [store, setStore] = useState<NormalizedData>(data)
  const behavior = useMemo(() => link, [])
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <Aria
      behavior={behavior}
      data={store}
      plugins={[]}
      onChange={onChange}
      aria-label="Navigation Links"
    >
      <Aria.Item render={renderLink} />
    </Aria>
  )
}
