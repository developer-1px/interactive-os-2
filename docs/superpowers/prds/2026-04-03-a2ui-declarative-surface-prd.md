# A2UI Declarative Surface — PRD

> Discussion: React를 내부 구현으로 숨기고, flat 선언만으로 접근성 완비 UI를 조립하는 A2UI 호환 표면 제공

## ① 동기

### WHY

- **Impact**: LLM(Gemini, Claude, GPT 등)은 Radix 스타일 TSX 조립(Select.Root > Portal > Content > Viewport > Item)을 정확히 생성하지 못한다. 중첩 순서 오류, 필수 wrapper 누락, prop 전달 실수가 빈번하다. 결과적으로 에이전트가 리치 UI를 만들 수 없다.
- **Opportunity**: Google A2UI(Agent-to-User Interface) 프로토콜이 2025.12 공개되어 에이전트→UI 선언 표준이 형성 중이다. A2UI는 flat JSONL(한 줄 = 한 컴포넌트, ID 참조로 중첩 표현)로 LLM 생성에 최적화되어 있다. 우리 NormalizedData(노드 플랫 맵 + 루트 ID 배열)와 **구조적으로 동일**하다.
- **Forces**: A2UI 기본 카탈로그는 18개 폼 수준 위젯(Text, Button, TextField, ChoicePicker 등)만 제공한다. 레이아웃은 Row/Column 중첩이 전부. TreeGrid, Combobox, DnD 리스트 같은 복잡한 인터랙션 패턴은 **커스텀 카탈로그로 확장해야** 한다. 이것이 우리 자리다.
- **Decision**: A2UI 호환 flat 선언 포맷을 입력으로 받아, 우리 axis + pattern + plugin 엔진이 접근성 완비 React 컴포넌트를 렌더링하는 표면(surface)을 만든다. React를 버리는 것이 아니라 **TSX 작성을 외부에 요구하지 않는 것**.
- **Non-Goals**: React 제거, 자체 렌더링 엔진 구축, A2UI 전송 프로토콜(AG-UI/A2A) 구현, 에이전트 런타임

### 핵심 테제

```
Radix/Ark/Headless UI → 개발자가 TSX로 조립 → 사람만 소비 가능
interactive-os A2UI   → flat 선언으로 기술 → 사람 + LLM 모두 소비 가능
```

### 전략적 맥락

| 프로토콜 | 역할 | 우리 위치 |
|---------|------|----------|
| MCP (Anthropic) | 에이전트→도구 접근 | 해당 없음 |
| A2A (Google) | 에이전트 간 통신 | 해당 없음 |
| A2UI (Google) | 에이전트→UI 선언 | **렌더러 (커스텀 카탈로그 제공자)** |

A2UI 모델에서 UI 품질은 렌더러가 결정한다. 에이전트가 `{"pattern": "listbox"}`를 선언하면, 키보드 내비게이션·ARIA·focus recovery·undo/redo는 전부 렌더러 몫. **axis 7축 시스템이 곧 렌더러의 가치.**

### 시나리오

| # | Given | When | Then |
|---|-------|------|------|
| S1 | 에이전트가 A2UI JSONL 스트림 전송 | 기본 카탈로그 컴포넌트 (Text, Button, TextField 등) | 우리 ui/ 컴포넌트로 매핑하여 접근성 완비 렌더링 |
| S2 | 에이전트가 커스텀 카탈로그 컴포넌트 선언 | `{"pattern": "listbox", "items": [...]}` | composePattern("listbox") → axis 자동 조합 → 키보드/ARIA 완비 ListBox 렌더링 |
| S3 | 에이전트가 TreeGrid 선언 | `{"pattern": "treegrid", "columns": [...], "data": "nodeId"}` | TreeGrid ui/ 컴포넌트로 렌더링, navigate/select/expand axis 전부 동작 |
| S4 | JSONL 스트리밍 중 | 한 줄씩 도착 | NormalizedData에 점진적 추가 → React가 해당 노드만 리렌더 |
| S5 | 에이전트가 특정 노드 업데이트 | 같은 ID로 재전송 | 해당 컴포넌트만 교체 (부분 업데이트) |
| S6 | /chat 페이지에서 Claude 응답 | 텍스트 대신 A2UI 페이로드 포함 | 채팅 버블 안에 인터랙티브 UI 렌더링 |

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

### 패키지 구조 (장기)

```
@interactive-os/core     ← store + engine + axis + pattern (순수 JS, React 무관)
@interactive-os/react    ← primitives + ui (React 바인딩)
@interactive-os/a2ui     ← A2UI ↔ NormalizedData 어댑터
```

### 단기 산출물

