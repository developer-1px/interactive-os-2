// ② 2026-03-24-isomorphic-layer-tree-prd.md
import type React from 'react'
import type { NormalizedData } from '../store/types'
import type { StoreDiff } from '../store/computeStoreDiff'
import type { InspectPatternInfo } from './computeNodeAriaProps'
import type { LogEntry } from './logger'

// ② 2026-03-29-engine-handler-registry-prd.md

// ② 2026-04-03-app-inspector-prd.md
export interface KeyMapEntry {
  owner: string
  command?: string
}

// ② 2026-04-04-command-binding-registry-prd.md
export interface BindingEntry {
  command: string
  nodeId: string | null
  input: string
}

export interface InspectResult {
  commands: string[]
  keyMap: Record<string, KeyMapEntry>
  plugins: string[]
  state: NormalizedData
  extras: Record<string, Record<string, unknown>>
  /** Pattern role — for ASCII tree rendering */
  role?: string
  /** Pattern child role — for ASCII tree rendering */
  childRole?: string
  /** Registered command-input bindings from bindingRegistry */
  bindings?: BindingEntry[]
  /** Declarative click bindings from pattern clickMap */
  clickMap?: Record<string, readonly string[]>
  /** Per-node lightweight ARIA labels (role + key states) for tree display */
  nodeProps?: Record<string, Record<string, string>>
  /** Compute full ARIA props for a single node on-demand (inspector x-ray) */
  computeNodeProps?: (nodeId: string) => Record<string, string>
}

export interface DispatchEvent {
  readonly kind: 'dispatch'
  readonly seq: number
  readonly command: Command
  readonly prev: NormalizedData
  readonly next: NormalizedData
  /** lazy — 접근 시에만 computeStoreDiff 실행 */
  readonly diff: StoreDiff[]
  readonly error?: string
  /** Original command type before middleware transformation */
  readonly originalType?: string
  /** Original command payload before middleware transformation */
  readonly originalPayload?: unknown
}

export interface UnhandledKeyEvent {
  readonly kind: 'unhandled-key'
  readonly seq: number
  readonly key: string
  readonly code: string
  readonly modifiers: string
}

export type EngineEvent = DispatchEvent | UnhandledKeyEvent
export type Unsubscribe = () => void

export interface CommandEngine {
  dispatch(command: Command): CommandResult
  getStore(): NormalizedData
  /** Replace internal store with external data (for controlled/sync scenarios) */
  syncStore(newStore: NormalizedData): void
  /** Introspect engine capability — commands, keyMap, plugins, state, plugin extras */
  inspect(): InspectResult
  /** Set keyMap description for inspect() — called by view layer after merging pattern+plugin+user keyMaps */
  setInspectKeyMap(desc: Record<string, KeyMapEntry>): void
  /** Set pattern role info for inspect() — called by view layer */
  setInspectRole(role: string, childRole?: string): void
  /** Set pattern info for inspect() node-level ARIA x-ray — called by view layer */
  setInspectPattern(info: InspectPatternInfo): void
  /** Subscribe to engine events (dispatch, error, etc.) */
  subscribe(listener: (event: EngineEvent) => void): Unsubscribe
  /** Emit an unhandled key event — called by view layer when keyMap has no match */
  emitUnhandledKey(event: KeyboardEvent): void
}

// ② engine-validator-clipboard-prd.md
export type CommandResult =
  | { ok: true; store: NormalizedData }
  | { ok: false; reason: string }

// ② engine-validator-clipboard-prd.md
export type ValidatorFn = (store: NormalizedData, command: Command) => CommandResult | undefined

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
  /** false면 이 노드를 visible에 push하지 않지만 자식은 walk (container skip) */
  isFocusable?(nodeId: string, store: NormalizedData): boolean
}

export interface EngineOptions {
  logger?: boolean | ((entry: LogEntry) => void)
  /** Merged keyMap from all plugins — for inspect() introspection */
  keyMap?: Record<string, KeyMapEntry>
  /** Plugin instances — for inspect() introspection */
  plugins?: Plugin[]
}

export function isBatchCommand(cmd: Command): cmd is BatchCommand {
  return cmd.type === 'batch' && 'commands' in cmd
}

/** Build a handler registry from command sets (axes, plugins, etc.) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildRegistry(...sources: Record<string, any>[]): Map<string, CommandHandler> {
  const registry = new Map<string, CommandHandler>()
  for (const source of sources) {
    for (const creator of Object.values(source)) {
      if (creator != null && 'type' in creator && 'handler' in creator) {
        registry.set(creator.type as string, creator.handler as CommandHandler)
      }
    }
  }
  return registry
}

/** Renderer 모듈 — Plugin이 optional로 제공하는 렌더링 확장 */
export interface RendererModule {
  /** 노드 렌더러. null 반환 시 다음 renderer로 fallback */
  renderItem?: (
    props: Record<string, unknown>,
    item: Record<string, unknown>,
    state: Record<string, unknown>,
  ) => unknown
}

// ② 2026-04-03-plugin-effect-autoscroll-prd.md
/** Effect context — read-only, DOM-only. dispatch 접근 불가 (whitelist 타입) */
export interface EffectContext {
  containerRef: React.RefObject<HTMLElement | null>
  getStore: () => NormalizedData
}

/** Plugin 인터페이스 — engine이 소비하는 계약 */
export interface Plugin {
  name?: string
  /** React hook body — DOM read+write만 허용, dispatch/setState 금지 */
  useEffect?: (ctx: EffectContext) => void
  middleware?: Middleware
  visibilityFilter?: VisibilityFilter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commands?: Record<string, (...args: any[]) => Command>
  keyMap?: Record<string, import('../axis/types').KeyHandler>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUnhandledKey?: (event: KeyboardEvent, engine: any) => boolean
  intercepts?: readonly string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCopy?: (ctx: any) => Command | void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCut?: (ctx: any) => Command | void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPaste?: (ctx: any) => Command | void
  /** Write OS 확장팩의 optional renderer — behavior + 렌더링을 자급자족 */
  renderer?: RendererModule
  /** Introspect plugin-specific data for devtools inspector */
  inspect?: () => Record<string, unknown>
  // ② engine-validator-clipboard-prd.md
  validator?: ValidatorFn
}
