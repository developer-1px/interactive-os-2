# APG Conformance 전수 포팅 — PRD

> Discussion: APG example 전수 포팅으로 role/aria-* 정합성 검증 + os 갭 발견. composePattern만 사용, 날코딩 금지.

## ① 동기

### WHY

- **Impact**: 16개 pattern/roles/가 있지만 APG와 실제로 일치하는지 검증된 적 없다. 뭘 했고 뭘 안 했는지 기록이 없어 매번 전수조사를 해야 한다. 나머지 42개는 아예 없다.
- **Forces**: 58개 대상 example의 볼륨이 크고 복잡도가 다르다 + composePattern만 사용해야 하는 제약 + 날코딩 금지 + os의 axis/plugin 체계가 APG 전체를 커버하는지 미검증
- **Decision**: 기존 16개 적합성 검증을 먼저 하고, 나머지 42개를 포팅한다. APG HTML의 aria tree와 우리 aria tree를 비교하고, keyboard interaction을 integration test로 검증한다. 갭 발견 시 레지스트리에 기록하고 넘어간다. 기각: "처음부터 순서대로" — 기존 것의 갭을 먼저 발견해야 같은 실수 반복 방지. "갭 발견 시 즉시 os 수정" — 전체 지도를 먼저 그리는 것이 우선.
- **Non-Goals**: CSS 포팅 안 함. os 갭 즉시 수정 안 함 (기록만). Deprecated example (D1, D2) 포팅 안 함. Landmarks 8개 + Tooltip 포팅 안 함 (engine 불필요).

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | 기존 accordion.ts가 pattern/roles/에 있고, ui/Accordion.tsx가 있다 | 적합성 검증을 실행한다 | APG Accordion example과 동일한 aria tree 구조 + 동일한 키보드 동작이 테스트로 증명된다 | |
| S2 | APG에 Listbox with Grouped Options example이 있지만 우리는 없다 | 해당 example을 포팅한다 | composePattern 조합으로 ui/ 컴포넌트가 만들어지고, aria tree + 키보드 테스트가 통과한다 | |
| S3 | 포팅 중 composePattern으로 표현 불가한 APG 동작을 만난다 | 갭을 발견한다 | 매트릭스에 ⛔ 표시 + 갭 레지스트리에 영향 axis/plugin과 함께 기록된다. 날코딩으로 우회하지 않는다 | |
| S4 | 다음 세션에서 진척을 확인하고 싶다 | 매트릭스를 본다 | 58개 example 각각의 상태(⬜/🔨/🟢/🟡/⛔)와 갭이 한 눈에 보인다 | |

완성도: 🟢

## ② 산출물

> 기존 파일 재사용 우선, 새 파일은 최소한으로

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `docs/2-areas/pattern/apgConformanceMatrix.md` | 전수 추적 SSOT. 68개 전체 + APG 링크 + 상태 + 갭. 이미 생성 완료 | |
| `pattern/roles/{pattern}.ts` | composePattern 호출. role 계층이 다르면 별도 파일 (예: `listbox.ts` vs `listboxGrouped.ts`). 같은 role 계층에서 ui 조합만 다르면 같은 pattern 파일 | |
| `ui/{Component}.tsx` | Aria + pattern 조합 컴포넌트. 기존 것 재사용 + 신규 | |
| `__tests__/{pattern}-apg.conformance.test.tsx` | APG 적합성 테스트 = showcase 데모를 겸한다. example별 aria tree 스냅샷 + keyboard interaction 검증. 기존 `*-keyboard.integration.test.tsx`의 역할을 흡수 | |

### 산출물 관계

```
apgConformanceMatrix.md (추적)
  ↓ 참조
pattern/roles/{name}.ts (composePattern 선언)
  ↓ import
ui/{Name}.tsx (렌더링 컴포넌트)
  ↓ import
__tests__/{name}-apg.conformance.test.tsx (검증)
  ↓ 결과
apgConformanceMatrix.md (상태 갱신)
```

### 파일명 규칙

