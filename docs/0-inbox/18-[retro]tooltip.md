# Retro: Tooltip — 2026-03-21

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-21-tooltip-prd.md
- **Diff 범위:** 6ccff14..45a27e0
- **커밋 수:** 1
- **변경 파일:** 3 (Tooltip.tsx, Tooltip.css, tooltip.test.tsx)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 동기 | ✅ | — | — |
| 2 | 인터페이스 | ✅ | — | — |
| 3 | 산출물 | ✅ | — | — |
| 4 | 경계 | ✅ | — | — |
| 5 | 금지 | ✅ | — | — |
| 6 | 검증 | ✅ | — | — |

**일치율:** 6/6

## 갭 상세

### ❌ PRD에 있는데 구현 안 됨
- 없음

### ⚠️ 구현됐는데 PRD에 없었음
- `position-try-fallbacks: flip-block` — 화면 하단 공간 부족 시 상단 전환. CSS 방어 코드로 좋은 추가
- props 보존 테스트 — cloneElement 사용 시 기존 props가 유실되지 않는지 검증. PRD 검증에 없었지만 안전장치

### 🔀 의도와 다르게 구현됨
- 없음

## 계층별 개선 제안

### L1 코드
- 없음

### L2 PRD 스킬
- ⚠️ `position-try-fallbacks`처럼 CSS positioning의 fallback 전략은 경계 항목에서 자연스럽게 나와야 하나, PRD 스킬의 경계 체크리스트에 "positioning overflow/fallback" 항목이 없음. 다만 이번 구현은 CSS Anchor Positioning이라는 새 기술이라 기존 체크리스트로는 커버 안 됨 — 빈도 누적 관찰 후 판단
- ⚠️ cloneElement 사용 시 props 보존은 React 공통 패턴. PRD 검증에 "wrapper 컴포넌트의 props 투과" 체크를 넣을지 빈도 관찰

### L3~L4
- 없음

### L5 사용자 피드백
- 없음

## 다음 행동
- L1 없음 — 수정 불필요
- 검증 3~8 (브라우저 동작) → `/reproduce`로 별도 확인 가능
