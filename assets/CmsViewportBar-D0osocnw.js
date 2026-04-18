var e=`// ② 2026-03-24-cms-floating-viewport-bar-prd.md
import { Smartphone, Tablet, Monitor, Play } from 'lucide-react'
import type { ViewportSize } from './CmsViewportWrapper'
import { ax } from '@styles/ax'
import { Button } from '@os/ui/Button'

interface CmsViewportBarProps {
  viewport: ViewportSize
  onViewportChange: (v: ViewportSize) => void
  onPresent: () => void
  hidden: boolean
}

export default function CmsViewportBar({ viewport, onViewportChange, onPresent, hidden }: CmsViewportBarProps) {
  if (hidden) return null

  return (
    <div className={\`cms-viewport-bar \${ax({ surface: 'overlay', layout: 'bar', width: 'fit', padding: 'xs', gap: 'xs', shape: 'xl' })}\`} aria-label="Viewport controls">
      {([['mobile', Smartphone], ['tablet', Tablet], ['desktop', Monitor]] as const).map(([v, Icon]) => (
        <Button
          key={v}
          icon
          className={\`cms-floating-toolbar__btn\${viewport === v ? ' cms-floating-toolbar__btn--active' : ''}\`}
          onClick={() => onViewportChange(v as ViewportSize)}
          title={v}
        >
          <Icon size={16} />
        </Button>
      ))}
      <div className={\`cms-floating-toolbar__sep \${ax({ border: 'start' })}\`} />
      <Button icon className="cms-floating-toolbar__btn" onClick={onPresent} title="Present">
        <Play size={16} />
      </Button>
    </div>
  )
}
`;export{e as default};