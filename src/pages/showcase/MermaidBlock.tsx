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
    let cancelled = false
    const id = `mermaid-${++mermaidCounter}`
    mermaid.render(id, code).then(({ svg }) => { if (!cancelled) setSvg(svg) }).catch(() => { if (!cancelled) setSvg('') })
    return () => { cancelled = true }
  }, [code])

  const handleClick = () => {
    if (onClick && ref.current) {
      onClick(ref.current.innerHTML)
    }
  }

  return (
    <div className={ax({ placement: 'relative' })}>
      <div
        ref={ref}
        className={onClick ? 'lightbox-trigger' : undefined}
        dangerouslySetInnerHTML={{ __html: svg }}
        onClick={handleClick}
      />
      {svg && <CopyButton text={code} />}
    </div>
  )
}
