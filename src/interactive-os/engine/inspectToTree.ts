// ② 2026-04-03-app-inspector-prd.md
import type { NormalizedData, Entity } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { InspectResult } from './types'

export function inspectToTree(result: InspectResult): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = {}

  const COMMANDS_GROUP = '_group:commands'
  const KEYMAP_GROUP = '_group:keyMap'
  const PLUGINS_GROUP = '_group:plugins'
  const STATE_GROUP = '_group:state'
  const EXTRAS_GROUP = '_group:extras'

  entities[COMMANDS_GROUP] = {
    id: COMMANDS_GROUP,
    data: { label: 'commands', type: 'group', count: result.commands.length },
  }
  entities[KEYMAP_GROUP] = {
    id: KEYMAP_GROUP,
    data: { label: 'keyMap', type: 'group', count: Object.keys(result.keyMap).length },
  }
  entities[PLUGINS_GROUP] = {
    id: PLUGINS_GROUP,
    data: { label: 'plugins', type: 'group', count: result.plugins.length },
  }
  const entityCount = Object.keys(result.state.entities).length
  const relCount = Object.keys(result.state.relationships).length
  entities[STATE_GROUP] = {
    id: STATE_GROUP,
    data: { label: 'state', type: 'group', count: entityCount },
  }
  entities[EXTRAS_GROUP] = {
    id: EXTRAS_GROUP,
    data: { label: 'extras', type: 'group', count: Object.keys(result.extras).length },
  }

  relationships[ROOT_ID] = [COMMANDS_GROUP, KEYMAP_GROUP, PLUGINS_GROUP, STATE_GROUP, EXTRAS_GROUP]

  // Commands
  const commandChildren: string[] = []
  for (const cmd of result.commands) {
    const nodeId = `_cmd:${cmd}`
    entities[nodeId] = { id: nodeId, data: { label: cmd, type: 'command' } }
    commandChildren.push(nodeId)
  }
  relationships[COMMANDS_GROUP] = commandChildren

  // KeyMap
  const keyMapChildren: string[] = []
  for (const [key, owner] of Object.entries(result.keyMap)) {
    const nodeId = `_key:${key}`
    entities[nodeId] = { id: nodeId, data: { label: key, type: 'key', value: owner } }
    keyMapChildren.push(nodeId)
  }
  relationships[KEYMAP_GROUP] = keyMapChildren

  // Plugins
  const pluginChildren: string[] = []
  for (const name of result.plugins) {
    const nodeId = `_plugin:${name}`
    entities[nodeId] = { id: nodeId, data: { label: name, type: 'plugin' } }
    pluginChildren.push(nodeId)
  }
  relationships[PLUGINS_GROUP] = pluginChildren

  // State — entity count + relationship count as summary
  const stateEntities = `_state:entities`
  const stateRels = `_state:relationships`
  entities[stateEntities] = {
    id: stateEntities,
    data: { label: `entities (${entityCount})`, type: 'meta' },
  }
  entities[stateRels] = {
    id: stateRels,
    data: { label: `relationships (${relCount})`, type: 'meta' },
  }
  relationships[STATE_GROUP] = [stateEntities, stateRels]

  // State entities detail
  const stateEntityChildren: string[] = []
  for (const [id, entity] of Object.entries(result.state.entities)) {
    const nodeId = `_se:${id}`
    const { id: _id, ...rest } = entity
    entities[nodeId] = {
      id: nodeId,
      data: { label: id, type: id.startsWith('__') ? 'meta' : 'entity', value: JSON.stringify(rest) },
    }
    stateEntityChildren.push(nodeId)
  }
  relationships[stateEntities] = stateEntityChildren

  // State relationships detail
  const stateRelChildren: string[] = []
  for (const [parentId, childIds] of Object.entries(result.state.relationships)) {
    const nodeId = `_sr:${parentId}`
    entities[nodeId] = {
      id: nodeId,
      data: { label: `${parentId} → [${childIds.join(', ')}]`, type: 'rel' },
    }
    stateRelChildren.push(nodeId)
  }
  relationships[stateRels] = stateRelChildren

  // Extras — plugin-specific data
  const extrasChildren: string[] = []
  for (const [pluginName, data] of Object.entries(result.extras)) {
    const groupId = `_extra:${pluginName}`
    entities[groupId] = {
      id: groupId,
      data: { label: pluginName, type: 'plugin', count: Object.keys(data).length },
    }
    extrasChildren.push(groupId)

    const extraFields: string[] = []
    for (const [key, value] of Object.entries(data)) {
      const fieldId = `_extra:${pluginName}:${key}`
      entities[fieldId] = {
        id: fieldId,
        data: { label: key, type: 'field', value: JSON.stringify(value) },
      }
      extraFields.push(fieldId)
    }
    relationships[groupId] = extraFields
  }
  relationships[EXTRAS_GROUP] = extrasChildren

  return { entities, relationships }
}
