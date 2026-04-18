---
id: 2-areas/engine/prds/scroll-plugin-prd
type: prd
slug: scrollPlugin
title: 'Scroll Plugin — PRD'
tags: [untagged]
created: 2026-04-09
updated: 2026-04-09
summary: 'Discussion: MD viewer에서 Space/Shift+Space로 반페이지 스크롤. scroll axis 대신 plugin으로 구현 (축 상한 P7 준수, DOM side-effect 전용)'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# Scroll Plugin — PRD

> Discussion: MD viewer에서 Space/Shift+Space로 반페이지 스크롤. scroll axis 대신 plugin으로 구현 (축 상한 P7 준수, DOM side-effect 전용)

## WHY (discuss FRT)

- **Impact**: /docs에서 MD 문서를 키보드만으로 읽을 수 없음. 마우스 스크롤에 의존.
- **Forces**: Command handler는 순수 함수(store→store)로 DOM side-effect 불가. Plugin.useEffect는 키 입력과 무관하게 render 시 실행. → **Plugin.keyMap**이 유일한 해법.
- **Decision**: axis가 아닌 plugin으로 구현. 이유: ① 축 상한 규칙(P7) 준수 ② store entity 불필요 ③ Plugin에 이미 keyMap 슬롯 존재. 기각 대안: scroll axis (축 상한 위반), navigate axis 확장 (discrete vs continuous 본질 차이).
- **Non-Goals**: 스크롤 위치 store 동기화, undo/redo, 가상 스크롤, 스무스 애니메이션

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | /docs에서 MD 파일 선택됨, preview 영역 표시 중 | preview 영역 클릭 | preview에 포커스 이동 | |
| M2 | preview 영역에 포커스 있음, 콘텐츠가 뷰포트보다 김 | Space 누름 | 반페이지(clientHeight/2) 아래로 스크롤 | |
| M3 | preview 영역에 포커스 있음, 콘텐츠가 뷰포트보다 김 | Shift+Space 누름 | 반페이지 위로 스크롤 | |
| M4 | preview 영역에 포커스 있음 | Tab 누름 | MillerColumns로 포커스 복귀 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/plugins/scroll.ts` | scroll plugin — keyMap(Space/Shift+Space) + containerRef 기반 DOM scrollBy | |
| `src/interactive-os/ui/MillerColumns.tsx` 수정 | preview 영역에 tabIndex={0}, role="region", ref 전달 | |
| `src/interactive-os/ui/millerPreset.ts` 수정 | scroll plugin 추가 (?) | |

완성도: 🟡 — millerPreset에서 plugin을 추가하는 방식 vs MillerColumns에서 직접 적용하는 방식 결정 필요. Plugin.keyMap은 useAria에서 병합되므로 MillerColumns가 useAria에 plugins prop으로 전달하는 구조가 맞음.

→ 수정: millerPreset은 pattern(composePattern) 반환이므로 plugin 포함 불가. **MillerColumns에서 plugins prop에 scroll plugin 추가**.

하지만 scroll plugin의 대상은 MillerColumns 전체 container가 아니라 **preview 영역**임. EffectContext.containerRef는 전체 컨테이너를 가리킴.

→ 핵심 설계 결정: **preview 영역을 별도 useAria zone으로 분리**하거나, **plugin이 특정 ref를 받는 구조** 필요.

가장 단순한 해법: preview 영역에 독립적인 onKeyDown 핸들러를 붙이되, os plugin 구조를 활용. preview를 **별도 Aria zone**(useAriaZone)으로 만들지 않고, **ScrollArea에 keyboard scroll 기능을 내장**하는 것이 재사용성 높음.

**최종 산출물:**

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/ui/ReadingPane.tsx` | 포커스 가능한 스크롤 영역. Space/Shift+Space로 반페이지 스크롤. keyMap 선언적 처리. | |
| `src/interactive-os/ui/MillerColumns.tsx` 수정 | preview 영역을 ReadingPane으로 교체 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 클릭 (preview 영역) | MillerColumns 포커스 | preview에 focus 이동 | tabIndex={0}으로 포커스 가능, 클릭 시 브라우저 기본 동작 | preview 포커스 | |
| Space | preview 포커스, scrollTop < scrollHeight - clientHeight | scrollBy(0, clientHeight/2) | 반페이지 = 읽기에 적합한 이동량. 브라우저 기본 Space 스크롤을 preventDefault로 가로채고 정확히 반페이지 이동 | scrollTop += clientHeight/2 | |
| Shift+Space | preview 포커스, scrollTop > 0 | scrollBy(0, -clientHeight/2) | Space의 역방향. 되돌리기 가능해야 함 (reversible_motion) | scrollTop -= clientHeight/2 | |
| Space | preview 포커스, 이미 최하단 | 아무 동작 안 함 | scrollBy의 자연스러운 경계 처리 (브라우저가 clamp) | 변화 없음 | |
| Shift+Space | preview 포커스, 이미 최상단 | 아무 동작 안 함 | 동일 | 변화 없음 | |
| Tab | preview 포커스 | MillerColumns로 포커스 이동 | 브라우저 기본 Tab 동작 | MillerColumns 포커스 | |
| Keyboard (그 외 키) | preview 포커스 | 무시 (브라우저 기본) | ReadingPane은 Space/Shift+Space만 가로챔 | 변화 없음 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 콘텐츠가 뷰포트보다 짧음 | preview 포커스 | 스크롤 불필요 상태에서 Space가 페이지 스크롤을 일으키면 안 됨 | Space → preventDefault만, 스크롤 없음 | 변화 없음 | |
| preview 없이 폴더 선택 | MillerColumns 포커스 | 파일이 아닌 폴더 선택 시 preview 미표시 | ReadingPane 미렌더링, Space 무관 | MillerColumns만 | |
| 빠른 연타 (Space 연속) | preview 포커스 | 매 입력마다 반페이지씩 이동해야 자연스러움 | scrollBy 누적 실행 | scrollTop 누적 증가 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | addEventListener 금지 (CLAUDE.md) | ReadingPane 키 처리 | ⚠️ 조건부 | ReadingPane은 ui/ 컴포넌트이므로 onKeyDown JSX prop 사용 — addEventListener 아님. 단, keyMap 선언적 방식이 이상적. **ReadingPane 내부에서 keyMap 객체를 선언하고 matchKeyEvent로 디스패치** | |
| 2 | UI만 노출, primitives 금지 (feedback) | ② 산출물 | ✅ 준수 | ReadingPane은 ui/ 레이어 컴포넌트 | |
| 3 | 축 상한 P7 (axis-v3 PRD) | 설계 결정 | ✅ 준수 | plugin/ui로 구현, 새 axis 추가 안 함 | |
| 4 | store 무관 side-effect는 useRef (plugin-effect PRD) | DOM 스크롤 | ✅ 준수 | scrollBy는 DOM-local, store 변경 없음 | |
| 5 | os 기반 개발 — panels/ 사용 (CLAUDE.md) | preview 컨테이너 | ⚠️ 확인 필요 | ReadingPane이 panels/에 속하는지 ui/ 직접인지 — 독립 스크롤 영역이므로 ui/ 직접이 적합 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | MillerColumns preview 영역 | tabIndex 추가로 Tab 순서 변경 | 낮음 | Tab으로 preview→columns 전환은 자연스러움 | |
| 2 | Space 키 기본 동작 (페이지 스크롤) | preventDefault로 브라우저 기본 Space 스크롤 차단 | 낮음 | preview 포커스 시에만 차단, columns 포커스 시 무관 | |
| 3 | MillerColumns 외 다른 페이지 | 없음 | — | ReadingPane은 독립 컴포넌트, 사용처만 영향 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | addEventListener('keydown') 직접 사용 | ⑤-1 CLAUDE.md | onKeyDown prop 또는 keyMap+matchKeyEvent 사용 | |
| 2 | 스크롤 위치를 store에 저장 | WHY Non-Goals | DOM-local 상태, undo 대상 아님 | |
| 3 | scroll axis 신설 | ⑤-3 축 상한 | plugin 또는 ui 컴포넌트로 해결 | |
| 4 | preview에서 useAria/useAriaZone 사용 | ⑤-2 | 읽기 전용 영역에 engine 불필요. 단순 키보드 스크롤만 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | M1 | /docs에서 파일 선택 후 preview 영역 클릭 | preview에 포커스 표시 (focus-visible outline) | |
| V2 | M2 | preview 포커스 상태에서 Space | 콘텐츠가 반페이지 아래로 스크롤 | |
| V3 | M3 | preview 포커스 상태에서 Shift+Space | 콘텐츠가 반페이지 위로 스크롤 | |
| V4 | M4 | preview 포커스 상태에서 Tab | MillerColumns로 포커스 복귀 | |
| V5 | ④-1 | 짧은 콘텐츠에서 Space | 스크롤 변화 없음, 페이지 스크롤도 없음 | |
| V6 | ④-3 | Space 5회 연타 | scrollTop이 clientHeight/2 × 5만큼 증가 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

## 교차 검증

1. **동기 ↔ 검증**: M1→V1, M2→V2, M3→V3, M4→V4 ✅
2. **인터페이스 ↔ 산출물**: ReadingPane이 모든 인터페이스 계약 수행 ✅
3. **경계 ↔ 검증**: ④-1→V5, ④-3→V6 ✅
4. **금지 ↔ 출처**: 4개 금지 모두 ⑤/WHY에서 파생 ✅
5. **원칙 대조 ↔ 전체**: 위반 없음 ✅
