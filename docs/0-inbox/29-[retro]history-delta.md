# Retro: History Delta-Based Undo/Redo — 2026-03-23

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-23-history-delta-prd.md
- **Diff 범위:** 38fc271..HEAD
- **커밋 수:** 6 (코드 4 + docs 2)
- **변경 파일:** 4 (computeStoreDiff.ts, dispatchLogger.ts, history.ts, treegrid/dispatch-logger tests)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | M4(slider), M6(메모리)는 역PRD 미언급이나 구현 정확 | — |
| ② | 산출물 | ✅ | 완전 일치 | — |
| ③ | 인터페이스 | ✅ | 완전 일치 | — |
| ④ | 경계 | ⚠️ | batch 경계(E1-E3) 역PRD 미포착. PRD가 더 촘촘 | — |
| ⑤ | 원칙 대조 | ✅ | focus recovery 잠재 위반 → PRD P1에서 해결 | — |
| ⑥ | 부작용 | ✅ | 일치 | — |
| ⑦ | 금지 | ✅ | 일치 | — |
| ⑧ | 검증 | ✅ | V1-V10 테스트 대응 | — |

**일치율:** 7/8

## 갭 상세

### ❌ PRD에 있는데 구현 안 됨
- 없음

### ⚠️ 구현됐는데 PRD에 없었음
- `summarizeValue` logger 헬퍼 — PRD S4 부작용 대응으로 추가. PRD에 산출물로 명시 안 됨 (minor)

### 🔀 의도와 다르게 구현됨
- PRD `kind: 'reordered'` → 구현은 `kind: 'changed'` (이미 PRD 업데이트 완료)
- PRD `path: 'relationships:key'` → 구현은 raw key (이미 PRD 업데이트 완료)

## 계층별 개선 제안

### L1 코드
- 없음

### L2 PRD 스킬
- 없음 (PRD가 역PRD보다 촘촘 — 긍정적 신호)

### L3 스킬
- 없음

### L4 지식
- 없음 (expand not history 이미 discussion에서 memory 저장 완료)

### L5 사용자 피드백
- 없음

## 다음 행동
- L1 백로그 없음
- PRD 아카이브 실행
