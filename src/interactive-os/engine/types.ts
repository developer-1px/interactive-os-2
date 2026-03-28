// ② 2026-03-24-isomorphic-layer-tree-prd.md
import type { NormalizedData } from '../store/types'

// ② 2026-03-29-engine-handler-registry-prd.md
export interface Command {
  type: string
  payload?: unknown
  meta?: boolean
}

export interface BatchCommand extends Command {
  type: 'batch'
  commands: Command[]
}

export function createBatchCommand(cmds: Command[]): BatchCommand {
  return {
    type: 'batch',
    commands: cmds,
  }
}

/** Handler function type for command registry */
export type CommandHandler = (store: NormalizedData, payload?: unknown) => NormalizedData

export type Middleware = (
  next: (command: Command) => void,
  getStore: () => NormalizedData
) => (command: Command) => void

/** Visibility filter — axis/plugin이 선언, getVisibleNodes가 소비 */
export interface VisibilityFilter {
  /** false면 이 노드 자체를 스킵 (push하지 않음) */
  shouldShow?(nodeId: string, store: NormalizedData): boolean
  /** false면 이 노드의 자식을 walk하지 않음 */
  shouldDescend?(nodeId: string, store: NormalizedData): boolean
}

/** Plugin 인터페이스 — engine이 소비하는 계약 */
export interface Plugin {
  name?: string
  middleware?: Middleware
  visibilityFilter?: VisibilityFilter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commands?: Record<string, (...args: any[]) => Command>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyMap?: Record<string, (ctx: any, original?: () => Command | void) => Command | void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUnhandledKey?: (event: KeyboardEvent, engine: any) => boolean
  intercepts?: readonly string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCopy?: (ctx: any) => Command | void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCut?: (ctx: any) => Command | void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPaste?: (ctx: any) => Command | void
}
