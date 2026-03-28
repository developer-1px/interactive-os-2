# Aria.Panel + Aria.Trigger — PRD

> Discussion: 축 v3에서 capability 분리는 완성됐지만, 소비측(Aria 컴포넌트)이 `<Aria><Aria.Item/>` 단일 구조로 고정되어 multi-zone 패턴(Tabs, Accordion, MenuButton, Combobox, Dialog)의 DOM 구조/ARIA 관계를 표현할 수 없다.

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: 모든 APG example이 동일한 `<Aria><Aria.Item render={fn}/>` 구조를 사용하여, 패턴마다 근본적으로 다른 레이아웃(탭바+패널, 트리거+팝업)과 ARIA 관계(aria-controls, aria-labelledby)를 표현할 수 없다. render 함수 분기로 때우면 레이아웃 제어 불가, ARIA 참조 끊김, 포커스 도메인 미분리.
- **Forces**: (1) Aria 컴포넌트는 단일 컬렉션 모델로 시작 — Item이 재귀적으로 트리를 렌더링하는 구조. (2) APG 패턴 중 절반 이상이 2개 이상의 zone으로 구성 (tablist↔tabpanel, trigger↔popup). (3) engine/store/axis 아키텍처는 유지해야 함.
- **Decision**: Aria.Panel + Aria.Trigger 두 Part 추가. Base UI처럼 패턴당 Part 세트(Menu만 16개)를 만들지 않는다 — composePattern 조합 철학 유지. Panel은 Item과 동형의 순회 렌더러(같은 store, 다른 DOM 위치). (기각: A) behavior-driven panelPlacement — 개발자 레이아웃 제어권 상실. B) Portal 기반 PanelOutlet — 불필요한 새 개념, Portal은 Dialog 같은 DOM 탈출 시 개발자가 직접 사용)
- **Non-Goals**: (1) 기존 단일 컬렉션 패턴(listbox, tree, grid 등)은 변경하지 않음. (2) Floating UI 같은 포지셔닝 라이브러리 통합은 범위 밖. (3) Portal/Positioner 같은 DOM 위치 Part는 만들지 않음.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | Tabs 패턴을 사용하는 개발자 | `<Aria behavior={tabs}>` 안에 탭 목록과 패널을 배치 | tablist 영역과 tabpanel 영역이 분리되고, 선택된 탭에 대응하는 패널만 보임. tab의 aria-controls가 panel의 id를, panel의 aria-labelledby가 tab의 id를 가리킴 | |
| S2 | Accordion 패턴을 사용하는 개발자 | `<Aria behavior={accordion}>` 안에 헤더와 패널을 배치 | 각 헤더 아래에 region이 연결되고, 확장된 헤더의 region만 보임. header의 aria-controls가 region의 id를, region의 aria-labelledby가 header의 id를 가리킴 | |
| S3 | MenuButton 패턴을 사용하는 개발자 | `<Aria behavior={menuButton}>` 안에 트리거와 메뉴 아이템을 배치 | 트리거 버튼에 aria-haspopup/aria-expanded가 자동 생성. 클릭/Enter/Space로 팝업 열림. 열리면 첫 아이템으로 포커스 위임. Escape로 닫히면 트리거로 포커스 복귀 | |
| S4 | Combobox 패턴을 사용하는 개발자 | `<Aria behavior={combobox}>` 안에 인풋 트리거와 옵션 리스트를 배치 | 인풋에 aria-haspopup/aria-expanded/aria-controls 자동 생성. 인풋에서 ArrowDown으로 리스트 열림. 선택 후 인풋으로 포커스 복귀 | |
| S5 | Dialog 패턴을 사용하는 개발자 | `<Aria behavior={dialog}>` 안에 트리거와 다이얼로그 콘텐츠를 배치 | 트리거에 aria-haspopup="dialog"/aria-expanded 자동 생성. 열리면 다이얼로그 콘텐츠로 포커스 위임. Escape로 닫히면 트리거로 복귀 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마
>
> 핵심 원칙: **DOM 배치가 곧 컴포넌트의 이유.** Item/Panel/Trigger는 같은 store를 순회하되 DOM에서 다른 위치를 차지하기 때문에 별도 컴포넌트.

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `Aria.Panel` in `aria.tsx` | Item과 동형의 store 순회 렌더러. 차이점: (1) visibility 조건이 selected/expanded 기반 (2) role은 behavior.panelRole (tabpanel/region) (3) aria-labelledby → 연결된 Item의 id 자동 생성. 개발자가 JSX 배치로 레이아웃 직접 제어 | |
| `Aria.Trigger` in `aria.tsx` | popup 축의 진입점 렌더러. popup 축의 isOpen/open/close를 DOM에 연결. aria-haspopup/aria-expanded/aria-controls 자동 생성. 클릭/키보드로 open() 호출 | |
| `AriaPattern.panelRole` in `pattern/types.ts` | 패턴이 Panel의 role을 선언 (tabpanel, region 등) | |
| `AriaPattern.panelVisibility` in `pattern/types.ts` | Panel 보���/숨김 기준 선언 ('selected' \| 'expanded') | |
| tabs pattern 업데이트 | `panelRole: 'tabpanel'`, `panelVisibility: 'selected'` 추가 | |
| accordion pattern 업데이트 | `panelRole: 'region'`, `panelVisibility: 'expanded'` 추가 | |
| menuButton pattern 업데이트 | popup 축 사용, Trigger 활용 | |
| tabs example | `<Aria.Item/>` + `<Aria.Panel/>` 형제 배치 | |
| accordion example | `<Aria.Item/>` + `<Aria.Panel/>` 번갈아 배치 | |
| menuButton example | `<Aria.Trigger/>` + `<Aria.Item/>` 구조 | |

