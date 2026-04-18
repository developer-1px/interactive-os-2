---
id: 2-areas/pattern/prds/route-modal-prd
type: prd
slug: routeModal
title: 'AriaRoute Route-Level Modal — PRD'
tags: [untagged]
created: 2026-04-09
updated: 2026-04-09
summary: 'Discussion: 화면을 가리는 UI(fullscreen view 등)는 modal 취급해야 한다. popup 축(인스턴스 내 modal)과 별개로, AriaRoute가 인스턴스 간 포커스 격리를 담당한다.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# AriaRoute Route-Level Modal — PRD

> Discussion: 화면을 가리는 UI(fullscreen view 등)는 modal 취급해야 한다. popup 축(인스턴스 내 modal)과 별개로, AriaRoute가 인스턴스 간 포커스 격리를 담당한다.

## ① 동기

### WHY

- **Impact**: Writer에서 cmd+\로 slides/pyramid 뷰 전환 시, 포커스가 트리에 남아 화살표 키가 배경 트리를 조작한다. CmsPresentMode에서도 동일 문제. fullscreen overlay가 뜨면 배경 UI가 키보드를 수신하면 안 되는데, 현재 이를 막을 os 레벨 메커니즘이 없다.
- **Forces**: popup 축은 trigger-content 쌍 기반(인스턴스 내)이라 triggerless fullscreen에 적용 불가. AriaRoute는 document 레벨 keydown만 처리하고 children DOM에 관여 안 함. AriaRoute가 Fragment 렌더(`<>{children}</>`)라 siblings에 inert를 직접 걸 수 없음.
- **Decision**: popup 축은 건드리지 않고, AriaRoute 레벨에 route modal 관리를 추가한다. popup modal(인스턴스 내)과 route modal(인스턴스 간)은 범위가 달라 양립한다. Conflict 분석으로 검증 완료.
- **Non-Goals**: popup 축 변경. 기존 dialog/alertdialog 패턴 변경. Tab 순환(focus trap) — fullscreen 뷰는 focusable 요소가 거의 없어 Tab trap 불필요.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Writer에서 트리에 포커스가 있다 | cmd+\로 slides 모드 진입 | 포커스가 SlideView 컨테이너로 이동하고, 트리는 inert되어 키보드 수신 불가 | |
| S2 | Slides 모드에서 슬라이드를 보고 있다 | Escape를 누른다 | slides가 닫히고 포커스가 트리의 이전 위치로 복구된다 | |
| S3 | CMS에서 콘텐츠를 편집 중이다 | cmd+\로 present 모드 진입 | 포커스가 presentation 컨테이너로 이동하고, 배경 CMS는 inert | |
| S4 | 어떤 페이지에서든 route modal이 없다 | 일반 키보드 조작 | 기존 동작과 완전히 동일 (하위호환) | |

완성도: 🟢

## ② 산출물

| 산출물 | 위치 | 설명 | 역PRD |
|--------|------|------|-------|
| `RouteModal` | `src/interactive-os/ui/RouteModal.tsx` | route-level modal UI 컴포넌트. children을 modal 컨테이너로 감싸고, 활성 시 siblings에 inert 전파 + 자신에게 focus | |
| AriaRoute 확장 | `src/interactive-os/primitives/AriaRoute.tsx` | RouteModalContext 제공. route modal 활성 시 RouteKeyMap에서 modal 외부 키 처리 차단 | |
| RouteModalContext | `src/interactive-os/primitives/AriaRoute.tsx` | `{ isModalActive: boolean, registerModal: () => void, unregisterModal: () => void }` context | |

**구조:**
```
AriaRoute (RouteModalContext.Provider)
  ├─ <RouteModal active={viewMode === 'slides'}>  ← active 시 focus 잡음
  │    └─ <SlideView />
  │
  └─ <div ref={contentRef}>  ← RouteModal이 active면 이 div에 inert
       └─ <SplitPane> ...
```

