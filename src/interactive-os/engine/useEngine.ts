import { useState, useEffect, useRef } from 'react'
import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import { createCommandEngine } from './createCommandEngine'
import type { CommandEngine } from './createCommandEngine'

export interface UseEngineOptions {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
}

export interface UseEngineReturn {
  engine: CommandEngine
  store: NormalizedData
}

export function useEngine(options: UseEngineOptions): UseEngineReturn {
  const { data, plugins = [], onChange } = options
  const [, forceRender] = useState(0)
  const engineRef = useRef<CommandEngine | null>(null)
  const onChangeRef = useRef(onChange)
  // eslint-disable-next-line react-hooks/refs
  onChangeRef.current = onChange

  if (engineRef.current == null) {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      const commandTypes = new Set(plugins.flatMap((p) => Object.keys(p.commands ?? {})))
      for (const p of plugins) {
        for (const dep of p.intercepts ?? []) {
          if (!commandTypes.has(dep)) {
            console.warn(`[${p.name ?? 'anonymous'}] intercepts "${dep}" but no plugin provides it`)
          }
        }
      }
    }

    const middlewares = plugins
      .map((p) => p.middleware)
      .filter((m): m is NonNullable<typeof m> => m != null)

    // eslint-disable-next-line react-hooks/refs
    engineRef.current = createCommandEngine(data, middlewares, (newStore) => {
      onChangeRef.current?.(newStore)
      forceRender((n) => n + 1)
    })
  }

  // eslint-disable-next-line react-hooks/refs
  const engine = engineRef.current

  // Sync external data changes into the engine (pure data, no meta-entity preservation)
  useEffect(() => {
    const currentStore = engine.getStore()
    if (data === currentStore) return
    const entitiesChanged =
      data.relationships !== currentStore.relationships ||
      Object.keys(data.entities).some((key) => data.entities[key] !== currentStore.entities[key]) ||
      Object.keys(currentStore.entities).some((key) => !(key in data.entities))
    if (!entitiesChanged) return

    engine.syncStore(data)
    forceRender((n) => n + 1)
  }, [data, engine])

  // eslint-disable-next-line react-hooks/refs
  const store = engine.getStore()

  // eslint-disable-next-line react-hooks/refs
  return { engine, store }
}
