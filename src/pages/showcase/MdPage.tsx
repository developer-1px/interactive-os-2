import { MarkdownPreview } from '@os/ui/MarkdownPreview'
import { showcaseMdConfig } from './mdConfig'

interface MdPageProps {
  md: string
}

const mdModules = import.meta.glob<{ default: string }>('/contents/**/*.md', {
  query: '?raw',
  eager: true,
})

export default function MdPage({ md }: MdPageProps) {
  const mdPath = `/contents/${md}.md`
  const mod = mdModules[mdPath]

  if (!mod) {
    return <div className="page-header"><p className="page-desc">Not found: {mdPath}</p></div>
  }

  return <MarkdownPreview content={mod.default} config={showcaseMdConfig} />
}
