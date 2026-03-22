import { ChevronRight } from 'lucide-react'
import styles from '../PageViewer.module.css'

export function Breadcrumb({ path, root }: { path: string; root: string }) {
  const relative = path.startsWith(root) ? path.slice(root.length + 1) : path
  const segments = relative.split('/')
  return (
    <div className={styles.vwBreadcrumb}>
      {segments.map((seg, i) => (
        <span key={i}>
          {i > 0 && <ChevronRight size={10} className={styles.vwBreadcrumbSep} />}
          <span className={i === segments.length - 1 ? styles.vwBreadcrumbCurrent : styles.vwBreadcrumbSegment}>{seg}</span>
        </span>
      ))}
    </div>
  )
}
