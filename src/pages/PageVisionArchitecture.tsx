import { useRef, useState, useEffect } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, theme: 'default' })

interface MermaidChartProps {
  code: string
  id: string
}

let mermaidSeq = 0

function MermaidChart({ code, id }: MermaidChartProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState('')

  useEffect(() => {
    const chartId = `vision-${id}-${++mermaidSeq}`
    mermaid.render(chartId, code).then(({ svg }) => setSvg(svg)).catch(() => setSvg(''))
  }, [code, id])

  if (!svg) return <pre><code>{code}</code></pre>
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
}

const sections = [
  {
    title: '1. Vision — LLM이 인터랙션을 재발명하지 않는 세계',
    chart: `graph TB
  subgraph Vision["Vision"]
    direction TB
    LLM["LLM (Cursor, Claude Code, ...)"]
    LLM -->|"one-line import"| IOS["interactive-os"]
    IOS -->|"keyboard + focus + CRUD"| App["Generated App"]
    App -->|"instantly operable"| User["End User"]
  end`,
  },
  {
    title: '2. Layer Architecture',
    chart: `graph TB
  subgraph UI["UI Layer"]
    TreeGrid & ListBox & TabList & Grid & More["...10+ components"]
  end
  subgraph Behavior["Behavior Layer"]
    BTypes["keyMap + focusStrategy + ariaAttributes + childRole"]
    B13["14 presets"]
  end
  subgraph Plugin["Plugin Layer"]
    PCore["core + history + crud"]
    PEdit["clipboard + rename + dnd"]
  end
  subgraph Engine["Command Engine"]
    Dispatch["dispatch() + middleware"]
  end
  subgraph Store["Normalized Store"]
    Entities["entities + relationships"]
  end
  UI --> Behavior
  Behavior --> Plugin
  Plugin --> Engine
  Engine --> Store`,
  },
  {
    title: '3. Command Lifecycle',
    chart: `sequenceDiagram
  participant U as User
  participant C as Component
  participant B as Behavior
  participant P as Plugin
  participant E as Engine
  participant S as Store

  U->>C: keydown
  C->>B: keyMap lookup
  B->>P: Command created
  P->>E: dispatch(command)
  E->>E: middleware pipeline
  E->>S: command.execute(store)
  S-->>E: new store
  E-->>C: onChange(newStore)
  C-->>U: re-render`,
  },
  {
    title: '4. Plugin Composition',
    chart: `graph LR
  subgraph Minimal["Minimal"]
    core
  end
  subgraph ReadOnly["Read-only"]
    core2[core] --> history
  end
  subgraph Editor["Full Editor"]
    core3[core] --> history2[history]
    core3 --> crud
    core3 --> clipboard
    core3 --> rename
    core3 --> dnd
  end`,
  },
  {
    title: '5. Gen UI Integration',
    chart: `graph TB
  subgraph LLMWorkflow["LLM generates UI"]
    direction TB
    Intent["User intent"]
    Intent -->|"1"| Select["Select Behavior"]
    Select -->|"2"| Plugins["Compose Plugins"]
    Plugins -->|"3"| Data["Convert to NormalizedData"]
    Data -->|"4"| Render["Render with Aria"]
  end`,
  },
]

export default function PageVisionArchitecture() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Architecture</h2>
        <p className="page-desc">
          interactive-os vision — a building block so LLMs never reinvent keyboard interaction.
          Five layers, each with a single responsibility.
        </p>
      </div>
      {sections.map((section) => (
        <div key={section.title} className="page-section">
          <h3 className="page-section-title">{section.title}</h3>
          <div className="card" style={{ padding: '16px', overflow: 'auto' }}>
            <MermaidChart code={section.chart} id={section.title} />
          </div>
        </div>
      ))}
    </div>
  )
}
