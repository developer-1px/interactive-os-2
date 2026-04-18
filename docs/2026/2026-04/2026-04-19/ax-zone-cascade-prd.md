---
id: prd/ax/zone-cascade
type: prd
slug: axZoneCascade
title: 'ax Zone Cascade — Public 축 4개 + Zone 컨텍스트 상속으로 해치 봉쇄'
tags: [ax, prd, design-system, zone-cascade]
created: 2026-04-19
updated: 2026-04-19
legacy:
  legacy_status: draft
summary: 'ax의 "해치 혼재" 문제(reject된 축과 hatch된 축의 혼합 조합) 해결. Public 축을 role/surface/cs/interactive 4개로 축소하고, Zone(surface+material+elevation) 컨텍스트 상속으로 interactive 종류·법도를 자동 파생. 대다수 디자인 깨짐의 구조적 원인(페어 붕괴) 제거.'
---
# ax Zone Cascade — Public 축 4개 + Zone 컨텍스트 상속으로 해치 봉쇄

## 1. SCQA

**Situation.** ax는 24축 → Public 3축(cs/role/surface) 축소(`project_ax_public_private_split`)와 rolePreset cascade(role × surface × content|interactive)를 도입하여 "구조 잠금 + 스타일 개방"에 근접. 02 원리 연구에서 P-06 Chroma Scale(Paired Foreground)이 🟢 Locked 판정.

**Complication.** 실제 구현은 공식 목표에 **도달하지 못함**:
- `AxPublic`에 여전히 `tone`, `textStyle`, `content`, `cs`, `layout` 등이 **병렬 override 경로로 노출** (해치)
- rolePreset 주입 + 사용자 override의 **혼합 CSS**가 페어 붕괴 유발
- 툴팁: `surface: inverted`(글자 반전)인데 text 축은 독립 선택 → 흰글자/회배경. P-06 "Locked" 판정은 **FRT 게이트 누락 오판**
- 각 ax() 호출은 독립. 부모 surface 인지 불가 → sunken 위 selected와 base 위 selected가 **같은 법도** 받음. 위계 붕괴
- 실독: `ax.css`에 `data-surface` zone selector **부재**, `--selected-bg` 등 state 변수 **부재**, `ui/panels/SurfacePanel` 컴포넌트 **부재**(메모리 `project_depth_ladder`는 설계 기록이며 미구현)

**Question.** 축 개수를 더 줄이거나 새 축을 만들기 전에, **"해치 혼재"라는 구조적 결함**을 어떻게 봉쇄하는가?

**Answer.** 두 원리 도입 + 메커니즘 1개 신설.
- **P-26 Contextual Cascade (Zone Inheritance)** — interactive의 종류·법도는 Zone(surface + material + elevation)에서 자동 파생
- **P-27 No Hatch on Public Axis** — Public은 의도축(role/surface/cs/interactive)만. 파생축 override는 `ax.raw()` 단일 해치로 수렴
- **Zone CSS cascade** — `data-surface`/`data-material`/`data-elevation`을 부착한 컨테이너가 `--selected-bg`, `--hover-bg` 등 CSS 변수를 재정의. 자식 `.ax-interactive-*`는 그 변수를 읽음

## 2. 의도축 판정 공리 (P-27의 운용 도구)

의도축 = (1) 사용자가 이름으로 부름 (2) 다른 의도축의 함수가 아님 (3) 원리에 의해 값 조합이 제약됨.

| 축 | 의도축? | 판정 |
|------|:-------:|------|
| `role` | ✓ "버튼/인풋/카드/팁" | 🟢 Public |
| `surface` | ✓ "패널/액션/팁/행" | 🟢 Public (단 zone 상속으로 자식 파생) |
| `cs` | ✓ "작게/크게" | 🟢 Public |
| `interactive` | ✓ "아이템/탭/셀" (APG 좌표) | 🟢 Public |
| `tone` | ○ 같은 role에서 의미 색 전환 | 🟡 Public 유보 — rolePreset 흡수 시 제거 후보 |
| `layout` | ○ FlatLayout 소유 | 🔴 ax에서 제거 후보 |
| `content`, `textStyle`, `pd`, `gap`, `shape`, `weight`, color raw | ✗ role/surface/cs 파생 | 🔴 Private |
| `elevation` 숫자 | — L0 primitive | 🔴 노출 금지 |

**결론: Public 4축 (role/surface/cs/interactive).** tone은 단계적으로 role/surface subset으로 흡수.

## 3. Zone Cascade 메커니즘

### 3.1 컨테이너 부착

