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

---

## Architecture Snapshot

> 2026-03-23 스냅샷 — 지금까지 발견된 구조를 한 장의 mermaid로 그린다.

### 배경

FE 인터랙션 패턴(ARIA APG)과 데이터 조작(CRUD/undo/clipboard/DnD)은 사실상 표준이 수렴했다. interactive-os는 이 표준을 블록화하는 도구이며, 그 과정에서 아키텍처가 bottom-up으로 발견되었다. 하지만 전체를 한 눈에 보는 그림이 없어서, "지금 어디까지 왔고 어디가 비어있는가"를 판단하기 어렵다.

고정이 아니라 스냅샷 — 지금까지 발견된 것을 한 장의 mermaid로 그린다.

### 내용

```mermaid
graph TB
  subgraph L7["L7 · UI 완성품"]
    direction LR
    subgraph L7_ARIA["Aria Primitives"]
      AriaComp["Aria · Aria.Item · Aria.Cell · Aria.Editable"]
    end
    subgraph L7_UI["표준 UI (15종)"]
      L7_nav["TreeGrid · ListBox · NavList"]
      L7_layout["TabList · Accordion · DisclosureGroup"]
      L7_input["Combobox · RadioGroup · SwitchGroup · Slider · Spinbutton"]
      L7_action["MenuList · Kanban · Grid"]
      L7_feedback["Toaster · Tooltip"]
    end
    subgraph L7_GAP["🔴 미구현"]
      L7_g["Select · ContextMenu · DatePicker"]
    end
  end

  subgraph L6["L6 · Hook (React 접착)"]
    direction LR
    subgraph L6_core["코어 hook"]
      useAria_h["useAria — engine+zone 통합 sugar"]
      useZone_h["useAriaZone — zone 단독"]
      useCtrl_h["useControlledAria — 외부 상태 연동"]
      useEng_h["useEngine — engine 생성"]
    end
    subgraph L6_input["입력 처리"]
      useKb["useKeyboard — keyMap→onKeyDown"]
      useSp["useSpatialNav — DOM 좌표 기반 방향키"]
    end
    subgraph L6_util["유틸 hook"]
      useResize["useResizer"]
      useVS["useVirtualScroll"]
    end
  end

  subgraph L5["L5 · Zone (뷰 스코프)"]
    direction LR
    subgraph L5_own["Zone 소유"]
      Z_focus["focus — FOCUS_ID (zone-local useState)"]
      Z_sel["selection — SELECTION_ID · SELECTION_ANCHOR_ID"]
      Z_scope["scope — data-scope-id DOM 네임스페이스"]
    end
    subgraph L5_bridge["모델↔뷰 경계"]
      Z_reg["registerAria · unregisterAria — 글로벌 레지스트리"]
      Z_dispatch["dispatchKeyAction — keyMap 매칭 → engine.dispatch"]
    end
    subgraph L5_GAP["🔴 Gap"]
      Z_g1["multi-zone 포커스 이동 규약"]
      Z_g2["zone 간 selection 공유/격리 정책"]
    end
  end

  subgraph L4["L4 · Behavior (인터랙션 표준 = ARIA APG)"]
    direction TB
    subgraph L4_axis["5축 · 13 원자 (Axis → partial keyMap)"]
      direction LR
      ax_nav["nav: navV · navH · navVhUniform · navGrid"]
      ax_depth["depth: depthArrow · depthEnterEsc"]
      ax_sel["selection: selectToggle · selectExtended"]
      ax_act["activation: activate · activateFollowFocus"]
      ax_trap["trap: focusTrap"]
      ax_val["value: valueArrow (increment · decrement · clamp)"]
    end
    subgraph L4_compose["합성"]
      compose["composePattern(config, ...axes) → AriaBehavior"]
      config["PatternConfig — role · metadata · Omit AriaBehavior keyMap"]
    end
    subgraph L4_preset["17 Presets (APG 16/19 + kanban)"]
      direction LR
      p_list["listbox · tree · treegrid · grid"]
      p_tabs["tabs · accordion · disclosure"]
      p_menu["menu · dialog · alertdialog · toolbar"]
      p_input["combobox · radiogroup · switch · slider · spinbutton"]
      p_extra["kanban (custom)"]
    end
    subgraph L4_pointer["포인터"]
      pointer["activateOnClick · pointer interaction"]
    end
    subgraph L4_GAP["🔴 Gap"]
      b_g1["trigger ↔ popup 연결 (menubar · menu button)"]
      b_g2["다계층 keyMap (bar vs dropdown)"]
      b_g3["미구현 APG: Menubar · Carousel · Feed"]
    end
  end

  subgraph L3["L3 · Plugin (데이터 조작 표준)"]
    direction TB
    subgraph L3_core["core — 포커스 · 셀렉션 · 확장"]
      direction LR
      cmd_focus["focusCommands: next · prev · first · last · parent · child"]
      cmd_sel["selectionCommands: toggle · select · selectRange · selectAll · clear · extend · setAnchor"]
      cmd_expand["expandCommands: expand · collapse · toggle"]
      cmd_gcol["gridColCommands: setGridCol"]
    end
    subgraph L3_data["데이터 조작"]
      direction LR
      cmd_crud["crud: moveNode · insertNode · add · remove · templateToCommand"]
      cmd_clip["clipboard: copy · cut · paste · resetClipboard · CanAcceptFn · CanDeleteFn"]
      cmd_rename["rename: startRename · confirmRename · cancelRename · RENAME_ID"]
      cmd_dnd["dnd: dndCommands (drag · drop reorder)"]
    end
    subgraph L3_enhance["보강"]
      direction LR
      cmd_hist["history: undo · redo · command stack"]
      cmd_spatial["spatial: spatialCommands · findNearest · findAdjacentGroup · spatialReachable"]
      cmd_type["typeahead: findTypeaheadMatch · resetTypeahead · TypeaheadNode"]
      cmd_recovery["focusRecovery: findFallbackFocus · IsReachable · post-dispatch hook"]
    end
    subgraph L3_GAP["🔴 Gap"]
      p_g1["permissions (concept only)"]
      p_g2["직렬화/역직렬화 (load · save 범용)"]
    end
  end

  subgraph L2["L2 · Engine (실행)"]
    direction LR
    subgraph L2_dispatch["디스패치"]
      eng_create["createCommandEngine"]
      eng_dispatch["dispatch(command) → state'"]
      eng_batch["createBatchCommand — 다중 커맨드 원자 실행"]
    end
    subgraph L2_mid["미들웨어"]
      eng_mw["Middleware 체인"]
      eng_logger["dispatchLogger · Logger"]
      eng_rollback["command 실행 실패 시 롤백"]
    end
    subgraph L2_meta["메타 커맨드"]
      eng_meta["META_COMMAND_TYPES · applyMetaCommand"]
    end
  end

  subgraph L1["L1 · Store (데이터)"]
    direction LR
    subgraph L1_struct["구조"]
      store_nd["NormalizedData T — flat entities map"]
      store_entity["Entity T — id + data T"]
      store_root["ROOT_ID · DEFAULT_ROOT"]
    end
    subgraph L1_read["읽기"]
      store_get["getEntity · getEntityData · getChildren · getParent"]
      store_vis["getVisibleNodes · getRootAncestor"]
      store_tree["storeToTree — flat → tree 변환"]
    end
    subgraph L1_write["쓰기"]
      store_add["addEntity · removeEntity"]
      store_upd["updateEntity · updateEntityData"]
    end
    subgraph L1_meta["메타 엔티티 (view state in store)"]
      meta_ids["FOCUS_ID · SELECTION_ID · SELECTION_ANCHOR_ID\nEXPANDED_ID · GRID_COL_ID · RENAME_ID · VALUE_ID"]
    end
    subgraph L1_diff["변경 감지"]
      store_diff["computeStoreDiff · StoreDiff"]
      store_detect["detectNewVisibleEntities"]
    end
    subgraph L1_GAP["🔴 Gap"]
      s_g1["직렬화 (serialize · deserialize)"]
      s_g2["스키마 검증 (validateNode 범용화)"]
    end
  end

  L7 --> L6
  L6 --> L5
  L5 -->|"keyMap"| L4
  L5 -->|"commands"| L3
  L4 -->|"Command 생성"| L2
  L3 -->|"Command 생성"| L2
  L2 -->|"dispatch"| L1

  style L7 fill:#fff8f0,stroke:#a85,stroke-width:2px
  style L6 fill:#fff8f0,stroke:#a85,stroke-width:2px
  style L5 fill:#fffff0,stroke:#aa5,stroke-width:2px
  style L4 fill:#f0fff0,stroke:#5a5,stroke-width:2px
  style L3 fill:#f0fff0,stroke:#5a5,stroke-width:2px
  style L2 fill:#f0f8ff,stroke:#58a,stroke-width:2px
  style L1 fill:#f0f8ff,stroke:#58a,stroke-width:2px
  style L7_GAP fill:#fff3f3,stroke:#e55
  style L5_GAP fill:#fff3f3,stroke:#e55
  style L4_GAP fill:#fff3f3,stroke:#e55
  style L3_GAP fill:#fff3f3,stroke:#e55
  style L1_GAP fill:#fff3f3,stroke:#e55
```