**핵심 설계 결정:**
- AriaRoute가 Fragment→div로 바뀌지 않는다. RouteModal이 자신의 siblings를 DOM API로 inert 처리한다.
- RouteModal은 ui/ 레이어 컴포넌트. pages에서 primitives를 직접 쓰지 않는 원칙 준수.

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `<RouteModal active={true}>` 마운트/활성 | siblings 활성, 포커스 트리에 있음 | RouteModal 컨테이너에 focus(), siblings에 inert={true} 적용 | 화면을 가리면 modal — 배경은 비활성이어야 포커스 격리 보장 | 컨테이너에 포커스, siblings inert | |
| `<RouteModal active={false}>` 비활성 | RouteModal 활성, siblings inert | siblings에서 inert 제거, 이전 포커스 위치로 복구 | modal 해제 시 원래 작업 흐름 복귀 — APG 포커스 복구 규칙 | siblings 활성, 이전 포커스 복구 | |
| RouteModal 활성 중 ArrowLeft/Right | SlideView 활성 | RouteKeyMap이 slide 네비게이션 처리 | RouteModal 안에서는 RouteKeyMap만 동작, siblings의 onKeyDown은 inert로 차단됨 | 슬라이드 전환 | |
| RouteModal 활성 중 Escape | SlideView 활성 | RouteKeyMap이 modal 종료 처리 → active={false} | Escape는 modal 닫기의 표준 키 (APG) | modal 비활성, 포커스 복구 | |