- conformance test: `{pattern}-apg.conformance.test.tsx` — 기존 `*-keyboard.integration.test.tsx`를 흡수 (동일 용도의 파편화 해소)
- **pattern 파일 분리 기준 = role 계층**: role 계층(identity)이 다르면 별도 파일. 같은 role 계층에서 ui 조합만 다르면 같은 pattern
  - `listbox.ts` — listbox > option (Scrollable, Rearrangeable)
  - `listboxGrouped.ts` — listbox > group > option (Grouped)
  - `radiogroup.ts` — radiogroup > radio (Roving tabindex, activedescendant는 focusStrategy 옵션)
- pattern은 조립 블록이지 범용 추상화가 아님. 상품마다 원하는 게 다르므로 완성품의 범용 추상화 불필요

완성도: 🟢

## ③ 인터페이스

> "인터페이스" = 각 conformance test가 검증하는 입력→결과 매핑

### 검증 워크플로우 (example당)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| APG example 페이지 | aria tree 미확인 | APG 페이지의 role 계층 + aria-* 속성을 기준선으로 기록 | APG가 ARIA 구현의 표준 레퍼런스이므로 | 기준 aria tree 확보 | |
| 기준 aria tree | composePattern 미작성 또는 기존 | pattern/roles/에서 composePattern 호출로 동일 구조 선언 | composePattern이 axis 조합으로 role+aria-*를 선언하므로 | pattern 파일 완성 | |
| pattern 파일 | ui 컴포넌트 미작성 또는 기존 | ui/ 컴포넌트가 Aria + pattern으로 렌더링 | ui 컴포넌트는 pattern을 Aria에 전달하여 DOM을 생성하므로 | 렌더 가능한 컴포넌트 | |
| 렌더된 컴포넌트 | 테스트 미작성 | conformance test에서 (1) aria tree 스냅샷 비교 (2) 키보드 인터랙션 검증 | serializeAriaNode로 추출한 tree가 APG 기준선과 구조적으로 동일해야 적합 | 🟢 또는 🟡/⛔ + 갭 기록 | |

### aria tree 비교 기준

| 비교 대상 | 일치 필수 | 불일치 허용 | 왜 | 역PRD |
|----------|----------|-----------|-----|-------|
| role 계층 (부모-자식) | ✅ | — | role 계층이 AT의 시맨틱 해석을 결정 | |
| childRole (option, treeitem 등) | ✅ | — | 자식 role이 틀리면 AT가 잘못된 동작 안내 | |
| aria-selected, aria-expanded 등 상태 속성 | ✅ | — | 상태 속성이 AT의 현재 상태 전달 | |
| aria-label, aria-labelledby | ✅ (존재 여부) | 값 (콘텐츠 의존) | 라벨 메커니즘은 같되 실제 텍스트는 다를 수 있음 | |
| aria-posinset, aria-setsize | ✅ (동적 로딩 시) | 정적 DOM이면 생략 가능 | 브라우저가 정적 DOM에서 자동 계산 | |
| DOM 태그 (div vs span 등) | — | ✅ | 시맨틱은 role이 결정, 태그는 구현 선택 | |
| id 값, class명 | — | ✅ | 구현 디테일 | |
| tabindex 전략 | ✅ (roving vs activedescendant) | 값 자체 | 포커스 관리 전략이 AT 동작에 영향 | |

### 키보드 인터랙션 검증 (APG Keyboard Interaction 섹션 기반)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↓ ArrowDown | listbox에 포커스 | 다음 option으로 포커스 이동 | APG listbox: 수직 목록에서 ArrowDown = 다음 항목 | 다음 option focused | |
| ↑ ArrowUp | listbox에 포커스 | 이전 option으로 포커스 이동 | APG listbox: 수직 목록에서 ArrowUp = 이전 항목 | 이전 option focused | |
| Home | listbox에 포커스 | 첫 option으로 포커스 이동 | APG: Home = 컬렉션 시작 | 첫 option focused | |
| End | listbox에 포커스 | 마지막 option으로 포커스 이동 | APG: End = 컬렉션 끝 | 마지막 option focused | |
| Space | option에 포커스 (multi-select) | 선택 토글 | APG: Space = 현재 항목 선택 변경 | aria-selected 토글 | |
| Enter | accordion header에 포커스 | 패널 expand/collapse 토글 | APG: Enter = 연결된 패널의 확장 전환 | aria-expanded 토글 | |
| Tab | 컴포넌트 내부 | 컴포넌트 밖으로 포커스 이동 | APG: roving tabindex 패턴에서 Tab은 위젯 탈출 | 다음 탭 순서 요소 focused | |

