---
id: 2-areas/axis/prds/spatial-navigate-prd
type: prd
slug: spatialNavigate
title: 'Spatial Navigate — PRD'
tags: [untagged]
created: 2026-03-30
updated: 2026-04-08
summary: 'Discussion: 2D 공간 탐색(TV 리모컨 방향키)을 os 기본기로 승격. navigate 축에 spatial 전략 추가, DOM rect 기반 방향키 이동 + cross-boundary + sticky cursor를 os가 자동 처리.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Spatial Navigate — PRD

> Discussion: 2D 공간 탐색(TV 리모컨 방향키)을 os 기본기로 승격. navigate 축에 spatial 전략 추가, DOM rect 기반 방향키 이동 + cross-boundary + sticky cursor를 os가 자동 처리.

## ① 동기

### WHY (discuss FRT에서 이식)

- **Impact**: bento grid, kanban, dashboard 같은 2D 레이아웃에서 방향키로 가장 가까운 요소에 포커스 이동이 필요. 현재 소비자가 useSpatialNav hook 직접 호출 + keyMap 수동 조립해야 함 → 진입장벽, 코드 중복
- **Forces**: DOM rect 기반 이동은 store 레이어가 모르는 DOM 의존 ↔ 축은 store 레이어. 해소: 축은 선언만, primitives가 자동 bridge
- **Decision**: navigate 축에 `'spatial'` 전략 추가. 기각: 별도 `spatial()` 축 신설 → 개념 수 증가. rect provider 콜백 → 실제 필요 없음
- **Non-Goals**: Enter/Escape 깊이 탐색(`__spatial_parent__`), CMS 특화 키맵 — 커스텀 영역에 남김

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | bento grid에서 `navigate('spatial', { selector })` 선언 | 방향키 누름 | DOM rect 기반 최근접 요소로 포커스 이동 | |
| S2 | 2D 그리드에 여러 그룹(섹션)이 있음 | 현재 그룹 마지막에서 ArrowDown | 인접 그룹의 가장 가까운 요소로 cross-boundary 이동 | |
| S3 | cross-boundary로 그룹B 진입 상태 | ArrowUp으로 그룹A 복귀 | sticky cursor가 이전 위치 복원 (가역적 동선) | |
| S4 | CMS가 spatial + 깊이 탐색 필요 | navigate('spatial') + 커스텀 Enter/Escape override | os가 방향키 처리, CMS가 깊이만 추가 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `navigate.ts` 수정 | `navigate('spatial', { selector })` 시그니처. selector는 `string \| () => string`. `nav.up/down/left/right` 방향별 핸들러 capability 제공. meta에 `focusStrategy: { type: 'spatial', selector }` | |
| `useAriaView.ts` 수정 | spatial 감지 시 내부 spatial hook 호출하여 DOM bridge 제공. keyMap 자동 주입 없음 — 패턴이 명시적 바인딩 | |
| `useSpatialNav.ts` 리팩토링 | 순수 공간 탐색만 유지: findBestInDirection + preferred coordinate. cross-boundary/sticky cursor/그룹 로직 제거. `plugins/` → `primitives/` 내부 모듈 | |
| `misc/spatial.ts` 수정 | `navigate('spatial', { selector })` 사용, useSpatialNav 수동 호출 제거 | |
| CMS 마이그레이션 | useSpatialNav 직접 호출 제거. cross-boundary/sticky cursor/drill은 CMS 커스텀 keyMap으로 유지 | |

> hooks 규칙: useSpatialNav는 useAriaView 내에서 항상 호출, spatial 아니면 no-op 반환

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Arrow(4방향) | 노드A 포커스 | `selector()` 결과에서 해당 방향 최근접으로 이동 | DOM rect 중심점 방향 필터 + overlap 거리 점수 (W3C CSS Spatial Nav) | 최근접 노드 포커스 | |
| Arrow (연속) | 같은 축 이동 중 | preferred orthogonal coordinate 유지 | 기억 컬럼/행 — 지그재그 방지 | 수직이면 가로 보존, 수평이면 세로 보존 | |
| Arrow | 방향에 후보 없음 | no-op | selector 범위 내에 없으면 벽 | 변화 없음 | |
| Shift+Arrow | 노드A 포커스 | 동일하게 최근접 이동 | 포커스 이동은 spatial 책임, selection 확장은 select 축 middleware | 최근접 포커스 (+ select 축이 확장) | |
| Enter/Escape/Tab/Space/Home/End/Click | — | os spatial 처리 안 함 | 패턴/축/커스텀 영역 | — | |