### 사용 예시

```tsx
// Tabs — Item과 Panel이 별도 영역
<Aria behavior={tabs}>
  <div className="tablist">
    <Aria.Item render={renderTab} />
  </div>
  <Aria.Panel render={renderPanel} />
</Aria>

// Accordion — Item과 Panel이 번갈아
<Aria behavior={accordion}>
  <Aria.Item render={renderHeader} />
  <Aria.Panel render={renderRegion} />
</Aria>

// MenuButton — Trigger + Item
<Aria behavior={menuButton}>
  <Aria.Trigger render={renderButton} />
  <Aria.Item render={renderMenuItem} />
</Aria>
```

완성도: 🟢

## ③ 인터페이스

### Aria.Panel

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Panel 마운트 | store에 아이템 존재 | Panel이 store children을 순회하며 렌더링 | Panel은 Item과 동형 — 같은 store를 다른 DOM 위치에서 순회 | 각 아이템에 대응하는 panel DOM 생성 | |
| panelVisibility='selected' | 탭 A 선택됨 | 탭 A의 panel만 보임, 나머지 숨김 | APG Tabs: 선택된 탭의 패널만 표시 | 탭 A panel: visible, 나머지: hidden | |
| panelVisibility='expanded' | 헤더 A 확장됨 | 헤더 A의 panel만 보임 | APG Accordion: 확장된 항목의 region만 표시 | 헤더 A panel: visible, 나머지: hidden | |
| Panel 렌더링 | 아이템 id 존재 | panel에 자동 id 생성, 연결된 Item에 aria-controls 주입 | APG: tab은 aria-controls로 tabpanel을 가리켜야 함 | panel: id="panel-{itemId}", item: aria-controls="panel-{itemId}" | |
| Panel 렌더링 | 아이템 id 존재 | panel에 aria-labelledby 자동 생성 | APG: tabpanel은 aria-labelledby로 tab을 가리켜야 함 | panel: aria-labelledby="{itemId}" | |
| Panel 렌더링 | behavior.panelRole='tabpanel' | panel DOM에 role="tabpanel" 설정 | 패턴이 Panel의 ARIA role을 결정 | panel: role="tabpanel" | |

### Aria.Trigger

