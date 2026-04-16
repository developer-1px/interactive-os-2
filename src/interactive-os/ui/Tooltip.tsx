/** @catalog 호버 시 툴팁 표시 */
import { Children, cloneElement, useId, useRef, useCallback, useEffect } from 'react'
import { ax } from '@styles/ax'
import type { ReactElement, ReactNode, CSSProperties } from 'react'

type Placement = 'top' | 'bottom' | 'left' | 'right'

const placementMap = {
  bottom: 'anchor-below',
  top: 'anchor-above',
  right: 'anchor-end',
  left: 'anchor-start',
} as const

const offsetStyle: Record<Placement, CSSProperties> = {
  bottom: { paddingBlockStart: 'var(--space-xs)' },
  top: { paddingBlockEnd: 'var(--space-xs)' },
  right: { paddingInlineStart: 'var(--space-xs)' },
  left: { paddingInlineEnd: 'var(--space-xs)' },
}

interface TooltipProps {
  content: string
  placement?: Placement
  children: ReactNode
}

export function Tooltip({ content, placement = 'bottom', children }: TooltipProps): ReactNode {
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
  const childProps = (child as ReactElement<Record<string, unknown>>).props as Record<string, unknown>

  return (
    <>
      {cloneElement(child as ReactElement<Record<string, unknown>>, {
        ref: triggerRef,
        interestfor: id,
        'aria-describedby': id,
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: childProps.onFocus
          ? (e: unknown) => { (childProps.onFocus as (e: unknown) => void)(e); show() }
          : show,
        onBlur: childProps.onBlur
          ? (e: unknown) => { (childProps.onBlur as (e: unknown) => void)(e); hide() }
          : hide,
      })}
      <span
        ref={tooltipRef}
        id={id}
        popover="hint"
        role="tooltip"
        className={`pointer-none ${ax({ surface: 'inverted', placement: placementMap[placement], padding: 'xs', shape: 'sm', textStyle: 'caption', motion: 'fade-slide-in' })}`}
        style={{
          positionAnchor: anchorName,
          maxWidth: 'calc(var(--space-3xl) * 6)',
          overflowWrap: 'break-word',
          ...offsetStyle[placement],
        } as CSSProperties}
      >
        {content}
      </span>
    </>
  )
}
