import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector'
import type { NormalizedData } from '../store/types'
import type { CommandEngine } from './types'

const identity = <T>(x: T): T => x

/**
 * Subscribe a component to an engine's store. Re-renders only when the selected
 * slice changes under `equalityFn` (default `Object.is`).
 *
 * This is the canonical way for widgets to read engine state without forcing a
 * parent rerender. Pair with `shallow` when the selector returns a composed
 * object/array.
 */
export function useEngineSelector<T>(
  engine: CommandEngine,
  selector: (store: NormalizedData) => T,
  equalityFn: (a: T, b: T) => boolean = Object.is,
): T {
  return useSyncExternalStoreWithSelector(
    engine.subscribeStore,
    engine.getStore,
    engine.getStore,
    selector,
    equalityFn,
  )
}

/**
 * Subscribe a component to the engine's full store. Equivalent to
 * `useEngineSelector(engine, s => s)`. Use this for internal OS hooks that
 * genuinely need the whole snapshot; prefer `useEngineSelector` in widgets.
 */
export function useEngineStore(engine: CommandEngine): NormalizedData {
  return useEngineSelector(engine, identity)
}
