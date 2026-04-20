// featureToPlugin — FeatureRegistry를 engine Plugin으로 번역.
//
// Feature keymap은 scope(ctx)에 따라 런타임에 활성/비활성. engine Plugin의 keyMap은
// 등록 시점 고정이므로, 어댑터는 "가능한 모든 키의 union"을 등록하고 각 핸들러에서
// ctx getter로 현재 scope를 재평가해 우선순위 높은 것부터 시도한다.

import type { Plugin } from '@os/engine/types'
import { key } from '@os/axis/types'
import type { FeatureRegistry } from './featureRegistry'
import type { FeatureContext } from './defineFeature'

export function featureRegistryToPlugin(
  registry: FeatureRegistry,
  getContext: () => FeatureContext,
): Plugin {
  // 모든 Feature keymap이 바인딩하는 키의 union
  const allKeys = new Set<string>()
  for (const km of registry.keymaps) {
    for (const k of Object.keys(km.bindings)) allKeys.add(k)
  }

  const keyMap: Record<string, ReturnType<typeof key>> = {}
  for (const k of allKeys) {
    const commandIdsForKey = registry.keymaps
      .flatMap(km => (km.bindings[k] ? [km.bindings[k]] : []))

    keyMap[k] = key(commandIdsForKey, () => {
      const ctx = getContext()
      // priority desc 순으로 정렬된 keymaps에서 scope 만족하는 첫 바인딩 채택
      for (const km of registry.keymaps) {
        if (km.scope && !km.scope(ctx)) continue
        const cmdId = km.bindings[k]
        if (!cmdId) continue
        const handler = registry.commands[cmdId]
        if (handler) void handler(ctx)
        return // engine Command는 반환하지 않음 — Feature 핸들러가 직접 side-effect
      }
    })
  }

  return {
    name: 'feature-registry',
    keyMap: Object.keys(keyMap).length > 0 ? keyMap : undefined,
  }
}