> Trigger 자체는 키 바인딩을 하드코딩하지 않는다. **어떤 키가 open/close를 호출하는지는 composePattern의 triggerKeyMap이 선언.** Trigger는 ARIA 속성 연결 + triggerKeyMap을 DOM에 바인딩만 한다. (축 = capability only, 패턴 = key binding 원칙과 동일)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Trigger 마운트 | popup 닫힘 | trigger에 aria-haspopup, aria-expanded="false" 자동 생성 | APG: trigger는 popup 존재와 상태를 선언해야 함 | trigger: aria-haspopup="{type}", aria-expanded="false" | |
| triggerKeyMap에 바인딩된 키 입력 | popup 닫힘 | 패턴이 지정한 handler 실행 (예: popup.handlers.opensPopup) | 축 원칙: 키 바인딩은 패턴이 결정. MenuButton은 Enter/Space/ArrowDown→open, Combobox는 ArrowDown만→open | handler가 반환한 Command 실행 | |
| Escape (triggerKeyMap) | popup 열림 | popup.handlers.closesPopup 실행 | APG: Escape closes popup and returns focus to trigger | popup 닫힘, trigger로 포커스 복귀 | |
| 클릭 | popup 닫힘/열림 | triggerClickMap에 바인딩된 handler 실행 (toggle) | 클릭도 선언적 맵, 패턴이 결정 | popup toggle | |
| popup 열림 | trigger 존재 | trigger에 aria-expanded="true" 반영 | popup 상태 변화가 trigger의 aria-expanded에 반영 | trigger: aria-expanded="true" | |
| popup 열림 | Item 영역 존재 | trigger의 aria-controls가 Item 컨테이너 id를 가리킴 | APG: trigger는 aria-controls로 popup을 참조 | trigger: aria-controls="{popup-container-id}" | |

### composePattern에서의 Trigger keyMap 선언

```ts
// menuButton 패턴 — triggerKeyMap은 composePattern이 소유
export const menuButton = composePattern(
  { role: 'menu', childRole: 'menuitem', ... },
  [popup({ type: 'menu' }), navigate({ orientation: 'vertical', wrap: true })],
  // Item keyMap (popup 내부)
  { ArrowDown: nav.handlers.movesNext, Escape: pop.handlers.closesPopup, ... },
  // clickMap
  { none: ... },
  // triggerKeyMap (Trigger 전용) ← 새 인자
  { Enter: pop.handlers.opensPopup, Space: pop.handlers.opensPopup,
    ArrowDown: pop.handlers.opensPopup },
)

// combobox 패턴 — 다른 triggerKeyMap
export const combobox = composePattern(
  { role: 'listbox', childRole: 'option', ... },
  [popup({ type: 'listbox' }), select(), navigate()],
  { ArrowDown: nav.handlers.movesNext, ... },
  {},
  // triggerKeyMap — ArrowDown만 open
  { ArrowDown: pop.handlers.opensPopup },
)
```

### 인터페이스 체크리스트

