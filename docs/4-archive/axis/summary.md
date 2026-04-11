# Axis — 결정 요약

## Axis v2: 11축 → 5축 모델 (2026-03-20)

- 11개 축 + metadata grab bag으로 APG 패턴을 정의하는 구조
- → metadata의 행동 플래그(followFocus, selectionMode 등)가 축 밖에 존재하여, 축 조합만으로 패턴을 완전 정의할 수 없는 상태
- **행동 플래그를 어디에 둘 것인가?**
  - metadata의 행동 플래그를 해당 축의 옵션으로 흡수
  - Axis 타입을 keyMap + config로 확장하여 composePattern이 config를 머지
  - 5축: navigate, select, activate, expand, trap

```mermaid
flowchart TD
  S["11축 + metadata grab bag으로 패턴 정의"] --> C["축 조합만으로 패턴을 완전 정의 불가 — 행동 플래그가 metadata에 분산"]
  C --> Q{{"행동 플래그를 어디에 둘 것인가?"}}
  Q --> A["metadata에 유지"]
  Q --> B["해당 축의 옵션으로 흡수 (5축 모델)"]
  A -. "✗ 축 조합 = 패턴 불성립" .-> X[기각]
  B -- "✓ 축 = keyMap + config, 5개로 수렴" --> OK[채택]
  OK -.- R{{Axis 타입 확장: Record → interface with keyMap+config}}
```

> 원본: [archive/axisV2FiveAxesModel.md](archive/axisV2FiveAxesModel.md)

---

## Grid 범용화 + i18n Table (2026-03-23)

- Grid가 CMS 전용으로 결합된 상태에서 i18n 테이블도 필요해진 상황
- → Grid를 범용 컴포넌트로 추출해야 하는데, plugin 위임 범위와 테스트 커버리지 갭 발생
- **CMS 결합된 Grid를 어떻게 범용화할 것인가?**
  - Grid를 독립 패턴으로 추출, plugin이 키 동작 소유
  - 일치율 5/8 — 마우스 클릭 편집 경로 제거가 PRD 미예측 부작용

```mermaid
flowchart TD
  S["Grid가 CMS 전용으로 결합"] --> C["i18n 테이블 필요 — 범용 추출 필요하나 plugin 위임 범위 불명"]
  C --> Q{{"CMS Grid를 어떻게 범용화?"}}
  Q --> A["CMS Grid 복사하여 별도 컴포넌트"]
  Q --> B["Grid를 독립 패턴으로 추출 + plugin 위임"]
  A -. "✗ 중복" .-> X[기각]
  B -- "✓ 재사용 가능" --> OK[채택]
  OK -.- R{{마우스 클릭 편집 경로 제거 부작용 — PRD에서 미예측}}
```

> 원본: [archive/22-[retro]grid-i18n.md](archive/22-[retro]grid-i18n.md)

---

## Active Zone: 다중 zone 포커스 추적 (2026-03-24)

- 단일 zone만 있는 구조에서 다중 zone(sidebar + main)이 필요해진 상황
- → 어떤 zone이 활성인지 추적하는 메커니즘 부재
- **다중 zone 활성 상태를 어떻게 추적할 것인가?**
  - onPointerDown으로 직접 focus() 호출하는 경량 방식 채택
  - lastActiveContainer 싱글턴은 over-spec으로 의도적 제거

```mermaid
flowchart TD
  S["단일 zone에서 다중 zone(sidebar+main)으로 확장"] --> C["어떤 zone이 활성인지 추적하는 메커니즘 부재"]
  C --> Q{{"다중 zone 활성 상태를 어떻게 추적?"}}
  Q --> A["lastActiveContainer 싱글턴"]
  Q --> B["onPointerDown으로 직접 focus()"]
  A -. "✗ over-spec, dead code" .-> X[기각]
  B -- "✓ 경량, 추가 상태 불필요" --> OK[채택]
  OK -.- R{{다중 zone 추적 필요 시 재추가 가능}}
```

> 원본: [archive/34-[retro]active-zone.md](archive/34-[retro]active-zone.md)

---

## Tab Axis: 탭 네비게이션 전략 (2026-03-24)

- 탭 패턴에서 panel 전환 + 포커스 이동을 하나의 축으로 구현해야 하는 상황
- → 4가지 focusStrategy 중 선택 필요, 기존 테스트의 getFocused 셀렉터가 깨지는 연쇄 영향
- **탭 패턴의 포커스 전략을 어떻게 설계할 것인가?**
  - 4전략 + escape orientation + composePattern 우선순위로 해결
  - 교훈: tabindex="0" 셀렉터로 포커스 탐지하면 natural-tab-order에서 깨짐

```mermaid
flowchart TD
  S["탭 패턴에서 panel 전환 + 포커스 이동을 하나의 축으로 구현"] --> C["4가지 focusStrategy 선택 필요 + 기존 getFocused 셀렉터 깨짐"]
  C --> Q{{"탭 포커스 전략을 어떻게 설계?"}}
  Q --> A["단일 focusStrategy 고정"]
  Q --> B["4전략 + escape orientation + 우선순위"]
  A -. "✗ 패턴별 요구사항 상이" .-> X[기각]
  B -- "✓ PRD 6/8 일치" --> OK[채택]
  OK -.- R{{tabindex=0 셀렉터 포커스 탐지 금지}}
```

> 원본: [archive/35-[retro]tab-axis.md](archive/35-[retro]tab-axis.md)
