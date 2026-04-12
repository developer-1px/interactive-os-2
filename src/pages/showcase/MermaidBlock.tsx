// @useState-hatch
import { useRef, useState, useEffect } from 'react'
import mermaid from 'mermaid'
import { ax } from '@styles/ax'
import { CopyButton } from '../../interactive-os/ui/CopyButton'

mermaid.initialize({ startOnLoad: false, theme: 'default' })

let mermaidCounter = 0

export function MermaidBlock({ code, onClick }: { code: string; onClick?: (svgHtml: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState('')

  useEffect(() => {
    const id = `mermaid-${++mermaidCounter}`
    mermaid.render(id, code).then(({ svg }) => setSvg(svg)).catch(() => setSvg(''))
  }, [code])

  const handleClick = () => {
    if (onClick && ref.current) {
      onClick(ref.current.innerHTML)
    }
  }

  if (!svg) return <pre><code>{code}</code></pre>
  return (
    <div className={ax({ placement: 'relative' })}>
      <div ref={ref} className={onClick ? 'lightbox-trigger' : undefined} dangerouslySetInnerHTML={{ __html: svg }} onClick={handleClick} />
      <CopyButton text={code} />
    </div>
  )
}