**레이어 읽는 법:**

| 색상 | 레이어 | 역할 | 렌더러 독립 |
|------|--------|------|------------|
| 🔵 | L1 Store · L2 Engine | 데이터 + 실행 | ✅ |
| 🟢 | L3 Plugin · L4 Behavior | FE 표준 블록화 (조작 + 인터랙션) | ✅ |
| 🟡 | L5 Zone | 모델↔뷰 경계 | ❌ (React) |
| 🟠 | L6 Hook · L7 UI | React 접착 + 완성품 | ❌ (React) |
| 🔴 | 각 레이어 GAP | 안개 영역 | — |

**의존 방향:** L7 → L6 → L5 → (L4 + L3) → L2 → L1 (단방향, 하위 레이어는 상위를 모름)

### 다음 행동

- 이 그림을 기반으로 discussion 계속 — gap의 우선순위, 계층 경계의 근거 정리

---

## Architecture Rationale

> 2026-03-24 — 프로젝트 전체 아키텍처 해설. 디자인 시스템 구축과 UI 완성품 양산을 앞두고, 현재까지의 설계 의도와 구조를 정리한다.

> **Situation** — ARIA 키보드 인터랙션, 포커스 관리, CRUD는 모든 웹 앱에 필요하지만, 매번 처음부터 구현한다.
> **Complication** — 기존 라이브러리는 탐색/표시만 지원. copy/paste/undo/redo/dnd는 앱마다 직접 구현 → GUI 구축 비용이 CLI 대비 높아 GUI가 nice-to-have로 밀림.
> **Question** — 어떻게 하면 ARIA 패턴 전체를 블록화하여 GUI 구축 비용을 제거할 수 있는가?
> **Answer** — 정규화 Store + Command Engine + Plugin + Axis/Pattern 4계층으로, 모든 ARIA 인터랙션을 조합 가능한 블록으로 만든다. 렌더러 독립 모델이므로 웹에서 증명 후 멀티플랫폼 확산이 가능하다.

