# Visual Test Runner — Plan

> PRD: `docs/superpowers/specs/2026-03-23-visual-test-runner-prd.md`

## Task 분해

### Task 1: Vite 플러그인 (`browserTestPlugin`)
- **파일**: `src/testRunner/browserTestPlugin.ts`
- **역할**: `?browser` 쿼리가 붙은 import에서 `from 'vitest'` → `from '@/testRunner/vitestShim'`으로 교체
- **의존**: 없음 (독립)
- **검증**: 플러그인 단독 테스트 — transform 함수가 올바르게 교체하는지

### Task 2: vitestShim
- **파일**: `src/testRunner/vitestShim.ts`
- **역할**: describe, it, expect, beforeEach, afterEach의 브라우저 구현
- **핵심 설계**:
  - describe/it은 "등록 → 실행" 2단계. import 시 등록, run() 호출 시 실행
  - expect: toBe, toBeTruthy, toBeFalsy, toBeNull, toBeInstanceOf, toHaveAttribute (listbox 테스트가 사용하는 것)
  - it 실행 전 render cleanup (document에서 testing-library 컨테이너 제거)
  - 실패해도 다음 it 계속 (try-catch)
  - vi 객체: fn → noop 반환, mock → 무시 + 경고
  - 결과 수집: { name, status, error? } 배열
- **의존**: 없음 (독립)
- **검증**: listbox-keyboard 테스트 파일을 shim으로 import하여 전체 pass

### Task 3: runTest
- **파일**: `src/testRunner/runTest.ts`
- **역할**: 테스트 파일 경로를 받아 dynamic import(`?browser`) → vitestShim의 run() 호출 → 결과 반환
- **의존**: Task 1, Task 2
- **검증**: runTest('listbox-keyboard') 호출 시 결과 배열 반환

### Task 4: TestRunnerPanel
- **파일**: `src/testRunner/TestRunnerPanel.tsx`
- **역할**: UI 컴포넌트 — Run Test 버튼, describe/it 트리 구조, 🟢/🔴 표시, 에러 메시지
- **의존**: Task 3
- **검증**: 브라우저에서 렌더 + Run Test 클릭 → 결과 표시

### Task 5: 데모 페이지 통합
- **역할**: 기존 데모 페이지(예: `/collection/listbox`)에 TestRunnerPanel 삽입
- **의존**: Task 4
- **검증**: V1~V3 (PRD 검증 시나리오)

## 실행 순서

Task 1, 2는 독립 → **병렬 실행 가능**
Task 3은 1+2 완료 후
Task 4는 3 완료 후
Task 5는 4 완료 후

```
[Task 1: 플러그인] ──┐
                     ├──→ [Task 3: runTest] → [Task 4: Panel] → [Task 5: 통합]
[Task 2: vitestShim] ┘
```

## 구현 노트

### vitestShim expect 구현 범위
listbox-keyboard.integration.test.tsx가 사용하는 패턴:
- `expect(value).toBe(expected)` — 엄격 동등
- `expect(node?.getAttribute('data-selected')).toBe('true')` — getAttribute + toBe

최소 구현: toBe만으로 프로토타입 통과. 다른 matcher는 점진적 추가.

### Vite 플러그인 transform 규칙
```
입력: import { describe, it, expect } from 'vitest'
출력: import { describe, it, expect } from '/src/testRunner/vitestShim'

조건: 파일 id에 '?browser' 포함 시에만
```

### render cleanup 전략
@testing-library/react의 cleanup()을 각 it 실행 전에 호출.
이전 테스트의 DOM 잔여물 제거.
