# UI 완성품 공통 인터페이스 — PRD

> Discussion: UI 완성품의 3축 모델(Pattern/Plugin/Renderer) 도출. 소비자 커스텀 cliff 해소를 위해 공통 인터페이스 + Plugin renderer 슬롯 + Renderer 주입점 확립.

## ① 동기

### WHY

- **Impact**: UI 완성품 소비자가 "약간 다른" 커스텀이 필요할 때, 완성품(100%) 아니면 useAria 직접 조립(0%)의 cliff가 존재한다. CMS는 5개 컴포넌트(Canvas, Sidebar, Toolbar, TemplatePicker, PresentMode)에서 useAria/useAriaZone을 직접 사용하며, 그 핵심 이유는 노드 렌더러(Structure) 교체 불가다.
- **Forces**: ARIA 정합성 유지(Pattern 불변) vs 커스텀 자유도(Plugin+Renderer 교체). Plugin은 framework-agnostic이어야 하나 Renderer는 React 종속 불가피. UI 완성품은 얇은 조합 껍질이어야 하나 현재 Pattern+Plugin+Render를 하나로 묶음.
- **Decision**: 3축 모델 — Pattern(정체성, 컴포넌트 이름이 결정, 고정) + Plugin(Write OS 확장팩, 조합 자유) + Renderer(보이기, 모듈화 가능, 교체). 기각된 대안: ① Pattern을 prop으로 교체 가능하게 → 정체성 모순(TreeView에 listbox pattern), ② Slot 기반 구조 → 과복잡하고 pattern 종속.
- **Non-Goals**: 소비자가 axis부터 조립하는 것. Pattern을 교체 가능하게 만드는 것. 기존 axis/pattern/engine 레이어 변경. 새 UI 완성품 추가(이 PRD는 기존 완성품의 인터페이스 통일).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | TreeView가 기본 렌더러로 폴더를 표시 중 | 소비자가 노드를 커스텀 아이콘+라벨로 바꾸고 싶다 | renderNode prop으로 교체, useAria까지 안 내려감 | ✅ AriaComponentProps.renderItem 제공 |
| M2 | ListBox가 기본 plugins 없이 읽기 전용 | 소비자가 Ctrl+C 복사와 Ctrl+Z 히스토리를 추가하고 싶다 | plugins={[clipboard(), history()]}로 조합 | ✅ AriaComponentProps.plugins 제공 |
| M3 | Grid가 기본 렌더러 사용 중 | rename plugin 활성 시 편집 중인 노드가 input으로 바뀌어야 한다 | rename plugin의 renderer가 자동 적용 (plugin이 renderer를 가져옴) | ✅ Plugin.renderer 슬롯 존재, rename에 미적용 (후속) |
| M4 | CMS Canvas가 현재 useAriaZone 직접 사용 | 공통 인터페이스로 마이그레이션 | plugins + renderNode로 동일 기능, useAriaZone 직접 사용 제거 | ⑥-3 별도 PRD로 분리 |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `AriaComponentProps` | 공통 props 타입: `store, onChange, plugins, renderNode, onActivate, onFocusChange, className` | ✅ `types.ts::AriaComponentProps` |
| `RendererModule` | renderer 모듈 타입: `{ node: (node, state, nodeProps) => ReactNode \| null }`. null = fallback | ✅ `engine/types.ts::RendererModule` |
| `Plugin.renderer` | 기존 `definePlugin`에 optional `renderer: RendererModule` 슬롯 추가 | ✅ `engine/types.ts::Plugin.renderer` |
| `mergeRenderers` | renderer 합성 함수: `(default, ...pluginRenderers, userRenderer) → final`. null fallback chain | ✅ `types.ts::mergeRenderers` |
| `TreeView` 리팩터 | 공통 인터페이스 적용. 내부 pattern 고정, plugins/renderNode 주입 가능 | ✅ `TreeView.tsx` extends Omit<AriaComponentProps, 'renderItem'> |
| `ListBox` 리팩터 | 동일 | ✅ `ListBox.tsx` extends AriaComponentProps |
| `Grid` 리팩터 | 동일 + 고유 prop `columns` | ✅ `Grid.tsx` extends Omit<AriaComponentProps, 'renderItem'> |
| `Kanban` 리팩터 | 동일 + 고유 props | ✅ `Kanban.tsx` extends AriaComponentProps |
| `TabList` 리팩터 | 동일 + 고유 prop `orientation` | ✅ `TabList.tsx` extends AriaComponentProps |

