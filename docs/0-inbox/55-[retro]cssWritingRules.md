# Retro: CSS Writing Rules — 2026-03-25

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-25-css-writing-rules-prd.md
- **Diff 범위:** cb0336d (단일 커밋)
- **변경 파일:** 8

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | — | — |
| ② | 산출물 | 🔀 | stylelint의 `:where()` 강제 + structure 속성 경고 미구현 (커스텀 플러그인 필요) | L1, L2 |
| ③ | 인터페이스 | ✅ | — | — |
| ④ | 경계 | ✅ | — | — |
| ⑤ | 원칙 대조 | ✅ | — | — |
| ⑥ | 부작용 | ✅ | — | — |
| ⑦ | 금지 | ✅ | — | — |
| ⑧ | 검증 | 🔀 | V4(`:where()` lint) 미구현, V6(시각 검증) 미실시 | L1 |

**일치율:** 6/8

## 갭 상세

### 🔀 의도와 다르게 구현됨

1. **② stylelint `:where()` 강제 + module.css display:flex/grid 경고**: PRD에 "`:where()` 강제, structure 속성 경고"라고 명시했으나, 이 두 규칙은 stylelint standard에 없고 **커스텀 플러그인**이 필요하다. stylelint.config.mjs에서 margin 금지는 구현했지만, 나머지 2개는 향후 과제.

2. **⑧ V6 시각 검증**: `:where()` 래핑 전후 브라우저 스크린샷 비교를 PRD가 요구하지만, 이번 세션에서 실시하지 않았다. vitest 806 tests 통과로 로직 검증은 완료.

## 계층별 개선 제안

### L1 코드 — /backlog
- [ ] stylelint 커스텀 플러그인: `:where()` 강제 (components.css에서 `[data-aria-container]` 셀렉터가 `:where()` 밖에 있으면 error)
- [ ] stylelint 커스텀 플러그인: module.css에서 display:flex/grid 사용 시 warning
- [ ] `:where()` 래핑 전후 브라우저 시각 비교 (dev server에서 페이지별 확인)

### L2 PRD 스킬
- PRD ② 산출물에 "구현 가능성 확인" 체크가 없음. "stylelint로 강제"라고 적었지만 실제로 standard 규칙으로 가능한지 확인하지 않았음.
- **조치 불요**: 이번 케이스는 커스텀 플러그인이 필요한 특수 케이스. PRD 스킬 수준에서 "모든 도구의 기능 범위를 확인하라"는 체크리스트는 과도.

### L5 사용자 피드백
- 없음

## 다음 행동
- L1 3개 항목을 `/backlog`에 저장
- 시각 검증은 다음 CSS 작업 시 함께 실시