```tsx
// ui/panels/Panel (혹은 신설 SurfacePanel)
<div
  className={ax({ role: 'control-group', surface })}
  data-surface={surface}         // 'sunken' | 'base' | 'raised' | 'overlay'
  data-material={material}       // 'matte' | 'glass' | 'flat' (기본 matte)
  data-elevation={depth}         // -1 | 0 | 1 | 2 (surface에서 자동 파생)
>
  {children}
</div>
```

### 3.2 CSS 변수 재정의

```css
/* ax.css — Zone cascade layer (신규) */
:where([data-surface="sunken"]) {
  --selected-bg:  var(--tone-accent-dim-on-sunken);
  --hover-bg:     var(--surface-sunken-hover);
  --focus-ring:   oklch(from var(--focus) l c h / 0.35);
}
:where([data-surface="base"]) {
  --selected-bg:  var(--tone-accent-on-base);
  --hover-bg:     var(--surface-base-hover);
}
:where([data-surface="raised"]) {
  --selected-bg:  var(--tone-accent-bright-on-raised);
  --hover-bg:     var(--surface-raised-hover);
}
:where([data-surface="overlay"]) { /* ... */ }

/* Material 변조 (누르는 것에만) */
:where([data-material="glass"]) .ax-interactive-button {
  --selected-bg:  oklch(from var(--selected-bg) l c h / 0.6);
  backdrop-filter: blur(12px);
}
```

### 3.3 자식 ax()는 변수만 읽음

```css
.ax-interactive-item[aria-selected="true"],
.ax-interactive-item[data-selected] {
  background: var(--selected-bg);
  color:      var(--selected-fg);
}
```

자식은 Zone을 **읽을 뿐 결정하지 않는다.** Zone 결정권은 컨테이너 소유.

## 4. 구현 단계

### Phase 1 — Zone 인프라 완성 (사실상 종료)

**재조사로 드러난 진상**: 예상보다 인프라가 앞서 있었음. L0 elevation primitive, L1 depth tier(OKLCH 자동 파생), `.sf-{surface}` Zone 재바인딩 모두 구현됨. `.sf-inverted`도 focus/text 체인 전체 재정의. **빠진 것은 `--selection*` 3종뿐**.

- [x] ~~`:where([data-surface="*"])` cascade 블록 추가~~ → **`.sf-{surface}` 클래스가 이미 Zone scope 소유**. 별도 data-surface 메커니즘 불필요
- [x] **`.sf-sunken`/`.sf-base`/`.sf-raised`/`.sf-overlay`에 `--selection`/`--selection-cursor`/`--selection-context` 재바인딩 추가** (2026-04-19 edit)
- [x] ~~Panel·SidePanel·SubmenuPanel에 data-surface 자동 부착~~ → `.sf-*` 클래스가 이미 대행
- [x] ~~SurfacePanel 신설 여부~~ → 불필요. Panel이 zone 소유자 역할 충분
- [ ] 툴팁 흰글자/회배경 증상의 실제 원인 재조사 (`.sf-inverted` 작동 중 → 다른 곳에서 surface 오용 가능성)
- [ ] 스크린샷 매트릭스로 Phase 1 회귀 검증 (sunken/base/raised/overlay × selected/hover/focus)

### Phase 2 — Public 축 축소 (P-27 이행)
- [ ] `scanOsViolations` 확장: `ax({role, tone, textStyle, content, layout, ...})` 패턴 통계 수집
- [ ] 사용 빈도 낮은 override는 rolePreset 엔트리로 흡수 (cascade key 확장)
- [ ] `AxPublic`에서 `content`, `textStyle`, `layout` 제거 (Private로 이동)
- [ ] `tone`은 유보: rolePreset surface subset 확장으로 흡수 경로 검토
- [ ] override 필요한 잔여 케이스는 `ax.raw()` 단일 해치로 이전

### Phase 3 — 원리 카드 고정 + FRT 재게이트
- [ ] `docs/2026/2026-04/2026-04-18/02-principles.md`에 P-26·P-27 추가
- [ ] P-06 Paired Foreground 재판정: 🟢 → ⚠ 다운그레이드 후 Zone cascade로 다시 🟢 복귀
- [ ] 03 ax-mapping 갱신 (매트릭스 재검증)
- [ ] 04 gap-plan의 P0/P1 우선순위 조정

### Phase 4 — DESIGN.md 재편
- [ ] "메타 원리 선언 → Public 4축 → Zone cascade → Private 파생" 구조로 DESIGN.md 재작성 (Mandate §6 완결)

## 5. 제약 (§7)

