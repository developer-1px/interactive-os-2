import { definePlugin } from './definePlugin'
import { VALUE_ID } from '../axis/value'
import type { ValueRange } from '../axis/value'
import type { Plugin, Command } from './types'

interface DragResizeOptions {
  orientation: 'horizontal' | 'vertical'
  range: ValueRange
  /** Resolve the container element that defines the drag dimension */
  getContainer: () => HTMLElement | null
  /** Stable key to look up the current onDelta callback */
  callbackKey: string
}

/** Mutable registry for drag resize callbacks — avoids ref-in-render issues */
const deltaCallbacks = new Map<string, (delta: number) => void>()
export function registerDragCallback(key: string, cb: (delta: number) => void) { deltaCallbacks.set(key, cb) }
export function unregisterDragCallback(key: string) { deltaCallbacks.delete(key) }

export function dragResize(options: DragResizeOptions): Plugin {
  const { orientation, range, getContainer, callbackKey } = options
  const isHorizontal = orientation === 'horizontal'
  const valueSpan = range.max - range.min

  return definePlugin({
    name: 'dragResize',
    middleware: (next, getStore) => (command: Command) => {
      // Intercept drag start
      if (command.type === 'dragResize:start') {
        const { pointerId, target } = command.payload as { pointerId: number; target: HTMLElement }
        const container = getContainer()
        if (!container) return

        const dimension = isHorizontal
          ? container.getBoundingClientRect().width
          : container.getBoundingClientRect().height

        target.setPointerCapture(pointerId)

        let baseX: number | null = null
        let baseY: number | null = null

        const handleMove = (e: PointerEvent) => {
          if (baseX === null) { baseX = e.clientX; baseY = e.clientY }
          const pxDelta = isHorizontal ? e.clientX - baseX : e.clientY - baseY!
          deltaCallbacks.get(callbackKey)?.(pxDelta / dimension)
        }

        document.addEventListener('pointermove', handleMove)
        target.addEventListener('lostpointercapture', () => {
          document.removeEventListener('pointermove', handleMove)
        }, { once: true })
        return
      }

      // Intercept value commands → convert to delta, don't update store
      if (command.type === 'core:set-value' || command.type === 'core:increment-value') {
        const store = getStore()
        const valueMeta = store.entities[VALUE_ID] as Record<string, unknown> | undefined
        const currentValue = (valueMeta?.value as number) ?? range.min

        let newValue: number
        if (command.type === 'core:increment-value') {
          const payload = command.payload as { step: number; min: number; max: number }
          newValue = Math.max(payload.min, Math.min(payload.max, currentValue + payload.step))
        } else {
          const payload = command.payload as { value: number }
          newValue = payload.value
        }

        const delta = (newValue - currentValue) / valueSpan
        if (delta !== 0) deltaCallbacks.get(callbackKey)?.(delta)
        return // Don't pass to store — we handle externally
      }

      next(command)
    },
  })
}

/** Command to initiate a drag resize */
export function startDragResize(pointerId: number, target: HTMLElement) {
  return { type: 'dragResize:start' as const, payload: { pointerId, target } }
}
