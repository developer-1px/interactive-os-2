import { Children, cloneElement, useId, useRef, useCallback } from 'react'
import type { ReactElement, ReactNode, CSSProperties } from 'react'
import styles from './Tooltip.module.css'

interface TooltipProps {
  content: string
  children: ReactElement
}

export function Tooltip({ content, children }: TooltipProps): ReactNode {
  const child = Children.only(children)
  const id = `tooltip-${useId()}`
  const anchorName = `--${id.replace(/[^a-zA-Z0-9-]/g, '')}`
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const delayRef = useRef<ReturnType<typeof setTimeout>>(null)

  const show = useCallback(() => {
    delayRef.current = setTimeout(() => {
      tooltipRef.current?.showPopover()
    }, 300)
  }, [])

  const hide = useCallback(() => {
    if (delayRef.current) clearTimeout(delayRef.current)
    tooltipRef.current?.hidePopover()
  }, [])

  if (!content) {
    return child
  }

  return (
    <>
      {cloneElement(child, {
        interestfor: id,
        'aria-describedby': id,
        style: { anchorName, ...(child.props as { style?: CSSProperties }).style },
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
      })}
      <span
        ref={tooltipRef}
        id={id}
        popover="hint"
        role="tooltip"
        className={styles.tooltip}
        style={{ positionAnchor: anchorName } as CSSProperties}
      >
        {content}
      </span>
    </>
  )
}
