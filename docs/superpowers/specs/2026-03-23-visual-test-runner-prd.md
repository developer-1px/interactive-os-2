# Visual Test Runner — PRD

> Discussion: LLM 시대 FE 검증 — vitest 테스트를 서비스 데모 페이지에서 브라우저로 직접 실행하여 눈으로 확인. 서비스가 주인, vitest 서버로 가지 않는다.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | vitest 테스트가 happy-dom에서 pass/fail 텍스트로만 결과를 보여줌 | LLM이 FE 코드+테스트를 생성하고 pass를 보고함 | 사람이 실제 인터랙션을 눈으로 확인할 수 없어 "테스트 통과 = 품질 보증" 착각 발생 | |
| M2 | 테스트가 인라인 fixture를 사용(ListBox 자체 fixtureData) | 데모 페이지는 별도 showcaseFixtures 사용 | 테스트 통과해도 데모에서 동일 인터랙션이 안 될 수 있음 (부분 검사가 누락을 숨김) | |
| M3 | 개발자가 서비스를 localhost:5173에서 개발 중 | 테스트를 눈으로 확인하고 싶음 | vitest 서버(별도 포트)로 이동해야 함 — 서비스 개발 흐름이 끊김 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/testRunner/vitestShim.ts` | vitest API(describe, it, expect, beforeEach, afterEach)의 브라우저 구현. 실행 + 시각적 pass/fail 피드백 | |
| `src/testRunner/runTest.ts` | 테스트 파일을 동적 import하여 브라우저에서 실행하는 러너 함수 | |
| `src/testRunner/TestRunnerPanel.tsx` | 데모 페이지에 삽입되는 UI — Run Test 버튼, 테스트 목록, 실시간 pass/fail 표시 | |
| Vite 플러그인 (`vite-plugin-browser-test`) | `?browser` 쿼리 시 `from 'vitest'` → `from '@/testRunner/vitestShim'`으로 import 교체 | |
| 프로토타입 대상: `listbox-keyboard.integration.test.tsx` | 기존 테스트 코드 변경 없이 브라우저에서 실행되는 첫 번째 검증 | |

**산출물 관계:**
```
데모 페이지
├── TestRunnerPanel
│   ├── [▶ Run Test] 버튼
│   └── 테스트 결과 목록 (describe/it 구조, 🟢/🔴)
│
└── 테스트 렌더 영역
    └── render()가 그리는 컴포넌트 (실제 DOM)

import 흐름:
test.tsx?browser → Vite 플러그인 → 'vitest' → vitestShim
                                  → '@testing-library/*' → 그대로 (브라우저에서 동작)
                                  → '../ui/ListBox' → 그대로 (서비스 번들)
