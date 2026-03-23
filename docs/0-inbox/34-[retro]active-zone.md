# Retro: Active Zone — 2026-03-24

## 비교 기준
- **PRD:** docs/superpowers/specs/2026-03-23-active-zone-prd.md
- **Diff 범위:** a122b3e..40ee513
- **커밋 수:** 1
- **변경 파일:** 4 (useAriaView.ts, activeZone.integration.test.tsx, active-zone-prd.md, PROGRESS.md)

## 항목별 비교

| # | PRD 항목 | 일치 | 갭 요약 | 계층 |
|---|---------|------|---------|------|
| ① | 동기 | ✅ | M1~M4 전부 일치 | — |
| ② | 산출물 | 🔀 | lastActiveContainer 싱글턴 의도적 제거, onFocusIn 미구현 | — (의도적 간소화) |
| ③ | 인터페이스 | ✅ | 핵심 일치, 싱글턴 관련 부분만 해당 없음 | — |
| ④ | 경계 | ⚠️ | natural-tab-order 테스트 없음 | L1 |
| ⑤ | 원칙 대조 | ✅ | 전부 일치 | — |
| ⑥ | 부작용 | ✅ | S1 onFocusIn→onPointerDown만 (경량화), S2~S3 일치 | — |
| ⑦ | 금지 | ✅ | F1~F4 전부 준수 | — |
| ⑧ | 검증 | ✅ | V1~V7 전부 테스트됨 | — |

**일치율:** 7/8 (④에서 minor gap)

## 갭 상세

### 🔀 ② 산출물 — lastActiveContainer 의도적 제거
- PRD에서는 싱글턴을 명세했지만, /simplify에서 dead code로 판별되어 제거
- 현재 동작에 영향 없음 — onPointerDown이 직접 focus() 호출하므로 싱글턴 불필요
- PROGRESS.md에 갭으로 기록됨 — 소비자(다중 zone 추적) 필요 시 재추가
- **계층: PRD가 over-spec했다는 L2 신호이지만, "향후 필요할 수 있음"을 인지하고 PROGRESS에 기록했으므로 수정 불필요**

### ⚠️ ④ natural-tab-order 테스트 없음
- 코드상 동작함 (non-activedescendant 분기에 포함)
- 전용 테스트 미작성
- **계층: L1** — 테스트 추가로 해결 가능하지만, 현재 natural-tab-order behavior를 사용하는 곳이 없으므로 낮은 우선순위

## 계층별 개선 제안

### L1 코드
- [ ] natural-tab-order zone 테스트 → `/backlog`에 저장 (현재 사용처 없음, 행동 추가 시 함께 추가)

### L2~L4
- 해당 없음 — PRD 스킬, 다른 스킬, memory에 수정 필요한 갭 없음

### L5 사용자 피드백
- 없음

## 다음 행동
- L1: natural-tab-order 테스트 → backlog
- PRD 아카이브: specs/ → specs/archive/
