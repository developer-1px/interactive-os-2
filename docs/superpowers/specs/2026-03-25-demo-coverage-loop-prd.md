# Demo Coverage Self-Improving Loop — PRD

> Discussion: IA ≈ 폴더 구조에서 착안. vitest --coverage를 judge로, LLM이 데모 갭을 자율 보강하는 Score→Diagnose→Act→Re-score 루프.

## ① 동기

### WHY

- **Impact**: axis 7개 중 navigate만 데모 커버리지 66%. 나머지 6개는 0%. 데모가 소스 코드를 얼마나 반영하는지 알 수 없고, 빠진 기능이 뭔지 수동으로만 파악 가능. tab.ts처럼 데모 자체가 없는 축도 있음.
- **Forces**: (a) 데모는 의미 있는 인터랙션이어야 함 — 커버리지 숫자만 올리는 코드는 무가치. (b) test=demo=showcase 원칙 — 데모가 충분하면 별도 테스트가 필요 없어야 함. (c) mock 금지 — userEvent→DOM 상태 검증만 허용.
- **Decision**: 스킬 기반(사람 트리거, LLM 실행). 기각: 완전 자율 랄프루프(데모 품질 판단 불가), 정적 분석(런타임 경로 못 잡음, branch 커버리지 대비 정밀도 떨어짐).
- **Non-Goals**: 100% 커버리지 추구 (80% 수렴이 목표). plugins/primitives/ui 레이어 커버리지 (axis부터 PoC). 데모 컴포넌트의 시각적 품질 자동 판정.

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | axis 7개 중 대부분 커버리지 0% | scorecard 스크립트 실행 | 축별 stmts/branches/fns/composite 점수 + 갭 유형 출력 | |
| S2 | scorecard에서 tab.ts가 MISSING_DEMO로 식별됨 | LLM이 Act 단계 실행 | TabDemo.tsx 생성 + 데모 커버리지 테스트 생성 + tab.ts 커버리지 > 0% | |
| S3 | navigate.ts에 UNCOVERED_BRANCH (tabCycle) | LLM이 Act 단계 실행 | NavigateDemo에 tabCycle 토글 추가 + 테스트 보강 + 해당 branch 커버 | |
| S4 | Act 후 Re-score | 이전 점수와 비교 | delta 리포트 출력. 개선 없으면 STOP | |
| S5 | 전체 axis composite 평균 ≥ 80% | 루프 종료 판정 | 최종 scorecard 출력 + 요약 | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `scripts/axisScorecard.mjs` | coverage-final.json → `{ average: number, axes: AxisScore[] }` JSON 출력. AxisScore = `{ axis, file, stmts, branches, fns, composite, demoExists, testExists, gapType, uncoveredCount, uncovered[] }`. composite = branches×0.5 + stmts×0.3 + fns×0.2 | |
| 데모 커버리지 테스트 | `{Axis}Demo`를 렌더 → userEvent로 모든 옵션 조작 → DOM 상태 assertion. 파일: `src/interactive-os/__tests__/{axis}-demo-coverage.integration.test.tsx`. 각 describe = 데모의 한 모드/옵션 조합 | |
| `src/pages/axis/TabDemo.tsx` | tab.ts의 4전략(native/flow/loop/escape)을 select로 토글하는 데모. 기존 NavigateDemo 패턴(controls → Aria → 키 힌트) 준수 | |
| `docs/2-areas/axis/tab.md` | tab 축 스펙 문서. data-render로 TabDemo 임베드 | |

완성도: 🟢 — 프로토타입으로 출력 형식 검증 완료. AxisScore 스키마 확정.

## ③ 인터페이스