- 기존 ax() 호출 ~1761개 마이그레이션. Phase 2에서 codemod 필요
- rolePreset 테이블 행수 증가 (zone × role × surface × interactive). 값 비어있는 entry는 cascade fallback으로 해결
- CLAUDE.md `ax()만 사용 / style={} 금지`와 정합 — 본 PRD는 Public API 면을 줄이지 CSS 해치를 새로 여는 것 아님

## 6. 부작용 (NBR — ⑫)

| # | 부작용 | 대응 |
|---|--------|------|
| 1 | 중첩 Zone (overlay 안 raised 안 base 등) cascade 혼동 가능 | `:where()` 0-specificity 유지로 가장 가까운 조상이 이김. E2E 시나리오 스냅으로 회귀 방지 |
| 2 | `ax.raw()` 해치가 Zone 무시 | scanOsViolations 훅으로 raw() 사용처 전수 감사, 정당한 예외만 화이트리스트 |
| 3 | Phase 2 중간에 혼재 상태 발생 (일부 Public, 일부 Zone) | feature flag 없이 Phase별 원자 실행. Phase 끝마다 typecheck + screenshot 매트릭스 통과 필수 |
| 4 | `tone` 유보로 P-27 완전성 지연 | Phase 2 말미 또는 Phase 3에서 별도 PRD로 tone 흡수 처리 |

## 7. 장애물 (PRT — ⑬)

| # | 선행 조건 |
|---|-----------|
| 1 | SurfacePanel/Panel이 data-surface 부착 여부 결정 + 구현 |
| 2 | state 변수 매트릭스(11 surfaces × 6 interactive × {bg/fg/border}) 설계 — 현재 완전 부재 |
| 3 | rolePreset 현재 커버리지 재스캔 후 부족분 seed 작성 |
| 4 | 실독으로 확인된 `project_depth_ladder` 메모리의 "SurfacePanel 소유" 설계 미구현을 어떻게 결론 내릴지 (Panel에 흡수 vs 별 컴포넌트) |

## 8. FRT 게이트

| # | 검증 | 주장 | 증거 | 반증 조건 | 판정 |
|---|------|------|------|-----------|------|
| 1 | ⑪→⑤ 해소 | Zone cascade 도입으로 sunken/base selected 법도 분리 | CSS `:where([data-surface="X"])` + state 변수 매트릭스 | 다른 surface에서 동일 CSS 생성 시 거짓 | 🟢 (Phase 1 완료 기준) |
| 2 | ⑪→⑥ 원인 제거 | Public에서 파생축 제거로 해치 봉쇄 | AxPublic 타입 시그니처 변경 + `ax.raw()` 단일화 | Public에 override 경로 잔존 시 거짓 | 🟡 (Phase 2 의존) |
| 3 | ⑪→⑦ 제약 준수 | 기존 규약(`ax()`만, `style={}` 금지, OKLCH)과 정합 | 본 PRD는 Public 면만 축소, CSS 변수 추가만 | style 인라인 1회 이상 발생 시 거짓 | 🟢 |
| 4 | ⑪→⑧ 자산 활용 | rolePreset cascade, `:where()`, OKLCH 파생 모두 기존 기법 | 재사용: rolePreset(P-01 구현), `:where()`(ax.css 전역), `oklch(from ...)`(palette.css) / 신규: data-surface zone cascade | "있는 걸로" 검토 없이 신규 축 신설 시 거짓 | 🟢 |
| 5 | ⑪→⑫ 부작용 수용 | 중첩 cascade 복잡도 + Phase 2 혼재 기간 vs 페어 붕괴 상시 | 부작용 4건 명시 + 각 대응 / 비교: 페어 붕괴(상시·구조적) > cascade 복잡도(국지적) | 부작용 0개 주장 시 거짓 | 🟢 |
| 6 | ⑨ 기각 대안 | B rolePreset 키 확장, C surface 구조화 토큰 기각 | 기각 B(타입 폭발·React Context 필요), C(1761 호출 breaking change) | 대안 0개 | 🟢 |

5행 🟢, 1행 🟡 — P-27 완전 이행은 Phase 2 완료에 의존. Phase 1만으로 P-26의 핵심 증상(툴팁)은 해결 가능.

## 9. 성공 지표

1. **툴팁 증상 해소** — surface=inverted 단독 선언으로 foreground 페어 자동 결정. 별도 text 선언 없음
2. **sidebar vs content selected 법도 분리** — 동일 `interactive: 'item'` + `aria-selected` 조합이 부모 Zone별로 다른 CSS 생성
3. **AxPublic 축 개수 ≤ 4** — role/surface/cs/interactive 외 Public 제거 (tone은 Phase 3 유보)
4. **`ax.raw()` 사용처 < 20** — 기존 분산 해치를 단일 escape hatch로 수렴
