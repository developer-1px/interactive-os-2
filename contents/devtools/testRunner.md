# Test Runner

> 브라우저 내 vitest 테스트 실행. vitest API를 shim으로 교체하여 코드 변경 없이 브라우저에서 시각 검증.

## 원리

- vitest의 `describe/it/expect` → `vitestShim`으로 교체
- `@testing-library/react` → `rtlShim`으로 교체
- Vite 플러그인(`browserTestPlugin`)이 `?browser` 쿼리 시 자동 교체
- 이중 실행: vitest(CI, jsdom) + Test Runner(브라우저, 시각 검증)

## 파일

| 파일 | 역할 |
|------|------|
| `src/devtools/testRunner/TestRunnerPanel.tsx` | 테스트 결과 UI (그룹/개별 pass/fail) |
| `src/devtools/testRunner/runTest.ts` | 오케스트레이터 (`runTest`, `demoTest`) |
| `src/devtools/testRunner/vitestShim.ts` | vitest API shim (describe, it, expect, vi) |
| `src/devtools/testRunner/rtlShim.ts` | RTL shim (render, screen, act) + demo mode |
| `src/devtools/testRunner/browserTestPlugin.ts` | Vite 플러그인 — import 교체 |
