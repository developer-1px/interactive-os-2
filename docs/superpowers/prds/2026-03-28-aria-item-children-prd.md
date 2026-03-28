# Aria.Item render children — PRD

> Discussion: container node의 자식을 render callback 4번째 인자로 전달하여 APG group wrapper 구조 지원

## ① 동기

### WHY

- **Impact**: APG group 패턴(listbox grouped, toolbar grouped, menu grouped, tree)에서 DOM에 wrapper element(ul[role="group"])가 필요하지만, 현재 Aria.Item은 모든 노드를 flat하게 렌더링하여 APG 구조 불일치 발생. 스크린리더가 그룹을 인식하지 못함.
- **Forces**: normalized store + single render callback 모델을 유지해야 함 (시스템 정체성). compound component(Aria.Group 등) 추가는 Occam Gate 미통과.
- **Decision**: render callback에 4번째 인자 `children`을 전달. container node일 때 non-null, leaf node일 때 undefined. 소비자가 children 배치 위치를 명시적으로 제어. 기각: compound component(새 개념 추가), cloneElement 자동 주입(마법적, 배치 제어 불가).
- **Non-Goals**: store 모델 변경, 새 compound component 추가, 기존 flat 패턴 변경.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | listbox grouped 패턴 사용 | render callback 호출 | container node는 children 인자 받음, leaf node는 undefined | |
| S2 | tree 패턴 사용 | expandable treeitem에 자식 있음 | render callback이 children 받아 ul[role="group"]로 감쌈 | |
| S3 | 기존 flat listbox 사용 | render callback 3인자만 사용 | 동작 변화 없음 (하위 호환) | |
| S4 | toolbar grouped 패턴 사용 | 그룹별 버튼 묶음 | container가 children 받아 div[role="group"]로 감쌈 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `AriaItemProps.render` 시그니처 확장 | 4번째 인자 `children: ReactNode` 추가 | |
| `aria.tsx` renderNodes() | container node 감지 시 재귀 결과를 children으로 전달 | |
| `aria.tsx` AriaItemNode | children prop 수신 → render callback에 전달 | |
| `ListboxGrouped.tsx` 예제 갱신 | APG 구조(ul[role="group"] > li[role="presentation"] + li[role="option"])로 변경 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| renderNodes가 container node 순회 | `getChildren(store, id).length > 0` | 재귀 결과를 ReactNode[]로 수집, render(props, node, state, children) 호출 | container 자식은 wrapper 안에 있어야 APG 구조 준수 | 소비자가 반환한 element 안에 children 포함 |
| renderNodes가 leaf node 순회 | `getChildren(store, id).length === 0` | render(props, node, state, undefined) 호출 | leaf는 단독 element | 기존과 동일한 flat element |
| expandable container + expanded | expandedIds에 포함 | children 전달 | expanded면 자식이 보여야 함 | wrapper + children DOM 생성 |
| expandable container + collapsed | expandedIds에 미포함 | children=undefined | collapsed면 자식 DOM 불필요 | 자식 없는 단독 element |
| non-expandable container (group) | expandedIds === null | 항상 children 전달 | 그룹은 항상 열려있음 | wrapper + children |
| 기존 3인자 render 함수 | — | 4번째 인자 무시 | JS 함수는 여분의 인자 무시 | 하위 호환 100% |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 빈 그룹 (container의 모든 자식이 search로 필터됨) | children 재귀 결과가 빈 배열 | 빈 그룹도 DOM에 wrapper가 있어야 레이아웃 깨지지 않음 | children=[] (빈 ReactNode[]) 전달, 소비자가 빈 그룹 렌더링 결정 | wrapper는 있되 내용 없음 |
| ids mode (flat rendering) | `<Aria.Item ids={[...]}` 사용 | ids mode는 명시적 flat 렌더링, 재귀 없음 | children 전달 안 함 (기존 동작 유지) | flat rendering |
| 중첩 그룹 (group 안에 group) | container의 자식이 다시 container | 재귀가 자연스럽게 처리 | 각 레벨의 container가 각각 children 받음 | 중첩 wrapper |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | Occam Gate — 새 개념 추가 금지 (feedback_aria_item_parent_prop) | ② 산출물 | ✅ 준수 — 새 컴포넌트 0개, render 인자 1개 추가 | — | |
| 2 | store 모델 무변경 (feedback_os_based_dev_mandatory) | ② 산출물 | ✅ 준수 — store 구조 변경 없음 | — | |
| 3 | 하위 호환 필수 | ③ 인터페이스 | ✅ 준수 — 기존 3인자 함수 그대로 동작 | — | |
| 4 | APG 표준 용어 우선 (feedback_naming_convention) | ② 산출물 | ✅ 준수 — children은 React 표준 용어 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | aria.tsx AriaItemNode 컴포넌트 | children prop 추가로 기존 호출부 변경 필요 | 낮 | renderNodes() 내부에서만 호출, 외부 API 아님 | |
| 2 | 기존 render callback 소비자 | 4번째 인자가 추가로 전달됨 | 낮 | JS에서 여분의 인자는 무시됨, 타입은 optional | |
| 3 | getVisibleNodes 키보드 네비게이션 | container node의 navigable 여부 | 없음 | 이미 non-expandable container는 getVisibleNodes에서 스킵됨 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | cloneElement로 children 자동 주입 | ⑤ Decision 기각 | 소비자가 배치 위치 제어 불가, 마법적 | |
| 2 | container node에 자동 role="group" 부여 | ⑤ APG 표준 | APG 패턴마다 wrapper role이 다름 (group, menu 등), 소비자가 결정 | |
| 3 | collapsed container에 hidden children 전달 | ④ 경계 | 불필요한 DOM 생성, 현재 expand 로직과 불일치 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | ListboxGrouped render callback이 container node에서 children 수신 | ul[role="group"] > li[role="presentation"] + li[role="option"] DOM 구조 | |
| V2 | ①S2 | Tree의 expanded treeitem에서 children 수신 | children && ul[role="group"] 패턴으로 subtree wrapper 생성 | |
| V3 | ①S3 | 기존 flat listbox에서 render callback 3인자만 사용 | 동작 변화 없음, 테스트 통과 | |
| V4 | ④E1 | search 필터로 그룹 내 모든 option 숨김 | children이 빈 배열로 전달, wrapper는 렌더됨 | |
| V5 | ④E2 | ids mode로 Aria.Item 사용 | children 전달 없이 flat rendering | |
| V6 | ④E3 | 중첩 container (group 안에 group) | 각 레벨에서 children 재귀 전달 | |
| V7 | ③ | expandable container collapsed | children=undefined, 자식 DOM 없음 | |
| V8 | ③ | expandable container expanded | children=ReactNode[], 자식 DOM 생성 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
