var e=`/** @catalog 파일 포맷별 프리뷰 렌더러 registry (OCP) */
import type { ReactNode } from 'react'
import type { HighlightTone, CodeViewerPreset } from './CodeViewer'

// --- Registry types ---

export interface FileRenderProps {
  content: string
  src: string
  filename: string
  highlightLines?: Set<number> | Map<number, HighlightTone>
  preset?: CodeViewerPreset
}

export interface FileRendererDescriptor {
  /** 'text'면 content를 fetch, 'url'이면 src URL만 전달 */
  source: 'text' | 'url'
  render: (props: FileRenderProps) => ReactNode
}

const registry = new Map<string, FileRendererDescriptor>()

export function defineFileRenderer(extensions: string[], descriptor: FileRendererDescriptor) {
  for (const ext of extensions) {
    registry.set(ext, descriptor)
  }
}

export function getFileRenderer(filename: string): FileRendererDescriptor | undefined {
  const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : ''
  return registry.get(ext)
}

/** 확장자로 source 타입 조회 — fetch 전에 text/url 분기용 */
export function getFileSource(filename: string): 'text' | 'url' {
  return getFileRenderer(filename)?.source ?? 'text'
}
`;export{e as default};