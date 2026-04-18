---
id: 2-areas/ui/prds/virtual-scroll-plugin-prd
type: prd
slug: virtualScrollPlugin
title: 'virtualScroll Plugin — PRD'
tags: [itemcount]
created: 2026-04-04
updated: 2026-04-17
summary: 'Discussion: useVirtualScroll을 os definePlugin으로 승격. autoscroll 패턴 — useEffect + 훅 이중 구조.'
legacy:
  status: active
  kind: prd
  topics: [2-areas, itemcount]
  relates: []
  supersedes: []
---
# virtualScroll Plugin — PRD

> Discussion: useVirtualScroll을 os definePlugin으로 승격. autoscroll 패턴 — useEffect + 훅 이중 구조.

## ① 동기

### WHY

- **Impact**: 대량 노드를 가진 os 컴포넌트(코드 뷰어, 긴 리스트 등)가 DOM 가상화를 쓰려면 useVirtualScroll을 직접 호출하고 ref/height를 수동 배선해야 한다. 모든 소비자가 같은 보일러플레이트를 반복한다.
- **Forces**: os 철학은 "플러그인으로 꽂으면 동작". autoscroll이 이미 이 패턴을 확립했다. 하지만 virtualScroll은 반환값(visibleRange 등)이 필요해서 fire-and-forget이 아님.
- **Decision**: A 수준 — useEffect로 DOM 가상화만, engine 수준 visibilityFilter는 안 함. 반환값은 별도 훅으로 노출 (autoscroll 이중 구조).
- **Non-Goals**: engine 수준 노드 필터링, store에 스크롤 상태 저장, Page Up/Down keyMap.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | os 컴포넌트가 1000+ 노드를 렌더 | virtualScroll() 플러그인을 engine에 등록 | 보이는 노드만 DOM에 마운트, 스크롤 시 가상화 동작 | ✅ 일치 |
| S2 | VirtualCodeBlock이 현재 useVirtualScroll을 직접 사용 | 플러그인으로 교체 | 동일 동작, 배선 코드 감소 | ✅ 일치 |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/plugins/virtualScroll.ts` | definePlugin 래퍼. useEffect에서 containerRef 기반 스크롤 이벤트 배선 | ✅ `virtualScroll.ts` |
| `src/interactive-os/plugins/virtualScroll.ts::virtualScroll` | 팩토리 함수. `virtualScroll({ estimatedItemHeight, overscan? })` | ✅ `virtualScroll.ts::virtualScroll` |
| `src/interactive-os/plugins/virtualScroll.ts::useVirtualScrollState` | 컴포넌트용 훅. visibleRange, totalHeight, offsetTop, measureItem, scrollToIndex 반환 | ✅ `virtualScroll.ts::useVirtualScrollState` |
| `src/interactive-os/ui/VirtualCodeViewer.tsx` 수정 | useVirtualScroll 직접 호출 → useVirtualScrollState 훅으로 교체 | ✅ import 교체 완료 |

⚠️ PRD에 없는 추가 산출물:
- `plugins/useVirtualScroll.ts` — 훅 본체 이동 (ui/ → plugins/)
- `ui/useVirtualScroll.ts` — re-export shim (하위호환)

완성도: 🟢

## ③ 인터페이스

> 비-UI 플러그인이므로 키보드 인터페이스 N/A. API 인터페이스만.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `virtualScroll({ estimatedItemHeight: 20 })` | engine에 플러그인 미등록 | definePlugin 반환, engine에 등록 | autoscroll과 동일한 플러그인 등록 패턴 | useEffect가 containerRef 스크롤 이벤트를 감시 | ✅ 일치 |
| 스크롤 이벤트 발생 | containerRef에 스크롤 리스너 등록됨 | rAF로 visibleRange 재계산 | 기존 useVirtualScroll의 recalc 로직 그대로 | visibleRange/offsetTop 갱신 → 구독 컴포넌트 리렌더 | ✅ 일치 |
| `useVirtualScrollState()` 호출 | 플러그인이 등록됨 | 현재 visibleRange, totalHeight, offsetTop 반환 | 플러그인 내부 상태를 외부 훅으로 노출 (autoscroll의 useAutoscroll 패턴) | 컴포넌트가 보이는 범위만 렌더 | ✅ 일치 |
| `measureItem(index, height)` | heightCache에 해당 index 없음 | 높이 캐시 갱신 + recalc | 가변 높이 항목 지원 — DOM 측정 후 정확한 높이 반영 | totalHeight/visibleRange 재계산 | ✅ 일치 |
| `scrollToIndex(index, 'start')` | 임의 스크롤 위치 | 해당 index의 offsetTop으로 스크롤 | 프로그래매틱 스크롤 — 검색 결과 이동 등 | 해당 줄이 뷰포트 상단에 위치 | ✅ 일치 |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| itemCount = 0 | 빈 리스트 | 빈 리스트에서 가상화할 것이 없다 | visibleRange = {0,0}, totalHeight = 0 | 빈 컨테이너 | ✅ 코드 확인 |
| containerRef.current = null | 마운트 전 또는 언마운트 후 | DOM 없으면 스크롤 이벤트도 없다 | recalc no-op, 리스너 미등록 | 초기 상태 유지 | ✅ 코드 확인 |
| itemCount 동적 변경 (append) | 기존 N개 렌더 중 | 스트리밍 등에서 항목이 추가된다 | recalc 트리거 → visibleRange/totalHeight 갱신 | 새 항목이 스크롤 범위에 반영 | ✅ useEffect([itemCount]) |
| 플러그인 미등록 상태에서 useVirtualScrollState 호출 | 독립 사용 | 플러그인 없이도 훅 단독 사용 가능해야 한다 (하위호환) | 기존 useVirtualScroll과 동일 동작 | 독립 동작 | ✅ thin wrapper |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 선언=등록, 합성 런타임 불변 (feedback_declarative_ocp) | ② virtualScroll() 팩토리 | 준수 | — | ✅ |
| 2 | UI 컴포넌트만 노출, primitives 직접 사용 금지 (feedback_ui_over_primitives) | ② useVirtualScrollState | 준수 | — | ✅ |
| 3 | style={} 금지, ax()만 (feedback_style_is_hatch) | ② VirtualCodeBlock 수정 | 준수 | — | ✅ |
| 4 | 최소 구현 수렴은 좋은 특성 (feedback_minimum_impl_is_good) | ③ A 수준 | 준수 | — | ✅ |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | VirtualCodeViewer.tsx | useVirtualScroll → useVirtualScrollState 교체 | 낮 | 동일 인터페이스 유지 | ✅ |
| 2 | useVirtualScroll.ts (ui/) | 본체 이동 + re-export shim | 낮 | 허용 | ✅ |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | visibilityFilter로 engine 수준 노드 필터링 | ① Non-Goals | A 수준 초과. 복잡도 급증 | ✅ 준수 |
| 2 | store에 스크롤 상태(visibleRange 등) 저장 | ① Non-Goals | 스크롤은 view state, NormalizedData가 아님 | ✅ 준수 |
| 3 | useVirtualScroll 훅 삭제 | ⑥ 부작용 | 플러그인 내부에서 사용. 이중 구조 유지 | ✅ 준수 |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①S1 | virtualScroll() 플러그인 등록 후 1000+ 항목 스크롤 | 보이는 항목만 DOM에 존재, 스크롤 부드러움 | ❌ 테스트 없음 |
| V2 | ①S2 | VirtualCodeBlock이 useVirtualScrollState로 교체 후 동작 | 기존과 동일한 가상 스크롤 동작 | ✅ typecheck + 전체 테스트 통과로 검증 |
| V3 | ④경계1 | itemCount=0일 때 | visibleRange={0,0}, 빈 렌더 | ❌ 테스트 없음 |
| V4 | ④경계4 | 플러그인 없이 useVirtualScrollState 단독 호출 | 기존 useVirtualScroll과 동일 동작 | ✅ VirtualCodeBlock이 이 방식으로 동작 |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

#kind/prd #topic/ui
