# Retro: Combobox 완성 — 2026-03-19

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-19-combobox-complete-prd.md
- **Diff 범위:** 892ba36..c1689f4

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 유저 스토리 | 🔀 | US5(토큰 ←→ 이동) 미구현 | L1 |
| 2 | 화면 구조 | ✅ | — | — |
| 3 | 인터랙션 맵 | 🔀 | 토큰 ←→ 이동, Space 토글(non-editable multi), Tab 미검증 | L1 |
| 4 | 상태 전이 | ✅ | — | — |
| 5 | 시각적 피드백 | 🔀 | 토큰 포커스 accent border 없음 (←→ 없으므로) | L1 |
| 6 | 데이터 모델 | ✅ | — | — |
| 7 | 경계 조건 | ✅ | — | — |
| 8 | 접근성 | 🔀 | aria-multiselectable 미설정 | L1 |
| 9 | 검증 기준 | ✅ | — | — |

**일치율: 6/9**

## 계층별 개선 제안

### L1 코드 — 백로그
- [ ] 토큰 ←→ 키보드 이동 (토큰 포커스 state + 방향키 핸들러)
- [ ] 토큰 포커스 시 accent border CSS
- [ ] Space 토글 (non-editable multi-select 모드)
- [ ] aria-multiselectable="true" on listbox (multi mode)
- [ ] Tab 동작 검증 테스트

### L2~L5
- 해당 없음