### GUI의 가치는 사라지지 않았다 — 비용이 가치를 가렸을 뿐이다

CLI+LLM이 GUI 조작을 대체하면서 GUI는 사치로 밀려났다. 하지만 "보고 판단하는 것"은 시각적 UI가 압도적이다. CLI가 이긴 이유는 "더 좋아서"가 아니라 "더 싸서"다.

interactive-os는 이 비용 구조를 뒤집는다. ARIA 패턴 16/19종을 블록화하여 GUI 구축 비용을 제거하면, nice-to-have가 기본값이 된다. LLM도 이 블록 위에서 일하면 토큰 비용, 검증 비용, 시간 모두 이긴다.

```mermaid
flowchart LR
    subgraph 현재["현재: GUI가 비쌈"]
        A["ARIA 키보드"] --> B["포커스 관리"]
        B --> C["CRUD"]
        C --> D["Copy/Paste/Undo"]
        D --> E["DnD"]
        E --> F["매번 처음부터"]
    end

    subgraph 목표["interactive-os: 블록화"]
        G["Store"] --> H["Engine"]
        H --> I["Plugin"]
        I --> J["Pattern"]
        J --> K["UI 완성품"]
        K --> L["조합만 하면 끝"]
    end

    현재 -->|"비용 제거"| 목표
```

