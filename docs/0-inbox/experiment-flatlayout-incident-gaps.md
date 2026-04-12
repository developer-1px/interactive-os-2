# FlatLayout 깊이 한계 실험 — incident 재현

**날짜**: 2026-04-12
**목적**: FlatLayout + ui 부품 조합만으로 incident 데모를 재현하여 gap을 발견

## 실험 구조

```
incident 원본 (레거시):          FlatLayout 선언 시도:
┌─────────────────────────────┐   stack (root)
│ MonitoringBar (Toolbar)     │     widget: MonitoringBar
├────────┬──────────┬─────────┤   split (horizontal, [0.22, flex, 0.3])
│Timeline│ Capture  │  Chat   │     widget: TimelinePanel
│ListBox │ Before/  │StreamFeed│    widget: CapturePanel
│        │ After    │Composer │     widget: ChatZone
└────────┴──────────┴─────────┘
```

## 발견된 GAP 목록

### GAP #1: 위젯 간 공유 상태 메커니즘 없음

FlatLayout의 widget은 독립적. 위젯 간 상태 공유(채팅 진행→타임라인 visible, 타임라인 선택→캡처 내용)를 위한 메커니즘이 없다.

**현재 우회**: 페이지 레벨 useState + widget.props로 전달 → @useState-hatch 필요

**제안**: FlatLayout 레벨의 shared context 또는 layout store

### GAP #2: widget.props 타입 안전성

`WidgetRegistry = Record<string, ComponentType<Record<string, unknown>>>`

props 전달은 되지만 타입 체크가 없다. `as React.ComponentType<Record<string, unknown>>` 캐스팅 필요.

**제안**: 제네릭 registry 또는 props 스키마

### GAP #3: 정적 definePage vs 동적 widget.props

definePage는 정적 선언이지만, widget.props가 매 렌더 변한다 (items, isStreaming, selectedEvent 등).

- useMemo deps에 상태 포함 → 매 이벤트마다 전체 layout NormalizedData 재생성
- 레이아웃 구조(split/stack)는 안 변하는데 props만 변함
- 구조와 props를 분리하는 메커니즘 없음

**제안**: widget.props를 NormalizedData 밖에서 관리하는 채널

### GAP #4: StreamFeed renderItem ≠ items/ 패턴

items/(ListItem, ToolbarItem 등)는 `(props, node, state)` 시그니처.
StreamFeed의 renderItem은 `(item, index, meta)` 시그니처.

채팅 메시지는 type별 완전히 다른 렌더링(user/agent/system/tool)이 필요하여 단일 Item 컴포넌트로 커버 불가.

**제안**: StreamFeed 전용 message renderer registry (OCP)

### GAP #5: ListItem/ToolbarItem이 도메인 데이터 표현에 부족

timeline event는 time + icon + title + detail 구조.
ListItem은 icon + label + rightContent만 지원.
label이 문자열이라 다단 레이아웃(title 줄 + detail 줄) 표현 불가.

**제안**: items/TimelineItem 또는 ListItem의 label을 ReactNode로 확장

### GAP #6 (핵심): pages/ 규칙과 widget 정의 위치 충돌

pages/ 안에 widget을 정의하면:
- `renderItem` 전달 금지 (규칙 11) — 하지만 widget이 ListBox를 쓰려면 renderItem 필요
- `useState` 금지 (규칙 9) — 하지만 widget 간 상태 공유에 필요

widget은 ui/ 부품을 조합하는 "중간 레이어"인데, 이 레이어의 위치가 모호하다.

**선택지**:
- A) widget을 ui/에 두면 → 도메인 의존성이 ui/ 레이어로 올라감
- B) widget을 pages/에 두면 → os 규칙에 걸림
- C) 새 레이어 (composites/ 또는 widgets/) 도입

## 실험 2차 (command + shared store)

### 해결된 GAP

