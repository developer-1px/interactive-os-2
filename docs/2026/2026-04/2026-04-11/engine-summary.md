---
id: 4-archive/engine/summary
title: 'Engine — 결정 요약'
status: archived
kind: summary
created: 2026-04-11
updated: 2026-04-11
topics: [4-archive, explain, retro]
relates: []
supersedes: []
---
# Engine — 결정 요약

## History: snapshot → delta 방식 전환 (2026-03-23)

- undo/redo가 store 전체를 snapshot으로 저장하는 구조
- → 노드 수백 개 초과 시 메모리 폭증, slider 같은 고빈도 변경에서 성능 붕괴
- **undo 단위를 어떻게 경량화할 것인가?**
  - 변경분만 diff로 기록하는 delta 방식 채택
  - batch 경계 내에서만 유효하다는 제약

```mermaid
flowchart TD
  S["undo/redo가 전체 store snapshot 저장"] --> C["노드 많아지면 메모리 폭증 + 고빈도 변경 성능 붕괴"]
  C --> Q{{"undo 단위를 어떻게 경량화?"}}
  Q --> A["전체 snapshot 유지"]
  Q --> B["computeStoreDiff — delta만 저장"]
  A -. "✗ O(n) 메모리" .-> X[기각]
  B -- "✓ O(변경분)" --> OK[채택]
  OK -.- R{{batch 경계 내에서만 delta 유효}}
```

> 원본: [archive/29-[retro]history-delta.md](archive/29-[retro]history-delta.md)

---

## definePlugin: 플러그인 합성 API (2026-03-23)

- 플러그인마다 keyMap·commands·초기화 로직이 파일별로 흩어진 상태
- → crud가 focusRecovery를 번들할 때 기본 isReachable=treeReachable이 spatial 모델과 충돌
- **플러그인을 어떻게 선언적으로 합성할 것인가?**
  - definePlugin 팩토리로 requires+keyMap을 한 객체에 명시
  - 기본값 번들 시 사용처별 옵션 전달 필수라는 교훈

```mermaid
flowchart TD
  S["플러그인마다 keyMap·commands·초기화가 흩어짐"] --> C["기본값 번들 충돌 (crud→focusRecovery의 treeReachable vs spatial)"]
  C --> Q{{"플러그인을 어떻게 선언적으로 합성?"}}
  Q --> A["convention 기반 자동 발견"]
  Q --> B["definePlugin 명시적 선언 (requires + keyMap)"]
  A -. "✗ 암묵적, 디버깅 어려움" .-> X[기각]
  B -- "✓ 명시적 의존·합성" --> OK[채택]
  OK -.- R{{기본값 번들 시 다른 모델 충돌 주의}}
```

> 원본: [archive/31-[retro]define-plugin.md](archive/31-[retro]define-plugin.md)

---

## cellEdit Plugin: 셀 편집 축 (2026-03-25)

- Grid에서 Enter/Escape/Tab 셀 편집 흐름을 각 페이지가 직접 구현하는 상태
- → 동일 로직 중복, IME 조합 중 Enter 오동작
- **셀 편집을 어떻게 플러그인으로 추출할 것인가?**
  - cellEdit 플러그인으로 editingId/value 상태 + 선언적 keyMap 추출
  - IME는 composingRef 가드로 대응

```mermaid
flowchart TD
  S["Grid 셀 편집(Enter/Escape/Tab)이 각 페이지에서 ad-hoc 구현"] --> C["중복 + IME 조합 중 오동작"]
  C --> Q{{"셀 편집을 어떻게 플러그인으로 추출?"}}
  Q --> A["페이지별 직접 구현 유지"]
  Q --> B["cellEdit 플러그인 — editingId/value + 선언적 keyMap"]
  A -. "✗ 중복, IME 누락" .-> X[기각]
  B -- "✓ PRD 8/8 완전 일치" --> OK[채택]
  OK -.- R{{IME composingRef 가드 필수}}
```

> 원본: [archive/41-[retro]cell-edit-plugin.md](archive/41-[retro]cell-edit-plugin.md)

---

## Clipboard Singleton 오염 (2026-03-23)

- clipboard 플러그인이 module-level singleton으로 canAcceptFn을 전역 변수에 저장하는 설계
- → SPA에서 마지막으로 import된 페이지(CMS)의 canAccept가 전체 앱의 paste 판정을 납치
- **singleton을 유지하면서 페이지 간 오염을 어떻게 막을 것인가?**
  - buffer/mode는 전역 유지
  - canAcceptFn/canDeleteFn만 인스턴스별 바인딩으로 분리

```mermaid
flowchart TD
  S["clipboard가 module-level singleton으로 canAcceptFn 전역 저장"] --> C["마지막 import 페이지의 canAccept가 전체 앱 paste 납치"]
  C --> Q{{"singleton 유지하면서 오염 방지?"}}
  Q --> A["전역 singleton 그대로"]
  Q --> B["buffer/mode 전역 + canAcceptFn 인스턴스별"]
  A -. "✗ import 순서 의존" .-> X[기각]
  B -- "✓ 컨텍스트별 판정" --> OK[채택]
  OK -.- R{{buffer·mode·cutSourceIds는 전역 유지}}
```

> 원본: [archive/30-[explain]clipboard-singleton-contamination.md](archive/30-[explain]clipboard-singleton-contamination.md)

---

## getVisibleNodes: tree→범용 가시성 (2026-03-25)

- getVisibleNodes가 모든 키보드 네비게이션(focusNext, typeahead)의 단일 소스인 상태
- → expand/collapse를 전제한 tree 모델이라, 투명 그룹(listbox group)의 자식을 건너뜀
- **가시성 모델을 어떻게 범용화할 것인가?**
  - expandedIds(화이트리스트) → collapsedIds(블랙리스트) 전환으로 기본=보임
  - 8파일 기계적 rename, 핵심 제약은 tree 초기 상태와 focusRecovery reachability 2곳

```mermaid
flowchart TD
  S["getVisibleNodes가 모든 키보드 네비게이션의 단일 소스"] --> C["tree의 expand/collapse 전제 — 투명 그룹 자식 건너뜀"]
  C --> Q{{"가시성 모델을 어떻게 범용화?"}}
  Q --> A["expandedIds 화이트리스트 유지"]
  Q --> B["collapsedIds 블랙리스트 전환 (기본=보임)"]
  A -. "✗ 기본=숨김, 투명 그룹 깨짐" .-> X[기각]
  B -- "✓ 기본=보임, 8파일 기계적 rename" --> OK[채택]
  OK -.- R{{tree 초기 상태 + focusRecovery reachability 제약}}
```

> 원본: [archive/42-[explain]getVisibleNodes-dependency-tree.md](archive/42-[explain]getVisibleNodes-dependency-tree.md), [archive/43-[explain]expandedIds-to-collapsedIds-constraints.md](archive/43-[explain]expandedIds-to-collapsedIds-constraints.md)
