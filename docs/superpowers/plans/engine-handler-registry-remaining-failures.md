# Engine Handler Registry — 잔여 테스트 실패 보고

> Phase 2 수정 후 15건 실패. Cynefin 분석 기반, 확실한 1건(use-aria-zone)은 수정 완료.

## 잔여 실패 15건

### Group A: spatial-cross-boundary (11건)

**파일**: `src/__tests__/spatial-cross-boundary.test.tsx`

| 테스트 | 증상 |
|--------|------|
| T9: intra-group ArrowRight | 포커스 이동 안 됨 (항상 'a') |
| T1: ArrowDown cross boundary | 동일 |
| T2: ArrowUp sticky cursor restore | 동일 |
| T3: consecutive ArrowDown | 동일 |
| T4: ArrowDown at last group | 동일 |
| T6: Escape clears sticky cursors | 동일 |
| T7: click resets sticky cursor | 동일 |
| T11: Shift+ArrowDown | 동일 |
| N2: Home/End boundary | 동일 |
| T12: depth 2 cross-boundary | 'x'에 고정 |
| T13: depth 2 sticky cursor restore | 동일 |

**가설**: spatial plugin commands가 registry에 등록되지 않았거나, spatial middleware의 `getStore()` 전환에서 문제. 모든 테스트에서 포커스가 초기값에 고정되는 패턴이므로 single root cause일 가능성 높음.

**확인 필요**: spatial plugin이 `defineCommand` 패턴을 사용하는지, 아니면 hand-rolled Command(`.execute()` 포함)인지 확인. 후자라면 defineCommand로 전환 필요.

### Group B: dialog/alertdialog (2건)

**파일**: `src/interactive-os/__tests__/dialog-apg.conformance.test.tsx`, `alertdialog-apg.conformance.test.tsx`

| 테스트 | 증상 |
|--------|------|
| Escape collapses dialog item | 초기 getVisibleNodes가 자식(btn들)을 포함 — collapsed 상태에서 자식이 숨겨지지 않음 |

**가설**: dialog의 expand 초기화 command가 registry에서 no-op되거나, getVisibleNodes의 expand gating이 변경됨.

### Group C: spatial drill-in (1건)

**파일**: `src/interactive-os/__tests__/behaviors/spatial.test.tsx`

| 테스트 | 증상 |
|--------|------|
| Home/End after drill-in | Home/End가 drill-in된 자식 범위가 아닌 전체 범위에서 동작 |

**가설**: Group A와 동일 root cause (spatial plugin).

### Group D: cms-detail-panel (1건)

**파일**: `src/__tests__/cms-detail-panel.test.tsx`

| 테스트 | 증상 |
|--------|------|
| widens panel scope when escaping | Escape scope 전환 시 값 불일치 (expected 21, got 2) |

**가설**: CMS 레이어 — Phase 2 수정 범위 밖일 가능성. 또는 Group A/B와 동일 root cause의 연쇄 효과.

## 조사 우선순위

1. **spatial plugin** (`src/interactive-os/plugins/spatial.ts`) — defineCommand 사용 여부 확인 → 12건 해소 가능
2. **dialog expand 초기화** — expand command registry 등록 확인 → 2건 해소 가능
3. **cms-detail-panel** — 위 2개 해결 후 재확인
