/** @catalog 클릭 트리거 인터랙티브 팝오버 */
import { Children, cloneElement, useId, useRef, useEffect } from 'react'
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

interface PopoverProps {
  content: ReactNode
  placement?: Placement
  children: ReactNode
}

export function Popover({ content, placement = 'bottom', children }: PopoverProps): ReactNode {
  const id = `popover-${useId()}`
  const anchorName = `--${id.replace(/[^a-zA-Z0-9-]/g, '')}`
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (triggerRef.current) {
      ;(triggerRef.current.style as unknown as Record<string, unknown>).anchorName = anchorName
    }
  }, [anchorName])

  // Focus first focusable element inside popover when it opens
  useEffect(() => {
    const el = popoverRef.current
    if (!el) return

    const onToggle = (e: Event) => {
      const toggleEvent = e as ToggleEvent
      if (toggleEvent.newState === 'open') {
        const focusable = el.querySelector<HTMLElement>(
          'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable) {
          focusable.focus()
        } else {
          el.focus()
        }
      }
    }

    el.addEventListener('toggle', onToggle)
    return () => el.removeEventListener('toggle', onToggle)
  }, [])

  if (!content) {
    return children
  }

  const child = Children.only(children) as ReactElement

  return (
    <>
      {cloneElement(child as ReactElement<Record<string, unknown>>, {
        ref: triggerRef,
        'aria-haspopup': 'dialog',
        popovertarget: id,
      })}
      <div
        ref={popoverRef}
        id={id}
        popover="auto"
        role="dialog"
        tabIndex={-1}
        className={ax({
          role: 'tip',
          surface: 'overlay',
          placement: placementMap[placement],
          textStyle: 'body'
        })}
        style={{
          positionAnchor: anchorName,
          maxWidth: 'calc(var(--space-3xl) * 8)',
          ...offsetStyle[placement],
        } as CSSProperties}
      >
        {content}
      </div>
    </>
  )
}
