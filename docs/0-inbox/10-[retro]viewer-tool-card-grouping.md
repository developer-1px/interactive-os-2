# Retro: Viewer Tool Card Grouping — 2026-03-22

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-22-viewer-tool-card-prd.md
- **Diff 범위:** 9208671..4c6dea4
- **커밋 수:** 1
- **변경 파일:** 5 (groupEvents.ts, TimelineColumn.tsx, TimelineColumn.module.css, groupEvents.test.ts, PROGRESS.md)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | — | — |
| ② | 산출물 | ⚠️ | TimelineEvent 이동, 테스트 파일, dead code 정리가 PRD에 미명시 | L2 |
| ③ | 인터페이스 | ✅ | — | — |
| ④ | 경계 | ✅ | — | — |
| ⑤ | 원칙 대조 | 🔀 | P2 "새 파일 불필요" → 실제로 분리됨 (정당화됨) | L2 |
| ⑥ | 부작용 | ⚠️ | onClick prop 제거 부작용 미예측 (의도된 변경이나 PRD에 없음) | L2 |
| ⑦ | 금지 | 🔀 | F3 "새 파일 분리 금지" 위반 (정당화됨) | L2 |
| ⑧ | 검증 | ✅ | — | — |

**일치율:** 4/8 완전 일치, 4/8 사소한 deviation

## 갭 상세

### ⚠️ 구현됐는데 PRD에 없었음
- TimelineEvent 인터페이스를 groupEvents.ts로 이동 (순환 의존 해소)
- groupEvents.test.ts 7 unit tests (원칙 P3에 부합하나 산출물 표에 미명시)
- TimelineItem에서 tool_use 분기 제거 + onClick prop 제거 (dead code 정리)

### 🔀 의도와 다르게 구현됨
- F3 "새 파일 분리 금지" → groupEvents.ts 분리됨. 정당화: 순수 함수 테스트 + 순환 의존 해소

## 계층별 개선 제안

### L2 PRD 스킬
- PRD 산출물(②)에 "테스트 파일"을 자동 포함하는 체크리스트 항목 추가 고려
- PRD 금지(⑦)에 "테스트 대상 순수 함수의 파일 분리는 예외" 명시 고려
- 이번 건은 deviation이 모두 개선 방향이므로 즉시 수정 불필요

### L1 코드
- 없음

### L5 사용자 피드백
- 없음

## 다음 행동
- L1 항목 없음 — 코드 수정 불필요
- L2 deviation은 사소하고 개선 방향 — PRD 스킬 수정은 패턴 반복 시 검토
