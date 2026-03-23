## 시뮬레이션: 설계

현재 Plugin 인터페이스와 10개 플러그인의 코드를 분석한 결과, 이상적인 플러그인 시스템 모듈 구조를 다이어그램으로 그렸다.

### 현재 상태 — 문제가 보이는 구조

```mermaid
graph TB
  subgraph PluginInterface["Plugin 인터페이스 (현재)"]
    direction LR
    PI_mid["middleware?"]
    PI_cmd["commands?"]
    PI_key["keyMap?"]
    PI_unhandled["onUnhandledKey?"]
  end

  subgraph Plugins["10개 플러그인 (현재)"]
    direction TB

    subgraph stateless["commands만 제공 (stateless)"]
      crud_p["crud"]
      dnd_p["dnd"]
      rename_p["rename"]
      combobox_p["combobox"]
    end

    subgraph keyed["commands + keyMap"]
      clipboard_p["clipboard"]
      history_p["history"]
    end

    subgraph middleware_only["middleware만 (cross-cutting)"]
      focusRecovery_p["focusRecovery"]
      core_p["core (+ anchorReset middleware)"]
    end

    subgraph hook_based["onUnhandledKey (훅 기반)"]
      typeahead_p["typeahead"]
    end

    subgraph non_plugin["Plugin 인터페이스 안 씀"]
      spatial_p["spatial — { name: string } 반환"]
    end
  end

  PluginInterface --> Plugins

  style non_plugin fill:#fff3f3,stroke:#e55
  style PluginInterface fill:#f0f8ff,stroke:#58a,stroke-width:2px
```

위 구조에서 보이는 문제:
- **spatial**은 Plugin 인터페이스를 따르지 않는다 (`{ name: string }` 반환)
- **core**는 middleware + commands를 섞고 있는데, 사실 focus/selection/expand는 engine의 기본 연산에 가깝다
- **clipboard**은 module-level 싱글턴 상태를 갖고 있어서 다중 인스턴스 불가
- Plugin이 commands/keyMap/middleware/onUnhandledKey 4가지를 임의 조합하므로, 어떤 플러그인이 "어떤 종류"인지 인터페이스만 보고 알 수 없다

---

### 이상적 상태 — 역할별 분리

```mermaid
graph TB
  subgraph Engine["L2 · Engine"]
    dispatch["dispatch(command)"]
    mw_chain["middleware chain"]
  end

  subgraph BuiltIn["내장 (Engine 기본)"]
    direction LR
    focus_cmd["focus commands"]
    selection_cmd["selection commands"]
    expand_cmd["expand commands"]
    gridcol_cmd["gridCol commands"]
    value_cmd["value commands"]
  end

  subgraph PluginTypes["Plugin 유형 분리"]
    direction TB

    subgraph DataPlugin["DataPlugin — commands + keyMap"]
      direction LR
      dp_desc["순수 데이터 조작"]
      dp_members["crud · clipboard · dnd · rename · combobox"]
    end

    subgraph GuardPlugin["GuardPlugin — middleware only"]
      direction LR
      gp_desc["dispatch 전후 불변 조건 보장"]
      gp_members["focusRecovery · anchorReset"]
    end

    subgraph HistoryPlugin["HistoryPlugin — middleware + keyMap"]
      direction LR
      hp_desc["command 가로채기 + 자체 command"]
      hp_members["history (undo/redo)"]
    end

    subgraph InputPlugin["InputPlugin — onUnhandledKey"]
      direction LR
      ip_desc["keyMap 외 입력 처리"]
      ip_members["typeahead"]
    end
  end

  Engine -->|"core commands 내장"| BuiltIn
  Engine -->|"등록"| PluginTypes

  DataPlugin -->|"commands"| dispatch
  GuardPlugin -->|"middleware"| mw_chain
  HistoryPlugin -->|"middleware + commands"| mw_chain
  InputPlugin -->|"fallback handler"| dispatch

  style BuiltIn fill:#f0f8ff,stroke:#58a,stroke-width:2px
  style DataPlugin fill:#f0fff0,stroke:#5a5,stroke-width:2px
  style GuardPlugin fill:#fffff0,stroke:#aa5,stroke-width:2px
  style HistoryPlugin fill:#fff8f0,stroke:#a85,stroke-width:2px
  style InputPlugin fill:#faf0ff,stroke:#a5a,stroke-width:2px
```

---

### 이상적인 Plugin 등록 흐름

