# interactive-os — Architecture Vision

> 작성일: 2026-03-17
> 현재 상태가 아닌, 프로젝트의 이상적 완성 형태를 그린 로드맵 구조도

---

## 1. 전체 비전 — Gen UI 시대의 인터랙션 빌딩블록

```mermaid
graph TB
  subgraph Vision["🎯 Vision: LLM이 인터랙션을 재발명하지 않는 세계"]
    direction TB
    LLM["LLM (Cursor, Claude Code, ...)"]
    LLM -->|"한 줄 import"| IOS["interactive-os"]
    IOS -->|"keyboard + focus + CRUD<br/>자동 해결"| App["Generated Application"]
    App -->|"사용자가 즉시 조작 가능"| User["End User"]
  end

  style Vision fill:#1a1a2e,stroke:#e94560,color:#eee
  style LLM fill:#0f3460,stroke:#e94560,color:#eee
  style IOS fill:#e94560,stroke:#fff,color:#fff
  style App fill:#16213e,stroke:#e94560,color:#eee
  style User fill:#0f3460,stroke:#e94560,color:#eee
```

---

## 2. 레이어 아키텍처 — 현재 + 미래

```mermaid
graph TB
  subgraph Ecosystem["🌍 Ecosystem Layer (미래)"]
    CLI["shadcn-style CLI<br/>npx interactive-os add treegrid"]
    Showcase["Showcases<br/>Markdown Viewer · File Explorer"]
    LLMTxt["llms.txt / MCP Server<br/>AI-native 문서"]
  end

  subgraph UI["🎨 UI Layer — Reference Components"]
    TreeGrid & ListBox & TabList & Grid
    Combobox & Accordion & Menu & More["...10+ components"]
  end

  subgraph Behavior["⌨️ Behavior Layer — ARIA Patterns"]
    direction LR
    BTypes["keyMap · focusStrategy · ariaAttributes · childRole"]
    B13["13 presets (treegrid, listbox, tabs, ...)"]
    BCustom["Custom Behavior API (OCP)"]
  end

  subgraph Plugin["🔌 Plugin Layer — Command Producers + Middleware"]
    direction LR
    PCore["core · history · crud"]
    PEdit["clipboard · rename · dnd"]
    PAdv["combobox · focus-recovery"]
    PFuture["permissions · collaboration (미래)"]
  end

  subgraph Engine["⚙️ Command Engine"]
    Dispatch["dispatch() + middleware pipeline"]
    Serialize["Command 직렬화 (미래)<br/>협업 · 로깅 · 리플레이"]
  end

  subgraph Store["💾 Normalized Store"]
    Entities["entities: Record&lt;string, Entity&lt;T&gt;&gt;"]
    Rels["relationships: Record&lt;string, string[]&gt;"]
    Meta["meta entities: __focus__ · __selection__ · __expanded__"]
    Virtual["가상화 어댑터 (미래)<br/>10k+ nodes"]
  end

  subgraph DevTools["🔧 DevTools"]
    Recorder["Event Recorder"]
    Replay["Replay Engine"]
    Inspector["State Inspector (미래)"]
    Timeline["Command Timeline (미래)"]
  end

  Ecosystem --> UI
  UI --> Behavior
  Behavior --> Plugin
  Plugin --> Engine
  Engine --> Store
  DevTools -.->|"관측"| Engine
  DevTools -.->|"관측"| Store

  style Ecosystem fill:#2d1b69,stroke:#a78bfa,color:#eee
  style UI fill:#1e3a5f,stroke:#60a5fa,color:#eee
  style Behavior fill:#1a4731,stroke:#34d399,color:#eee
  style Plugin fill:#4a3728,stroke:#fb923c,color:#eee
  style Engine fill:#4a2028,stroke:#f87171,color:#eee
  style Store fill:#3b3b1a,stroke:#fbbf24,color:#eee
  style DevTools fill:#1a2e3b,stroke:#67e8f9,color:#eee
```

---

## 3. 데이터 흐름 — Command Lifecycle

```mermaid
sequenceDiagram
  participant U as User / LLM
  participant C as Component
  participant B as Behavior
  participant P as Plugin
  participant E as Engine
  participant S as Store
  participant D as DevTools

  U->>C: keydown / API call
  C->>B: keyMap lookup
  B->>P: Command 생성
  P->>E: dispatch(command)

  activate E
  E->>E: middleware pipeline (outside-in)
  E->>S: command.execute(store)
  S-->>E: new store
  E->>D: record(command, before, after)
  deactivate E

  E-->>C: onChange(newStore)
  C-->>U: re-render + focus update

  Note over E,S: undo = command.undo(store)<br/>모든 조작이 되돌릴 수 있다
```

---

## 4. Plugin Composition — 조합의 힘

