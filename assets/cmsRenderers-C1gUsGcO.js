var e=`// ② 2026-03-24-cms-editorial-content-prd.md
/* eslint-disable react-refresh/only-export-components */
import type { Locale } from './cmsTypes'
import { nodeRegistry, type NodePresentationDesc } from './cmsNodePresentation'

export { CmsIcon } from './cmsNodePresentation'

// ── Resolve helpers ──

type NodeTag = keyof React.JSX.IntrinsicElements

function resolveTag(desc: NodePresentationDesc | undefined, data: Record<string, string>): NodeTag {
  if (!desc?.tag) return 'div'
  return typeof desc.tag === 'function' ? desc.tag(data) : desc.tag
}

function resolveClassName(desc: NodePresentationDesc | undefined, data: Record<string, string>): string {
  if (!desc?.className) return ''
  return typeof desc.className === 'function' ? desc.className(data) : desc.className
}

// ── Consumer functions (registry 조회만, 분기 없음) ──

export function getSectionClassName(variant: string): string {
  const desc = nodeRegistry.get('section')
  return desc?.className
    ? typeof desc.className === 'function' ? desc.className({ type: 'section', variant } as Record<string, string>) : desc.className
    : ''
}

export function getChildrenContainerClassName(data: Record<string, string>): string | undefined {
  const desc = nodeRegistry.get('section')
  if (!desc?.childrenContainerClassName) return undefined
  return typeof desc.childrenContainerClassName === 'function' ? desc.childrenContainerClassName(data) : desc.childrenContainerClassName
}

export function getNodeClassName(data: Record<string, string>): string {
  return resolveClassName(nodeRegistry.get(data.type), data)
}

export function getNodeTag(data: Record<string, string>): NodeTag {
  return resolveTag(nodeRegistry.get(data.type), data)
}

export function NodeContent({ data, locale }: { data: Record<string, unknown>; locale: Locale }) {
  const desc = nodeRegistry.get(data.type as string)
  if (!desc?.render) return null
  return desc.render(data, locale) as React.ReactElement
}

// Section header types — rendered before the grid container
export const HEADER_TYPES = new Set(['section-label', 'section-title', 'section-desc', 'badge', 'text', 'cta', 'section-cta'])

// ── Editable fields — re-export from schema (single source of truth) ──

export { getEditableFields, getInlineEditableFields } from './cmsSchema'
`;export{e as default};