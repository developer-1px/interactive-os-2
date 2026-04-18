var e=`import type { MarkdownRendererConfig } from '@os/ui/MarkdownViewer'
import remarkRender from './remarkRender'
import { parseJsx } from './parseJsx'
import { mdComponents } from './mdComponents'
import { MermaidBlock } from './MermaidBlock'

export const showcaseMdConfig: MarkdownRendererConfig = {
  remarkPlugins: [remarkRender],
  componentRegistry: mdComponents,
  parseComponent: parseJsx,
  mermaidComponent: MermaidBlock,
}
`;export{e as default};