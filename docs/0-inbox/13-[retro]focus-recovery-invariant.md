# Retro: Focus Recovery Invariant — 2026-03-21

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-21-focus-recovery-invariant-prd.md
- **Diff 범위:** c3fed76 (1 commit)
- **커밋 수:** 1
- **변경 파일:** 4 src + 1 test + 1 docs

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 동기 | ✅ | M1~M4 전부 구현됨 | — |
| 2 | 인터페이스 | ✅ | 5개 행 모두 매칭 | — |
| 3 | 산출물 | ✅ | 3파일 변경 + 테스트 | — |
| 4 | 경계 | ✅ | 6개 경계 모두 커버 | — |
| 5 | 금지 | ✅ | F1~F4 모두 준수 | — |
| 6 | 검증 | ✅ | V1~V10 + V8(duplicate) 추가 | — |

**일치율:** 6/6

## 갭 상세

### ❌ PRD에 있는데 구현 안 됨
(없음)

### ⚠️ 구현됐는데 PRD에 없었음
- `spatialReachable = () => true` 공유 export — PRD는 CmsCanvas에서 inline 정의를 명시했으나, simplify 리뷰에서 module-level const로 개선. PRD보다 나은 결과.
- `core:focus` passthrough, `storeAfter === storeBefore` skip — 구현 레벨 디테일. PRD 추상화 수준에서는 누락 아님.

### 🔀 의도와 다르게 구현됨
(없음)

## 계층별 개선 제안

### L1 코드
(없음 — 갭 없음)

### L2~L4
(없음 — PRD가 충분히 촘촘했음)

### L5 사용자 피드백
(없음)

## 다음 행동
갭 없음. 완료.
