import { ax } from '@styles/ax'
import '@styles/ax.css'

export function Breadcrumb({ path, root }: { path: string; root: string }) {
  if (!path) return null
  const relative = path.startsWith(root) ? path.slice(root.length + 1) : path
  const segments = relative.split('/')
  return (
    <div className={ax({ layout: 'bar', gap: 'xs', textStyle: 'body', text: 'muted', clamp: '1' })}>
      {segments.map((seg, i) => (
        <span key={i}>
          {i > 0 && <span className={ax({ text: 'muted' })}>/</span>}
          <span className={i === segments.length - 1 ? ax({ text: 'primary' }) : ax({ text: 'muted' })}>{seg}</span>
        </span>
      ))}
    </div>
  )
}
