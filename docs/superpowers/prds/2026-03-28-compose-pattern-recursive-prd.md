# composePattern 재귀 오버라이드 — PRD

> Discussion: v3 대규모 마이그레이션 실패 → 점진 전환 전략. 첫 단계로 keyMap 소유권을 composePattern에 확립하고, 패턴-on-패턴 재귀 합성을 지원한다.

## ① 동기

### WHY

- **Impact**: 현재 composePattern은 축(Axis)만 조합할 수 있다. 기존 패턴을 base로 받아 확장하려면 post-processing 해킹(navlist.ts의 keyMap 삭제)이나 축을 처음부터 다시 나열해야 한다. v3 아키텍처(축=capability, 패턴=binding)의 전제 조건.
- **Forces**: (1) 57개 기존 호출부가 깨지면 안 된다 (2) AriaPattern은 이미 합성된 결과물이라 Axis와 성격이 다르다 (3) chain-of-responsibility 키 충돌 해소 메커니즘은 이미 동작한다
- **Decision**: 첫 인자 union에 AriaPattern을 추가. Axis union이 아닌 base 위치에 두는 이유 — "이 패턴 위에 쌓는다"가 의미적으로 명확하고, 가변 인자 중간에 패턴이 섞이면 순서 혼란.
- **Non-Goals**: (1) 축 인터페이스 변경 (v3의 나머지) (2) createPatternContext 해체 (3) Axis 타입 union에 AriaPattern 추가

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | listbox 패턴이 존재 | `composePattern(listbox, popup())` 호출 | listbox의 keyMap + popup 축 keyMap이 합성된 새 AriaPattern 반환. role/config은 listbox 것 유지 | |
| S2 | tree 패턴이 존재 | `composePattern(tree, { Enter: customHandler })` 호출 | tree의 Enter 핸들러보다 customHandler가 우선 (추가 축이 앞) | |
| S3 | 기존 Identity 호출 | `composePattern(identity, navigate(), select())` 호출 | 현재와 동일하게 동작 (하위 호환) | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `composePattern.ts` 시그니처 확장 | 첫 인자 `Identity \| PatternConfig \| AriaPattern` | |
| `isAriaPattern()` 판별 함수 | AriaPattern을 Identity/PatternConfig와 구분 | |
| AriaPattern base 추출 로직 | base 패턴에서 keyMap/config/middleware/visibilityFilters를 꺼내 axes와 합성 | |
| 테스트 | pattern-on-pattern 합성, base 속성 유지, 키 오버라이드, 하위 호환 | |

완성도: 🟡

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `composePattern(basePattern, axisA)` | basePattern은 AriaPattern (keyMap={Enter:expand}, role='tree') | base의 모든 속성을 초기값으로 깔고, axisA의 keyMap/config를 위에 합성 | AriaPattern은 이미 합성된 결과물이므로 Identity처럼 base 역할. 축의 키가 base 키 앞에 chain됨 | 새 AriaPattern: role='tree', keyMap={base+axis 합성} | |
| `composePattern(basePattern)` | 추가 축 없음 | base 패턴을 그대로 복제 반환 | 축이 0개면 base만 남음 — 항등 연산 | basePattern과 동일한 새 AriaPattern | |
| `composePattern(basePattern, axisA, axisB)` | 복수 축 | base keyMap + axisA keyMap + axisB keyMap chain-of-responsibility 합성 | 기존 축 간 합성 규칙과 동일. 추가 축이 base보다 우선 | 새 AriaPattern | |
| base에 middleware 존재 + axis에도 middleware 존재 | 양쪽 middleware | base middleware를 체인 앞에 깔고, axis middleware를 뒤에 합성 | middleware는 reduceRight — 나중 것이 바깥 래퍼. base가 가장 안쪽 | 합성된 middleware | |
| base에 visibilityFilters 존재 + axis에도 존재 | 양쪽 filters | base filters + axis filters 연결 | 필터는 AND 조합 — 둘 다 통과해야 visible | 합쳐진 visibilityFilters 배열 | |
| base의 config 값 + axis의 config 값 충돌 | 예: base.expandable=true, axis.config.expandable=false | axis config가 base를 override | "위에 쌓는다" = 나중 것이 이김. 기존 "later overwrites" 규칙과 일치 | expandable=false | |
| base의 role/childRole/ariaAttributes | 항상 | base 것 유지. 축은 role을 변경하지 않음 | Identity 속성은 패턴의 정체성. 축은 행동만 추가 | role/childRole/ariaAttributes 불변 | |

