import { Children, cloneElement, useId } from 'react'
import type { ReactElement, ReactNode } from 'react'
import './Tooltip.css'

interface TooltipProps {
  content: string
  children: ReactElement
}

export function Tooltip({ content, children }: TooltipProps): ReactNode {
  const child = Children.only(children)
  const id = `tooltip-${useId()}`

  if (!content) {
    return child
  }

  return (
    <>
      {cloneElement(child, {
        interestfor: id,
        'aria-describedby': id,
      })}
      <span id={id} popover="hint" role="tooltip" className="tooltip">
        {content}
      </span>
    </>
  )
}
