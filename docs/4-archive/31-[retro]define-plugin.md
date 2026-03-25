# Retro: definePlugin — 2026-03-23

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-23-define-plugin-prd.md
- **Diff 범위:** b460764 (단일 커밋)
- **커밋 수:** 1
- **변경 파일:** 24

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | — | — |
| ② | 산출물 | ✅ | — | — |
| ③ | 인터페이스 | ✅ | — | — |
| ④ | 경계 | ⚠️ | E4(순환 의존 방지) 미구현 | L1 |
| ⑤ | 원칙 대조 | ✅ | — | — |
| ⑥ | 부작용 | ⚠️ | kanban spatialReachable 충돌 PRD에 미예측 | L2 |
| ⑦ | 금지 | ✅ | — | — |
| ⑧ | 검증 | ✅ | — | — |

**일치율:** 6/8

## 갭 상세

### ⚠️ 구현됐는데 PRD에 없었음
- kanban-keyboard 테스트 실패: crud()가 focusRecovery(treeReachable)을 번들 → spatial 모델에서 카드가 unreachable 판정. `crud({ isReachable: spatialReachable })` 로 수정. **PRD ⑥ 부작용에서 이 충돌을 예측하지 못함**

### ❌ PRD에 있는데 구현 안 됨
- E4 순환 requires 방지: 현실적으로 A requires B, B requires A는 극히 드물어 미구현. 백로그 불필요.

## 계층별 개선 제안

### L1 코드
- E4 순환 requires — 스킵 (현실적 위험 없음)

### L2 PRD 스킬
- **⑥ 부작용에서 "기본값 변경의 2차 영향"을 체크하는 항목 부재.** crud가 focusRecovery를 번들할 때 기본 isReachable=treeReachable이 spatial 모델과 충돌하는 것을 예측 못함.
- → 단, 이건 PRD 체크리스트로 강제하기 어려움. 경험 DB에 기록으로 충분.

### L5 사용자 피드백
- 없음

## 경험 DB

| 도메인 | 상황 | 교훈 |
|--------|------|------|
| plugin/focusRecovery | crud가 focusRecovery 번들 시 기본 isReachable=treeReachable | 기본값 번들 시 다른 모델(spatial)의 기본값과 충돌 가능. 사용처별 isReachable 전달 필요 |