> CLI 스크립트 + vitest 파이프라인. 4단계 루프의 각 단계가 하나의 인터페이스.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| `pnpm vitest run --coverage **/*-demo-coverage*` | 데모 테스트 파일 존재 | 데모 렌더 → userEvent 조작 → v8 coverage 수집 | vitest v8 provider가 모듈별 실행 범위를 byte offset으로 추적, istanbul 포맷 변환 | coverage/coverage-final.json 생성 | |
| `node scripts/axisScorecard.mjs` | coverage-final.json 존재 | JSON 파싱 → 축별 점수 계산 + 갭 분류 | branchMap+b[]로 branch 단위 미커버 추출. demoExists/testExists는 파일시스템 체크. gapType 우선순위: MISSING_DEMO > MISSING_TEST > UNCOVERED_BRANCH > NONE | stdout에 scorecard JSON | |
| scorecard JSON + 소스 코드 → LLM | 갭 리포트 있음 | MISSING_DEMO: Demo 컴포넌트+MD+테스트 생성. MISSING_TEST: 기존 Demo를 렌더하는 테스트 생성. UNCOVERED_BRANCH: Demo에 옵션 추가+테스트 보강 | 갭 유형이 행동을 결정적으로 결정. 소스의 옵션/분기 구조가 데모 토글 설계를 결정 | 새/수정 파일. 기존 테스트 통과 필수 | |
| Re-score: vitest --coverage → axisScorecard | Act 완료 후 | 이전 JSON과 새 JSON 비교 | delta = 새 composite - 이전 composite. 축별 계산 | delta 리포트. 전체 delta ≤ 0이면 STOP. 평균 ≥ 80이면 SUCCESS | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| coverage-final.json 없음 | 테스트를 한 번도 안 돌린 상태 | scorecard는 입력이 없으면 행동할 수 없음 | "Run vitest --coverage first" 에러 메시지 + exit 1 | 변화 없음 | |
| 데모 파일은 있지만 happy-dom에서 렌더 불가능한 브라우저 API 사용 | 데모가 IntersectionObserver 등 사용 | happy-dom이 미지원 API를 만나면 테스트 실패. 커버리지 0으로 잡히는 게 거짓 갭이 됨 | 해당 축은 scorecard에서 `envLimit: true` 플래그. LLM Act에서 스킵 | scorecard에 표시만, Act 대상에서 제외 | |
| Act 후 기존 테스트 깨짐 | 데모 보강이 공유 데이터/컴포넌트에 영향 | 기존 동작 보호가 새 커버리지보다 우선 | `vitest run` (전체) 실패 시 Act 결과 revert. 해당 축 scorecard 변경 없음 | Act 이전 상태로 복원 | |
| 모든 축이 이미 composite ≥ 80% | 갭 없음 | 할 일 없는데 루프 돌리면 낭비 | "All axes above threshold. Done." 출력 후 종료 | 변화 없음 | |
| 3사이클 연속 delta ≤ 2% | 수렴 정체 | happy-dom 한계 등으로 더 올릴 수 없는 구간 진입 | 강제 종료 + 잔여 갭 리포트 출력 | 최종 scorecard 저장 | |
| value.ts처럼 데모가 없고 ValueDemo도 없는 축 | MISSING_DEMO | 데모 생성 시 소스의 옵션 구조를 읽어야 함 | LLM이 소스 파일을 읽고 옵션 타입에서 토글 UI 구조를 유도 | 새 Demo + Test 파일 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | test=demo=showcase 수렴 (feedback_test_equals_demo) | ② 데모 커버리지 테스트 | 준수 | — | |
| P2 | 계산은 unit, 인터랙션은 통합 (feedback_test_strategy) | ② 테스트 패턴 | 준수 — 데모 테스트는 userEvent→DOM 통합 | — | |
| P3 | mock 호출 검증 금지 (CLAUDE.md) | ③ Act 단계 | 준수 — assertion은 DOM 상태만 | — | |
| P4 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | ② TabDemo.tsx | 준수 — `export default function TabDemo` | — | |
| P5 | IA = 폴더 구조 일치 (discuss 배경) | ② tab.md + TabDemo | 준수 — routeConfig에 이미 tab 라우트 존재, 빈 페이지를 채우는 것 | — | |
| P6 | 디자인은 장식이 아니라 기능 (feedback_design_is_function) | ② 데모 컴포넌트 | 준수 — 데모의 토글 UI는 기능 시연 목적, 장식 불필요 | — | |
| P7 | LLM이 테스트로 스스로 검증 (feedback_self_verify) | ③ Re-score | 준수 — 커버리지 수치가 자동 검증 | — | |
| P8 | 이벤트 버블링 가드 (feedback_nested_event_bubbling) | ④ 데모 렌더 | 해당 없음 — axis 데모는 단일 Aria 인스턴스, 중첩 없음 | — | |

