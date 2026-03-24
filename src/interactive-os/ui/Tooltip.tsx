import { Children, cloneElement, useId, useRef, useCallback, useEffect } from 'react'
import type { ReactElement, ReactNode, CSSProperties } from 'react'
import styles from './Tooltip.module.css'

interface TooltipProps {
  content: string
  children: ReactNode
}

export function Tooltip({ content, children }: TooltipProps): ReactNode {
  const id = `tooltip-${useId()}`
  const anchorName = `--${id.replace(/[^a-zA-Z0-9-]/g, '')}`
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const delayRef = useRef<ReturnType<typeof setTimeout>>(null)
  const triggerRef = useRef<HTMLElement>(null)

  // Apply anchor-name style via ref to avoid accessing child.props during render
  useEffect(() => {
    if (triggerRef.current) {
      ;(triggerRef.current.style as unknown as Record<string, unknown>).anchorName = anchorName
    }
  }, [anchorName])

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
    return children
  }

  const child = Children.only(children) as ReactElement

  return (
    <>
      {cloneElement(child as ReactElement<Record<string, unknown>>, {
        ref: triggerRef,
        interestfor: id,
        'aria-describedby': id,
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