```

완성도: 🟢

## ③ 인터페이스

> 이 기능은 UI 인터랙션 컴포넌트가 아니라 **개발 도구**이므로, 키보드 전수 검토 대신 사용자 행위 기반으로 작성.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Run Test 버튼 클릭 | 데모 페이지 열림, 테스트 미실행 | 테스트 파일을 `?browser` 쿼리로 dynamic import → vitestShim의 describe/it이 테스트 함수 수집 → 순차 실행 | vitestShim이 describe/it을 "등록 → 실행" 2단계로 처리하므로 전체 구조를 먼저 파악한 뒤 순서대로 실행 | 테스트 렌더 영역에 컴포넌트 표시 + TestRunnerPanel에 결과 실시간 갱신 | |
| 개별 describe 그룹 클릭 | 전체 테스트 결과 표시 중 | 해당 그룹만 재실행 | 전체 재실행 없이 특정 시나리오만 확인하고 싶을 때 | 해당 그룹 결과만 갱신, 나머지 유지 | |
| 테스트 실행 중 | it 블록 순차 실행 | 각 it마다: userEvent가 실제 DOM에 이벤트 발생 → expect가 DOM 상태 검증 → pass/fail을 vitestShim이 수집 | userEvent와 render는 원본 라이브러리 그대로이므로 실제 브라우저 이벤트가 발생 | 포커스 이동, 선택 상태 변경이 눈앞에서 보임 + 각 it에 🟢/🔴 표시 | |
| 테스트 완료 | 모든 it 실행 완료 | 전체 결과 요약 (passed/failed/total) | — | TestRunnerPanel에 최종 결과 표시, 컴포넌트는 마지막 상태 유지 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| expect 실패 (assertion error) | it 블록 실행 중 | 실패해도 다음 it을 계속 실행해야 전체 결과를 한눈에 볼 수 있음 | 해당 it을 🔴 표시, 에러 메시지 저장, 다음 it 계속 실행 | 전체 결과에 실패 수 반영 | |
| render()가 이전 테스트 DOM을 남김 | 이전 it의 컴포넌트가 DOM에 있음 | 테스트 간 격리 없으면 이전 상태가 다음 테스트에 영향 | 각 it 실행 전 테스트 렌더 영역 cleanup | 깨끗한 DOM에서 새 it 시작 | |
| 테스트 파일이 vi.fn() 사용 | 일부 테스트가 vitest mock API 사용 | 통합 테스트는 mock 금지 원칙이므로 vi.fn은 대상 외. 만나면 에러보다 skip이 나음 | vi.fn()은 noop 함수 반환, vi.mock은 무시 + 콘솔 경고 | 해당 테스트 skip 표시 | |
| 테스트가 비동기 타이밍 이슈 | happy-dom과 실제 브라우저의 이벤트 타이밍 차이 | 브라우저가 실제 환경이므로 더 정확하나, React batching 등으로 타이밍 다를 수 있음 | userEvent의 내장 await가 처리. 실패 시 해당 it 🔴 표시 (이것이 진짜 버그 발견) | 타이밍 관련 실패 = 실제 환경 갭 감지 (가치) | |
| 테스트 파일에 `@vitest-environment node` 주석 | 순수 계산 테스트 | node 환경 전용 테스트는 브라우저에서 실행 불가 (fs, path 등) | import 시 감지하여 skip + "node-only test" 메시지 | 해당 테스트 skip | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | 테스트 원칙: 계산→unit, 인터랙션→통합(userEvent→DOM) (feedback_test_strategy) | ③ 전체 | ✅ 준수 — userEvent가 그대로 실제 DOM에서 동작 | — | |
| P2 | mock 호출 검증 금지 (feedback_test_strategy) | ④ vi.fn 경계 | ✅ 준수 — vi.fn은 noop, 통합 테스트 대상만 실행 | — | |
| P3 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | ② 산출물 | ✅ 준수 — vitestShim.ts, runTest.ts, TestRunnerPanel.tsx | — | |
| P4 | barrel export 금지 (CLAUDE.md) | ② 산출물 | ✅ 준수 — 각 파일이 독립 export | — | |
| P5 | 부분 검사는 누락을 숨긴다 (discussion K2) | ② fixture 분리 여부 | ⚠️ 주의 — 프로토타입은 기존 인라인 fixture 그대로 실행. 궁극적으로 실제 페이지 렌더로 전환 필요 | 프로토타입 후 2단계로 실제 페이지 렌더 전환 계획 | |
| P6 | 서비스가 주인 (discussion K3) | ③ 전체 | ✅ 준수 — 서비스 데모 페이지에서 실행, vitest 서버 불필요 | — | |
| P7 | FSD 아키텍처 (CLAUDE.md) | ② 파일 위치 | ✅ 준수 — testRunner/는 독립 feature 디렉토리 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | Vite 빌드 파이프라인 (플러그인 추가) | `?browser` 쿼리 미사용 시 영향 없음. 사용 시에만 transform 발생 | 낮 | 플러그인이 `?browser` 쿼리 없는 import에는 개입하지 않음 | |
| S2 | 프로덕션 번들 크기 | testRunner 코드가 프로덕션에 포함될 수 있음 | 중 | 데모 페이지 라우트에서만 lazy import. 프로덕션 빌드 시 tree-shaking 또는 별도 엔트리 | |
| S3 | 기존 vitest CI 실행 | 플러그인이 vitest 실행에 영향 줄 수 있음 | 중 | vitest.config.ts와 vite.config.ts 분리 (현재 이미 분리됨). 플러그인은 vite.config에만 추가 | |
| S4 | @testing-library/react의 cleanup | render()가 브라우저 DOM에 남음 | 낮 | vitestShim의 it 실행 전 cleanup 호출 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | 테스트 코드를 수정하여 브라우저에서 돌아가게 만들기 | discussion 원칙 "vitest 코드를 그대로 활용" | 이중 유지 비용, 원본과의 diverge | |
| X2 | vitestShim에서 vitest의 전체 API를 구현하기 | ⑤ P2 mock 금지 + 실용성 | 통합 테스트가 쓰는 API만: describe, it, expect(.toBe, .toHaveAttribute 등), beforeEach, afterEach | |
| X3 | 플러그인이 `?browser` 없는 import를 변환 | ⑥ S1/S3 | 기존 빌드/테스트 파이프라인 오염 | |
| X4 | 프로덕션 빌드에 testRunner 포함 | ⑥ S2 | 번들 크기, 개발 도구가 프로덕션에 노출 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | listbox-keyboard 테스트를 데모 페이지에서 Run Test 버튼으로 실행 | 브라우저에서 ListBox가 렌더되고, 포커스 이동이 눈으로 보이며, 11개 it 전부 🟢 | |
| V2 | ①M2 | 테스트 코드를 한 줄도 수정하지 않고 V1 달성 | 원본 `listbox-keyboard.integration.test.tsx`가 `?browser` import로 그대로 실행 | |
| V3 | ①M3 | localhost:5173의 데모 페이지에서 직접 실행, vitest 서버 불필요 | vitest가 실행 중이 아니어도 Run Test 동작 | |
| V4 | ④ expect 실패 | expect를 의도적으로 실패하게 수정 후 실행 | 해당 it 🔴 표시, 에러 메시지 표시, 나머지 it 계속 실행 | |
| V5 | ④ cleanup | 테스트 실행 후 다시 Run Test | 이전 실행 결과가 초기화되고 새로 실행 | |
| V6 | ④ vi.fn | vi.fn을 사용하는 테스트 파일을 import 시도 | vi.fn은 noop 반환, 해당 테스트 실행되되 mock 관련 assertion은 skip | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

**교차 검증:**
1. 동기 ↔ 검증: M1→V1, M2→V2, M3→V3 ✅
2. 인터페이스 ↔ 산출물: RunTest→runTest.ts, 결과→TestRunnerPanel, import→Vite플러그인 ✅
3. 경계 ↔ 검증: expect실패→V4, cleanup→V5, vi.fn→V6 ✅
4. 금지 ↔ 출처: X1←discussion, X2←P2, X3←S1/S3, X4←S2 ✅
5. 원칙 대조 ↔ 전체: P5 주의사항은 프로토타입 범위로 허용 ✅
