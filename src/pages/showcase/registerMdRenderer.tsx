import { defineFileRenderer, type FileRenderProps } from '@os/ui/fileRenderers'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { showcaseMdConfig } from './mdConfig'

defineFileRenderer(['md'], {
  source: 'text',
  render: ({ content }: FileRenderProps) => (
    <MarkdownViewer
      content={content}
      config={showcaseMdConfig}
      className="markdown-file"
    />
  ),
})
