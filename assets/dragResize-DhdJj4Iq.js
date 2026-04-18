var e=`import { definePlugin } from './definePlugin'
import type { Plugin, Command } from './types'

interface DragResizeOptions {
  orientation: 'horizontal' | 'vertical'
  getContainer: () => HTMLElement | null
  onDragStart: () => void
  onDragMove: (cumulativeDelta: number) => void
}

export function dragResize(options: DragResizeOptions): Plugin {
  const { orientation, getContainer } = options
  const isHorizontal = orientation === 'horizontal'

  return definePlugin({
    name: 'dragResize',
    middleware: (next) => (command: Command) => {
      if (command.type === 'dragResize:start') {
        const { pointerId, target, clientX, clientY } = command.payload as {
          pointerId: number; target: HTMLElement; clientX: number; clientY: number
        }
        const container = getContainer()
        if (!container) return

        const dimension = isHorizontal
          ? container.getBoundingClientRect().width
          : container.getBoundingClientRect().height
        const startPos = isHorizontal ? clientX : clientY

        target.setPointerCapture(pointerId)
        options.onDragStart()

        const handleMove = (e: PointerEvent) => {
          const currentPos = isHorizontal ? e.clientX : e.clientY
          options.onDragMove((currentPos - startPos) / dimension)
        }

        document.addEventListener('pointermove', handleMove)
        target.addEventListener('lostpointercapture', () => {
          document.removeEventListener('pointermove', handleMove)
        }, { once: true })
        return
      }

      next(command)
    },
  })
}

export function startDragResize(pointerId: number, target: HTMLElement, clientX: number, clientY: number) {
  return { type: 'dragResize:start' as const, payload: { pointerId, target, clientX, clientY } }
}

// --- keyboard resize: separate plugin ---

interface KeyboardResizeOptions {
  onDelta: (delta: number) => void
}

export function keyboardResize(options: KeyboardResizeOptions): Plugin {
  return definePlugin({
    name: 'keyboardResize',
    middleware: (next) => (command: Command) => {
      if (command.type === 'resize:delta') {
        const { delta } = command.payload as { delta: number }
        if (delta !== 0) options.onDelta(delta)
        return
      }
      next(command)
    },
  })
}

export function resizeDelta(delta: number) {
  return { type: 'resize:delta' as const, payload: { delta } }
}
`;export{e as default};