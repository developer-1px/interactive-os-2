# Retro: tab-axis — 2026-03-24

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-24-tab-axis-prd.md
- **Diff 범위:** 547a20e~1..4c1125f (7 커밋)
- **커밋 수:** 7
- **변경 파일:** 10

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | M1~M5 모두 구현 | — |
| ② | 산출물 | ✅ | 7개 산출물 전부 | — |
| ③ | 인터페이스 | ✅ | 4전략 + escape orientation + composePattern 우선순위 | — |
| ④ | 경계 | ✅ | 비활성 panel 스킵, 공존, 폴백, 순서 독립 | — |
| ⑤ | 원칙 대조 | ✅ | P1~P6 준수 | — |
| ⑥ | 부작용 | ⚠️ | 기존 테스트 getFocused 셀렉터 깨짐 미예측 | L2 |
| ⑦ | 금지 | ⚠️ | "tabindex=0 셀렉터 포커스 탐지 금지" 미도출 | L2 |
| ⑧ | 검증 | ✅ | V1~V11 커버 | — |

**일치율:** 6/8

## 갭 상세

### ⚠️ 구현됐는데 PRD에 없었음
- 기존 CMS 테스트의 `getFocused()` 셀렉터를 `document.activeElement`로 전환 필요 — focusStrategy 변경의 연쇄 영향
- `querySelector('[tabindex="0"]')`로 포커스 노드를 찾는 패턴이 natural-tab-order에서 깨짐

## 계층별 개선 제안

### L2 PRD 스킬
- PRD ⑥ 부작용 분석 시 "기존 테스트 코드"도 영향 범위에 포함해야 함
- focusStrategy 변경은 tabIndex 할당 방식을 바꾸므로, tabindex 기반 셀렉터를 사용하는 모든 테스트가 영향권

### L1 코드 — 처리 완료
- [x] CMS 테스트 getFocused → document.activeElement 전환 (커밋 6fe54e9)

## 다음 행동
- L2 보강: PRD 스킬에 "테스트 코드 영향" 체크리스트 검토 (이미 존재하나 focusStrategy→tabIndex 연쇄를 구체적으로 명시 필요)
