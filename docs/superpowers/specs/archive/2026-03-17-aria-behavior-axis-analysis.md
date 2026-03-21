# AriaBehavior Axis Completeness Analysis

> 작성일: 2026-03-17

## Purpose

APG 30개 패턴을 AriaBehavior 인터페이스에 대입하여 현재 축(속성)이 충분한지 검증하고, 부족한 축을 식별한다.

## Current AriaBehavior Axes

| 축 | 타입 | 용도 |
|----|------|------|
| role | string | ARIA role |
| childRole | string? | 자식 노드 role |
| keyMap | Record<string, fn> | 키보드 → Command 매핑 |
| focusStrategy | FocusStrategy | 포커스 관리 방식 |
| expandable | boolean? | 모든 노드 확장 가능 여부 |
| selectionMode | SelectionMode? | single / multiple |
| activateOnClick | boolean? | 클릭 시 activate 호출 |
| colCount | number? | grid 컬럼 수 |
| ariaAttributes | fn | 노드별 ARIA 속성 계산 |

## APG Pattern Classification

### 현재 표현 가능 (구현 완료: 14개)

| 패턴 | behavior | 그룹 |
|------|----------|------|
| Accordion | accordion | Navigation |
| Disclosure | disclosure | Navigation |
| Switch | switch | Navigation |
| Tabs | tabs | Navigation |
| Radio Group | radiogroup | Navigation |
| Menu | menu | Navigation |
| Toolbar | toolbar | Navigation |
| Dialog (Modal) | dialog | Navigation |
| Alert Dialog | alertdialog | Navigation |
| Tree View | tree | Navigation |
| Treegrid | treegrid | Collection |
| Listbox | listbox | Collection |
| Grid | grid | Collection |
| Combobox | combobox | Collection |

### 표현 불가능 — 축 부족 (7개)

| 패턴 | 부족한 축 | 설명 |
|------|----------|------|
| **Menubar** | 다계층 keyMap | bar 레벨(Left/Right) vs dropdown 레벨(Up/Down). 단일 keyMap으로 표현 불가 |
| **Menu Button** | trigger ↔ popup 연결 | button과 menu 두 위젯의 조합. combobox와 유사한 패턴 |
| **Slider** | 연속 값 (min/max/step) | 현재 모델은 이산 노드 탐색만 지원 |
| **Slider (Multi-Thumb)** | 연속 값 + 다중 thumb | slider + 복수 제어점 |
| **Spinbutton** | 연속 값 (min/max/step) | slider와 동일 |
| **Carousel** | 시간 기반 동작 | 자동 회전, 일시정지 등 현재 축에 없음 |
| **Tooltip** | 비포커스 위젯 | 현재 모델은 "포커스 가능한 노드" 전제 |

### interactive-os 모델 밖 (13개)

HTML 네이티브로 충분하거나 interactive-os가 추가 가치를 주지 않는 패턴:

Alert, Breadcrumb, Button, Checkbox, Feed, Landmarks, Link, Meter, Table

## 발견된 부족한 축 (4개)

### 1. 연결된 위젯 (trigger ↔ popup)

- **영향 패턴**: Menubar, Menu Button
- **현재 상태**: combobox가 이미 이 패턴이지만, 전용 plugin(comboboxCommands)으로 우회 구현
- **확장 방향**: behavior에 `connectedBehavior` 또는 `popup` 축 추가

### 2. 연속 값 (value: min/max/step)

- **영향 패턴**: Slider, Multi-Thumb Slider, Spinbutton
- **현재 상태**: 이산 노드 기반 모델만 존재
- **확장 방향**: BehaviorContext에 `value`/`increment`/`decrement` 메서드 추가, AriaBehavior에 `valueRange` 축

### 3. 비포커스 위젯

- **영향 패턴**: Tooltip
- **현재 상태**: 모든 노드가 focusable 전제
- **확장 방향**: focusStrategy에 `'none'` 타입 추가 또는 별도 패턴으로 분리

### 4. 다계층 keyMap

- **영향 패턴**: Menubar (bar + dropdown 두 레벨)
- **현재 상태**: 단일 플랫 keyMap
- **확장 방향**: keyMap을 레벨별로 분리하거나, nested behavior 합성 패턴

## Conclusion

현재 AriaBehavior의 9개 축으로 APG 30개 중 14개 (47%)를 완전히 표현 가능. 4개 축을 추가하면 21개 (70%)까지 커버 가능. 나머지 9개는 HTML 네이티브 영역.
