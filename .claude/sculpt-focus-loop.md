# Sculpt Focus Loop — Iteration 지침

**목표:** focus-apca pass 0/22 → 22/22 (APCA Lc ≥ 60 전 조합)

## 매 iteration 절차

1. **현재 상태** — `cat ax-baseline.json | node -e "..."` 또는 `node scripts/measureFocusContrast.mjs --json`로 pass/total, Lc 분포 파악 (가장 pass에 가까운 항목 = 최우선 타겟)
2. **타겟 선택 (1~2 gap)** — 이번 iteration에서 개선할 조합 1~2개 결정. 전체를 동시에 처리하려 하지 말 것
3. **수정 전략** (우선순위):
   - A. `src/styles/tokens.css`의 `--focus-ring-shadow` alpha 상향 (현재값에서 0.1~0.2 증분. 상한 0.95)
   - B. `src/styles/tokens.css`의 `--focus` 토큰 재선택 (dark: `--blue-300`/`--blue-200`/`--stone-0` 등, light: `--blue-600`/`--blue-700`/`--stone-950` 등)
   - C. `scripts/measureFocusContrast.mjs`를 보강하여 dual-layer ring 측정 지원 (ax.css의 multi box-shadow 파싱). 이 경우 소스도 `src/styles/ax.css`의 `:focus-visible` 규칙에 halo layer 추가
4. **수정 실행** — Edit 도구로 위 파일 중 택일 수정
5. **재측정 + compare** — `pnpm baseline:compare` 실행
6. **분기**:
   - 회귀 0 + 개선 있음 → `pnpm baseline:save` → `git add [수정 파일] ax-baseline.json` → `git commit -m "sculpt(focus): <한 줄 요약, 예: dark Lc +X, pass A→B>"` 
   - 회귀 있음 → `git checkout -- [수정 파일]` 롤백 + 다른 전략 재시도 (같은 iteration 내)
7. **완료 판정** — pass 22/22 달성 시 `<promise>FOCUS_PASS_22_22</promise>` 출력

## 엄수 규칙

| 규칙 | 이유 |
|------|------|
| 수정 가능 파일: `src/styles/tokens.css`, `src/styles/ax.css`, `scripts/measureFocusContrast.mjs`, `ax-baseline.json`만 | blast radius 통제 |
| `modular-scale.warnings` 증가 시 반드시 롤백 | 타 metric 회귀 금지 |
| `git add -A` 금지 — 위 허용 파일만 명시적 add | 워킹 디렉토리의 다른 변경이 섞이지 않게 |
| 1 iteration = 1~2 gap | 회귀 원인 분리 위해 |
| 극단 변화 금지 (focus-ring width 5px 초과, alpha 1.0 초과) | 시각적 디자인 의도 유지 |
| 커밋 전 `git status --short` + `git diff --cached --stat` 로 의도치 않은 파일 섞임 확인 | 안전장치 |

## 전략 가이드 (효과 예측)

- **alpha 상향 단독**: dark +3~5 Lc/단계, light +4~7 Lc/단계
- **focus 색 blue-300 (dark)**: +5~10 Lc. 너무 밝아 시각 부담 가능
- **focus 색 stone-0 (dark)**: +30+ Lc. 단 blue 정체성 손실
- **dual-layer (white halo + blue core, dark)**: +20~40 Lc. 측정 스크립트 보강 필수

## 정체 판정

3 iteration 연속 pass 증가 0이면 전략 A/B로 해결 불가 — 전략 C (dual-layer + 측정 보강)로 전환.

## 참고

- `docs/research/ax/reports/focus-apca-<date>.md` — 최신 측정 리포트
- `docs/research/ax/02-principles.md` P-08 카드
- `src/styles/palette.css` — blue/stone OKLCH 스펙트럼 확인
