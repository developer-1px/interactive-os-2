---
id: 2-areas/layout/prds/flatlayout-slot-policy-prd
title: 'FlatLayout Slot Policy — PRD'
status: active
kind: prd
created: 2026-04-13
updated: 2026-04-13
summary: 'Discussion: FlatLayout 위젯 컨테이너를 Swing식 "슬롯이 정책 소유" 2층 구조로 전환하여, 스크롤/flex를 엔진이 자동 보장. LLM 결정 지점 0.'
topics: [2-areas]
relates: []
supersedes: []
---
# FlatLayout Slot Policy — PRD

> Discussion: FlatLayout 위젯 컨테이너를 Swing식 "슬롯이 정책 소유" 2층 구조로 전환하여, 스크롤/flex를 엔진이 자동 보장. LLM 결정 지점 0.

## ① 동기

### WHY

- **Impact**: LLM이 위젯을 생성할 때마다 `flex: 1`, `min-height: 0`, `overflow-y: auto`를 누락한다. 스크롤이 안 되거나 공간을 못 채우는 레이아웃 깨짐이 반복. 수동 수정이 필요하면 바이브코딩 엔진으로서의 가치가 없다.
- **Forces**: CSS flex의 기본 동작(자식이 콘텐츠 크기) vs FlatLayout이 원하는 동작(자식이 남은 공간 채우고 넘치면 스크롤). 현재는 위젯이 이 차이를 매번 메워야 한다.
- **Assets**: `ax({ layout: 'scroll' })` = `ly-scroll` 클래스가 이미 존재 (flex column + overflow-y:auto + min-height:0). `parentType` 분기도 이미 있음. react-resizable-panels의 2층 패턴이 검증된 레퍼런스.
- **Decision**: Java Swing의 "슬롯이 정책 소유" 패턴 채택. 위젯은 콘텐츠만 렌더하고, fill/scroll은 parentType에서 자동 파생. 기각 대안: (A) 위젯마다 scroll prop 명시 — LLM 결정 지점 증가, (B) 현상 유지 + CLAUDE.md 규칙 강화 — 금지 목록으로는 LLM 사전학습을 이길 수 없음 (`project_do_skill` 교훈).
- **Non-Goals**: widget 내부 레이아웃 변경 아님. SplitPane 리사이즈 로직 변경 아님. nav renderer 구조 변경 아님 (이미 overflow-y:auto 있음).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | split(horizontal, [0.25, 'flex'])에 sidebar, main 위젯 | sidebar 콘텐츠가 패널 높이보다 김 | sidebar 자동 스크롤, main은 남은 공간 채움 | |
| S2 | stack에 toolbar, editor 위젯 | editor 콘텐츠가 길어짐 | editor가 남은 공간 채우고 자동 스크롤 | |
| S3 | split 안에 지도/캔버스 위젯 | 위젯이 자체 뷰포트 소유 | scroll: false opt-out으로 스크롤 비활성 | |
| S4 | floating에 팝업 위젯 | 콘텐츠가 짧음 | 콘텐츠 크기에 맞춤, fill/scroll 없음 | |
| S5 | tab에 여러 위젯 | 탭 전환 후 콘텐츠가 김 | 활성 탭 위젯이 fill + 자동 스크롤 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `FlatLayout.tsx` widget renderer 수정 | outer div + inner div 2층 구조. inner div가 `ly-scroll` + `fx-1` 기본 적용 | |
| `FlatLayout.module.css` splitChild 셀렉터 수정 | `.splitChild > *` → inner div를 정확히 타겟하도록 조정 | |
| `WidgetNode.scroll` 속성 추가 | `flatLayout.ts` 타입에 `scroll?: boolean` (기본 true, opt-out용) | |
| `slotPolicy` 매핑 | parentType별 기본 정책 (fill/scroll 조합) | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| widget이 split 자식 | outer div만 존재, `scroll: 'hidden'` | 엔진이 inner div 자동 주입 | split 슬롯 = fill+scroll 정책. Swing BorderLayout CENTER처럼 슬롯이 결정 | outer: `ly-column sc-hidden min-h-0` + inner: `fx-1 ly-scroll` | |
| widget이 stack 자식 | outer div만 존재, flex:1 없음 | 엔진이 inner div 자동 주입 | stack 슬롯도 fill+scroll 기본. 대부분의 위젯은 남은 공간을 채워야 함 | outer: `ly-column min-h-0 fx-1` + inner: `ly-scroll` | |
| widget이 floating 자식 | outer div만 존재 | inner div 주입하되 scroll/fill 없음 | floating = 자연 크기 정책. popup/tooltip은 콘텐츠 크기에 맞춰야 함 | outer: `ly-column` + inner: 없음 (단층 유지) | |
| widget에 `scroll: false` | 기본 scroll 정책 적용 중 | inner div의 overflow를 hidden으로 | 지도/캔버스 등 자체 뷰포트 소유 위젯은 스크롤 불필요 | inner: `fx-1 sc-hidden` (ly-scroll 대신) | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 콘텐츠 높이 0 (빈 위젯) | inner div가 flex:1 | flex:1이 남은 공간 할당, 빈 영역 표시 | 빈 패널이지만 공간은 차지 | 정상 | |
| 위젯 내부에서 자체 overflow-y:auto 설정 | inner div에 ly-scroll 있음 | 이중 스크롤바 방지 필요 — inner의 scroll이 기본이고, 위젯 내부에서 자체 scroll하면 inner가 넘치지 않으므로 inner 스크롤바 미출현 | 위젯 자체 스크롤이 우선, inner 스크롤바 안 나타남 | 정상 (overflow:auto는 넘칠 때만 스크롤바) | |
| split 안에 split 중첩 | 각 split level마다 widget이 2층 | 각 widget마다 독립적으로 정책 적용 | 중첩 split의 각 leaf widget이 모두 fill+scroll | 정상 | |
| nav renderer | 이미 navSidebar/navContent에 overflow-y:auto | nav는 자체 스크롤 구조가 있으므로 widget 2층 적용 불필요 | nav 자식 widget은 nav renderer가 직접 처리, widget renderer 우회 | nav는 현행 유지 | |
| stack에서 하나만 auto 나머지 fill | 현재 구분 불가 | stack 자식 전부 fill이 기본. auto가 필요하면 bar 또는 section 사용 | stack = 모든 자식 fill+scroll | LAYOUT.md 명시 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | LLM 결정 지점 최소화 (`feedback_llm_surface_three_layer`) | 전체 설계 | ✅ 준수 — LLM이 scroll/flex 결정 불필요 | — | |
| 2 | 자동 파생이 시스템 (`feedback_auto_derivation_is_system`) | slotPolicy 매핑 | ✅ 준수 — parentType에서 자동 파생 | — | |
| 3 | Pull 모델 (`feedback_flatlayout_pull_not_push`) | scroll prop | 🟡 주의 — `scroll: false`는 definePage에서 선언, Push처럼 보일 수 있음 | scroll은 **레이아웃 속성**(LayoutBase)이지 런타임 값이 아님. surface/hidden과 동급. 위반 아님 | |
| 4 | ax()만 사용, style={} 금지 (`CLAUDE.md`) | inner div 스타일 | ✅ 준수 — `ax({ layout: 'scroll', flex: '1' })` 사용 | — | |
| 5 | surface 소유 속성 last-mile 금지 (`feedback_surface_no_lastmile`) | inner div | ✅ 준수 — inner div는 구조(flex/scroll)만, surface 속성 없음 | — | |
| 6 | CSS @layer 잠금 (`feedback_css_layer_lock`) | splitChild 셀렉터 수정 | ✅ 준수 — FlatLayout.module.css는 @layer component 안에 있음 | — | |
| 7 | 하네스는 수렴 (`feedback_harness_convergence`) | 기본값 전환 | ✅ 부합 — "스크롤 넣어라" 금지가 아니라 "엔진이 자동으로 넣어줌" | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `.splitChild > *` CSS 셀렉터 (FlatLayout.module.css:14) | inner div가 끼면서 Component 대신 inner div에 flex:1 적용 | **높음** — 현재 동작이 깨질 수 있음 | inner div가 splitChild의 직접 자식이므로 셀렉터가 inner div를 타겟 → **오히려 의도대로**. inner div에 flex:1이 걸리고, Component는 inner div의 scroll 콘텐츠가 됨. 셀렉터 수정 불필요할 수 있음 — 검증 필요 | |
| 2 | 기존 위젯의 height:100% 의존 | 일부 위젯이 부모 div의 높이에 직접 의존하는 경우 inner div 삽입으로 참조가 바뀜 | **중간** | inner div에 `height: 100%`도 부여하면 해소. `ly-scroll`이 `min-height:0`을 포함하므로 flex 계산은 정상 | |
| 3 | workspace.integration.test.tsx DOM 구조 | DOM depth가 1 증가하여 테스트의 querySelector가 깨질 수 있음 | **낮음** | 테스트가 data-testid 기반이면 영향 없음. 확인 후 수정 | |
| 4 | 이중 스크롤바 | 위젯 내부에서 자체 scroll 사용 시 외부 inner div와 이중 스크롤 | **낮음** | overflow:auto는 넘칠 때만 스크롤바 표시. 위젯이 자체 scroll하면 inner는 넘치지 않으므로 미출현 | |
| 5 | nav renderer의 기존 스크롤 | nav는 navSidebar/navContent에 이미 overflow-y:auto | **낮음** | nav 자식 widget은 widget renderer를 거치지만, parentType='nav'일 때 inner scroll 생략 가능. 또는 이중 적용해도 무해 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | inner div에 module.css last-mile 추가 | ⑤ #5 surface 소유 속성 | inner div는 ax()로만 스타일링. module.css로 border/shadow/bg 추가 금지 | |
| 2 | slotPolicy를 widget props로 override | ⑤ #3 Pull 모델 | `widget('foo', { flex: false, scroll: true })` 같은 세밀한 제어는 LLM 결정 지점 증가. scroll opt-out만 허용 | |
| 3 | floating 위젯에 fill+scroll 적용 | ④ floating 경계 | floating은 자연 크기 정책. fill하면 팝업이 전체 화면 차지 | |
| 4 | nav renderer 내부에서 2층 중복 적용 | ⑥ #5 nav 기존 스크롤 | nav는 navSidebar/navContent가 이미 스크롤 소유. widget renderer의 inner div는 nav 자식일 때 scroll 생략 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | split sidebar에 100개 아이템 ListBox | sidebar 영역 내 스크롤바 출현, main은 정상 fill | |
| V2 | S2 | stack [toolbar, editor], editor에 긴 텍스트 | toolbar는 자연 높이, editor가 나머지 채우고 스크롤 | |
| V3 | S3 | split에 `scroll: false` 위젯 (canvas) | canvas 영역에 스크롤바 없음, canvas가 영역 전체 채움 | |
| V4 | S4 | floating에 짧은 콘텐츠 위젯 | 콘텐츠 크기에 맞춤, fill/scroll 없음 | |
| V5 | S5 | tab 3개, 각각 긴 콘텐츠 | 활성 탭만 fill+scroll, 비활성 탭은 렌더 안 됨 | |
| V6 | ④ 이중 스크롤 | 위젯 내부에 자체 overflow-y:auto가 있는 ListBox | 스크롤바 1개만 출현 (inner div 스크롤바 미출현) | |
| V7 | ④ nav | PageCatalog의 nav 레이아웃 | 기존과 동일하게 동작 (sidebar 스크롤, content 스크롤) | |
| V8 | ⑥ #1 | PageCms 3-pane split | 3개 패널 모두 fill+scroll 정상, 기존 동작과 시각적 차이 없음 | |
| V9 | ⑥ #3 | workspace.integration.test 실행 | 테스트 통과 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## 구현 가이드 (요약)

