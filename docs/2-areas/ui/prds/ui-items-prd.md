---
id: 2-areas/ui/prds/ui-items-prd
title: 'UI 부품 레이어 확장 — PRD'
status: active
kind: prd
created: 2026-04-05
updated: 2026-04-08
summary: 'Discussion: 도구 UI 글자 크기 불일치 → 부품 레이어 부재가 근본 원인 → indicators처럼 items/panels/cells 3개 부품 레이어 추가 + hook 강제'
topics: [2-areas]
relates: []
supersedes: []
---
# UI 부품 레이어 확장 — PRD

> Discussion: 도구 UI 글자 크기 불일치 → 부품 레이어 부재가 근본 원인 → indicators처럼 items/panels/cells 3개 부품 레이어 추가 + hook 강제

## ① 동기

### WHY

- **Impact**: 새 페이지를 만들 때마다 renderItem에서 ax()를 처음부터 조립하여 textStyle/controlSize가 컴포넌트마다 다름. 서비스 전체의 시각적 일관성이 깨짐.
- **Forces**: renderItem의 전체 교체 자유도(구조 변경 가능) vs 일관성(기본값 수렴). 둘 다 필요하지만 현재는 자유도만 있고 수렴 장치가 없음.
- **Decision**: indicators 패턴을 따라 ui/items/, ui/panels/, ui/cells/ 3개 부품 레이어를 만든다. 기각: slot 방식(구조 고정됨), 팩토리(불필요한 추상화), 타입 강제(ax() 유연성 훼손).
- **Non-Goals**: renderItem 인터페이스 변경, 기존 UI 컴포넌트 구조 변경, 모든 pages 즉시 마이그레이션.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 새 페이지에서 TreeView를 사용 | renderItem을 커스텀하지 않음 | 기본 TreeItem이 caption(12px) + controlSize sm으로 렌더링 | |
| S2 | 새 페이지에서 ListBox를 사용 | 아이콘을 추가하고 싶음 | items/에서 ListItem을 import하여 icon prop만 전달 | |
| S3 | pages에서 renderItem을 ax()로 날코딩 | hook이 경고 | "ui/items/ 완성품을 사용하세요" 메시지 출력 | |
| S4 | 도메인 특화 렌더링이 필요 | ui/items/에 새 Item 컴포넌트를 만들고, UI 컴포넌트의 defaultRenderItem이 그것을 사용 | 부품이 쌓이는 구조 — pages가 renderItem을 직접 쓰지 않음 | |
| S5 | pages에서 renderItem prop을 직접 전달 | hook이 경고 | "renderItem 직접 사용 금지 — 필요하면 ui/items/에 Item을 추가하세요" | |

완성도: 🟢

## ② 산출물