| 산출물 | 설명 |
|--------|------|
| `src/interactive-os/a2ui/parseSurface.ts` | JSONL 파서. A2UI 메시지 스트림 → NormalizedData 변환. 한 줄 단위 점진적 파싱 |
| `src/interactive-os/a2ui/catalogMap.ts` | 기본 카탈로그 18개 → 우리 ui/ 컴포넌트 매핑 테이블 |
| `src/interactive-os/a2ui/patternCatalog.ts` | 커스텀 카탈로그 정의. pattern 이름 → composePattern 호출 매핑 |
| `src/interactive-os/a2ui/A2UISurface.tsx` | React 컴포넌트. NormalizedData를 받아 engine + pattern으로 렌더링하는 진입점 |
| `src/interactive-os/a2ui/catalogSchema.json` | A2UI 커스텀 카탈로그 JSON. 우리 패턴(listbox, treegrid, tabs 등) 스키마 정의 |
| `/chat` 페이지 통합 | A2UISurface를 채팅 응답 렌더러로 연결 |

### 데이터 흐름

```
A2UI JSONL (에이전트 출력)
  ↓ parseSurface()
NormalizedData { nodes: Map<id, node>, rootIds: string[] }
  ↓ catalogMap / patternCatalog
컴포넌트 결정 (기본 위젯 or 패턴 컴포넌트)
  ↓ A2UISurface
engine (command, plugin) + axis/pattern 바인딩
  ↓ React 렌더링
접근성 완비 UI
```

## ③ 인터페이스

### A2UI 기본 카탈로그 → 우리 컴포넌트 매핑

| A2UI 컴포넌트 | 우리 매핑 | 비고 |
|--------------|----------|------|
| Text | 기본 렌더링 | variant(h1~body) → HTML 태그 |
| Image | 기본 렌더링 | |
| Icon | 기본 렌더링 | |
| Video | 기본 렌더링 | |
| AudioPlayer | 기본 렌더링 | |
| Row | ax() flex row | |
| Column | ax() flex column | |
| List | ax() flex + direction | |
| Card | ax() surface | |
| Divider | 기본 렌더링 | |
| Tabs | ui/Tabs | axis: tab 바인딩 |
| Modal | ui/Dialog | axis: dismiss 바인딩 |
| Button | 기본 렌더링 | action → engine command |
| TextField | 기본 렌더링 | axis: value 바인딩 |
| CheckBox | 기본 렌더링 | axis: value 바인딩 |
| ChoicePicker | ui/ListBox | axis: navigate + select |
| Slider | 기본 렌더링 | axis: value 바인딩 |
| DateTimeInput | ui/DatePicker | composite pattern |

### 커스텀 카탈로그 (우리만의 확장)

| 패턴 이름 | composePattern | axis 조합 | A2UI에 없는 것 |
|----------|----------------|-----------|--------------|
| listbox | listbox | navigate + select | 키보드 내비, 다중/범위 선택 |
| treegrid | treegrid | navigate + select + expand | 트리 펼침, 컬럼 리사이즈 |
| combobox | combobox | navigate + select + expand + value | 검색 + 선택 |
| workspace | workspace | navigate + tab + activate | 패널 분할, DnD 탭 |
| menu | menu | navigate + activate + dismiss | 중첩 메뉴, 키보드 |

### parseSurface 인터페이스

```ts
// 입력: A2UI JSONL 스트림
interface A2UIMessage {
  id: string
  component?: string    // 기본 카탈로그
  pattern?: string      // 커스텀 카탈로그
  children?: string[]   // ID 참조
  child?: string        // 단일 ID 참조
  [key: string]: unknown // 컴포넌트별 props
}

// 출력: 우리 NormalizedData
interface NormalizedData {
  nodes: Map<string, Node>
  rootIds: string[]
}

// 점진적 파싱
function parseSurface(stream: ReadableStream<string>): AsyncIterable<NormalizedData>
```

## ④ 우선순위

| Phase | 범위 | 가치 |
|-------|------|------|
| **P0** | parseSurface + catalogMap (기본 18개 매핑) | A2UI JSONL → React 렌더링 파이프라인 증명 |
| **P1** | patternCatalog (listbox, treegrid, combobox) | 커스텀 카탈로그로 차별화 — "접근성 완비 A2UI 렌더러" |
| **P2** | /chat 페이지 통합 | 실증 데모 — Claude가 A2UI로 리치 UI 응답 |
| **P3** | @interactive-os/core 분리 | 순수 JS 코어 추출 → 프레임워크 무관 배포 |

## ⑤ 열린 질문

| # | 질문 | 현재 생각 |
|---|------|----------|
| Q1 | A2UI action 이벤트를 engine command로 어떻게 변환? | action.event.name → defineCommand 매핑 테이블 |
| Q2 | 커스텀 카탈로그 JSON을 a2ui.org에 공개 등록? | P1 이후 검토. 먼저 로컬 카탈로그로 증명 |
| Q3 | A2UI v0.9 → v1.0 스펙 변경 대응 | parseSurface에 version 분기. 현재는 v0.9 타겟 |
| Q4 | 스트리밍 중 에러 처리 (잘못된 JSON, 없는 ID 참조) | 해당 줄 skip + console.warn. 나머지는 정상 렌더 |
