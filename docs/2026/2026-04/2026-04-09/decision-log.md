---
id: samples/decision-log
type: note
slug: decisionLog
title: 'Decision Log — CMS 프로젝트'
tags: [samples]
created: 2026-04-09
updated: 2026-04-09
summary: '아키텍처 결정 기록 (ADR-lite).'
legacy:
  status: sample
  kind: note
  topics: [samples]
  relates: []
  supersedes: []
---
# Decision Log — CMS 프로젝트

아키텍처 결정 기록 (ADR-lite).

| # | 날짜 | 제목 | 상태 |
|---|------|------|------|
| 1 | 2025-06 | Command 패턴 채택 (undo/redo) | 채택 |
| 2 | 2025-07 | 단일 store 원칙 | 채택 |
| 3 | 2025-08 | Zod 스키마 SSOT | 채택 |
| 4 | 2025-09 | ax() 디자인 시스템 (style={} 금지) | 채택 |
| 5 | 2025-10 | NormalizedData 플랫 맵 | 채택 |

---

## ADR-1: Command 패턴 채택

- **맥락**: CMS는 콘텐츠 편집 도구이므로 undo/redo가 필수다. 직접 상태를 변이하면 역연산을 추적할 수 없다.
- **결정**: 모든 상태 변경을 `Command` 객체(execute/undo)로 래핑한다. `createCommandEngine`이 히스토리 스택을 관리한다.
- **대안**:
  - Immer 패치 기반 자동 undo — 패치가 의미 단위와 불일치, 그룹 undo 어려움.
  - Event sourcing — 이벤트 재생 비용이 클라이언트 앱에 과도.
- **결과**: 모든 CRUD가 Command로 통일되어 plugin 합성이 가능해짐. undo/redo 외에 clipboard, dnd 등도 Command 조합으로 구현.

---

## ADR-2: 단일 store 원칙

- **맥락**: CMS 페이지에 트리, 캔버스, 속성 패널 등 여러 뷰가 동일 데이터를 참조한다. store가 분산되면 동기화 버그가 발생한다.
- **결정**: 하나의 앱 = 하나의 store (`cmsStore.ts`). 파생 상태는 셀렉터(`cmsState.ts`)로 분리한다.
- **대안**:
  - 뷰별 로컬 store + 동기 미들웨어 — 동기화 로직이 본질적 복잡도를 넘어섬.
  - Context 분할 — 리렌더 범위 제어가 어렵고 Command 패턴과 충돌.
- **결과**: 단일 진실 공급원으로 뷰 간 불일치 제거. 셀렉터 레이어가 읽기 성능을 보장.

---

## ADR-3: Zod 스키마 SSOT

- **맥락**: CMS는 15개 노드 타입을 다룬다. 타입 정의가 분산되면 런타임 검증과 TypeScript 타입이 괴리된다.
- **결정**: `cmsSchema.ts`에 Zod 스키마를 단일 정의하고, `z.infer`로 TypeScript 타입을 파생한다.
- **대안**:
  - TypeScript 타입 + io-ts — 두 곳에서 타입을 관리해야 함.
  - JSON Schema — 타입 추론이 불가능하고 별도 코드젠 필요.
- **결과**: 스키마 하나로 타입 안전성 + 런타임 검증 + 직렬화 규칙을 모두 커버. 노드 타입 추가 시 수정 지점이 1곳.

---

## ADR-4: ax() 디자인 시스템 (style={} 금지)

- **맥락**: `style={}`은 타입 제약이 없어 임의 CSS가 침투한다. 디자인 일관성을 구조적으로 강제할 수단이 필요했다.
- **결정**: 12축 MECE `ax()` 함수만 사용한다. `style={}` 금지. 축에 없는 속성은 `module.css` last-mile로만 허용한다.
- **대안**:
  - Panda CSS — `css()` 해치가 열려 있어 축소 실패. 폐기됨.
  - Tailwind — 유틸리티 자유도가 너무 높아 일관성 보장 불가.
  - CSS-in-JS (styled-components) — 런타임 비용 + 축 소유권 개념 부재.
- **결과**: 시각 6축 + 구조 6축으로 모든 스타일링이 분류됨. 디자인 리뷰가 축 단위 점검으로 자동화 가능.

---

## ADR-5: NormalizedData 플랫 맵

- **맥락**: CMS 노드는 트리 구조이지만, 중첩 객체로 저장하면 깊은 업데이트와 참조 추적이 비효율적이다.
- **결정**: `NormalizedData` = 노드 플랫 맵(`Record<Id, Node>`) + 루트 ID 배열. 부모-자식은 ID 참조로 표현.
- **대안**:
  - 중첩 트리 구조 — 깊은 불변 업데이트 비용, 순환 참조 위험.
  - 관계형 테이블 (정규화 3NF) — 클라이언트에 과도한 조인 비용.
- **결과**: O(1) 노드 접근, 불변 업데이트가 단순(스프레드 1단계). `getVisibleNodes` 순회도 ID 배열 기반으로 효율적.

#kind/note
