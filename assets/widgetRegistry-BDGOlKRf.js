var e=`// ② flat-layout-engine-prd.md
import type { ComponentType } from 'react'

export type WidgetRegistry = Record<string, ComponentType<Record<string, unknown>>>

export function createWidgetRegistry(widgets: WidgetRegistry): WidgetRegistry {
  return widgets
}

export function resolveWidget(registry: WidgetRegistry, type: string): ComponentType<Record<string, unknown>> | undefined {
  return registry[type]
}
`;export{e as default};