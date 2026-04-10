# Handoff: ax() Pit of Success 불변량 + Visual UI 레이어

> 2026-04-11 세션에서 ax() 디자인 시스템에 3가지 불변량(페어링/레벨/시드) 도입 완료. handoff의 "Visual UI 레이어" 작업은 미착수.

## 완료

| 커밋 | 내용 |
|------|------|
| `09d57458` | ax() pit of success 불변량 3종: surface-color 페어링(6곳), depth 5단계(prominent), radius-seed 비율 파생(11곳 토큰화) |

## 남은 것

### 즉시 (다음 세션 첫 작업)
1. **Visual UI 레이어** — 카탈로그 컴포넌트에 shadcn/ui 수준 시각 완성도를 ax()로 입히기. pit of success 불변량이 도입됐으므로 이제 tone+surface 조합이 안전. `/catalog`를 보면서 진행.

### 이후
- prominent depth를 사용하는 surface 추가 — 현재 토큰만 있고 소비하는 surface 없음. 중첩 팝업 등 필요시 `sf-prominent` 또는 기존 surface에 depth 매핑
- xs/sm radius 통합 검토 — 둘 다 `seed * 0.6`으로 동일값. 의도적이지만 미래에 분리 필요할 수 있음
- `/go` Step 0에 handoff 자동 탐지 로직 — 이전 handoff에서도 언급됨

## 컨텍스트

- **PRD**: `docs/2-areas/styles/prds/ax-pit-of-success-prd.md` — 8단계 전부 🟢
- **explain**: `docs/0-inbox/77-[explain]design-system-invariant.md` — 불변량 개념 해설
- **이전 handoff**: `docs/0-inbox/handoff-2026-04-11-component-catalog.md` — 카탈로그 인프라 완성, visual UI 미착수
- **주의**: `--shape-md-radius`가 10px→8px→10px 변경 이력 있음 (seed=10px로 최종 확정). combobox.test.tsx에 기존 실패 1건 (creatable, 이 세션 무관)

## 다음 행동 제안

이전 handoff의 "Visual UI 레이어"가 여전히 첫 작업. `/catalog` 라우트를 열고, `/use /catalog`로 visual 갭 파악 후 ax() 스타일링 시작. pit of success 덕분에 tone+surface 자유 조합 가능.
