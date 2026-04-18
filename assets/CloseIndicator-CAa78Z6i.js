var e=`import { ax } from '@styles/ax'
import { X } from 'lucide-react'

interface CloseIndicatorProps {
  className?: string
}

export function CloseIndicator({ className }: CloseIndicatorProps) {
  const classes = [\`inline-flex \${ax({ layout: 'center' })}\`, 'item-indicator--close', className].filter(Boolean).join(' ')
  return (
    <span className={classes}>
      <X size="1em" />
    </span>
  )
}
`;export{e as default};