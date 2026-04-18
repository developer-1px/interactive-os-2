var e=`import { useState, useCallback } from 'react'
import type { NormalizedData } from '../../store/types'
import type { NodeState } from '../../pattern/types'
import { createStore } from '../../store/createStore'
import { ROOT_ID } from '../../store/types'
import { Link as LinkComponent } from '../../ui/Link'
import { ax } from '@styles/ax'

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
      className={\`\${ax({ layout: 'bar', gap: 'sm', textStyle: 'body', padding: 'xs', content: 'text', tone: 'accent', interactive: 'item', shape: 'md' })} cursor-pointer outline-none\`}
      data-focused={state.focused || undefined}
    >
      <span>{label}</span>
      <span className={\`\${ax({ textStyle: 'caption', text: 'secondary' })} no-underline\`}>{href}</span>
    </div>
  )
}

export function Link() {
  const [store, setStore] = useState<NormalizedData>(data)
  const onChange = useCallback((next: NormalizedData) => setStore(next), [])

  return (
    <LinkComponent
      data={store}
      onChange={onChange}
      renderItem={renderLink}
      aria-label="Navigation Links"
    />
  )
}
`;export{e as default};