// ② 2026-03-24-cms-floating-viewport-bar-prd.md
import { Smartphone, Tablet, Monitor, Play } from 'lucide-react'
import type { ViewportSize } from './CmsViewportWrapper'

interface CmsViewportBarProps {
  viewport: ViewportSize
  onViewportChange: (v: ViewportSize) => void
  onPresent: () => void
  hidden: boolean
}

export default function CmsViewportBar({ viewport, onViewportChange, onPresent, hidden }: CmsViewportBarProps) {
  if (hidden) return null

  return (
    <div className="cms-viewport-bar" aria-label="Viewport controls">
      {([['mobile', Smartphone], ['tablet', Tablet], ['desktop', Monitor]] as const).map(([v, Icon]) => (
        <button
          key={v}
          type="button"
          className={`cms-floating-toolbar__btn${viewport === v ? ' cms-floating-toolbar__btn--active' : ''}`}
          onClick={() => onViewportChange(v as ViewportSize)}
          title={v}
        >
          <Icon size={16} />
        </button>
      ))}
      <div className="cms-floating-toolbar__sep" />
      <button className="cms-floating-toolbar__btn" onClick={onPresent} title="Present" type="button">
        <Play size={16} />
      </button>
    </div>
  )
}
