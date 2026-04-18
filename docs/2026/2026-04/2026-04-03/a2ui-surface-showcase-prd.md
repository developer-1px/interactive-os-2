---
id: 2-areas/ui/prds/a2ui-surface-showcase-prd
type: prd
slug: a2uiSurfaceShowcase
title: 'A2UI Surface Showcase — PRD'
tags: [untagged]
created: 2026-04-03
updated: 2026-04-08
summary: 'Discussion: A2UI 프로토콜의 세부 스펙을 조사하여 우리 interactive-os UI 컴포넌트와 매핑 가능성을 분석. 읽기 전용 showcase로 첫 통로를 만든다.'
legacy:
  status: active
  kind: prd
  topics: [2-areas]
  relates: []
  supersedes: []
---
# A2UI Surface Showcase — PRD

> Discussion: A2UI 프로토콜의 세부 스펙을 조사하여 우리 interactive-os UI 컴포넌트와 매핑 가능성을 분석. 읽기 전용 showcase로 첫 통로를 만든다.

## ① 동기

### WHY

- **Impact**: AI 에이전트가 A2UI JSON으로 UI를 생성해도, 기존 렌더러들은 접근성(ARIA 키보드/스크린리더)을 피상적으로만 지원한다. 우리 axis 시스템이 이 빈칸을 메울 수 있다.
- **Forces**: A2UI는 "뭘 보여줄까"만 정의하고 "어떻게 탐색할까"를 비워둠 ↔ 우리 axis는 탐색이 핵심. A2UI v0.9 draft라 스펙 불안정.
- **Decision**: 우리 UI 컴포넌트로 A2UI를 렌더링하는 어댑터. 기각: @a2ui-sdk/react(자체 컴포넌트, axis 활용 불가), A2UI 방출 쪽(백엔드 의존).
- **Non-Goals**: action(양방향), 채팅 통합 구현, 커스텀 카탈로그 등록. 이번은 읽기 전용 showcase까지.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | /ui/a2ui-surface 페이지 진입 | A2UI JSON 샘플이 로드됨 | Text, Button, Card, Row, Column 등이 우리 UI 컴포넌트로 렌더링된다 | ✅ basicLayout 샘플에서 검증 |
| M2 | A2UI JSON에 List + items | 렌더링됨 | ListBox가 ↑↓ 키보드 내비게이션을 지원한다 (axis 자동 부여) | ✅ interactiveList 샘플 |
| M3 | A2UI JSON에 Tabs | 렌더링됨 | TabList이 ←→ 키보드 내비게이션을 지원한다 | ✅ tabsSample |
| M4 | A2UI JSON에 미지원 컴포넌트 | 렌더링 시도 | 타입명 + raw JSON fallback 표시 (crash 없음) | ✅ fallbackSample (RizzChart3D) |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/ui/A2UISurface.tsx` | A2UI JSON → 우리 UI 컴포넌트 렌더링. flat list 파싱 + componentMap resolve + 재귀 렌더 | ✅ `A2UISurface.tsx::A2UISurface` |
| `src/interactive-os/ui/a2uiComponentMap.ts` | A2UI component type → 우리 UI 컴포넌트 매핑 레지스트리 | ✅ `a2uiComponentMap.ts::A2UIComponentMap` |
| `src/interactive-os/ui/a2uiAdapter.ts` | A2UI flat list → NormalizedData 변환 유틸 | ✅ `a2uiAdapter.ts::a2uiToNormalized` |
| `src/pages/showcase/A2UISurfaceDemo.tsx` | showcase 데모 페이지. 여러 A2UI JSON 샘플을 렌더링 | ✅ `A2UISurfaceDemo.tsx::A2UISurfaceDemo` |
| `uiCategories.ts` slug 추가 | `'a2ui-surface'` 등록 | ✅ Protocol 카테고리 추가 |

완성도: 🟢

## ③ 인터페이스

A2UISurface는 순수 변환 레이어. 키보드 인터랙션은 각 UI 컴포넌트가 axis를 통해 이미 소유.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| A2UI JSON flat component list | 빈 surface | a2uiAdapter가 flat list → NormalizedData 변환 | flat ID 참조 = entities + relationships와 동형 | NormalizedData에 모든 컴포넌트 로드 | ✅ 일치 |
| NormalizedData의 각 entity | 렌더 트리 구축 중 | componentMap에서 `entity.data.component` 키로 resolve | 카탈로그 패턴: 타입 문자열 → 컴포넌트 매핑 | 우리 UI 컴포넌트로 렌더 | ✅ 일치 |
| entity의 children 배열 | 부모 컴포넌트 렌더 중 | relationships에서 childId[] 조회 → 재귀 렌더 | adjacency list가 재귀 순회를 자연스럽게 유도 | 중첩 UI 트리 완성 | ✅ 일치 |
| 미지원 component type | componentMap에 없음 | fallback 렌더러: 타입명 + raw JSON | graceful degradation — A2UI 스펙 권장 패턴 | crash 없이 정보 표시 | ✅ 일치 |
| A2UI value path 바인딩 | 데이터 모델 존재 | JSON Pointer path를 데이터에서 resolve → props 주입 | A2UI DynamicString/Number가 JSON Pointer로 참조 | 컴포넌트에 실제 값 표시 | ✅ 일치 |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 빈 component list [] | surface 초기화 | 빈 입력은 빈 출력 — 에러가 아님 | 아무것도 렌더하지 않음 | 빈 surface | ✅ rootIds 빈 배열 → 렌더 없음 |
| 순환 참조 (A→B→A children) | 파싱 중 | 무한 재귀 방지 필수 | 깊이 제한(예: 20)에서 중단 + fallback | 부분 렌더 + 경고 | ✅ isSafeDepth(MAX_DEPTH=20) |
| 존재하지 않는 childId 참조 | 렌더 중 | 누락 참조는 skip — crash보다 부분 렌더가 낫다 | 해당 자식 위치에 아무것도 안 나옴 | 나머지 정상 렌더 | ✅ entity 없으면 null 반환 |
| 매우 긴 list (1000+ items) | 렌더 중 | showcase 범위에서 가상화는 over-engineering | 전체 렌더 (성능 경고는 없음) | 느릴 수 있지만 동작 | ✅ 가상화 없이 전체 렌더 |
| data binding path가 존재하지 않는 경로 | 값 resolve 중 | undefined를 빈 문자열로 fallback | 컴포넌트에 빈 값 표시 | 에러 없이 렌더 | ✅ resolveDataPath → undefined → ?? fallback |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | os 기반 개발: UI → ui/에 먼저 만들고 pages에서 import (CLAUDE.md) | ② A2UISurface를 ui/에 배치 | ✅ 준수 | — | ✅ 일치 |
| 2 | pages에서 useAria/useAriaZone 직접 사용 금지 (CLAUDE.md) | ② Demo는 A2UISurface만 사용 | ✅ 준수 | — | ✅ 일치 |
| 3 | ax()만 사용, style={} 금지 (CLAUDE.md) | ② A2UISurface 스타일링 | ✅ 준수 | — | ✅ 일치 (style={} 0건) |
| 4 | 파일명 = 주 export 식별자 (CLAUDE.md) | ② 파일명 | ✅ 준수 | — | ✅ 일치 |
| 5 | 표준 UI 어휘, 용도별 완성품 (feedback_ui_sdk_principles) | ② componentMap이 기존 UI 완성품만 사용 | ✅ 준수 | — | ✅ 일치 |
| 6 | UI 컴포넌트만 노출, primitives 금지 (feedback_ui_over_primitives) | ③ A2UISurface가 useAria 직접 안 씀 | ✅ 준수 — 기존 UI 컴포넌트를 조합 | — | ✅ 일치 |
| 7 | 모든 OS 상태는 NormalizedData+Command (feedback_all_state_normalized_command) | ③ adapter 출력이 NormalizedData | ⚠️ 부분 — showcase는 읽기 전용이라 Command 불필요, useState로 NormalizedData 보관 | 읽기 전용이므로 허용. 양방향 확장 시 Command 필수 | ✅ 의도적 예외 — Tabs useState도 읽기 전용 범위 |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | uiCategories.ts — slug 추가 | 사이드바에 항목 추가됨 | 낮 | 허용 — 기존 패턴과 동일 | ✅ 일치 |
| 2 | ui/ 디렉토리에 3파일 추가 | ui/ export 증가 | 낮 | 허용 — 독립 모듈, 기존 import에 영향 없음 | ✅ 일치 |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| 1 | A2UISurface 내부에서 useAria/useAriaZone 직접 사용 | ⑤#6 | 기존 UI 완성품을 조합해야 함. primitives 직접 사용 금지 | ✅ 준수 |
| 2 | A2UI action/event 처리 구현 | ① Non-Goals | 이번 스코프는 읽기 전용 | ✅ 준수 |
| 3 | @a2ui-sdk/react 등 외부 A2UI 렌더러 의존 | ① Decision | 우리 UI + axis를 써야 의미 | ✅ 준수 |
| 4 | A2UI JSON 스키마 검증(validation) 구현 | 범위 | showcase에서는 well-formed JSON 가정 | ✅ 준수 |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | ①M1 | A2UI JSON에 Text(h1) + Column + Row + Card 포함 → 렌더 | 해당 UI 컴포넌트가 올바른 계층으로 표시됨 | ✅ basicLayout 샘플 (시각 검증) |
| V2 | ①M2 | A2UI JSON에 List + 3개 item → 렌더 후 ↑↓ 키 | ListBox 포커스 이동 동작 | ✅ interactiveList 샘플 (시각 검증) |
| V3 | ①M3 | A2UI JSON에 Tabs + 2개 탭 → 렌더 후 ←→ 키 | TabList 포커스 이동 동작 | ✅ tabsSample 샘플 (시각 검증) |
| V4 | ①M4 | A2UI JSON에 "UnknownWidget" 타입 포함 → 렌더 | fallback 표시, crash 없음 | ✅ fallbackSample (RizzChart3D) |
| V5 | ④ 순환참조 | children이 순환하는 JSON → 렌더 | 깊이 제한에서 중단, 부분 렌더 | ✅ isSafeDepth 가드 (코드 검증) |
| V6 | ④ 빈 list | 빈 component list [] → 렌더 | 빈 surface, 에러 없음 | ✅ 코드 검증 (rootIds 빈 배열) |
| V7 | ④ 누락 childId | 존재하지 않는 childId 참조 → 렌더 | 해당 위치 skip, 나머지 정상 | ✅ 코드 검증 (entity null → return null) |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

### 교차 검증

1. **동기 ↔ 검증**: M1→V1, M2→V2, M3→V3, M4→V4 ✅ 전부 커버
2. **인터페이스 ↔ 산출물**: adapter→NormalizedData→componentMap→렌더 체인이 산출물 5개와 일치 ✅
3. **경계 ↔ 검증**: 빈list→V6, 순환→V5, 누락childId→V7 ✅
4. **금지 ↔ 출처**: 4개 금지 모두 출처 명시 ✅
5. **원칙 대조 ↔ 전체**: ⑤#7 부분 허용(읽기 전용)은 ① Non-Goals과 정합 ✅