```mermaid
graph LR
  subgraph Minimal["최소 구성"]
    core
  end

  subgraph ReadOnly["읽기 전용 뷰어"]
    core2[core] --> history
  end

  subgraph Editor["편집기"]
    core3[core] --> history2[history]
    core3 --> crud
    core3 --> clipboard
    core3 --> rename
    core3 --> dnd
  end

  subgraph Future["미래: 협업 편집기"]
    core4[core] --> history3[history]
    core4 --> crud2[crud]
    core4 --> clipboard2[clipboard]
    core4 --> collab["collaboration"]
    core4 --> perm["permissions"]
    collab -->|"직렬화된 Command 동기화"| OtherClient["Other Client"]
  end

  style Minimal fill:#1a4731,stroke:#34d399,color:#eee
  style ReadOnly fill:#1e3a5f,stroke:#60a5fa,color:#eee
  style Editor fill:#4a3728,stroke:#fb923c,color:#eee
  style Future fill:#2d1b69,stroke:#a78bfa,color:#eee
```

---

## 5. Gen UI Integration — LLM 워크플로우

```mermaid
graph TB
  subgraph LLMWorkflow["LLM이 UI를 생성하는 과정"]
    direction TB
    Intent["사용자 의도<br/>'파일 탐색기 만들어줘'"]
    Intent -->|"1"| Select["Behavior 선택<br/>treegrid"]
    Select -->|"2"| Plugins["Plugin 조합<br/>core + history + crud + clipboard"]
    Plugins -->|"3"| Data["데이터 변환<br/>→ NormalizedData"]
    Data -->|"4"| Render["렌더링<br/>&lt;Aria&gt; + custom render"]
  end

  subgraph Today["현재: LLM 없이"]
    T1["키보드 핸들링 직접 구현"] --> T2["포커스 관리 직접 구현"]
    T2 --> T3["Undo/Redo 직접 구현"]
    T3 --> T4["복사/붙여넣기 직접 구현"]
    T4 --> T5["접근성 직접 구현"]
  end

  subgraph WithIOS["미래: interactive-os 사용"]
    W1["import { treegrid, core, history, crud, clipboard }"]
    W1 --> W2["&lt;Aria behavior={treegrid} plugins={[...]} /&gt;"]
    W2 --> W3["Done. 모든 인터랙션이 자동."]
  end

  LLMWorkflow -.->|"이 과정을 자동화"| WithIOS

  style LLMWorkflow fill:#1a1a2e,stroke:#e94560,color:#eee
  style Today fill:#3b1a1a,stroke:#f87171,color:#eee
  style WithIOS fill:#1a4731,stroke:#34d399,color:#eee
```

---

## 6. 로드맵 타임라인

```mermaid
gantt
  title interactive-os Roadmap
  dateFormat YYYY-MM
  axisFormat %Y-%m

  section v0.1 (현재)
    Normalized Store + Command Engine     :done, 2026-03, 2026-03
    13 Behaviors + 8 Plugins              :done, 2026-03, 2026-03
    10 UI Components                      :done, 2026-03, 2026-03
    298 Tests + CI/CD                     :done, 2026-03, 2026-03
    npm publish automation                :done, 2026-03, 2026-03

  section v0.2 — Showcase
    Markdown + Code Viewer                :active, 2026-04, 2026-05
    File Explorer showcase                :2026-05, 2026-06
    llms.txt / AI-native docs             :2026-05, 2026-06

  section v0.3 — Scale
    Virtualization (10k+ nodes)           :2026-06, 2026-07
    Command serialization                 :2026-06, 2026-07
    State Inspector DevTool               :2026-07, 2026-08

  section v1.0 — Ecosystem
    shadcn-style CLI                      :2026-08, 2026-09
    permissions plugin                    :2026-08, 2026-09
    Collaboration (CRDT/OT)              :2026-09, 2026-11
    MCP Server                           :2026-09, 2026-10
    Website + Docs                       :2026-10, 2026-11
```

---

## 7. 경쟁 포지셔닝

```mermaid
quadrantChart
  title ARIA Libraries — 인터랙션 깊이 vs LLM 친화도
  x-axis "낮은 인터랙션 깊이" --> "높은 인터랙션 깊이"
  y-axis "낮은 LLM 친화도" --> "높은 LLM 친화도"

  React Aria: [0.7, 0.3]
  Radix: [0.4, 0.5]
  Headless UI: [0.3, 0.6]
  Zag.js: [0.5, 0.4]
  interactive-os (now): [0.8, 0.5]
  interactive-os (vision): [0.9, 0.9]
```

> **인터랙션 깊이** = navigation뿐 아니라 CRUD, undo/redo, clipboard, DnD까지 포함
> **LLM 친화도** = 하나의 패턴으로 수렴하는 API, llms.txt, CLI scaffolding