완성도: 🟡

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| base 패턴의 keyMap이 비어있음 | keyMap={} | 빈 base 위에 축을 쌓는 건 Identity 경로와 동일 | 축의 keyMap만 결과에 포함 | 정상 동작 | |
| 같은 키가 base와 axis 양쪽에 존재 | Enter가 base에도, axis에도 | chain-of-responsibility: 추가 축이 먼저 시도, void면 base로 폴스루 | axis의 Enter가 우선 시도됨 | 기존 규칙과 동일 | |
| 3단 재귀: `composePattern(composePattern(a, x), y)` | 2번 합성 | composePattern은 AriaPattern을 반환하고, AriaPattern을 base로 받으므로 자연스럽게 재귀 | 정상 동작 — a의 속성 + x + y 순서로 합성 | 3단 합성 AriaPattern | |
| base에 panelRole/triggerKeyMap 등 확장 속성 존재 | Identity 확장 속성 | AriaPattern에도 이 속성이 있으므로 그대로 전달 | 확장 속성 유지 | 불변 | |
| isAriaPattern이 StructuredAxis와 오판 | StructuredAxis도 keyMap 필드 있음 | AriaPattern은 role 필드가 반드시 존재 — StructuredAxis에는 없음 | role 존재로 판별 | 오판 없음 | |

완성도: 🟡

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 선언적 OCP (feedback_declarative_ocp) | ③ 전체 | 준수 | — | |
| P2 | 축은 keyMap 소유 금지 (feedback_axis_no_keymap) | ② 시그니처 | 준수 — 축이 아니라 패턴이 base keyMap 소유 | — | |
| P3 | Pattern은 조립 블록 (feedback_pattern_is_block_not_abstraction) | ② 전체 | 준수 — 패턴을 재조립 가능하게 만드는 것 | — | |
| P4 | 기존 테스트 97개 안전망 (CLAUDE.md) | ④ 하위 호환 | 준수 — Identity/PatternConfig 경로 무변경 | — | |
| P5 | 설계 원칙 > 요구 충족 (feedback_design_over_request) | ③ config override | 준수 — "later overwrites" 기존 규칙 유지 | — | |

완성도: 🟡

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | composePattern.ts 시그니처 | 타입 변경으로 기존 호출부 타입 에러 가능 | 낮 | union 확장이므로 기존 호출부 영향 없음 | |
| E2 | isIdentity() 판별 로직 | AriaPattern도 role 필드가 있어 isIdentity가 true 반환 가능 | 중 | isAriaPattern을 isIdentity보다 먼저 체크 | |
| E3 | navlist.ts의 keyMap 후처리 해킹 | 이 PRD 범위 밖이지만 향후 pattern-on-pattern으로 대체 가능 | 낮 | 허용 — 별도 작업 | |

완성도: 🟡

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | Axis 타입 union에 AriaPattern 추가 | ⑤ P2 — 축과 패턴은 다른 추상화 | 패턴은 base 위치에만. 가변 인자에 섞이면 순서 의미 상실 | |
| X2 | base 패턴의 role/childRole/ariaAttributes 를 axis config로 override | ⑤ P3 — Identity는 패턴의 정체성 | 축은 행동만 추가, 정체성은 건드리지 않음 | |
| X3 | isIdentity() 판별 순서를 isAriaPattern 앞에 두기 | ⑥ E2 | AriaPattern이 Identity로 오판됨 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 | AriaPattern을 base로 + 축 1개 합성 | base keyMap + 축 keyMap 합성. role은 base 것 | |
| V2 | S2 | AriaPattern을 base로 + plain KeyMap(같은 키) | 추가 축의 핸들러가 우선, void면 base 폴스루 | |
| V3 | S3 | 기존 Identity + 축 호출 | 현재 테스트와 동일 결과 (하위 호환) | |
| V4 | ④-3 | 3단 재귀 합성 | 정상 동작, 속성 누적 | |
| V5 | ④-E2 | base 패턴의 middleware + axis middleware 합성 | base가 안쪽, axis가 바깥 래퍼 | |
| V6 | ④-E2 | base 패턴의 visibilityFilters + axis filters | 배열 연결 | |
| V7 | ④-config | base config + axis config 충돌 | axis가 override | |
| V8 | ②-판별 | isAriaPattern이 StructuredAxis를 오판하지 않음 | role 존재로 정확 판별 | |

완성도: 🟡

---

**전체 완성도:** 🟢 8/8 (구현 완료, 커밋 70cb8eb)
