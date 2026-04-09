/**
 * A2UI v0.9 Surface Manager
 *
 * Manages surface lifecycle: create, update components, update data model, delete.
 * Each surface holds its own component tree and data model state.
 */
import type {
  A2UIServerMessage,
  A2UIClientMessage,
  A2UISurfaceState,
  A2UITheme,
} from './a2uiProtocol'
import type { A2UIPayload } from './a2uiAdapter'

// ── JSON Pointer operations ──

/** Get value at JSON Pointer path */
function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  if (!path || path === '/') return obj
  const segments = path.startsWith('/') ? path.slice(1).split('/') : path.split('/')
  let current: unknown = obj
  for (const seg of segments) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[seg]
  }
  return current
}

/** Set value at JSON Pointer path (immutable) */
function setAtPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  if (!path || path === '/') {
    return typeof value === 'object' && value !== null ? { ...value as Record<string, unknown> } : obj
  }
  const segments = path.startsWith('/') ? path.slice(1).split('/') : path.split('/')
  return setDeep(obj, segments, value)
}

function setDeep(obj: Record<string, unknown>, segments: string[], value: unknown): Record<string, unknown> {
  if (segments.length === 0) return typeof value === 'object' && value !== null ? { ...value as Record<string, unknown> } : obj
  const [head, ...rest] = segments
  const existing = obj[head]
  const child = typeof existing === 'object' && existing !== null ? { ...existing as Record<string, unknown> } : {}
  return { ...obj, [head]: rest.length === 0 ? value : setDeep(child, rest, value) }
}

/** Remove value at JSON Pointer path (immutable) */
function removeAtPath(obj: Record<string, unknown>, path: string): Record<string, unknown> {
  if (!path || path === '/') return {}
  const segments = path.startsWith('/') ? path.slice(1).split('/') : path.split('/')
  return removeDeep(obj, segments)
}

function removeDeep(obj: Record<string, unknown>, segments: string[]): Record<string, unknown> {
  if (segments.length === 0) return obj
  const [head, ...rest] = segments
  if (rest.length === 0) {
    const { [head]: _, ...remaining } = obj
    return remaining
  }
  const existing = obj[head]
  if (typeof existing !== 'object' || existing === null) return obj
  return { ...obj, [head]: removeDeep(existing as Record<string, unknown>, rest) }
}

// ── Surface Manager ──

export type SurfaceChangeListener = (surfaceId: string) => void

export class A2UISurfaceManager {
  private surfaces = new Map<string, A2UISurfaceState>()
  private listeners = new Set<SurfaceChangeListener>()
  private outbox: A2UIClientMessage[] = []

  /** Process a server→client message */
  processMessage(msg: A2UIServerMessage): void {
    if ('createSurface' in msg) {
      const { surfaceId, catalogId, theme, sendDataModel } = msg.createSurface
      this.surfaces.set(surfaceId, {
        surfaceId,
        catalogId,
        theme,
        sendDataModel: sendDataModel ?? false,
        components: [],
        dataModel: {},
      })
      this.notify(surfaceId)
    } else if ('updateComponents' in msg) {
      const { surfaceId, components } = msg.updateComponents
      const surface = this.surfaces.get(surfaceId)
      if (!surface) return
      // Merge: new components replace by ID, others preserved
      const map = new Map(surface.components.map(c => [c.id, c]))
      for (const comp of components) {
        map.set(comp.id, comp)
      }
      this.surfaces.set(surfaceId, { ...surface, components: [...map.values()] })
      this.notify(surfaceId)
    } else if ('updateDataModel' in msg) {
      const { surfaceId, path, value } = msg.updateDataModel
      const surface = this.surfaces.get(surfaceId)
      if (!surface) return
      if (value === undefined) {
        surface.dataModel = removeAtPath(surface.dataModel, path ?? '/')
      } else {
        surface.dataModel = setAtPath(surface.dataModel, path ?? '/', value)
      }
      this.notify(surfaceId)
    } else if ('deleteSurface' in msg) {
      this.surfaces.delete(msg.deleteSurface.surfaceId)
      this.notify(msg.deleteSurface.surfaceId)
    }
  }

  /** Get surface state */
  getSurface(surfaceId: string): A2UISurfaceState | undefined {
    return this.surfaces.get(surfaceId)
  }

  /** Get all surface IDs */
  getSurfaceIds(): string[] {
    return [...this.surfaces.keys()]
  }

  /** Convert surface to A2UIPayload for rendering */
  toPayload(surfaceId: string): A2UIPayload | null {
    const surface = this.surfaces.get(surfaceId)
    if (!surface) return null
    return {
      components: surface.components,
      ...(Object.keys(surface.dataModel).length > 0 ? { dataModel: surface.dataModel } : {}),
    }
  }

  /** Get theme for surface */
  getTheme(surfaceId: string): A2UITheme | undefined {
    return this.surfaces.get(surfaceId)?.theme
  }

  /** Dispatch action from client (e.g., button click) */
  dispatchAction(surfaceId: string, sourceComponentId: string, name: string, context: Record<string, unknown> = {}): void {
    this.outbox.push({
      type: 'action',
      name,
      surfaceId,
      sourceComponentId,
      timestamp: new Date().toISOString(),
      context,
    })
  }

  /** Dispatch validation error from client */
  dispatchError(surfaceId: string, path: string, message: string): void {
    this.outbox.push({
      type: 'error',
      code: 'VALIDATION_FAILED',
      surfaceId,
      path,
      message,
    })
  }

  /** Flush and return pending client→server messages */
  flush(): A2UIClientMessage[] {
    const msgs = this.outbox
    this.outbox = []
    return msgs
  }

  /** Update data model locally (for two-way input binding) */
  updateLocalData(surfaceId: string, path: string, value: unknown): void {
    const surface = this.surfaces.get(surfaceId)
    if (!surface) return
    surface.dataModel = setAtPath(surface.dataModel, path, value)
    this.notify(surfaceId)
  }

  /** Subscribe to surface changes */
  subscribe(listener: SurfaceChangeListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(surfaceId: string): void {
    for (const listener of this.listeners) {
      listener(surfaceId)
    }
  }
}

// Re-export path utilities for use in adapter
export { getAtPath, setAtPath }
