/** @catalog 경로 탐색 브레드크럼 */
import { ax } from '@styles/ax'

export function Breadcrumb({ path, root }: { path: string; root: string }) {
  if (!path) return null
  const relative = path.startsWith(root) ? path.slice(root.length ? root.length + 1 : 0) : path
  const segments = relative.split('/')
  return (
    <nav aria-label="Breadcrumb">
      <ol className={ax({ layout: 'bar', gap: 'xs', textStyle: 'body', clamp: '1' })}>
        {segments.map((seg, i) => (
          <li key={i} className={ax({ layout: 'bar', gap: 'xs' })}>
            {i > 0 && <span className={ax({  })} aria-hidden="true">/</span>}
            {i === segments.length - 1
              ? <span className={ax({  })} aria-current="page">{seg}</span>
              : <span className={ax({  })}>{seg}</span>
            }
          </li>
        ))}
      </ol>
    </nav>
  )
}