### 변경 지점

```typescript
// FlatLayout.tsx widget renderer — 변경 전 (line 295-298)
<div ref={refCallback(nodeId)} className={`${ax({ layout: 'column', width: 'full', scroll: 'hidden', surface, ... })} ${isSplitChild ? styles.splitChild : ''} min-h-0`}>
  <Component {...(node.props ?? {})} source={node.source}>{children}</Component>
</div>

// 변경 후
const isFloating = parentType === 'floating'
const scrollable = node.scroll !== false && !isFloating

<div ref={refCallback(nodeId)} className={`${ax({ layout: 'column', width: 'full', scroll: 'hidden', surface, flex: '1', ... })} ${isSplitChild ? styles.splitChild : ''} min-h-0`}>
  {scrollable
    ? <div className={ax({ layout: 'scroll', flex: '1' })}>
        <Component {...(node.props ?? {})} source={node.source}>{children}</Component>
      </div>
    : <Component {...(node.props ?? {})} source={node.source}>{children}</Component>
  }
</div>
```

### slotPolicy (개념 — 코드 분리는 선택)

```typescript
// 공간 분할 슬롯(split/nav/tab)만 fill+scroll. 문서 흐름(stack/floating)은 자연 높이.
// split/nav/tab → 2층 (fill + scroll)
// stack → 단층 (자연 높이, 문서 흐름)
// floating → 단층 (자연 크기)
// scroll: false → fill은 유지하되 overflow: hidden
```

### WidgetNode 타입 확장

```typescript
export interface WidgetNode extends LayoutBase {
  type: 'widget'
  widget: string
  props?: Record<string, unknown>
  source?: string
  scroll?: boolean  // 기본 true, false면 스크롤 비활성
}
```
