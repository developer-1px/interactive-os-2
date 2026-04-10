# FlatLayout 엔진 — PRD

> Discussion: React JSX 중첩을 NormalizedData flat 선언으로 대체. 위젯=React 블랙박스, 레이아웃=엔진이 관리. Phase 1: PageBookViewer 전환으로 검증.

## ① 동기

### WHY

- **Impact**: 현재 pages/는 평균 200~450줄의 JSX 레이아웃 배선 코드. LLM이 중첩 구조를 정확히 생성하지 못해 레이아웃 품질이 낮고, os 부품을 쓰면서도 배선은 React여서 규칙 강제가 구조적으로 불가능.
- **Forces**: 데이터(store)와 인터랙션(engine)은 이미 flat/NormalizedData인데, 렌더링만 JSX 중첩. 이 비대칭이 복잡도의 근원. 위젯은 React로 유지해야 하므로 전면 교체는 불가.
- **Decision**: A2UI 프로토콜의 "flat list + ID 참조" 컨셉을 내부 개발 패러다임으로 흡수. workspaceStore.ts의 split/tabgroup 모델을 확장하여 범용 FlatLayout 엔진으로 승격. 기각: A2UI 스펙 직접 준수(외부 의존만 늘림), React 전면 교체(위젯 재작성 비용).
- **Non-Goals**: A2UI 프로토콜 호환성. 기존 pages/ 일괄 마이그레이션. 위젯 내부 구현 변경.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 개발자가 새 페이지를 만들 때 | FlatLayout으로 레이아웃을 선언하면 | 엔진이 위젯을 registry에서 찾아 슬롯에 마운트하고, split/stack/overlay를 CSS로 배치 | |
| S2 | LLM이 페이지 레이아웃을 생성할 때 | flat NormalizedData를 출력하면 | 엔진이 동일한 렌더링 파이프라인으로 제품급 레이아웃 생성 | |
| S3 | 위젯에서 이벤트 발생 시 | dispatch(command)를 호출하면 | 엔진이 command를 처리하고 관련 위젯에 상태 변경 전파 (props 콜백 배선 불필요) | |
| S4 | registry에 없는 위젯을 선언 시 | type이 매칭 안 되면 | fallback 렌더러가 경고 표시. 구조적으로 os 외부 컴포넌트 사용 차단 | |
| S5 | Phase 2에서 ui/ 내부에 적용 시 | 위젯 슬롯에 중첩 FlatLayout을 넣으면 | 재귀적으로 렌더. NormalizedData가 이미 재귀 구조 지원 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — workspaceStore.ts를 확장하는 방향

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/layout/flatLayout.ts` | FlatLayout 데이터 모델: LayoutNode 타입 (split, stack, overlay, widget), `definePage()` 팩토리 | |
| `src/interactive-os/layout/layoutCommands.ts` | layout 전용 commands — resize, togglePane, setVisibility. workspaceCommands를 확장 | |
| `src/interactive-os/layout/widgetRegistry.ts` | `WidgetRegistry` — type 문자열 → React 컴포넌트 매핑. `registerWidget()`, `resolveWidget()` | |
| `src/interactive-os/layout/index.ts` | public API re-export | |
| `src/interactive-os/ui/FlatLayout.tsx` | UI 완성품 — NormalizedData를 받아 레이아웃 트리를 렌더. widgetRegistry에서 위젯 마운트 | |
| `src/interactive-os/layout/layoutPlugin.ts` | `layout()` plugin — commands + keyMap + middleware 등록. workspace() plugin을 requires | |

### 데이터 모델

```typescript
// LayoutNode entity types
interface SplitNode {
  type: 'split'
  direction: 'horizontal' | 'vertical'
  sizes: PaneSize[]            // 기존 workspaceStore.SplitData 재사용
}

interface StackNode {
  type: 'stack'
  gap?: 'sm' | 'md' | 'lg'
}