> indicators/ 패턴과 동일한 구조로 ui/items/ 디렉토리 생성

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `ui/items/index.ts` | 모든 Item export | |
| `ui/items/TreeItem.tsx` | 트리 노드: depth indent + ExpandIndicator + label. controlSize sm, caption | |
| `ui/items/ListItem.tsx` | 리스트 아이템: label + optional icon/rightContent. caption | |
| `ui/items/TabItem.tsx` | 탭: label + selected 상태. controlSize sm, caption | |
| `ui/items/ToolbarItem.tsx` | 툴바 버튼: icon 또는 label. controlSize sm | |
| `ui/items/MenuItem.tsx` | 메뉴 아이템: label + submenu indicator. body (메뉴는 독립 overlay) | |
| **panels/** | | |
| `ui/panels/index.ts` | 모든 Panel export | |
| `ui/panels/Panel.tsx` | 패널 컨테이너: surface + PanelHeader + scroll body. `<Panel header="Files" surface="sunken">{children}</Panel>` | |
| `ui/panels/SidePanel.tsx` | 사이드패널: Panel + 접기/width 옵션 (?) | |
| **cells/** | | |
| `ui/cells/index.ts` | 모든 Cell export | |
| `ui/cells/TextCell.tsx` | 텍스트 셀: caption, clamp:'1'. Grid/Table 기본 | |
| `ui/cells/BadgeCell.tsx` | 뱃지/태그 셀: tone + label | |
| `ui/cells/CodeCell.tsx` | 코드 셀: code textStyle, mono | |
| **규칙/강제** | | |
| CLAUDE.md 규칙 추가 | "아이템 → ui/items/, 패널 → ui/panels/, 셀 → ui/cells/ 사용. pages에서 새로 만들기 금지" | |
| CLAUDE.md 규칙 추가 (renderItem 금지) | pages에서 renderItem prop 직접 전달 금지 | |
| CLAUDE.md 규칙 추가 (패널 날코딩 금지) | pages에서 surface+header+scroll 패턴 직접 조립 금지. Panel 사용 | |
| guardOsPatterns.mjs 규칙 추가 | pages에서 부품 날코딩 시 ui/{items,panels,cells}/ 부품 목록을 동적으로 읽어 구체적 안내 | |

완성도: 🟢

## ③ 인터페이스

> 비-인터랙션 컴포넌트 (Item은 렌더링 전용, 인터랙션은 부모 UI 컴포넌트가 소유)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| TreeItem에 node + state 전달 | — | depth 계산 → indent padding + ExpandIndicator + label 렌더 | depth는 state.level에서 파생, indent는 CSS 변수로 일관 | caption 12px, ghost surface, sm 크기 | |
| ListItem에 node + state 전달 | — | label + optional icon 렌더 | 도구 UI 기본 밀도 = caption | caption 12px | |
| TabItem에 node + state 전달 | — | label + selected 상태 시각화 | TabList의 기본 밀도 유지 | caption 12px, selected → primary text | |
| ToolbarItem에 node + state 전달 | — | icon 또는 label 렌더, focused → state visual | Toolbar는 아이콘 중심, controlSize sm | sm 크기, center layout | |
| MenuItem에 node + state 전달 | — | label + submenu indicator 렌더, focused → bright text | 메뉴는 독립 overlay이므로 body 크기 유지 | body 14px, focused → bright | |
| **panels** | | | | | |
| Panel에 header + surface + children 전달 | — | PanelHeader 렌더 + scroll body 래핑 | surface+header+scroll은 3개 div 조합이 필수 패턴이므로 단일 컴포넌트로 | surface + overline 헤더 + 스크롤 영역 | |
| SidePanel에 header + children + collapsible 전달 | — | Panel + 접기 버튼 + width 제어 | 사이드바는 접기가 빈번한 패턴 | 접힌 상태 → 헤더만, 펼친 상태 → Panel | |
| **cells** | | | | | |
| TextCell에 value 전달 | — | caption + clamp:'1' + 정렬 | 그리드 셀은 밀도 높은 데이터 표시이므로 caption | caption 12px, 말줄임 | |
| BadgeCell에 tone + label 전달 | — | tone 배경 + caption label | 상태/카테고리 표시는 tone으로 구분 | tone pill + caption | |
| CodeCell에 value 전달 | — | code textStyle + mono | 코드/ID 표시는 mono 필수 | code 12px, mono | |

### 공통 Props 인터페이스

```
ItemProps = renderItem 시그니처의 3인자를 그대로 받음:
  props: HTMLAttributes (부모가 주는 ARIA/이벤트)
  node: Record<string, unknown>
  state: NodeState

+ 선택적 확장:
  icon?: ReactNode
  rightContent?: ReactNode
  className?: string
```

인터페이스 체크리스트: 키보드 인터랙션은 N/A (Item은 렌더링 전용, 인터랙션은 부모 UI 컴포넌트가 처리)

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| TreeItem depth가 10 이상 | indent가 화면 밖으로 | max-depth clamp 또는 스크롤로 처리해야 가독성 유지 | indent는 depth * space-md, 컨테이너 overflow-x로 처리 | 가로 스크롤 가능 | |
| node에 label/name이 없음 | fallback 필요 | node.id는 항상 존재(NormalizedData 보장) | node.id를 fallback label로 사용 | id 표시 | |
| Item에 icon + rightContent + label 모두 있음 | 공간 부족할 수 있음 | label이 주 콘텐츠이므로 clamp 적용 | label에 clamp:'1' (ellipsis), icon/rightContent는 shrink-0 | 말줄임 표시 | |
| renderItem을 완전 커스텀 | Item 컴포넌트 미사용 | 도메인 특화 케이스에서 자유도 필수 (제약) | hook 경고는 출력하되 차단하지 않음 (warning, not error) | 경고 + 허용 | |
| showcase/demo에서 renderItem 커스텀 | 데모 목적 | 데모는 API 사용법을 보여주는 것이므로 부품 강제 불필요 | showcase/ 디렉토리는 hook 예외 | 경고 없음 | |
| Panel에 header 없이 사용 | header가 불필요한 영역 | 메인 콘텐츠 영역은 헤더 불필요 | header를 optional로. 없으면 PanelHeader 미렌더 | scroll body만 | |
| Panel이 중첩됨 | SplitPane 안에 Panel 3개 | 패널이 중첩 가능해야 레이아웃 자유도 유지 | Panel은 self-contained, 중첩 무제한 | 각 Panel 독립 | |
| Cell이 커스텀 콘텐츠 필요 | TextCell/BadgeCell로 부족 | 도메인 특화 셀은 cells/에 새 Cell 추가 | pages에서 직접 만들지 않고 cells/에 추가 후 사용 | 부품이 쌓이는 구조 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | UI over Primitives (feedback_ui_over_primitives.md) | ② items는 ui/ 완성품 | ✅ 준수 | — | |
| 2 | Composite is UI (feedback_composite_is_ui_combination.md) | ② items는 ui/ 내부 | ✅ 준수 | — | |
| 3 | UI SDK — 용도별 완성품 (feedback_ui_sdk_principles.md) | ② TreeItem/ListItem/TabItem 분리 | ✅ 준수 | — | |
| 4 | Render = Slot (feedback_render_function_is_slot.md) | ③ renderItem 시그니처 유지 | ✅ 준수 — Item이 props/node/state를 그대로 받음 | — | |
| 5 | Declarative OCP (feedback_declarative_ocp.md) | ② index.ts에서 선언적 export | ✅ 준수 | — | |
| 6 | Reuse Existing (feedback_reuse_existing_impl.md) | ② ExpandIndicator 등 재활용 | ✅ 준수 | — | |
| 7 | Style is Hatch (feedback_style_is_hatch.md) | ③ ax() 강제 | ✅ 준수 | — | |
| 8 | DOM Placement (feedback_dom_placement_is_component_reason.md) | ② TreeItem(indent+chevron) vs ListItem(flat) = 다른 DOM 구조 | ✅ 준수 | — | |
| 9 | OS 기반 개발 — indicators 사용 (CLAUDE.md) | ② indicators 패턴 확장 | ✅ 준수 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | UI 컴포넌트의 defaultRenderItem | 기존 defaultRenderItem과 Item 컴포넌트가 중복 | 낮 | defaultRenderItem 내부에서 Item 컴포넌트를 사용하도록 교체 | |
| 2 | 27개 pages의 renderItem 커스텀 | hook 경고가 기존 코드에서 발생 | 중 | 마이그레이션 전까지 기존 파일은 예외 처리 또는 warning only | |
| 3 | 15개 테스트의 renderItem | 테스트에서 Item import 필요할 수 있음 | 낮 | 테스트는 __tests__/ 경로이므로 hook 대상 아님 | |
| 4 | 네이밍 — indicators와의 일관성 | TreeItem vs ExpandIndicator 혼동 가능 | 낮 | items/은 행 전체, indicators/는 아이콘 부품 — 역할 명확 | |
| 5 | PanelHeader.tsx와 Panel의 관계 | 기존 PanelHeader 사용처(7개 페이지)와 Panel이 충돌 | 중 | Panel이 PanelHeader를 내부 사용. 기존 PanelHeader 단독 사용은 Panel로 마이그레이션 | |
| 6 | 73개 패널 패턴 마이그레이션 | 기존 surface+header+scroll 조합 전부 교체 필요 | 중 | warning only로 점진 마이그레이션 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | Item 안에서 useAria/useAriaZone 사용 | ⑤ UI over Primitives | Item은 렌더링 전용, 인터랙션은 부모 UI 컴포넌트 소관 | |
| 2 | Item 안에서 style={{}} 사용 | ⑤ Style is Hatch | ax() + module.css last-mile만 | |
| 3 | Item 종류를 switch/if 분기하는 dispatcher 작성 | ⑤ Declarative OCP | 각 Item이 자기 책임, 중앙 분기 금지 | |
| 4 | pages에서 renderItem prop 직접 전달 | ④ 경계 S5 | 필요하면 ui/items/에 Item을 추가. pages는 UI 컴포넌트의 기본 렌더링을 사용 | |
| 5 | showcase/ 디렉토리에 hook 경고 적용 | ④ 경계 | 데모는 API 사용법 시연 목적 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | TreeView를 defaultRenderItem으로 렌더링 | TreeItem 사용, caption 12px, controlSize sm | |
| V2 | ①S2 | ListBox에서 ListItem + icon으로 렌더링 | icon + label이 caption 12px로 표시 | |
| V3 | ①S1 | TabList를 defaultRenderItem으로 렌더링 | TabItem 사용, caption 12px | |
| V4 | ①S3 | pages에서 renderItem을 ax()로 날코딩 | hook이 ui/items/ 부품 목록과 함께 경고 | |
| V5 | ①S5 | pages에서 renderItem prop 직접 전달 | hook 경고: "renderItem 직접 사용 금지" | |
| V9 | ④ | showcase에서 renderItem 커스텀 | hook 경고 없음 | |
| V6 | ④ | TreeItem depth 10 | indent + 가로 스크롤, 레이아웃 깨지지 않음 | |
| V7 | ④ | node에 label 없음 | node.id가 fallback으로 표시 | |
| V8 | ⑥#1 | TreeView.defaultRenderItem | 내부에서 TreeItem 사용 | |
| V10 | ①S1 | PageWriter의 Files/Chat 패널 | Panel 컴포넌트로 렌더링, surface sunken + overline 헤더 | |
| V11 | ④ | Panel에 header 없이 사용 | PanelHeader 미렌더, scroll body만 | |
| V12 | ④ | SplitPane 안에 Panel 3개 중첩 | 각 Panel 독립 렌더링, 충돌 없음 | |
| V13 | ② | Grid에서 TextCell로 셀 렌더링 | caption 12px, clamp 적용 | |
| V14 | ② | BadgeCell에 tone 전달 | tone 배경 + caption label | |
| V15 | ④ | pages에서 surface+header+scroll 날코딩 | hook이 "Panel을 사용하세요" 안내 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