- [x] ↑ 키: Trigger — N/A (Panel 내부 키는 Item이 처리)
- [x] ↓ 키: Trigger — ArrowDown으로 popup open + 첫 아이템 포커스
- [x] ← 키: N/A
- [x] → 키: N/A
- [x] Enter: Trigger — popup open
- [x] Escape: popup 열림 → close + trigger 복귀
- [x] Space: Trigger — popup open
- [x] Tab: N/A (popup 내 Tab은 패턴별)
- [x] Home/End: N/A
- [x] Cmd/Ctrl 조합: N/A
- [x] 클릭: Trigger — toggle popup
- [x] 더블클릭: N/A
- [x] 이벤트 버블링: Trigger의 키 이벤트가 Aria 컨테이너로 버블링되지 않아야 함 (stopPropagation)

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: Panel 없이 Aria.Item만 사용 | 기존 listbox/tree 패턴 | 하위 호환 — 단일 컬렉션 패턴은 Panel 불필요 | 기존과 동일하게 동작. Panel 없어도 에러 없음 | 변경 없음 | |
| E2: Trigger 없이 popup 패턴 사용 | popup 축 있지만 Trigger 미사용 | 점진 마이그레이션 — 기존 popup 패턴이 Trigger 없이도 동작해야 함 | 기존 방식(Item 내부 aria-haspopup) 유지 | 변경 없음 | |
| E3: Panel의 연결 대상 아이템이 삭제됨 | 탭 3개 중 선택된 탭 삭제 | focusRecovery 불변 조건 — CRUD 있으면 반드시 동작 | focusRecovery가 인접 탭으로 포커스 이동, 해당 탭의 Panel이 보임 | 새 선택 탭의 Panel 표시 | |
| E4: Accordion에서 모든 헤더 접힘 | expanded 없음 | APG Accordion: 모두 접힌 상태 허용 | Panel 전부 숨김. 헤더만 보임 | Panel 0개 visible | |
| E5: Tabs에서 아이템 0개 | 빈 store | 빈 컬렉션은 합법 상태 | Item 0개, Panel 0개 렌더링. 컨테이너만 존재 | 빈 tablist + 빈 panel 영역 | |
| E6: Trigger 키 이벤트 버블링 | Trigger가 Aria 컨테이너 내부 | Trigger의 키는 Trigger 전용 — Item keyMap과 충돌 방지 | Trigger의 onKeyDown에서 triggerKeyMap 매칭 후 stopPropagation | Item keyMap에 도달하지 않음 | |
| E7: popup 열린 상태에서 Trigger 재클릭 | popup 열림 | toggle — 사용자 기대: 열려있으면 닫기 | close() 실행, trigger 포커스 유지 | popup 닫힘 | |
| E8: 중첩 Aria — 외부 Aria 안에 Trigger 있는 Aria | 외부 listbox > 내부 menuButton | 중첩 이벤트 격리 — defaultPrevented 가드 | 내부 Trigger 키가 외부 Aria에 영향 없음 | 각자 독립 동작 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 축은 keyMap 소유 금지 (feedback_axis_no_keymap) | ③ Trigger | ✅ 준수 — Trigger는 capability만, triggerKeyMap은 composePattern이 소유 | — | |
| P2 | click도 선언적 맵 (feedback_click_map_needed) | ③ Trigger 클릭 | ✅ ��수 — triggerClickMap으로 선언 | — | |
| P3 | 선언적 OCP (feedback_declarative_ocp) | ② composePattern 확장 | ✅ 준수 — triggerKeyMap이 5번째 인자로 선언, 합성 런타임 불변 | — | |
| P4 | DOM 배치 = 컴포넌트 이유 (feedback_dom_placement_is_component_reason) | ② Panel/Trigger 분리 근거 | ✅ 준수 — Item/Panel/Trigger는 같은 store, 다른 DOM 위치 | — | |
| P5 | ARIA 표준 용어 우선 (feedback_naming_convention) | ② panelRole, triggerRole | ✅ 준수 — tabpanel, region, button 등 APG 표준 role | — | |
| P6 | 중첩 이벤트 버블링 가드 (feedback_nested_event_bubbling) | ④ E6, E8 | ✅ 준수 — Trigger의 stopPropagation + defaultPrevented 가드 | — | |
| P7 | focusRecovery 불변 조건 (feedback_focus_recovery_invariant) | ④ E3 | ✅ 준수 — Panel 삭제 시 focusRecovery가 처리 | — | |
| P8 | UI 완성품만 노출 (feedback_ui_over_primitives) | ② Panel/Trigger | 🟡 주의 — Panel/Trigger는 primitive. UI 완성품(Tabs, MenuList 등)이 이를 래핑해야 최종 사용자에 노출 | ui/ 완성품 업데이트는 별도 PRD | |
| P9 | Pattern = composePattern + examples/APG (feedback_pattern_apg_only) | ② pattern 업데이트 | ✅ 준수 — panelRole/panelVisibility는 composePattern Identity에 추가 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `aria.tsx` — Aria export 객체 | Panel, Trigger 추가로 export 확장 | 낮 | 허용 — 기존 Item/Cell/Editable과 동일 패턴 | |
| S2 | `pattern/types.ts` — AriaPattern 인터페이스 | panelRole, panelVisibility, triggerKeyMap 필드 추가 | 낮 | 허용 — optional 필드, 기존 패턴에 영향 없음 | |
| S3 | `composePattern.ts` — 함수 시그니처 | 5번째 인자(triggerKeyMap) 추가 | 중 | 허용 — 기존 4인자 호출은 그대로 동작 (optional) | |
| S4 | 기존 tabs/accordion/menuButton example | 구조 변경으로 기존 example 깨짐 | 중 | ④ E1/E2로 대응 — 기존 패턴은 Panel/Trigger 없이 동작 유지. example은 이번에 같이 업데이트 | |
| S5 | APG conformance 테스트 | tabs/accordion/menuButton 테스트가 새 DOM 구조 반영 필요 | 중 | 테스트 업데이트를 이번 범위에 포함 | |
| S6 | `useAriaView.ts` — getNodeProps | Panel용 props 생성 경로 필요 (aria-labelledby 등) | 중 | Panel이 자체 getNodeProps 로직 보유, useAriaView 변경 최소화 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | Trigger에 키 바인딩 하드코딩 | ⑤ P1 — 축 no keyMap | 축 원칙 위반. composePattern의 triggerKeyMap이 결정 | |
| X2 | Panel에 panelPlacement / 자동 배치 로직 | ⑤ P4 — DOM 배치 = 컴포넌트 이유 | 개발자가 JSX 배치로 레이아웃 제어. Panel은 순회만 | |
| X3 | Panel 내부에 Portal 로직 | ① Non-Goals | Portal은 Dialog 등에서 개발자가 직접 사용 | |
| X4 | composePattern 기존 4인자 호출 깨기 | ⑥ S3 | 하위 호환. triggerKeyMap은 optional 5번째 인자 | |
| X5 | Panel/Trigger를 UI 완성품 없이 직접 노출 | ⑤ P8 | primitive는 ui/ 완성품이 래핑. llms.txt에는 완성품만 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①S1 | Tabs: Item과 Panel을 형제 배치, 탭 클릭 | 선택된 탭의 panel만 visible. tab: aria-controls → panel id. panel: aria-labelledby → tab id. role="tabpanel" | |
| V2 | ①S2 | Accordion: Item과 Panel을 번갈아 배치, 헤더 Enter | 확장된 헤더의 region만 visible. header: aria-controls → region id. region: aria-labelledby → header id. role="region" | |
| V3 | ①S3 | MenuButton: Trigger 렌더, Enter 입력 | popup 열림, 첫 menuitem 포커스. trigger: aria-haspopup="menu", aria-expanded="true", aria-controls → menu id | |
| V4 | ①S3 | MenuButton: popup 열린 상태에서 Escape | popup 닫힘, trigger로 포커스 복귀. trigger: aria-expanded="false" | |
| V5 | ④E1 | Listbox: Panel 없이 Item만 사용 | 기존과 동일 동작. 에러 없음 | |
| V6 | ④E2 | 기존 popup 패턴: Trigger 없이 사용 | 기존 방식(Item 내부 aria-haspopup) 유지 | |
| V7 | ④E3 | Tabs: 선택된 탭 삭제 | focusRecovery로 인접 탭 선택, 해당 Panel 표시 | |
| V8 | ④E6 | Trigger 키 이벤트 버블링 | triggerKeyMap 매칭 후 Aria Item keyMap에 도달하지 않음 | |
| V9 | ④E8 | 중첩: 외부 listbox > 내부 menuButton Trigger | 내부 Trigger Enter가 외부 listbox에 영향 없음 | |
| V10 | ①S4 | Combobox: Trigger(인풋)에서 ArrowDown | popup 열림, 첫 option 포커스. Enter는 open이 아니라 select | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## 교차 검증

1. **동기 ↔ 검증**: S1→V1, S2→V2, S3→V3+V4, S4→V10, S5→V3(dialog 유사) ✅
2. **인터페이스 ↔ 산출물**: Panel = store 순회 + visibility, Trigger = popup ctx + triggerKeyMap. 산출물 구조와 일치 ✅
3. **경계 ↔ 검증**: E1→V5, E2→V6, E3→V7, E6→V8, E8→V9 ✅
4. **금지 ↔ 출처**: X1←P1, X2←P4, X3←Non-Goals, X4←S3, X5←P8 전부 유효 ✅
5. **원칙 대조 ↔ 전체**: P8 주의사항(ui/ 완성품 래핑)은 별도 PRD로 분리 ✅