- 핵심 신규: `AriaComponentProps`, `RendererModule`, `Plugin.renderer`, `mergeRenderers` (4개)
- 리팩터: 기존 UI 완성품에 공통 인터페이스 적용
- `renderNode` 하나로 충분 — getNodeProps가 aria-* 전부 넘기는 구조가 이미 존재

완성도: 🟢

## ③ 인터페이스

> API 설계 PRD — 키보드 인터랙션은 Pattern/Plugin이 처리, 이 레이어는 조합 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `plugins={[rename()]}` | 기본 TreeView | rename의 keyMap + renderer가 engine에 등록 | plugin이 behavior+renderer를 함께 가져옴 | F2 rename 가능, 편집 시 input 자동 표시 | |
| `plugins={[clipboard(), history()]}` | 기본 ListBox | 두 plugin의 keyMap merge | plugin은 독립 feature unit, 순서 무관 합성 | Ctrl+C/V + Ctrl+Z 동작 | |
| `renderNode={fn}` | plugin renderer 적용된 TreeView | 사용자 renderer 최우선 적용, null 시 plugin fallback | mergeRenderers 우선순위: user > plugin > default | 사용자 렌더러 표시, null인 노드만 plugin/기본값 | |
| `renderNode={fn}` + `plugins={[rename()]}` | TreeView | rename 상태 노드: 사용자 null → rename renderer 적용 | fallback chain: user → plugin → default | 일반=사용자 렌더러, 편집 중=rename input | |
| `onChange={fn}` | store 수정 발생 | 변경된 NormalizedData를 콜백 전달 | 외부 데이터 동기화 파이프라인 지원 | 외부 상태와 동기화 | |
| `plugins` 미지정 | UI 완성품 마운트 | 빈 배열 적용, Read OS만 동작 | Plugin=Write 확장팩, 없으면 읽기 전용 | 탐색만 가능, 수정 불가 | |
| `className={styles.tree}` | 기본 디자인 | 루트 컨테이너에 className 적용 | 디자인은 CSS 교체로 해결 | 커스텀 스타일 적용 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 두 plugin이 같은 키 등록 | 두 plugin 동시 장착 | engine 기존 keyMap merge 규칙 준수 (later wins) | 배열 뒤쪽 plugin 우선 | 뒤쪽 handler 실행 | |
| 두 plugin renderer가 같은 노드에 반응 | renderer 충돌 | fallback chain은 단일 승자, 모호함 제거 | plugin 배열 뒤쪽 우선, null이면 앞쪽 fallback | 뒤쪽 renderer 표시 | |
| plugins={[]} 명시 vs 미지정 | 마운트 | 둘 다 "Write 없음", 동일해야 혼란 없음 | 동일 동작 (빈 배열) | 읽기 전용 | |
| store 빈 데이터 | 마운트 | 빈 상태는 유효, 에러 아님 | 빈 컨테이너 렌더, 포커스 대상 없음 | 빈 UI 표시 | |
| onChange 없이 plugin이 store 수정 | crud로 노드 추가 | 내부 engine 동작, 외부 동기화 없음 | 내부 store만 변경 | UI 갱신, 외부 미동기 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | Pattern은 정체성, 교체 불가 (feedback_pattern_is_identity) | ② AriaComponentProps에 pattern prop 없음 | ✅ 준수 | — | |
| 2 | os 기반 개발: pages에서 useAria 직접 사용 금지 (CLAUDE.md) | ① 동기 | ✅ 준수 — PRD가 cliff 해소하여 원칙 실현 | — | |
| 3 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ② Plugin.renderer 추가 | ✅ 준수 — keyMap+renderer 자급자족 | — | |
| 4 | 선언적 OCP (feedback_declarative_ocp) | ② mergeRenderers | ✅ 준수 — useMemo 1회 합성, 선언 변경에만 반응 | — | |
| 5 | 설계 원칙 > 사용자 요구 (feedback_design_over_request) | ③ renderNode | ✅ 허용 — LLM 소비, TypeScript 안내 | — | |
| 6 | UI 완성품만 노출 (feedback_ui_over_primitives) | ② 리팩터 | ✅ 준수 — 공통 인터페이스가 primitives를 더 깊이 감춤 | — | |
| 7 | 하나의 앱 = 하나의 store (feedback_one_app_one_store) | ③ store prop | ✅ 준수 — 외부 주입, 완성품은 store 생성 안 함 | — | |
| 8 | 최소 구현 수렴 (feedback_minimum_impl_is_good) | ② renderNode 하나 | ✅ 준수 — slot 세분화 안 함 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `definePlugin` 타입 | renderer 슬롯 추가, 기존 plugin은 optional이므로 에러 없음 | 낮 | 허용 | |
| 2 | UI 완성품 props | 기존 props 유지 + 새 props 추가, breaking 아님 | 낮 | 허용 | |
| 3 | CMS 마이그레이션 | useAriaZone → 공통 인터페이스 전환 시 대규모 리팩터 | 중 | 별도 PRD로 분리, 이 PRD는 인터페이스 확립만 | |
| 4 | useAria 내부 | plugin renderer 수집/합성 로직 추가 필요 | 중 | mergeRenderers를 primitives에 추가 | |
| 5 | 내장 렌더러 유실 | renderNode 교체 시 들여쓰기/아이콘 등 내장 동작 유실 가능 | 중 | 기본 골격 컴포넌트 제작 시 검토 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | UI 완성품에 `pattern` prop 노출 | ⑤-1 | Pattern은 정체성, 교체 = 모순 | |
| 2 | Plugin.renderer를 필수(required)로 | ⑤-3 | 기존 plugin 호환, renderer는 optional | |
| 3 | mergeRenderers 매 렌더 재합성 | ⑤-4 | 선언적 OCP, deps 변경 시 useMemo만 | |
| 4 | CMS 마이그레이션을 이 PRD에서 수행 | ⑥-3 | 인터페이스 확립과 마이그레이션은 별개 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①-M1 | TreeView에 renderNode로 커스텀 노드 전달 | 커스텀 렌더러로 표시, aria-* props 정상 전달 | ❌ 테스트 없음 (타입 인터페이스, 후속 통합 테스트에서 커버) |
| V2 | ①-M2 | ListBox에 plugins={[clipboard(), history()]} 전달 | Ctrl+C/V 복사, Ctrl+Z 되돌리기 동작 | ❌ 테스트 없음 (기존 plugin 동작, 인터페이스 변경만) |
| V3 | ①-M3 | rename plugin 장착 후 F2 → 편집 모드 | plugin renderer 자동 적용, input 표시 | ❌ 미구현 — rename plugin에 renderer 미추가 (후속) |
| V4 | ①-M1+M3 | renderNode + rename plugin 동시 | 일반=사용자 렌더러, renaming=rename renderer (사용자 null 시) | ❌ V3 의존 |
| V5 | ④-1 | 두 plugin이 같은 키 등록 | 배열 뒤쪽 plugin handler 실행 | ✅ 기존 engine 동작, 변경 없음 |
| V6 | ④-2 | 두 plugin renderer 충돌 | 배열 뒤쪽 우선, null이면 앞쪽 fallback | ❌ 테스트 없음 (mergeRenderers unit 테스트 후속) |
| V7 | ④-4 | plugins 미지정 | 읽기 전용, 탐색만 가능 | ✅ 기존 동작, 변경 없음 |
| V8 | ④-5 | 빈 store 전달 | 빈 컨테이너 렌더, 에러 없음 | ✅ 기존 동작, 변경 없음 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

---

**역PRD 요약:** ② 산출물 9/9 ✅, ⑧ 검증 3/8 ✅ (V3,V4 미구현 — rename renderer 후속, V1,V2,V6 테스트 후속)