**RouteModal API:**
```tsx
interface RouteModalProps {
  active: boolean
  children: ReactNode
  restoreFocus?: boolean  // default: true
  label?: string          // aria-label
}
```

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| RouteModal active인데 내부에 focusable 요소 없음 | SlideView 컨테이너만 존재 | focus 대상이 없으면 document.body로 빠짐 — 컨테이너 자체가 focus 받아야 | 컨테이너에 tabIndex={-1} + focus() | 컨테이너 focused | |
| RouteModal 활성 중 다른 RouteModal 열림 | 첫 RouteModal 활성 | 현재 프로젝트에서 이중 route modal 케이스 없음 — 발생하면 마지막 활성이 우선 | 새 RouteModal만 활성, 기존도 inert | 최상위만 활성 | |
| active={true}→{false} 전환 시 이전 포커스 요소가 제거됨 | modal 닫히는 중 | focusRecovery 플러그인 fallback 체인(다음→이전→부모) 적용 | fallback 위치로 포커스 | 가까운 유효 위치 focused | |
| 중첩 AriaRoute (AppShell > PageWriter) | Shell AriaRoute 안에 Writer AriaRoute | RouteModal은 자신이 속한 AriaRoute의 siblings만 inert — 상위 AriaRoute 영향 없음 | Writer 내 siblings만 inert, Shell은 정상 | Writer 범위 내 격리 | |
| viewMode가 빠르게 연속 전환 (cmd+\ 연타) | slides→pyramid→tree 빠른 전환 | active가 false→true→false→true로 빠르게 변할 때 포커스 복구/설정이 race하지 않아야 | useEffect cleanup으로 이전 상태 정리 | 최종 상태만 반영 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 화면 가림 = modal (feedback_overlay_is_modal) | 전체 | ✅ 준수 | — | |
| 2 | 모든 상태 = NormalizedData+Command (feedback_all_state_normalized_command) | ② RouteModal active prop | ⚠️ 검토 | active는 외부에서 주입하는 derived state (viewMode에서 파생). RouteModal 자체는 새 state를 만들지 않음. viewMode는 이미 useState지만, 이는 "뷰 모드"라는 route-level 관심사로 engine 범위 밖. 허용. | |
| 3 | 축 SSOT, 패턴 정체성 (feedback_axis_pattern_principles) | ② AriaRoute 확장 | ✅ 준수 | popup 축 변경 없음. 새 축 추가 아님. AriaRoute의 route-level 관심사. | |
| 4 | UI > primitives (feedback_ui_over_primitives) | ② RouteModal 위치 | ✅ 준수 | RouteModal은 ui/ 레이어. pages에서 직접 사용. | |
| 5 | 포커스 복구 불변 (feedback_focus_principles) | ③ 복구 | ✅ 준수 | active={false} 시 이전 포커스로 복구. 요소 제거 시 focusRecovery fallback. | |
| 6 | 설계 > 요구 (feedback_design_over_request) | 전체 | ✅ 준수 | engine 우회 없음. popup 축 우회 없음. | |
| 7 | 선언적 OCP (feedback_declarative_ocp) | ③ API | ✅ 준수 | `<RouteModal active={...}>` 선언적. dispatcher 없음. | |
| 8 | OS 기반 개발 — addEventListener 금지 (CLAUDE.md) | ② inert 적용 방식 | ⚠️ 검토 | RouteModal이 siblings DOM에 inert를 직접 설정하는 건 imperative DOM 조작. 하지만 이건 React의 한계 — sibling DOM 제어는 ref+effect가 유일한 방법. keydown listener 추가가 아니라 attribute 설정이므로 허용. | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | AriaRoute — RouteModalContext 추가 | 기존 사용처(8곳) API 변경 없음. context는 optional consumer. | 🟡 낮음 | 하위호환 유지 — context 미사용 시 기존 동작 동일 | |
| 2 | PageWriter — SlideView/PyramidView 렌더 구조 | RouteModal로 감싸야 하고, SplitPane도 감싸야 inert 대상 식별 가능 | 🟠 중간 | PageWriter JSX 구조 변경 최소화. RouteModal은 SlideView만 감싸고, siblings 자동 탐색. | |
| 3 | CmsPresentMode — 기존 AriaRoute + tabIndex 패턴 | RouteModal로 교체하면 기존 수동 focus 로직 제거 가능 | 🟡 낮음 | CmsPresentMode를 RouteModal로 마이그레이션 | |
| 4 | FileViewerModal — native dialog | native dialog와 RouteModal 동시 활성 시 inert 범위 충돌 가능 | 🟡 낮음 | native dialog의 showModal()이 자체 top layer 관리하므로 충돌 없음 | |
| 5 | AppShell의 AriaRoute 키 처리 | RouteModal 활성 시 Shell 레벨 키(cmd+shift+I 등)는 여전히 동작해야 | 🟠 중간 | RouteModal은 자기 AriaRoute의 siblings만 inert. 상위 AriaRoute의 document keydown은 영향 없음 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | popup 축 수정 | ⑤-3 축 SSOT | popup은 trigger-content 쌍 전용. triggerless modal을 넣으면 정체성 훼손 | |
| 2 | AriaRoute를 Fragment→div로 변경 | ⑥-1 하위호환 | 8곳의 기존 사용처 DOM 구조가 변경됨. CSS/레이아웃 깨질 수 있음 | |
| 3 | RouteModal에 자체 state (useState) 추가 | ⑤-2 NormalizedData+Command | active는 외부에서 prop으로 주입. RouteModal 내부에 open/close state 만들지 않음 | |
| 4 | document.addEventListener('keydown') 추가 | ⑤-8 OS 기반 개발 | AriaRoute가 이미 document keydown 관리. 이중 등록 금지 | |
| 5 | pages에서 RouteModal 대신 primitives 직접 사용 | ⑤-4 UI > primitives | RouteModalContext를 pages에서 직접 consume하지 않음 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | RouteModal active 시 siblings에 inert 속성 존재 | `expect(sibling.hasAttribute('inert')).toBe(true)` | |
| V2 | S1 | RouteModal active 시 컨테이너가 document.activeElement | `expect(document.activeElement).toBe(container)` | |
| V3 | S1 | RouteModal active 시 sibling 내 요소에 키보드 입력 → 반응 없음 | sibling의 onKeyDown 미실행 | |
| V4 | S2 | RouteModal 비활성 시 siblings에서 inert 제거 | `expect(sibling.hasAttribute('inert')).toBe(false)` | |
| V5 | S2 | RouteModal 비활성 시 이전 포커스 위치로 복구 | `expect(document.activeElement).toBe(previousFocusElement)` | |
| V6 | S4 | RouteModal 미사용 시 AriaRoute 기존 동작 동일 | 모든 기존 테스트 통과 | |
| V7 | ④-1 | 내부에 focusable 요소 없을 때 컨테이너 자체가 focus | `tabIndex={-1}` 설정 + `container.focus()` 호출 | |
| V8 | ④-4 | 중첩 AriaRoute에서 상위 Route 키 처리 정상 | Shell keyMap (cmd+shift+I) 동작 | |
| V9 | ④-5 | active 빠른 연속 전환 시 최종 상태만 반영 | 중간 상태에서 inert 잔류 없음 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

#kind/prd #topic/pattern