v1은 과도한 추상화로 실패했다. "범용적일수록 좋다"는 착각이 아무 용도에도 맞지 않는 구조를 만들었다. v2는 교훈을 반영하여 "실제 제품에서 쓰는 용도를 그대로 추출"하는 전략을 택했다. CMS 개밥먹기로 검증하고, NavList처럼 작고 구체적인 완성품 여러 개가 올바른 방향임을 확인했다.

### 7개 레이어가 관심사를 분리하고, 아래에서 위로 쌓인다

핵심은 렌더러가 아니라 모델(Store + Command + Plugin + Pattern)이다. React는 현재의 렌더러일 뿐이고, 모델은 렌더러 독립이다.

```mermaid
graph TD
    subgraph L1["L1: Store"]
        S["NormalizedData<br/>entities + relationships"]
    end

    subgraph L2["L2: Engine"]
        E["CommandEngine<br/>dispatch + middleware"]
    end

    subgraph L3["L3: Plugins"]
        P1["core"] --- P2["history"]
        P2 --- P3["crud"]
        P3 --- P4["clipboard"]
        P4 --- P5["dnd"]
        P5 --- P6["zodSchema"]
    end

    subgraph L4["L4: Axis"]
        A1["navigate"] --- A2["select"]
        A2 --- A3["expand"]
        A3 --- A4["activate"]
        A4 --- A5["tab"]
        A5 --- A6["value"]
        A6 --- A7["edit"]
    end

    subgraph L5["L5: Pattern"]
        PT["composePattern<br/>17 presets"]
    end

    subgraph L6["L6: Primitives"]
        PR["Aria / useAria<br/>React 바인딩"]
    end

    subgraph L7["L7: UI"]
        U["TreeGrid · ListBox · TabList<br/>Kanban · Combobox · 15종"]
    end

    L1 --> L2
    L2 --> L3
    L3 --> L5
    L4 --> L5
    L5 --> L6
    L6 --> L7
```

| 레이어 | 역할 | 핵심 타입 | 렌더러 의존 |
|--------|------|-----------|-------------|
| **L1 Store** | 정규화 트리 데이터 | `NormalizedData`, `Entity<T>` | 없음 |
| **L2 Engine** | Command dispatch + middleware | `Command`, `Middleware`, `CommandEngine` | 없음 |
| **L3 Plugin** | 확장 메커니즘 (keyMap, clipboard, CRUD) | `Plugin`, `definePlugin` | 없음 |
| **L4 Axis** | 원자적 ARIA 행동 (탐색, 선택, 확장) | `KeyMap`, `PatternContext` | 없음 |
| **L5 Pattern** | 축 조합 → ARIA 위젯 행동 | `AriaPattern`, `composePattern` | 없음 |
| **L6 Primitives** | React 훅/컴포넌트 바인딩 | `useAria`, `Aria` | React |
| **L7 UI** | 소비자용 완성품 | `TreeGrid`, `ListBox` 등 | React + CSS |

L1~L5는 렌더러 독립이다. 웹에서 증명한 뒤 React Native, Swift, Kotlin, 심지어 Rust TUI(ratatui)로 확산할 수 있다.

### L1: Store — 모든 트리는 두 개의 flat map이다

```typescript
interface NormalizedData {
  entities: Record<string, Entity<unknown>>      // id → 노드
  relationships: Record<string, string[]>         // parentId → [childId, ...]
}
```

어떤 외부 데이터든 `entities` + `relationships` 두 맵으로 정규화한다. JSON 트리, 배열, GraphQL 응답 — 형태가 달라도 내부는 하나다. 메타 엔티티(`__focus__`, `__selection__`, `__expanded__` 등)는 UI 상태를 같은 store에 동거시켜 Command로 일괄 관리한다.

모든 mutation은 새 객체를 반환하는 순수 함수다. `removeEntity`는 재귀적으로 자손을 수집(O(n))하고, `moveNode`는 같은 부모 내 순서 변경과 cross-parent 이동을 모두 처리한다.

