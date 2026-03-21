export interface Entity<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string
  data?: T
  [key: string]: unknown
}

export interface NormalizedData {
  entities: Record<string, Entity>
  relationships: Record<string, string[]>
}

export const ROOT_ID = '__root__' as const

export interface Command {
  type: string
  payload: unknown
  execute(store: NormalizedData): NormalizedData
  undo(store: NormalizedData): NormalizedData
}

export interface BatchCommand extends Command {
  type: 'batch'
  commands: Command[]
}

export interface TransformAdapter<TExternal> {
  normalize(external: TExternal): NormalizedData
  denormalize(internal: NormalizedData): TExternal
}

export function createBatchCommand(cmds: Command[]): BatchCommand {
  return {
    type: 'batch',
    payload: null,
    commands: cmds,
    execute: (store: NormalizedData): NormalizedData =>
      cmds.reduce((s, c) => c.execute(s), store),
    undo: (store: NormalizedData): NormalizedData =>
      [...cmds].reverse().reduce((s, c) => c.undo(s), store),
  }
}

export type Middleware = (
  next: (command: Command) => void
) => (command: Command) => void

export interface Plugin {
  middleware?: Middleware
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commands?: Record<string, (...args: any[]) => Command>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyMap?: Record<string, (ctx: any) => Command | void>
  /** Fallback handler for keyboard events not matched by keyMap.
   *  Receives the raw KeyboardEvent. Return true to preventDefault. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUnhandledKey?: (event: KeyboardEvent, engine: any) => boolean
}
