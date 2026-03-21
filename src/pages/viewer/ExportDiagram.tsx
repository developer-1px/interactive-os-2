import { useState, useEffect } from 'react'
import { MermaidBlock } from '../MermaidBlock'
import styles from '../PageViewer.module.css'

// --- Export structure types ---

interface ExportedSymbol {
  kind: 'function' | 'interface' | 'type' | 'const' | 'class'
  name: string
  signature?: string
  properties?: { name: string; type: string }[]
  value?: string
}

interface ExportsData {
  file: string
  symbols: ExportedSymbol[]
}

// --- Data fetching ---

async function fetchExports(filePath: string): Promise<ExportsData | null> {
  try {
    const res = await fetch(`/api/fs/exports?path=${encodeURIComponent(filePath)}`)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

// --- Diagram generation ---

function escapeMermaid(text: string): string {
  return text
    .replace(/~/g, '∼')
    .replace(/[<>]/g, m => m === '<' ? '‹' : '›')
    .replace(/"/g, "'")
}

function generateClassDiagram(data: ExportsData, filename: string): string {
  if (data.symbols.length === 0) return ''

  const lines: string[] = ['classDiagram']
  const moduleName = filename.replace(/\.[^.]+$/, '')

  // Group by kind
  const interfaces = data.symbols.filter(s => s.kind === 'interface' || s.kind === 'type' && s.properties?.length)
  const types = data.symbols.filter(s => s.kind === 'type' && !s.properties?.length)
  const functions = data.symbols.filter(s => s.kind === 'function')
  const consts = data.symbols.filter(s => s.kind === 'const')
  const classes = data.symbols.filter(s => s.kind === 'class')

  // Render interfaces/types with properties as classes
  for (const sym of [...interfaces, ...classes]) {
    lines.push(`  class ${sym.name} {`)
    if (sym.properties) {
      for (const prop of sym.properties) {
        lines.push(`    +${escapeMermaid(prop.name)} ${escapeMermaid(prop.type)}`)
      }
    }
    lines.push('  }')
    if (sym.kind === 'interface') {
      lines.push(`  <<interface>> ${sym.name}`)
    }
  }

  // Render functions as a module class
  if (functions.length > 0 || consts.length > 0) {
    lines.push(`  class ${moduleName} {`)
    for (const fn of functions) {
      lines.push(`    +${escapeMermaid(fn.name)}${escapeMermaid(fn.signature ?? '()')}`)
    }
    for (const c of consts) {
      lines.push(`    +${escapeMermaid(c.name)} ${escapeMermaid(c.value ?? '')}`)
    }
    lines.push('  }')
    lines.push(`  <<module>> ${moduleName}`)
  }

  // Type aliases without properties → note
  for (const t of types) {
    lines.push(`  class ${t.name} {`)
    lines.push(`    ${escapeMermaid(t.value ?? '...')}`)
    lines.push('  }')
    lines.push(`  <<type>> ${t.name}`)
  }

  // Relationships: if a function returns or takes an interface type
  const typeNames = new Set([...interfaces, ...classes, ...types].map(s => s.name))
  for (const fn of functions) {
    const sig = fn.signature ?? ''
    for (const typeName of typeNames) {
      if (sig.includes(typeName)) {
        lines.push(`  ${moduleName} ..> ${typeName} : uses`)
      }
    }
  }

  return lines.join('\n')
}

// --- Component ---

export function ExportDiagram({ filePath }: { filePath: string }) {
  const [mermaidCode, setMermaidCode] = useState<string | null>(null)
  const filename = filePath.split('/').pop() ?? ''

  useEffect(() => {
    let cancelled = false
    fetchExports(filePath).then(data => {
      if (cancelled || !data) { setMermaidCode(null); return }
      const code = generateClassDiagram(data, filename)
      setMermaidCode(code || null)
    })
    return () => { cancelled = true }
  }, [filePath, filename])

  if (!mermaidCode) return null

  return (
    <div className={styles.vwDepGraph}>
      <MermaidBlock code={mermaidCode} />
    </div>
  )
}