**GAP #1 해결**: `useFlatLayout()` hook + `FlatLayoutContext` 추가.
- widget이 `dispatch(command)` + `store` 읽기 가능
- 위젯 간 통신: Timeline이 selectEvent command → store의 shared node 업데이트 → Capture가 store에서 읽음
- ChatZone이 setChatProgress command → store → Timeline이 visibleCount 계산

**GAP #3 부분 해결**: 대부분의 위젯은 props 없이 store만으로 동작.
- 단, ChatZone은 useStreamFeed 상태(items, feedRef)를 props로 받아야 함
- React 상태/ref는 NormalizedData에 직렬화 불가 → props 우회 필요

### 남은 GAP

**GAP #6 (핵심): widget 레이어 위치 문제**
- pages/ 훅이 renderItem 전달을 차단
- widget은 ui/ 부품을 조합하므로 renderItem 사용 필수
- 현재 우회: `src/experiments/`에 위젯 배치 (pages/ 밖)
- **근본 해결**: widget 전용 레이어 필요 (pages/도 ui/도 아닌 중간 계층)

**GAP #4**: StreamFeed renderItem은 items/ 시그니처와 다름 (item vs props+node+state)

**GAP #5 해결**: TimelineItem을 ui/items/에 추가하여 해결

## 실험 3차 (브라우저 검증 + 시각 polish)

### 추가로 발견한 GAP

**GAP #7**: FlatLayout에 **데이터 전용 노드** 개념 부재
- shared state를 store에 두려면 `type: 'state'` 노드가 필요한데, layoutRenderers에 없는 type을 쓰면 widget으로 처리되어 `Unknown widget` 에러
- **해결**: `StateNode` 타입 추가 (`flatLayout.ts`)

**GAP #8**: `stack` 노드의 multi-child sizing 정책 부재
- widget renderer가 `splitChild` 클래스(`height: 100%`)를 무조건 적용
- stack 안에 widget이 2개 이상이면 모두 100% 높이로 겹침
- **해결**: stack 대신 `vertical split [0.05, 'flex']` 사용. 근본 해결은 widget renderer가 부모 컨텍스트를 알아야 함

**GAP #9**: ListBox의 내부 focus state vs 외부 shared state 동기화
- ListBox는 자체 focus 추적 (첫 항목 자동 focus)
- 외부 store의 selectedId와 sync 메커니즘 없음
- **부분 해결**: TimelineItem에서 `aria-selected`를 외부 state로 override
- **남은 문제**: ListBox의 내부 focused 상태는 여전히 첫 항목

**GAP #10**: items/ 가 도메인별 다양성 부족
- ServiceItem, TimelineItem 등 도메인 Item을 ui/items/에 추가해야 함
- ToolbarItem은 icon OR label 둘 중 하나만 (status dot + name + detail 같은 복합 표현 불가)

### 시각 polish 결과 (브라우저 검증)

- ✅ 서비스 status dot (StatusIndicator 사용)
- ✅ Timeline 이벤트 아이콘 (lucide-react)
- ✅ Capture before/after grid
- ✅ AI Analysis 채팅 + 블록
- ✅ 자동 timeline reveal (chat progress 동기화)
- ✅ 자동 event 선택 (latest visible)
- ⚠️ ListBox 내부 focus와 외부 selection 어긋남 (GAP #9)

## 결론

FlatLayout + command + shared store로 incident 수준 화면을 **거의** 선언적으로 재현 가능.

**작동하는 것:**
- 레이아웃 선언 (split/stack/bar/widget)
- 위젯 간 command 통신 (selectEvent, setChatProgress)
- shared store로 상태 공유

**구조적 과제:**
1. **widget 레이어**: pages/도 ui/도 아닌 중간 계층이 필요
2. **React 상태 ↔ store 경계**: useStreamFeed 같은 React 훅 상태는 store에 넣을 수 없어 props 우회 필요
3. **StreamFeed renderItem**: items/ 패턴과 시그니처 불일치
