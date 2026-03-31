import { SeparatorIndicator } from './indicators'
import styles from './Breadcrumb.module.css'

export function Breadcrumb({ path, root }: { path: string; root: string }) {
  if (!path) return null
  const relative = path.startsWith(root) ? path.slice(root.length + 1) : path
  const segments = relative.split('/')
  return (
    <div className={`flex-row items-center overflow-hidden whitespace-nowrap ${styles.breadcrumb}`}>
      {segments.map((seg, i) => (
        <span key={i}>
          {i > 0 && <SeparatorIndicator orientation="vertical" className={`shrink-0 ${styles.sep}`} />}
          <span className={i === segments.length - 1 ? styles.current : styles.segment}>{seg}</span>
        </span>
      ))}
    </div>
  )
}
