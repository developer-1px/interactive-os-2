# ax() rolePreset Seed Expansion — Scan Report

Date: 2026-04-18
Scope: `src/**/*.{ts,tsx}` — 모든 `ax({...})` 호출
Goal: `rolePresetTable` 의 `role.surface.cs` 키에 자동 도출 seed 추가

## 요약 (Bottom Line)

**0개 seed 추가.** 현 코드베이스는 rolePresetTable의 키 구조 `role.surface.cs` 를 충족하는 ax() 호출을 **사실상 보유하지 않는다**. cs 축이 literal 문자열로 전달되는 호출은 **전체 1799개 중 1건**. seed 확장은 데이터 부족으로 보류한다.

스캔 결과는 오히려 **rolePresetTable 키 설계 자체의 재검토**가 필요함을 시사한다 — 현장 사용 패턴은 `role.surface` 또는 `*.surface` 축에 모여 있다.

## 스캔 결과 (Step 1)

| 지표 | 값 |
|---|---|
| 총 ax() 호출 수 | 1799 |
| Public 축 1개 이상 포함 | 1600 |
| `role:` literal 포함 | 131 |
| `surface:` literal 포함 | 234 |
| `cs:` literal 포함 | **1** |
| `role + surface + cs` 전부 포함 | **0** |
| 고유 (role.surface) 조합 (대리 키) | 46 |

(정규식: `\b<key>:\s*['"]` — 변수·표현식 전달은 제외)

## 왜 0건인가

1. **cs 축이 현장에서 미사용.** 1799 호출 중 literal cs는 1건. 나머지는 width/flex/padding 등으로 크기를 지정.
2. **role 축도 보조 위치.** 131/1799 ≈ 7.3%. layout/surface/textStyle 위주 사용.
3. **현재 9개 seed도 "실측이 아닌 의도 설계"에 가깝다.** 코드베이스가 아직 Public/Private split 이전 수준으로 작성됨.

## 군집화 참고 데이터 (Step 2, 대리 키 `role.surface`)

cs를 제외한 대리 키로 상위 버킷을 뽑은 결과. **seed 후보는 아니나 향후 마이그레이션 타겟**으로 기록.

| 빈도 | 키 | 일관성 ≥70% Private 값 | 샘플 |
|---|---|---|---|
| 51 | `*.display` | text:muted(3/3), gap:sm(11/12) | KeylineSections, CmsDetailPanel |
| 40 | `item.*` (content:text) | (분산) | 여러 |
| 37 | `*.sunken` | text:muted(7/9) | 여러 |
| 22 | `*.base` | (분산) | |
| 18 | `*.overlay` | shape:xl(6/14, 43%) | |
| 12 | `*.ghost` | **padding:xs(7/7), shape:sm(8/9), gap:sm(5/5)** | 가장 일관적 |
| 12 | `control.ghost` (content:icon) | text:secondary(5/9) | |
| 10 | `*.raised` | shape:md(7/7), border:ring(4/7) | |
| 8 | `*.sunken` (content:text) | weight:semi(5/5), text:primary(5/6), padding:sm(6/8) | |

**유일하게 seed 수준으로 일관적인 버킷: `*.ghost`**. 하지만 role이 불명확하여 rolePresetTable에 추가 불가.

## 채택된 seed (Step 3)

**없음.** rolePresetTable은 수정하지 않았다. 기존 9개 seed 유지.

이유:
- 제약: "실제 프로젝트 값 리터럴만 사용 (추측 금지)".
- rolePresetTable 키 스키마 `role.surface.cs` 를 만족하는 실측 triplet이 존재하지 않음.
- cs 축 리터럴 전달 0건 ⇒ 데이터 부족.

## 수동 검토 필요 케이스 (Step 3 — 향후)

cs 축이 채워지면 곧바로 seed 후보가 될 버킷:

1. **control.ghost.* ** — ghost 표면은 padding:xs, shape:sm, gap:sm 로 가장 수렴. cs 명세만 붙이면 seed 가능.
2. **item.*.md (content:text)** — 40건. role=item 고정, surface가 문제.
3. **control.action.*** — content:text 10건 중 shape:xl(1/1) — 빈약.
4. **control.input.*** — content:text 8건, shape:md/text:primary 수렴 징후.

## 마이그레이션 커버리지 추정 (Step 4)

현 데이터로 seed 흡수 가능한 호출 비율: **0/1799 = 0%**.

대리 키(role.surface, surface-only)로 느슨한 cascade를 허용할 경우 (향후 설계 변경 시):
- `*.ghost` 완전 흡수 → +12건
- `*.display` 부분 흡수(text/gap) → +11건
- `*.sunken` 부분 흡수(text) → +7건
- 합계 상한 ~30건 ≈ **1.7%**.

의미: 마이그레이션은 **seed 확장보다 "codebase → cs 축 도입" 쪽이 먼저**. rolePresetTable은 데이터 생성 이후 의미를 가진다.

## 권장 후속 액션

1. **cs 축 주입 캠페인** — 139 데모 중 상위 N개 파일에 `cs: 'sm'|'md'|'lg'` 를 명시 추가하는 마이그레이션을 먼저 실행.
2. **rolePresetTable 키 스키마 재검토** — 현장은 `role.surface` 또는 `*.surface` 기반. cs-less 키를 허용할지 또는 cs를 강제할지 결정.
3. **본 스캔 재실행** — 마이그레이션 후 동일 스캔으로 seed 자동 도출.

## 부록 — mini-verify

`pnpm typecheck` 미실행. rolePreset.ts·axPublic.ts·axPrivate.ts 모두 변경 없음.

## 부록 — 스크립트

일회성 스캔: `/tmp/scan_ax.mjs` (정규식 기반 object-literal 파서). 실행:
```bash
node /tmp/scan_ax.mjs > /tmp/ax_scan.json
```