### L2: Engine — 모든 변경은 Command이고, 되돌릴 수 있다

```typescript
interface Command {
  type: string
  payload: unknown
  execute(store: NormalizedData): NormalizedData
  undo(store: NormalizedData): NormalizedData
}
```

사용자의 모든 액션은 `execute()`와 `undo()`를 가진 Command 객체다. Engine은 이 Command를 middleware 체인에 통과시키고, store를 갱신하고, diff를 로깅한다. BatchCommand로 여러 Command를 원자적으로 묶을 수 있다.

```mermaid
sequenceDiagram
    participant User as 사용자 액션
    participant Engine as CommandEngine
    participant MW as Middleware Chain
    participant Store as NormalizedData

    User->>Engine: dispatch(command)
    Engine->>MW: history → focusRecovery → zodSchema
    MW->>Store: command.execute(store)
    Store-->>Engine: newStore
    Engine-->>Engine: computeStoreDiff + log
    Engine->>User: onStoreChange(newStore)
```

middleware는 `reduceRight`로 합성된다. 바깥에서 안쪽으로 감싸고, 실행은 안에서 바깥으로. history가 실행 전 스냅샷을 찍고, focusRecovery가 실행 후 포커스를 복원하고, zodSchema가 실행 전 유효성을 검증한다.

### L3: Plugin — keyMap부터 clipboard까지 소유하는 확장 단위

```typescript
interface Plugin {
  name: string
  middleware?: Middleware
  commands?: Record<string, Command>
  keyMap?: KeyMap
  onCopy?: (ctx) => DataTransfer | void
  onCut?: (ctx) => DataTransfer | void
  onPaste?: (ctx, data) => Command | void
  intercepts?: string[]
  requires?: Plugin[]
}
```

Plugin은 keyMap까지 소유한다. commands만 제공하면 소비자가 keyMap을 직접 연결해야 하므로 복붙과 누락 버그가 생긴다. `definePlugin` 팩토리가 `requires` 의존성의 middleware를 자동 수집하여 합성한다.

현재 11개 Plugin: core, focusRecovery, history, crud, clipboard, zodSchema, rename, dnd, spatial, typeahead, definePlugin(팩토리).

### L4: Axis — ARIA 행동의 원자 단위

```typescript
// navigate axis
function navigate(options?): StructuredAxis {
  return {
    keyMap: {
      ArrowDown: (ctx) => ctx.focusNext(),
      ArrowUp: (ctx) => ctx.focusPrev(),
      Home: (ctx) => ctx.focusFirst(),
      End: (ctx) => ctx.focusLast(),
    },
    config: { focusStrategy: 'roving-tabindex', orientation }
  }
}
```

7개 축: navigate, select, expand, activate, tab, value, edit. 각 축은 `KeyMap`(키 → Command 매핑)과 `AxisConfig`(focusStrategy, orientation 등)를 반환한다. 축은 순수 ARIA 행동만 담당하고, CRUD/clipboard 같은 앱 로직은 Plugin에 속한다.

### L5: Pattern — 축을 조합하면 위젯이 된다

```typescript
const treegridPattern = composePattern(
  { role: 'treegrid', childRole: 'row', ariaAttributes },
  select({ mode: 'multiple', extended: true }),
  activate({ onClick: true }),
  expand({ mode: 'arrow' }),
  navigate({ orientation: 'vertical' }),
)
```

`composePattern`이 N개 축의 keyMap을 합성한다. 같은 키에 여러 핸들러가 있으면 chain of responsibility — 위에서부터 순회하여 첫 non-void Command가 승리한다. 17개 preset이 있다: listbox, treegrid, tabs, accordion, menu, dialog, toolbar, grid, combobox, radiogroup, slider, spinbutton 등.

```mermaid
flowchart LR
    N["navigate"] --> CP["composePattern"]
    S["select"] --> CP
    E["expand"] --> CP
    A["activate"] --> CP
    CP --> P["AriaPattern<br/>role + keyMap + ariaAttributes"]
    P --> U["useAria / Aria"]
```

### L6: Primitives — React와 연결하는 다리