> selector는 `string | () => string` — 동적이면 keypress마다 호출하여 현재 scope 후보 수집

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| selector() 매칭 0개 | 후보 없음 | 탐색 불가 | 모든 방향키 no-op | 변화 없음 | |
| 노드 1개 | 이동할 곳 없음 | 최근접 없음 | no-op | 변화 없음 | |
| 겹치는 rect (동일 중심점) | 방향 후보 동률 | 결정론적이어야 함 | primary gap → secondary gap → DOM 순서 | 순서대로 선택 | |
| selector() 런타임 변경 | drill-in/out으로 scope 전환 | keypress마다 수집 → 항상 최신 | 새 scope 기준 이동 | 새 후보 중 최근접 | |
| 창 리사이즈 | 레이아웃 변경 | rect는 keypress 시점 수집 | 새 레이아웃 반영 | 올바른 이동 | |
| 포커스 노드가 selector 밖 | scope 전환 후 | 포커스는 유지, 방향키부터 새 scope | 다음 keypress에서 새 후보 기준 이동 | 새 scope 최근접 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | 축 인스턴스가 SSOT (feedback_axis_instance_ssot) | ② navigate 확장 | ✅ 준수 — navigate('spatial') 인스턴스가 config+handler 소유 | — | |
| 2 | 축은 keyMap 소유 금지 (feedback_axis_no_keymap) | ③ Arrow 바인딩 | ✅ 준수 — 축은 capability(up/down/left/right) 제공, 패턴이 명시적 바인딩 | — | |
| 3 | store 레이어는 DOM 모름 (레이어 구조) | ② useSpatialNav | ✅ 준수 — 축은 선언만, DOM bridge는 primitives 내부 | — | |
| 4 | DOM이 진실의 원천 (discuss 확정) | ③ selector | ✅ 준수 — keypress마다 DOM 수집 | — | |
| 5 | 선언적 OCP (feedback_declarative_ocp) | ② useAriaView | ✅ 준수 — strategy 선언 → 자동 bridge | — | |
| 6 | 가역적 동선 (feedback_reversible_motion) | ③ preferred coordinate | ✅ 준수 — 연속 이동 시 좌표 보존 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | `useSpatialNav.ts` — cross-boundary/sticky cursor/그룹 로직 제거 | CMS가 이 로직에 의존 중 | 높 | CMS 커스텀 코드로 이전 (cross-boundary/sticky cursor를 CMS keyMap에서 구현) | |
| 2 | `misc/spatial.ts` — 패턴 시그니처 변경 | 기존 spatial 패턴 소비자 영향 | 중 | spatial 패턴이 navigate('spatial') 사용하도록 마이그레이션 | |
| 3 | 12개 spatial 테스트 — useSpatialNav 직접 사용 | 테스트 구조 변경 필요 | 중 | os 기본기 테스트와 CMS 커스텀 테스트로 분리 | |
| 4 | `navigate.ts` — 타입 확장 | 기존 NavigateType union에 'spatial' 추가 | 낮 | 하위 호환 — 기존 타입 영향 없음 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | useAriaView에서 Arrow keyMap 자동 주입 | ⑤#2 축 keyMap 금지 | 키 바인딩은 패턴의 선택 | |
| 2 | useSpatialNav를 외부 export | ⑤#3 store/DOM 경계 | 소비자가 직접 호출하면 레이어 위반 재발 | |
| 3 | os spatial에 그룹/cross-boundary 개념 | discuss 확정 | selector가 scope 정의, 벽은 소비자 선택 | |
| 4 | navigate('spatial')에서 store relationships 읽기 | ⑤#3 DOM 진실의 원천 | 그룹 구조는 DOM selector로 표현 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①S1 | bento grid에서 ArrowDown → 아래쪽 최근접 이동 | DOM rect 기반 포커스 이동 | |
| V2 | ①S1 | ArrowRight → 오른쪽 최근접 이동 | 4방향 동작 | |
| V3 | ③ preferred | ArrowDown 연속 3회 → 가로 좌표 유지 | 지그재그 없이 직선 이동 | |
| V4 | ④ 벽 | 방향에 후보 없을 때 Arrow → no-op | 포커스 변화 없음 | |
| V5 | ④ 0개 | selector 매칭 0개 상태에서 Arrow | no-op | |
| V6 | ④ 1개 | 노드 1개에서 모든 방향키 | no-op | |
| V7 | ④ 동적 selector | selector() 결과 변경 후 Arrow | 새 scope 기준 이동 | |
| V8 | ①S4 | spatial + 커스텀 Enter/Escape override | os 방향키 + 커스텀 깊이 동시 동작 | |
| V9 | ③ Shift+Arrow | Shift+ArrowDown → 최근접 이동 | 포커스 이동 (selection은 select 축) | |
| V10 | ④ 겹침 | 동일 중심점 노드 → Arrow | 결정론적 선택 (DOM 순서 fallback) | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

---

**전체 완성도:** 🟢 구현 완료

## 역PRD

| 항목 | 증거 |
|------|------|
| navigate('spatial') | `axis/navigate.ts:132` — spatial 전략 지원 |
| spatial bridge | `primitives/useSpatialBridge.ts` — DOM bridge 자동 연결 |
| spatialAlgorithm | `primitives/spatialAlgorithm.ts` — 순수 공간 탐색 알고리즘 |
| misc/spatial 마이그레이션 | `misc/spatial.ts` — navigate('spatial') 사용 |
| 테스트 | `__tests__/spatial-navigate.test.tsx` |
