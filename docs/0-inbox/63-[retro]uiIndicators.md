# Retro: UI Indicators Phase 1 — 2026-03-28

## 비교 기준
- **PRD:** docs/superpowers/prds/2026-03-28-ui-indicators-prd.md
- **Diff 범위:** 0f28a57..e19231a
- **커밋 수:** 1
- **변경 파일:** 24

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | — | — |
| ② | 산출물 | ✅ | Phase 1 범위 5/18 구현, 나머지 Phase 2-3 예정대로 미구현 | — |
| ③ | 인터페이스 | ✅ | Phase 1 행 전부 일치 | — |
| ④ | 경계 | ✅ | Phase 1 해당 경계(className, expanded undefined) 준수 | — |
| ⑤ | 원칙 대조 | 🔀 | P1 위반: switch thumb raw 2px (기존 코드 이관, 토큰 부재) | L1 |
| ⑥ | 부작용 | 🔀 | Breadcrumb: chevron→line 시각 변경 (의도적). AppShell에 Chat nav 추가 (PRD 범위 밖 변경 혼입) | L1 |
| ⑦ | 금지 | ✅ | F3(raw 수치) 외 전부 준수 | — |
| ⑧ | 검증 | 🔀 | V9/V10 스크린샷 비교 미수행 | L1 |

**일치율:** 5/8 (Phase 1 범위 한정)

## 갭 상세

### 🔀 의도와 다르게 구현됨

1. **⑤ P1 — raw 2px**: `indicators.css` switch thumb `top:2px; left:2px`가 토큰이 아님. 기존 `interactive.css`에서 그대로 이관. `--space-inline-code: 2px`는 의미 불일치. 전용 토큰 `--switch-thumb-inset` 필요.
2. **⑥ Breadcrumb 시각 변경**: ChevronRight(12px) → SeparatorIndicator(1px line). 시각 형태 변경이 의도적이나 PRD에 명시 안 됨.
3. **⑥ AppShell Chat nav**: 커밋에 indicator와 무관한 Chat nav 항목이 포함됨 (기존 unstaged 변경이 함께 커밋).

### ❌ 미수행

4. **V9/V10 스크린샷 비교**: 시각 회귀 검증 미수행 (브라우저 캡처 누락).
5. **M3 "18개 indicator × 상태 조합 grid"**: showcase는 props 문서 형태, 인터랙티브 상태 조합 grid 아님. Phase 1 범위에서는 5개만 문서화.

## 계층별 개선 제안

### L1 코드 — /backlog
- [ ] `indicators.css` switch thumb `2px` → `--switch-thumb-inset` 토큰 도입 (tokens.css 확장 필요)
- [ ] showcase를 인터랙티브 데모(상태 조합 grid)로 개선 (Phase 2-3와 병행)

### L5 사용자 피드백
- 없음

## 다음 행동
- L1 backlog 2건은 Phase 2에서 함께 처리
- PRD → archive 이동 (Phase 1 완료)
