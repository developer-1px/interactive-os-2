# Inspector ARIA X-Ray — PRD

> Discussion: OS가 생산하는 ARIA를 노드별로 x-ray — Chrome DevTools Accessibility Tree급 세밀도

## ① 동기

### WHY

- **Impact**: inspector가 인스턴스 단위만 보여줘서, 개별 노드에 어떤 ARIA 속성이 실제로 나가는지 확인할 수 없다. 디버깅 시 DOM을 직접 뒤져야 한다.
- **Forces**: getNodeProps가 이미 노드별 ARIA를 계산하지만 렌더 타임 hook 내부에 갇혀 있다. inspect()는 engine 수준이라 이 정보에 접근 못 함.
- **Decision**: DOM 순회 대신 OS 데이터(store + pattern)만으로 ARIA props를 재계산. 기각: DOM tree 직접 순회 — OS 제공 정보 원칙 위배.
- **Non-Goals**: PointerMap/MouseMap 표시 (후행 작업으로 분리), React Fiber 인스펙션, 성능 프로파일링

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | inspector 왼쪽 트리에 인스턴스+노드 표시 | 트리를 본다 | 각 노드에 role, aria-selected, aria-expanded 등이 인라인 표시 | |
| S2 | 트리에서 특정 노드 선택 | 우측 패널 확인 | 해당 노드의 전체 ARIA props 테이블이 보임 | |
| S3 | PointerMap이 나중에 추가됨 | inspector 확인 | 기존 x-ray 구조에 자연스럽게 합류하여 보임 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `computeNodeAriaProps(store, pattern, nodeId)` | store + pattern으로 단일 노드의 ARIA props 순수 계산 (ariaGens + ariaAttributes + structural) | |
| `InspectResult.nodeProps` | `Record<nodeId, Record<string, string>>` — inspect() 반환값 확장 (optional) | |
| `setInspectPattern()` | engine setter — useAriaView가 pattern 참조를 engine에 전달 (setInspectKeyMap과 동일 패턴) | |
| `inspect()` 확장 | pattern 참조 + getVisibleNodes 순회 → computeNodeAriaProps로 nodeProps 생성 | |
| 트리 라벨 세밀화 | `button "Save" aria-expanded` 스타일 — role + label + 핵심 ARIA state, caption 이하 작은 폰트 | |
| ARIA Props 탭 | 3탭(Interaction / ARIA / State), 선택 노드의 full ARIA props key-value 테이블 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 트리에서 노드 activate (Enter/Click) | 아무 노드 포커스 | 해당 노드 선택 → 우측 ARIA 탭에 props 표시 | nodeProps[id] 조회 | ARIA 탭에 key-value 테이블 갱신 | |
| ARIA 탭 클릭 | Interaction 탭 활성 | ARIA 탭 전환 | 3탭 중 하나 선택 | ARIA props 테이블 표시 | |
| 인스턴스 루트 노드 선택 | `__inst__` 노드 activate | 컨테이너 수준 ARIA 표시 (role, aria-label, aria-orientation) | 인스턴스 루트도 containerProps 보유 | 컨테이너 props 표시 | |
| 내부 노드 선택 | `__inst__key::nodeId` activate | full ARIA props 표시 | nodeProps[nodeId] 조회 | 노드별 props 표시 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| 노드 0개 인스턴스 | store에 엔티티 없음 | getVisibleNodes 빈 배열 → nodeProps 빈 객체 | 인스턴스 루트만 표시, ARIA 탭 "No nodes" | 정상 | |
| 노드 500개+ | 대규모 treegrid | polling마다 전체 full props 계산은 과부하 | 트리 라벨은 role+label만(경량), full props는 선택 시에만 계산 | 성능 유지 | |
| pattern 없는 engine | keyMap-only 모드 | getNodeProps가 빈 객체인 케이스 | nodeProps 빈 객체, ARIA 탭 "No ARIA props" | 정상 | |
| ariaGens 예외 throw | 축 버그 | inspector가 죽으면 안 됨 | try-catch → 해당 노드만 에러 표시, 나머지 정상 | 부분 표시 | |
| 동적 childRole (함수) | `(entity, state) => role` | 노드마다 role이 다를 수 있음 | computeNodeAriaProps가 entity/state 넘겨 동적 resolve | 노드별 정확한 role | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| 1 | OS 제공 정보만 사용 (discuss 합의) | ② 전체 | ✅ 준수 | — | |
| 2 | 선언=등록, 합성 런타임 불변 (feedback_declarative_ocp) | ② computeNodeAriaProps | ✅ pattern의 ariaGens/ariaAttributes 그대로 호출 | — | |
| 3 | style={} 금지, ax()만 (feedback_style_is_hatch) | ② 트리 라벨, ARIA 탭 | ✅ 새 코드는 ax() 사용 | — | |
| 4 | UI → ui/ 완성품 사용 (CLAUDE.md) | ② ARIA 탭 | ✅ TreeView, SplitPane 기존 ui/ 사용 | — | |
| 5 | 레이어 의존 순서 (CLAUDE.md) | ⑦#2 | ✅ engine이 primitives hook을 import하지 않음 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| 1 | InspectResult 타입 확장 | 기존 소비자가 새 필드 무시 — optional | 낮 | nodeProps를 optional 선언 | |
| 2 | createCommandEngine에 pattern 참조 저장 | engine이 pattern을 알게 됨 | 중 | setInspectPattern() setter (setInspectKeyMap 동일 패턴) | |
| 3 | inspectorStore.ts 라벨 포맷 변경 | 기존 라벨 형식 변경 | 낮 | 허용 — inspector 내부 표현 | |
| 4 | InspectorWindow 3탭 | 기존 2탭 → 3탭 | 낮 | 허용 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| 1 | DOM에서 aria-* 읽어오기 | ⑤#1 OS 정보 원칙 | OS가 계산한 값을 보여주는 것이지 DOM 결과를 읽는 게 아님 | |
| 2 | useAriaView의 getNodeProps 직접 import | ⑤#5 레이어 위반 | engine → primitives 역방향 의존 | |
| 3 | polling마다 전 노드 full props 계산 | ④ 500개+ 경계 | 트리 라벨용은 role+label만, full props는 선택 시에만 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①S1 | listbox 인스턴스 노드가 트리에 `option "Apple" aria-selected` 표시 | 인라인 라벨에 role + label + 핵심 ARIA state | |
| V2 | ①S2 | treegrid 노드 선택 → ARIA 탭 | role, aria-expanded, aria-level, aria-posinset, aria-setsize 전체 props 테이블 | |
| V3 | ④ 빈 인스턴스 | 노드 0개 인스턴스 선택 → ARIA 탭 | "No nodes" 표시 | |
| V4 | ④ 대규모 | 500개 노드 treegrid에서 inspector | 1초 polling에서 프레임 드랍 없음 | |
| V5 | ④ ariaGen 예외 | 고장난 축 | 해당 노드만 에러, 나머지 정상 | |
| V6 | ①S3 | PointerMap 추가 시 | InspectResult에 필드 추가해도 ARIA 탭 구조 변경 불필요 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
