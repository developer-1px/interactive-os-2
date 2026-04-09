/**
 * A2UI v0.9 Protocol Types
 *
 * Complete type definitions for Google A2UI v0.9 wire format.
 * Covers all server→client and client→server messages.
 */

// ── Dynamic Types ──

/** Literal, path binding, or function call */
export type DynamicString = string | { path: string } | A2UIFunctionCall
export type DynamicNumber = number | { path: string } | A2UIFunctionCall
export type DynamicBoolean = boolean | { path: string } | A2UIFunctionCall
export type DynamicStringList = string[] | { path: string } | A2UIFunctionCall

/** Function call expression */
export interface A2UIFunctionCall {
  call: string
  args: Record<string, unknown>
  returnType?: string
}

// ── ChildList ──

/** Static array of IDs or template for iteration */
export type A2UIChildList =
  | string[]
  | { path: string; componentId: string }

// ── Action ──

export interface A2UIEventAction {
  name: string
  context?: Record<string, unknown>
}

export interface A2UIAction {
  event?: A2UIEventAction | null
  functionCall?: A2UIFunctionCall | null
}

// ── Component ──

export interface A2UIComponent {
  id: string
  component: string
  [key: string]: unknown
}

// ── Server → Client Messages ──

export interface A2UICreateSurface {
  surfaceId: string
  catalogId: string
  theme?: A2UITheme
  sendDataModel?: boolean
}

export interface A2UIUpdateComponents {
  surfaceId: string
  components: A2UIComponent[]
}

export interface A2UIUpdateDataModel {
  surfaceId: string
  path?: string
  value?: unknown
}

export interface A2UIDeleteSurface {
  surfaceId: string
}

export type A2UIServerMessage =
  | { version: string; createSurface: A2UICreateSurface }
  | { version: string; updateComponents: A2UIUpdateComponents }
  | { version: string; updateDataModel: A2UIUpdateDataModel }
  | { version: string; deleteSurface: A2UIDeleteSurface }

// ── Client → Server Messages ──

export interface A2UIActionMessage {
  type: 'action'
  name: string
  surfaceId: string
  sourceComponentId: string
  timestamp: string
  context: Record<string, unknown>
}

export interface A2UIErrorMessage {
  type: 'error'
  code: string
  surfaceId: string
  path: string
  message: string
}

export type A2UIClientMessage = A2UIActionMessage | A2UIErrorMessage

// ── Theme ──

export interface A2UITheme {
  primaryColor?: string
  iconUrl?: string
  agentDisplayName?: string
}

// ── Capabilities ──

export interface A2UIClientCapabilities {
  supportedCatalogIds: string[]
  inlineCatalogs?: unknown[]
}

// ── Surface State ──

export interface A2UISurfaceState {
  surfaceId: string
  catalogId: string
  theme?: A2UITheme
  sendDataModel: boolean
  components: A2UIComponent[]
  dataModel: Record<string, unknown>
}