```mermaid
sequenceDiagram
  participant App as useEngine
  participant Eng as CommandEngine
  participant MW as Middleware Chain
  participant Exec as Executor

  App->>Eng: createCommandEngine(data, plugins)
  Note over Eng: 1. core commands 내장 등록
  Note over Eng: 2. plugins 순회

  loop 각 plugin
    Eng->>Eng: plugin.commands → commands registry 병합
    Eng->>Eng: plugin.keyMap → keyMap registry 병합
    alt plugin.middleware 있음
      Eng->>MW: middleware chain에 추가
    end
    alt plugin.onUnhandledKey 있음
      Eng->>Eng: fallback handlers에 추가
    end
  end

  Note over Eng: 3. 합성 우선순위 확정
  Note over MW: behavior.keyMap > plugin.keyMap > user keyMap

  App->>Eng: dispatch(command)
  Eng->>MW: guard middleware (focusRecovery)
  MW->>MW: history middleware (snapshot)
  MW->>Exec: execute(store)
  Exec-->>MW: store'
  MW-->>Eng: store''
  Note over MW: guard: post-dispatch 검증
```

---

### 이상적인 의존 관계

```mermaid
graph LR
  subgraph Independent["독립 플러그인 (서로 모름)"]
    direction TB
    crud2["crud"]
    dnd2["dnd"]
    rename2["rename"]
    clipboard2["clipboard"]
    combobox2["combobox"]
    typeahead2["typeahead"]
    spatial2["spatial"]
  end

  subgraph CrossCutting["횡단 관심사 (모든 command에 반응)"]
    direction TB
    history2["history"]
    focusRecovery2["focusRecovery"]
    anchorReset2["anchorReset"]
  end

  subgraph Core["Engine 내장"]
    coreCmd["focus · selection · expand · value"]
  end

  Independent -->|"Command 생성"| Core
  CrossCutting -->|"middleware로 감싸기"| Core

  Independent -.->|"의존 없음"| Independent

  style Core fill:#f0f8ff,stroke:#58a,stroke-width:2px
  style CrossCutting fill:#fffff0,stroke:#aa5,stroke-width:2px
  style Independent fill:#f0fff0,stroke:#5a5,stroke-width:2px
```

**핵심 규칙:** 독립 플러그인은 서로의 존재를 모른다. 횡단 관심사만 다른 플러그인의 command에 반응한다.

---

### 발견된 갭

- **갭 1: core가 Plugin인가 Engine인가** — `focusCommands`, `selectionCommands`, `expandCommands`는 모든 behavior/plugin이 의존하는 기본 연산이다. 현재는 Plugin으로 등록하지만, 이상적으로는 Engine에 내장되어야 한다. 그래야 "plugin 없이도 focus/selection이 동작한다"는 보장이 생긴다.

- **갭 2: anchorReset이 core plugin 안에 숨어 있다** — `anchorResetMiddleware`는 focus command 후 selection anchor를 클리어하는 횡단 관심사다. core commands와 번들링되어 있어서 분리 불가. 이상적으로는 독립 guard로 빠져야 한다.

- **갭 3: clipboard의 module-level 싱글턴 상태** — `clipboardBuffer`, `canAcceptFn` 등이 모듈 스코프에 있어서, 두 개의 독립 engine이 clipboard 상태를 공유한다. 이상적으로는 plugin 인스턴스가 상태를 소유해야 한다(클로저 내부).

- **갭 4: spatial이 Plugin 인터페이스를 안 쓴다** — `spatial()`은 `{ name: string }`을 반환하고 commands는 별도 export. Plugin 인터페이스로 정규화하면 `useEngine`의 plugin 배열에 통합된다.

- **갭 5: Plugin 유형이 타입으로 구분되지 않는다** — 4가지 역할(Data/Guard/History/Input)이 하나의 `Plugin` 인터페이스에 optional 필드로 혼재. 타입 레벨에서 "이 플러그인은 어떤 종류인가"를 표현할 수 없다. discriminated union 또는 별도 타입으로 명시하면 등록 시 검증이 가능해진다.

### 질문

제 판단: core commands를 Engine 내장으로 승격시키는 것이 가장 영향이 큰 첫 번째 리팩토링이다. 이유: 현재 모든 behavior와 plugin이 `focusCommands`/`selectionCommands`를 직접 import하고 있어서, 이것이 "Plugin"이라는 사실이 의미가 없다. Engine이 기본 제공하면 plugin 간 암묵적 의존이 명시적 계약으로 바뀐다.

리팩토링 우선순위를 어디에 두고 싶은가? (1) core 승격, (2) clipboard 싱글턴 해소, (3) Plugin 유형 분리 중에서 가장 급한 것은?