interface OverlayNode {
  type: 'overlay'
  overlayType: 'modal' | 'popup' | 'hint'  // overlay/types.ts 재사용
  trigger?: string                          // command type 또는 keyMap 참조
  visible?: boolean
}

interface WidgetNode {
  type: 'widget'
  widget: string              // registry key
  props?: Record<string, unknown>  // 위젯에 전달할 정적 props
  source?: string             // store binding path (선택)
}
```

### workspaceStore.ts와의 관계

| workspaceStore | FlatLayout | 관계 |
|---------------|-----------|------|
| SplitData | SplitNode | 동일 — 재사용 |
| TabGroupData | — | tabgroup은 위젯(TabGroup 컴포넌트)으로 분류 |
| TabData | — | tab은 위젯 내부 데이터 |
| workspaceCommands | layoutCommands | 확장 — resize, splitPane 등 그대로, setVisibility 등 추가 |
| workspace() plugin | layout() plugin | 확장 — workspace()를 requires |

완성도: 🟢

## ③ 인터페이스

### FlatLayout 컴포넌트 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `data: NormalizedData` | 레이아웃 트리 초기값 | 엔진이 entities를 순회하며 type별 렌더 | entity.data.type으로 레이아웃/위젯 분기. A2UISurface의 componentMap 패턴과 동일 | DOM에 split/stack/overlay 구조 + 위젯 슬롯 생성 | |
| `registry: WidgetRegistry` | 위젯 매핑 테이블 | type 문자열로 React 컴포넌트 resolve | OCP — 새 위젯 추가 시 registry에 행 추가만. switch/if 금지 | 위젯이 해당 슬롯에 마운트 | |
| `onCommand?: (cmd) => void` | — | 위젯이 dispatch한 command를 외부로 전달 | FlatLayout 자체가 engine을 소유할 수도, 외부 engine에 위임할 수도 있어야 함 | command 처리 후 store 업데이트 → 리렌더 | |

### 레이아웃 노드별 렌더링

| 입력 (node type) | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|-----------------|----------|------|-------------------|----------|-------|
| `split` | children 2개 + sizes | CSS flex-row/column + flex-basis로 분할 | ax({ layout: 'row' }) + flex 비율. SplitPane UI 재활용 | 2개 영역이 sizes 비율로 배치 | |
| `stack` | children N개 + gap | CSS flex-column + gap으로 적층 | ax({ layout: 'column', gap }) | 자식들이 세로로 쌓임 | |
| `overlay` | child 1개 + trigger + visible | visible=true일 때 overlay 레이어에 렌더 | overlay/useOverlay 재사용. modal/popup/hint 구분 | 오버레이가 표시/숨김 | |
| `widget` | widget key + props | registry에서 컴포넌트 찾아 마운트 | widgetRegistry.resolveWidget(key) → React.createElement | 위젯이 슬롯 안에서 렌더 | |
| `widget` (미등록) | registry에 없는 key | fallback 렌더러로 경고 표시 | registry 미스 = os 미등록 컴포넌트. 구조적 차단 | 경고 UI 표시 | |

### 위젯→엔진 통신

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 위젯이 `dispatch(cmd)` 호출 | 레이아웃 내 위젯 활성 | engine이 command 처리 + store 업데이트 | 기존 engine dispatch 패턴 그대로. props/callbacks 배선 불필요 | store 변경 → FlatLayout 리렌더 → 관련 위젯 업데이트 | |
| overlay trigger command | overlay visible=false | engine이 setVisibility(id, true) 처리 | layoutCommands.setVisibility → entity.data.visible 변경 | overlay 표시, focus trap 활성화 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| split의 children이 1개만 남음 | split + 1 child | split은 2개 이상의 자식이 있어야 의미. workspaceStore.closePaneInternal 이미 구현 | split 제거, 남은 child를 부모로 승격 | 트리 단순화 | |
| split의 children이 0개 | split + 0 children | 빈 split은 존재할 이유 없음 | split 엔티티 자체 제거 | 빈 공간 없음 | |
| 중첩 split 3단계 이상 | split > split > split > widget | NormalizedData는 깊이 제한 없이 재귀 지원. 렌더는 entities 순회일 뿐 | 정상 렌더. 성능은 entity 수에 비례 (깊이 무관) | 중첩 분할 정상 표시 | |
| overlay 3개 동시 열림 | 3 overlay visible=true | layerStack이 z-index 관리. 최상위만 focus trap | 3개 모두 표시, 최상위만 인터랙션 가능 | Escape → 최상위부터 순차 닫힘 | |
| widget registry에 React lazy 등록 | registry에 `lazy(() => import(...))` | Suspense 경계가 필요 | FlatLayout이 각 widget 슬롯에 Suspense 래핑 | 로딩 중 fallback → 위젯 표시 | |
| NormalizedData가 빈 store | entities={}, relationships={} | 렌더할 것이 없음 | 빈 컨테이너. 에러 없음 | 빈 화면 | |
| split sizes 합이 1을 초과 | sizes: [0.7, 0.7] | CSS flex-basis 비율이 컨테이너를 초과 | flex가 자동 축소. 의도적으로 정규화하지 않음 (CSS에 위임) | 비율 근사치로 표시 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 모든 상태는 NormalizedData + Command (feedback_all_state_normalized_command) | ② 데이터 모델 | ✅ 준수 | — | |
| P2 | 선언적 OCP: 확장=행 추가 (feedback_declarative_ocp) | ② widgetRegistry | ✅ 준수 — Record<string, Component>, switch 금지 | — | |
| P3 | UI 완성품만 노출 (feedback_ui_over_primitives) | ② FlatLayout.tsx가 ui/에 위치 | ✅ 준수 — pages/는 FlatLayout만 import | — | |
| P4 | style={} 금지, ax()만 (feedback_style_is_hatch) | ③ split 비율 | ⚠️ 잠재 위반 — split sizes를 CSS에 적용할 때 style={{ flexBasis }} 필요 | SplitPane UI가 이미 이 방식 사용. layout/에서 처리하고 pages/에서는 사용 안 하므로 허용 범위. module.css로 격리 | |
| P5 | 데이터 모델 먼저 (feedback_model_first_state) | ② 전체 | ✅ 준수 — LayoutNode 타입 정의 후 UI 구현 | — | |
| P6 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | ③ onCommand | ✅ 준수 — 모든 조작이 command 경유 | — | |
| P7 | overlay는 modal 취급 (feedback_overlay_is_modal) | ③ overlay 렌더링 | ✅ 준수 — overlay/useOverlay + popup 축 사용 | — | |
| P8 | Composite = ui/ 조합 (feedback_composite_is_ui_combination) | ② FlatLayout.tsx | ✅ 준수 — 기존 SplitPane, ScrollArea 등 ui/ 조합 | — | |
| P9 | renderItem ARIA props 전달 필수 (CLAUDE.md) | ③ widget 마운트 | ✅ 준수 — 위젯은 자체 useAria 소유. FlatLayout은 슬롯만 제공 | — | |
| P10 | 레이어 의존 순서 (CLAUDE.md) | ② layout/ 위치 | ✅ 준수 — layout/은 store+engine 위, ui 아래 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | workspaceStore.ts | layout이 workspace를 확장. 기존 workspace() plugin 사용처(PageAgentChat, PageViewer)에 영향 없음 — requires로 포함만 | 🟢 Low | workspace()는 그대로 유지. layout()이 상위 plugin으로 감쌈 | |
| E2 | PageBookViewer.tsx (Phase 1 대상) | 453줄 → ~50줄 + FlatLayout 선언. 기존 테스트(route-book.screen.test.tsx) CSS 셀렉터 의존 | 🟡 Medium | 테스트가 CSS class가 아닌 ARIA role/label로 검증하도록 전환 | |
| E3 | AriaRoute + defineRouteKey | FlatLayout이 AriaRoute를 내부에서 사용할지, 외부에서 감쌀지 | 🟡 Medium | FlatLayout 내부에서 AriaRoute 사용. keyMap은 layoutPlugin이 소유 | |
| E4 | useState 기반 로컬 상태들 | PageBookViewer의 10개 useState → NormalizedData + command로 흡수 | 🟡 Medium | 점진적 — 레이아웃 관련 상태만 먼저 흡수. 비즈니스 상태(bookNavStore)는 유지 | |
| E5 | A2UISurface 렌더링 파이프라인 | FlatLayout과 A2UISurface가 병렬 존재. 중복 가능성 | 🟢 Low | 현재는 독립. 장기적으로 A2UISurface가 FlatLayout 위에서 동작하도록 통합 가능 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | FlatLayout.tsx 안에서 node type별 if/switch 분기 | ⑤ P2 OCP | 새 레이아웃 타입 추가 시 파일 수정 강제. `layoutRenderers: Record<string, Renderer>` 매핑 사용 | |
| X2 | pages/에서 useAria, useAriaZone 직접 사용 | ⑤ P3 UI 완성품 | FlatLayout이 내부에서 처리. pages/는 FlatLayout + data만 | |
| X3 | widget props에 ReactNode 저장 | ⑤ P5 Model-First | 직렬화 깨짐. props는 plain object만. 렌더는 widgetRegistry의 컴포넌트가 담당 | |
| X4 | layout 상태를 useState로 관리 | ⑤ P1 NormalizedData | undo/redo, 직렬화, agent 통신 불가. 반드시 command 경유 | |
| X5 | workspaceStore.ts 직접 수정 | ⑥ E1 | 기존 사용처 영향. layoutCommands에서 확장만 | |
| X6 | overlay를 visibility toggle로 구현 | ⑤ P7 overlay=modal | focus trap 누락. 반드시 overlay/useOverlay 사용 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | `definePage()`로 split + 2 widget 선언 → FlatLayout 렌더 | 두 위젯이 좌우 분할로 표시. 리사이즈 드래그 동작 | |
| V2 | S2 | NormalizedData JSON을 LLM이 생성 → FlatLayout에 주입 | JSX 없이 레이아웃 렌더. 위젯 정상 마운트 | |
| V3 | S3 | 위젯 A에서 dispatch → 위젯 B 상태 변경 | props 배선 없이 command bus로 전파. 위젯 B 업데이트 | |
| V4 | S4 | registry에 없는 widget type 선언 | fallback 경고 렌더. 콘솔 에러 없음 | |
| V5 | S5 | widget 슬롯에 중첩 FlatLayout 선언 | 재귀 렌더 정상 동작 | |
| V6 | 경계: split 1 child | split에서 pane 하나 제거 | split 자동 해소, 남은 child 승격 | |
| V7 | 경계: overlay 3개 | 3개 overlay 순차 열기 → Escape 3회 | 최상위부터 순차 닫힘. focus 복귀 | |
| V8 | Phase 1 | PageBookViewer를 FlatLayout으로 전환 | 기존 기능 동일 유지: 스프레드 리더, TOC, Quick Open, 키보드 네비게이션 | |
| V9 | 원칙 P2 | 새 레이아웃 타입 'grid' 추가 | layoutRenderers에 행 추가만. 기존 코드 수정 0 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

### 교차 검증

1. **동기 ↔ 검증**: S1~S5 모든 시나리오가 V1~V9로 커버됨 ✅
2. **인터페이스 ↔ 산출물**: FlatLayout.tsx의 props(data, registry, onCommand)가 산출물의 flatLayout.ts, widgetRegistry.ts, layoutCommands.ts에 대응 ✅
3. **경계 ↔ 검증**: split collapse(V6), overlay 중첩(V7) 커버 ✅
4. **금지 ↔ 출처**: 모든 금지의 출처가 ⑤ 또는 ⑥에 있음 ✅
5. **원칙 대조 ↔ 전체**: P4(style) 잠재 위반은 SplitPane UI 내부로 격리하여 해결 ✅
