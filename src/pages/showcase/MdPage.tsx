import { MarkdownViewer } from '@os/ui/MarkdownViewer'

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

  return <MarkdownViewer content={mod.default} />
}
