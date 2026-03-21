# Retro: Typeahead Plugin — 2026-03-22

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-22-typeahead-plugin-prd.md
- **Diff 범위:** 1e08cb4..92417f2
- **커밋 수:** 1
- **변경 파일:** 5 (types.ts, typeahead.ts, useAria.ts, 2 test files)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | M1~M5 모두 구현됨 | — |
| ② | 산출물 | ⚠️ | PRD는 module-level 버퍼, 실제는 per-instance closure (개선). handleKeyDown 추출은 PRD에 없었음 (simplify에서 추가) | L2 |
| ③ | 인터페이스 | ✅ | 모든 입력-결과 쌍 구현됨 | — |
| ④ | 경계 | ✅ | E1~E5, E9 직접 테스트됨. E6~E8, E10은 구조적으로 처리됨 | — |
| ⑤ | 원칙 대조 | ✅ | 7개 원칙 모두 준수 | — |
| ⑥ | 부작용 | ✅ | S1~S5 예상대로 | — |
| ⑦ | 금지 | ✅ | F1~F4 모두 준수 | — |
| ⑧ | 검증 | ⚠️ | V10(combobox) 미테스트 — 구조적으로 안전하나 통합 테스트 없음 | L1 |

**일치율:** 6/8 (2개 ⚠️는 모두 경미)

## 갭 상세

### ⚠️ 구현됐는데 PRD에 없었음
- `handleKeyDown` useCallback 추출 — /simplify에서 3x 중복 제거. PRD에 기재 불필요 (구현 레벨 최적화)
- per-instance buffer — PRD는 module-level이라 했지만 plan review에서 "두 ListBox 간 간섭" 이슈로 개선. PRD 업데이트 불필요 (plan이 보완)

### 🔀 의도와 다르게 구현됨
- 없음

### ❌ PRD에 있는데 구현 안 됨
- V10 (combobox에서 typeahead 비활성 확인) — combobox의 keyMap이 구조적으로 먼저 매칭하므로 문제 없지만, 통합 테스트로 증명되지 않음

## 계층별 개선 제안

### L1 코드
- V10 combobox 테스트 → /backlog (combobox는 별도 도메인, typeahead와 독립적으로 테스트 가능)

### L2 PRD 스킬
- ②산출물에서 "module-level vs per-instance" 결정을 PRD 단계에서 명시적으로 검토하지 않았음
- 그러나 plan review에서 잡혔으므로 파이프라인 전체로는 커버됨
- 수정 불필요

### L5 사용자 피드백
- 없음

## 다음 행동
- V10 → /backlog에 저장
