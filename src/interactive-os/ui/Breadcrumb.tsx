import { ax } from '@styles/ax'
import '@styles/ax.css'
import { SeparatorIndicator } from './indicators'
import styles from './Breadcrumb.module.css'

export function Breadcrumb({ path, root }: { path: string; root: string }) {
  if (!path) return null
  const relative = path.startsWith(root) ? path.slice(root.length + 1) : path
  const segments = relative.split('/')
  return (
    <div className={`${ax({ layout: 'bar', textStyle: 'body', text: 'muted', clamp: '1' })} ${styles.breadcrumb}`}>
      {segments.map((seg, i) => (
        <span key={i}>
          {i > 0 && <SeparatorIndicator orientation="vertical" className={styles.sep} />}
          <span className={i === segments.length - 1 ? ax({ text: 'primary' }) : ax({ text: 'muted' })}>{seg}</span>
        </span>
      ))}
    </div>
  )
}