> 위는 예시. 실제로는 **APG 각 example 페이지의 Keyboard Interaction 섹션을 그대로 테스트 케이스로 변환**한다.

완성도: 🟢 — 워크플로우 + 비교 기준 확정. example별 세부 키보드 스펙은 APG 원문이 SSOT, 포팅 시점에 추출

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 빈 데이터 (0 items) | 컴포넌트 렌더 | 빈 컬렉션도 role 컨테이너는 존재해야 AT가 위젯을 인식 | role 컨테이너 렌더, 자식 없음, 포커스 이동 없음 | 빈 컨테이너 | |
| 1개 항목 | 컴포넌트 렌더 | Home/End/Arrow 모두 같은 항목에 머무름 | 포커스 유지, 에러 없음 | 단일 항목 focused | |
| composePattern으로 표현 불가 | 포팅 시도 | 날코딩 금지 제약 — os가 해결해야 할 문제 | ⛔ 표시, 갭 레지스트리 기록, 스킵 | 갭 기록됨 | |
| APG example이 여러 위젯 조합 (예: Rearrangeable Listbox = listbox + toolbar) | 포팅 시도 | 각 위젯은 독립 pattern으로 존재, 조합은 ui 레벨 | 각 위젯을 별도 Aria zone으로 렌더, 조합은 ui 컴포넌트에서 | 복합 컴포넌트 | |
| roving tabindex vs aria-activedescendant 차이 | 같은 패턴의 두 변형 | APG가 두 포커스 전략을 별도 example로 제공 | pattern의 focusStrategy 옵션으로 분기 | 두 변형 모두 커버 | |
| APG에는 있지만 우리 axis에 없는 키바인딩 | 포팅 중 발견 | 없는 키바인딩 = axis 갭 | 갭 레지스트리에 "axis 확장 필요" 기록 | ⛔ | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | composePattern만, 날코딩 금지 (discuss 제약) | ②③ 전체 | 준수 | — | |
| P2 | os 기반 개발 필수 — ui/ 완성품 사용, useAria 직접 사용 금지 (CLAUDE.md) | ② ui 컴포넌트 | 준수 — Aria + pattern 조합 | — | |
| P3 | 테스트: 인터랙션은 통합 (user.keyboard() → DOM/ARIA 상태 검증), mock 호출 검증 금지 (CLAUDE.md) | ② conformance test | 준수 — userEvent + DOM 검증 | — | |
| P4 | 빈 표 먼저 만들고 채우기 (feedback) | ② 매트릭스 | 준수 — 이미 생성 완료 | — | |
| P5 | 테스트 = 데모 = showcase 수렴 (feedback) | ② conformance test | 준수 — conformance test = showcase 데모 통합. 기존 분리는 의도가 아니라 파편화. 용도가 같으므로 하나로 | — | |
| P6 | 하나의 앱 = 하나의 store (feedback) | ④ 복합 위젯 | 준수 — 복합 위젯도 단일 store + multi-zone | — | |
| P7 | focusStrategy: roving-tabindex 또는 aria-activedescendant (axis) | ③ 포커스 전략 | 준수 — pattern이 선언 | — | |
| P8 | ARIA 표준 용어 우선, 자체 이름 발명 금지 (feedback) | ② 파일명 | 준수 — APG pattern 이름 그대로 사용 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| B1 | 기존 `*-keyboard.integration.test.tsx` 16개 | conformance test가 흡수하면서 삭제 대상 | 중 | conformance test가 기존 test의 케이스를 포함하는지 확인 후 교체. 커버리지 누락 없이 전환 | |
| B2 | 기존 `pattern/roles/*.ts` 16개 | 적합성 검증 과정에서 수정될 수 있음 | 중 | 수정 시 기존 integration test가 회귀 감지 | |
| B3 | 기존 `ui/*.tsx` 컴포넌트 | 새 APG 변형 지원을 위해 props 추가 가능 | 중 | 기존 API 유지, 옵셔널 props로 확장 | |
| B4 | 매트릭스 파일이 커질 수 있음 | 68행 + 갭 레지스트리 — 관리 부담 | 낮 | 패턴별 섹션 분리로 충분히 관리 가능 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 | 이유 | 역PRD |
|---|---------------|------|------|-------|
| F1 | APG 동작을 표현하기 위해 addEventListener, 직접 DOM 조작 등 날코딩 | discuss 제약 | composePattern으로 표현 불가 = os 갭. 우회하면 갭을 숨기게 됨 | |
| F2 | 갭 발견 시 즉시 os(axis/plugin) 수정 | discuss 결정 | 전체 지도를 먼저 그리는 것이 우선. 수정은 별도 사이클 | |
| F3 | conformance test가 기존 test 케이스를 누락한 채 교체 | ⑥ B1 | 흡수 전환 시 기존 test의 모든 케이스가 conformance test에 포함되는지 반드시 확인 | |
| F4 | CSS 포팅 | discuss Non-Goals | 검증 대상은 구조 + 동작 + aria-*. 시각은 범위 밖 | |
| F5 | APG와 다른 role 계층을 "우리 방식이 더 나아서"로 정당화 | ⑤ P8 | APG가 표준. 의도적 차이는 갭 레지스트리에 사유와 함께 기록 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | 기존 accordion conformance test: Aria tree에 role=region, childRole=heading, aria-expanded 존재 | 스냅샷 일치 | |
| V2 | S1 동기 | 기존 accordion conformance test: Enter → aria-expanded 토글, ArrowDown/Up → 포커스 이동 | 키보드 동작 APG 스펙과 일치 | |
| V3 | S2 동기 | Listbox Grouped: role=listbox 안에 role=group + role=option 계층 | 그룹 구조 스냅샷 일치 | |
| V4 | S3 동기 | 포팅 불가 example: 매트릭스에 ⛔ + 갭 레지스트리에 행 추가 | 갭이 구조적으로 기록됨 | |
| V5 | S4 동기 | 검증 완료 후 매트릭스 상태가 ⬜→🟢 또는 🟡 또는 ⛔로 갱신 | 진척 추적 가능 | |
| V6 | 경계: 빈 데이터 | 0개 항목으로 렌더 → role 컨테이너 존재, 에러 없음 | 빈 컨테이너 렌더 | |
| V7 | 경계: roving vs activedescendant | Radio Group 두 변형: focusStrategy 옵션 전환 시 각각 APG 기준선 일치 | 두 변형 모두 통과 | |
| V8 | 경계: 복합 위젯 | Rearrangeable Listbox: listbox zone + toolbar zone이 독립 동작 | 각 zone의 aria tree와 키보드가 개별 APG 스펙과 일치 | |

### conformance test 구조 (템플릿)

```typescript
// {pattern}-apg.conformance.test.tsx
describe('{Pattern} APG Conformance', () => {
  describe('Aria Tree Structure', () => {
    it('matches APG {Example Name} role hierarchy', () => {
      // render → serializeAriaNode → 기준선과 비교
    })
  })
  describe('Keyboard Interaction', () => {
    // APG Keyboard Interaction 섹션의 각 행 → 하나의 it
    it('{Key} → {expected behavior}', async () => {
      // userEvent.keyboard → DOM/ARIA 상태 검증
    })
  })
})
```

완성도: 🟢

---

**전체 완성도:** 🟢 8/8 (①🟢 ②🟢 ③🟢 ④🟢 ⑤🟢 ⑥🟢 ⑦🟢 ⑧🟢)

> ③ 인터페이스와 ⑧ 검증의 세부 항목(example별 키보드 스펙)은 포팅 시점에 APG 페이지에서 추출하여 각 conformance test에 반영한다. PRD는 워크플로우와 기준을 정의하고, 58개 example의 개별 스펙은 APG 원문이 SSOT이다.
