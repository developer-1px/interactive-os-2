---
id: '2-areas/ui/66-[retro]apgUnificationDesignGaps'
type: retro
slug: apgUnificationDesignGaps
title: 'APG 전수 전환 설계 갭 리포트 — 2026-03-30'
tags: [retro]
created: 2026-03-30
updated: 2026-04-11
legacy:
  status: active
  kind: retro
  topics: [2-areas, retro]
  relates: []
  supersedes: []
---
# APG 전수 전환 설계 갭 리포트 — 2026-03-30

## 배경

36개 APG pattern example을 ui/ 완성품 소비 구조로 전수 전환하면서 발견한 설계 갭.
목표: AriaComponentProps 공통 인터페이스로 모든 APG 패턴을 예외 없이 표현 가능한지 증명.
결과: 33/36 전환 성공, 3종 의도적 제외, 5개 구조적 갭 발견.

## Gap 1: Pattern variant = 별도 컴포넌트 (확인된 원칙)

"Pattern = identity" 원칙이 실전 검증됨. 같은 APG 위젯이라도 pattern이 다르면 별도 ui/ 완성품이 필요.

| Example | 기존 ui/ | 차이 | 생성한 ui/ |
|---------|---------|------|-----------|
| RadioGroupActivedescendant | RadioGroup | navigate: roving vs activedescendant | RadioGroupActivedescendant |
| CheckboxMixed | Checkbox | flat two-state vs hierarchical tri-state, navigate: natural vs vertical | CheckboxMixed |
| ButtonToggle | Toggle | role: button+checked vs switch | ButtonToggle |
| MenuActivedescendant | MenuButton | navigate: vertical vs activedescendant, standalone vs popup | MenuActivedescendant |

**시사점**: APG spec에서 "같은 패턴의 다른 example"이라 불리는 것이 실제로는 다른 pattern을 사용함. ui/ 컴포넌트 수 = pattern role 수.

## Gap 2: Popup 패턴의 Aria.Trigger + Aria.Item 충돌

MenuButton은 `useAria` 직접 사용이 필수. `<Aria>` 선언적 방식 사용 불가.

**원인**: Aria.Item은 ROOT_ID부터 재귀 순회하여 모든 노드를 렌더. Aria.Trigger도 같은 노드를 렌더. trigger 노드가 DOM에 2번 나타남. Aria.Item이 trigger 노드에는 `aria-haspopup`/`aria-expanded`/trigger keyMap을 주입하지 않아 속성도 불완전.

**영향받는 컴포넌트**: MenuButton (현재 useAria 사용으로 우회)

**해결 방향**:
- A) Aria.Item이 trigger 노드를 skip하는 로직 추가
- B) Aria.Trigger가 Aria.Item의 렌더를 override하는 메커니즘
- C) popup 패턴 전용 Aria Part (Aria.Menu 등)

## Gap 3: Composite pattern = 단일 AriaComponentProps 범위 밖

3개 example이 전환 불가:

| Example | 이유 | 내부 패턴 조합 |
|---------|------|--------------|
| DatePickerCombobox | 3개 독립 인터랙션 zone (input + dialog + calendar grid) | combobox + dialog + calendarGrid |
| CarouselTabs | TabList + 외부 컨트롤(pause/play) + panel + live region | tabs + custom controls |
| CarouselPrevNext | Aria 미사용, plain React state + interval | 비-ARIA |

**시사점**: AriaComponentProps는 "1 pattern = 1 store = 1 컴포넌트" 설계. 여러 패턴의 교차 상태 관리(예: combobox가 dialog를 열고, dialog 안의 grid 선택이 combobox를 닫음)는 범위 밖. 이것은 한계가 아니라 올바른 경계 — composite는 여러 ui/ 완성품의 조합으로 구현.

## Gap 4: Aria 컴포넌트가 className/onFocusChange를 미지원

AriaComponentProps에 `className`과 `onFocusChange`가 정의되어 있지만, `<Aria>` 프리미티브가 이 props를 받지 않음.

**현재 우회**: Accordion은 `<div className={}>` wrapper 추가. 나머지는 className 미전달.

**해결 방향**: Aria 프리미티브에 className/onFocusChange 지원 추가.

## Gap 5: dependency-cruiser의 examples/ 레이어 인식

`pattern/examples/`는 파일 시스템상 pattern/ 하위이지만, 의존 방향은 소비자 코드(ui/ 위).

**해결 완료**: `.dependency-cruiser.cjs`에 `pathNot: 'pattern/examples/'` 예외 추가.

**잔여 질문**: examples/가 pattern/ 아래에 있는 게 맞는가? 의존 방향과 파일 위치가 불일치. 장기적으로 examples/를 별도 최상위 디렉토리로 이동하는 것이 더 정직한 구조일 수 있음.

## Simplify 리뷰에서 발견된 추가 이슈

| 이슈 | 심각도 | 상태 |
|------|--------|------|
| getNodeLabel() 26개 파일 중복 | 높음 | 해결됨 — types.ts에 추출 |
| TabsAutomatic/Manual renderTab props 드롭 | 높음(correctness) | 해결됨 |
| ToggleGroup/Toolbar pattern factory 매 렌더 재생성 | 중간 | 해결됨 — module-level constant |
| TreegridEmail이 Aria.Cell 직접 import | 낮음 | 해결됨 — TreeGrid에서 Cell re-export |
| Slider/Spinbutton module-level mutable counter | 낮음 | 해결됨 — React.useId() 전환 |
| mergeRenderers 미사용 | 정보 | 의도적 — 첫 plugin renderer 시 활성화 예정 |

## 해결 현황 (2026-03-30)

| Gap | 상태 | 커밋 |
|-----|------|------|
| Gap 1 (pattern variant) | ✅ 원칙 확인 | 99a29d6 |
| Gap 2 (popup 충돌) | ✅ Panel/Trigger 제거, state.slotProps 도입 | b260574 |
| Gap 3 (composite) | ✅ DatePicker ui/ 완성품 (useEngine+useAriaZone 조합). Carousel 2종은 비-ARIA/실전빈도 낮아 제외 | — |
| Gap 4 (onFocusChange) | ✅ useAria에 onFocusChange 추가 | b260574 |
| Gap 5 (dependency-cruiser) | ✅ 해결 완료 | 99a29d6 |

## 남은 행동

모든 갭 해결 완료. Carousel 2종(CarouselTabs, CarouselPrevNext)은 실전 빈도 낮아 의도적 제외.
