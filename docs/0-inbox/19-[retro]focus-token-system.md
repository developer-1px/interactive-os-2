# Retro: Focus Token System — 2026-03-21

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-21-focus-token-system-prd.md
- **Diff 범위:** cccc347..62f2eb9
- **커밋 수:** 1
- **변경 파일:** 6 (tokens.css, components.css, kanban.css, slider.css, spinbutton.css, PageVisualCms.css)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| 1 | 동기 | ✅ | 4/4 일치 | — |
| 2 | 인터페이스 | ✅ | 8/8 일치 | — |
| 3 | 산출물 | 🔀 | 10/11 일치. combobox 셀렉터 전환 미실행 (구조적 불가) | L2 |
| 4 | 경계 | ✅ | 7/7 일치 + Tab 방어 추가 | — |
| 5 | 금지 | ✅ | 6/6 준수 | — |
| 6 | 검증 | ✅ | 7/7 일치 | — |

**일치율:** 6/6 (산출물 1건 구조적 불가로 🔀, 의도 실패 아님)

## 갭 상세

### 🔀 의도와 다르게 구현됨
- **combobox.css 셀렉터 전환**: PRD에 "className → `[data-focused]` 셀렉터로 전환"으로 기재했으나, 실제로 combobox 드롭다운은 `[data-aria-container]` 밖에 렌더링되어 ARIA 셀렉터 전환이 구조적으로 불가능. 토큰 값은 `--bg-focus`를 올바르게 참조하므로 기능적 문제 없음.

### ⚠️ 구현됐는데 PRD에 없었음
- **outline 기본값 추가**: `outline: 1.5px solid transparent` 3곳 — focus→outline-color 전환을 위한 기반. PRD 산출물에 누락.
- **Tab `[data-focused]` 방어**: code review에서 발견한 latent risk 대응. PRD 경계 항목에 누락.
- **spinbutton 중복 invalid 룰 제거**: simplify에서 발견. PRD 범위 밖이나 자연스러운 정리.

## 계층별 개선 제안

### L1 코드
(없음 — 모든 의도가 구현됨)

### L2 PRD 스킬
- combobox처럼 "구조적으로 전환 불가능한 컴포넌트"를 PRD 작성 시점에 사전 확인하지 못함
- **원인**: PRD 산출물을 채울 때 "이 변경이 실제로 가능한가?"를 코드 구조로 검증하는 단계가 없었음
- **제안**: PRD 산출물 항목에 "구현 가능성 확인" 체크 추가 — 다만 이번 케이스는 PRD 대화에서 (?)로 표기했고 실행 단계에서 발견했으므로 프로세스가 작동한 셈

### L3 스킬
(없음)

### L4 지식
(없음 — discussion에서 확정된 원칙이 이미 memory에 반영됨)

### L5 사용자 피드백
(없음)

## 다음 행동
- L1 백로그 없음
- PRD → archive 이동