완성도: 🟢 — 위반 없음.

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| E1 | vitest.config.ts coverage.include | axis 폴더가 커버리지 대상에 추가됨 → CI 리포트 범위 확대 | 낮 | 허용 — 정보량 증가는 긍정적 | |
| E2 | 기존 데모 컴포넌트 (NavigateDemo 등) | Act 단계에서 토글 추가 시 기존 레이아웃 변경 가능 | 중 | ④ 경계의 "기존 테스트 깨짐 시 revert" 규칙으로 보호 | |
| E3 | routeConfig axis 그룹 | TabDemo 추가 시 라우트는 이미 존재하므로 변경 없음 | 낮 | 허용 — md 파일만 추가 | |
| E4 | coverage-final.json 크기 | 테스트 늘면 JSON 파일 커짐 | 낮 | 허용 — .gitignore에 이미 포함 (?) | |
| E5 | CI 실행 시간 | 데모 커버리지 테스트 7개 추가 시 CI 약간 느려짐 | 낮 | 허용 — 현재 테스트 831ms, 7개 추가해도 수 초 이내 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| D1 | 커버리지 올리기 위한 assertion 없는 테스트 코드 | ⑤ P3 mock 금지 + ⑤ P2 통합 테스트 | 키만 누르고 결과 안 보면 "동작"이 아니라 "실행"일 뿐 | |
| D2 | 데모에서 소스 코드의 내부 구현을 직접 import하여 호출 | ⑤ P1 test=demo=showcase | 데모는 사용자 관점 인터랙션이어야 함. engine.dispatch() 직접 호출 금지 | |
| D3 | 기존 데모의 토글/옵션 제거 | ⑥ E2 기존 레이아웃 변경 | 추가만 허용, 제거는 별도 판단 필요 | |
| D4 | happy-dom 미지원 API를 shim으로 억지 주입 | ⑥ 부작용 범위 제한 | 테스트 환경과 실제 환경 괴리 → 거짓 통과. envLimit 플래그로 표시하고 스킵 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | S1 | `pnpm vitest run --coverage **/*-demo-coverage*` → `node scripts/axisScorecard.mjs` 실행 | 7개 축의 composite 점수 + gapType JSON 출력. navigate > 0, 나머지 gapType 식별 | |
| V2 | S2 | MISSING_DEMO(tab) Act 후 재측정 | tab.ts composite > 0%. TabDemo.tsx 존재. tab-demo-coverage 테스트 통과 | |
| V3 | S3 | UNCOVERED_BRANCH(navigate tabCycle) Act 후 재측정 | navigate.ts의 line 30-50 커버됨. branches % 상승 | |
| V4 | S4 | 전체 테스트 suite(`pnpm vitest run`) 실행 | 기존 테스트 전부 통과. 새 테스트도 통과 | |
| V5 | S5 | 7개 축 전부 Act 완료 후 최종 scorecard | 평균 composite ≥ 80% 또는 3사이클 수렴 시 잔여 갭 리포트 | |
| V6 | 경계: JSON 없음 | coverage-final.json 없이 axisScorecard 실행 | 에러 메시지 + exit 1 | |
| V7 | 경계: 기존 테스트 깨짐 | Act 후 `vitest run` 실패 | Act 결과 revert, 해당 축 점수 변경 없음 | |
| V8 | D1 | 생성된 테스트에 assertion 존재 여부 | 모든 it 블록에 최소 1개 expect(DOM 상태) 포함 | |

완성도: 🟢

---

**전체 완성도:** ① 🟢 ② 🟢 ③ 🟢 ④ 🟢 ⑤ 🟢 ⑥ 🟢 ⑦ 🟢 ⑧ 🟢 → 8/8
