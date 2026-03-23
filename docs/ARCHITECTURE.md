# interactive-os — Architecture

> Living snapshot. 고정이 아니라 "지금까지 발견된 것"의 스냅샷.
> **갱신 시점:** 레이어 경계 변경, 새 축/플러그인 추가, /retro 시 gap 반영.
> **재료:** naming-dictionary.md (식별자) + PROGRESS.md (maturity) + BACKLOGS.md (gap)

## Thesis

FE 인터랙션 패턴(ARIA APG)과 데이터 조작(CRUD/undo/clipboard/DnD)은 사실상 표준이 수렴했다.
interactive-os는 이 표준을 블록화하는 도구이며, 아키텍처는 그 과정에서 bottom-up으로 발견되고 있다.

## Layer Diagram

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
    subgraph L4_axis["7축 (Axis → partial keyMap + config)"]
      direction LR
      ax_nav["navigate: navV · navH · navBoth · navGrid"]
      ax_depth["expand: depthArrow · depthEnterEsc"]
      ax_sel["select: selectToggle · selectExtended"]
      ax_act["activate: activate · activateFollowFocus"]
      ax_dismiss["dismiss: Escape → collapse"]
      ax_val["value: valueArrow (increment · decrement · clamp)"]
      ax_tab["tab: native · flow · loop · escape"]
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

## Layer Summary

| 색상 | 레이어 | 역할 | 렌더러 독립 |
|------|--------|------|------------|
| 🔵 | L1 Store · L2 Engine | 데이터 + 실행 | ✅ |
| 🟢 | L3 Plugin · L4 Behavior | FE 표준 블록화 (조작 + 인터랙션) | ✅ |
| 🟡 | L5 Zone | 모델↔뷰 경계 | ❌ (React) |
| 🟠 | L6 Hook · L7 UI | React 접착 + 완성품 | ❌ (React) |
| 🔴 | 각 레이어 GAP | 안개 영역 | — |

**의존 방향:** L7 → L6 → L5 → (L4 + L3) → L2 → L1 (단방향, 하위 레이어는 상위를 모름)

## Companion Documents

| 문서 | 역할 | 이 문서와의 관계 |
|------|------|----------------|
| `PROGRESS.md` | 모듈 maturity + gap | 레이어 안의 모듈 상태 |
| `BACKLOGS.md` | 미해결 과제 | 🔴 Gap의 상세 |
| `.claude/naming-dictionary.md` | 식별자 전수 목록 | 레이어 내부 채우기 재료 |
