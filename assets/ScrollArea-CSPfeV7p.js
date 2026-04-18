var e=`/** @catalog 스크롤 영역 컨테이너 */
import { forwardRef, type ReactNode, type CSSProperties } from 'react'
import { ax } from '@styles/ax'

interface ScrollAreaProps {
  children: ReactNode
  /** 스크롤 방향. 기본 'vertical' */
  orientation?: 'vertical' | 'horizontal'
  className?: string
  style?: CSSProperties
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea({ children, orientation = 'vertical', className, style }, ref) {
    return (
      <div
        ref={ref}
        className={\`\${ax({ layout: orientation === 'vertical' ? 'scroll' : 'scroll-x' })}\${className ? \` \${className}\` : ''}\`}
        style={style}
      >
        {children}
      </div>
    )
  },
)
`;export{e as default};