`useAria`가 Engine + Pattern + Plugin을 React 상태로 연결한다. 3단계:
1. Engine 생성 (한 번, useState)
2. 외부 데이터 동기화 (meta-entity 보존하며 merge)
3. View 레이어 위임 (useAriaView)

`useAriaView`가 keyMap 합성, ARIA 속성 계산, DOM 이벤트 바인딩을 처리한다. `Aria` 컴포넌트는 useAria의 선언적 래퍼다.

### L7: UI — 소비자가 쓰는 완성품

```tsx
<TreeGrid
  data={myData}
  plugins={[crud(), clipboard()]}
  onChange={setData}
  renderItem={(node, state) => <span>{node.data.label}</span>}
/>
```

L7은 L1~L6을 조합한 완성품이다. 현재 15종. v2의 핵심 교훈에 따라 "범용 hook 하나"가 아니라 "용도별 완성품 여러 개"가 올바른 방향이다. 이 층이 현재 가장 큰 갭 — 데모 수준이지 제품 수준이 아니다.

### 705개 테스트, 16/19 APG 패턴, CMS 개밥먹기까지 완료

정량적 현황:

| 지표 | 값 |
|------|-----|
| 테스트 | 705 (Vitest + axe-core) |
| APG 커버리지 | 16/19 (미구현: Menubar, Carousel, Feed) |
| Plugin | 11종 (전부 Integrated) |
| Axis | 7축 (전부 Integrated) |
| Pattern preset | 17종 (전부 Integrated) |
| UI 컴포넌트 | 15종 (Integrated) + 3종 미구현 |
| 데모 커버리지 | 85% (axes 100%, hooks 63%) |

CMS 개밥먹기에서 7개 갭을 발견하고 6개를 해결했다. Engine/Plugin/Axis 층은 안정적(OCP 검증 완료)이고, Plugin 교체 시 소비자 코드 변경 0, Axis 교체 시에도 소비자 무영향.

```mermaid
pie title APG Coverage (16/19)
    "완료" : 16
    "미구현" : 3
```

### UI 완성품 양산과 디자인 시스템이 다음 전환점이다

Engine~Pattern 층은 Integrated로 안정화됐다. 남은 병목:

1. **UI 완성품 (L7)** — 현재 데모 수준 → 제품 수준으로 전환. NavList hook-first 패턴을 확립 중이고, 확인되면 11개 완성품으로 확산.
2. **디자인 시스템** — claude.ai 레퍼런스 기반으로 5개 번들(surface, shape, type, tone, motion) 체계 확립 완료. tokens.css 교체 완료.
3. **Homepage (라우트 restructure)** — 내부 아키텍처 노출 → 외부 소비자 관점으로 전환. IA 설계 진행 중.

Pit of Success 5원리 중 P1(올바른 길이 최단 경로)과 P3(숨겨진 올바름)은 달성. P2(잘못된 조합 불가능), P4(관용적 패턴), P5(의도적 탈출구)는 미달 — UI 완성품이 양산되면 자연스럽게 해결되는 구조다.

LLM이 이 프레임워크 위에서 코드를 생성할 때, 완성품 1줄이 primitives 30줄+을 대체한다. 이것이 interactive-os의 존재 이유다.

### Walkthrough

> 이 프로젝트를 직접 만져보려면:

1. **진입점**: `pnpm dev` → `http://localhost:5173`
2. **전체 구조 파악**: ActivityBar 좌측 아이콘으로 5개 앱(CMS, UI Docs, Viewer, Agent, Theme) + 6개 내부(Store, Engine, Axis, Plugin, Components, Area) 탐색
3. **핵심 체감**: `/internals/engine/command` → ListBox에서 ↑↓ 탐색, Enter 생성, Del 삭제, ⌘Z undo — Dispatch Log에서 모든 command가 실시간 기록되는 것 확인
4. **ARIA 축 체감**: `/internals/axis/navigate` → 각 축의 키바인딩과 ARIA 속성 변화를 개별 확인
5. **실전 조합**: `/cms` → TreeGrid + spatial + clipboard + history + zodSchema가 조합된 Visual CMS
6. **확인 포인트**: 아무 데모에서 키보드만으로 CRUD + undo/redo + copy/paste가 전부 동작하면 정상
