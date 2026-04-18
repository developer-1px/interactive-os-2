var e=`// ② 2026-04-05-ui-items-prd.md
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'

interface CodeCellProps {
  children: ReactNode
  className?: string
}

export function CodeCell({ children, className }: CodeCellProps) {
  return (
    <span className={ax({ textStyle: 'code', text: 'secondary', clamp: '1' }) + (className ? \` \${className}\` : '')}>
      {children}
    </span>
  )
}
`;export{e as default};