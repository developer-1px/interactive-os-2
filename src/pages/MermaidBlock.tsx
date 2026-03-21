import { useRef, useState, useEffect } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, theme: 'default' })

let mermaidCounter = 0

export function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState('')

  useEffect(() => {
    const id = `mermaid-${++mermaidCounter}`
    mermaid.render(id, code).then(({ svg }) => setSvg(svg)).catch(() => setSvg(''))
  }, [code])

  if (!svg) return <pre><code>{code}</code></pre>
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
}
