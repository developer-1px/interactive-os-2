# Focus Token System — MECE 상태 분리 — PRD

> Discussion: focus/hover/active/selected 시각 상태가 MECE하지 않아 UX 혼동. 토큰 체계를 재설계하여 모든 상태 조합이 시각적으로 구분되게 한다.

## 1. 동기

| # | Given | Data (before) | When | Then | Data (after) | 역PRD |
|---|-------|--------------|------|------|-------------|-------|
| M1 | 키보드로 리스트 탐색 중, 마우스가 다른 아이템 위에 정지 | focused 아이템: `--accent-dim`(bg), hovered 아이템: `--bg-hover`(bg) | 두 아이템이 동시에 하이라이트 | 키보드 포커스 활성 시 hover 스타일 억제. focused 아이템만 하이라이트 | focused 아이템: `--bg-focus`(bg), hovered 아이템: transparent | ✅ `:not(:focus-within)` 가드로 hover 억제 구현 |
| M2 | focused 아이템에서 Enter/Space로 activate | focused: `--accent-dim` bg | press 중 | press 피드백이 보여야 함. 현재는 focused와 동일하여 구분 불가 | active: `--bg-press`(indigo 0.18) bg — focused보다 한 단계 강함 | ✅ 8개 role에 `:active { --bg-press }` 추가 |
| M3 | 여러 아이템 선택 후 키보드로 포커스 이동 | selected 아이템: `--bg-select`(green), focused+selected: `--accent-dim`(indigo) | focused가 selected 위에 오면 | selected 배경(green) 유지 + focus를 outline으로 표현. 현재는 focus가 selected를 덮어씀 | focused+selected: `--bg-select`(bg) + `outline: 1.5px solid var(--accent)`(ring) | ✅ `--bg-select` 유지 + `outline-color: var(--accent)` |
| M4 | `--accent-dim`이 focus와 장식 용도로 혼용 | focus 6곳 + 장식 5곳 모두 `--accent-dim` | focus 토큰 변경 시 | 장식까지 영향받음. 용도별 토큰 분리 필요 | focus → `--bg-focus`, 장식 → `--accent-dim` 유지 | ✅ focus 7곳 → `--bg-focus`/`--bg-select`, 장식 5곳 `--accent-dim` 유지 |

상태: 🟢

## 2. 인터페이스

| 입력 | Data (before) | 조건 | 결과 | Data (after) | 역PRD |
|------|--------------|------|------|-------------|-------|
| 마우스 hover (아이템 위) | 아이템: rest | 키보드 포커스 비활성 | `--bg-hover` 배경 표시 | 아이템: hover 상태 | ✅ |
| 마우스 hover (아이템 위) | 아이템: rest | **포커스 활성** (`[data-aria-container]:focus-within` — 키보드/마우스 무관) | **hover 스타일 억제** — 배경 변화 없음 | 아이템: rest 유지 | ✅ |
| 키보드 ↑↓ (포커스 이동) | 이전 아이템: focused, 다음 아이템: rest | — | 이전: rest로 복귀, 다음: `--bg-focus` + outline | 다음 아이템: focused | ✅ |
| Enter/Space (activate) | 아이템: focused (`--bg-focus`) | — | `--bg-press` 배경 (indigo 0.18) — press 중에만 | 아이템: active (`:active` 동안) | ✅ |
| 클릭 (선택) | 아이템: rest/hover | — | `--bg-select` 배경 | 아이템: selected | ✅ |
| 키보드 포커스 → selected 아이템 | 아이템: selected (`--bg-select`) | — | `--bg-select` 배경 유지 + `outline` 추가 | 아이템: selected + focused | ✅ |
| 키보드 포커스가 selected 아이템에서 떠남 | 아이템: selected + focused | — | outline 제거, `--bg-select` 배경 유지 | 아이템: selected | ✅ |
| hover → selected 아이템 | 아이템: selected | — | hover 피드백 없음 (selected 배경 유지) | 아이템: selected (변화 없음) | ✅ |

상태: 🟢

## 3. 산출물

> 토큰 변경, CSS 파일 수정, hover 억제 메커니즘

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `tokens.css` — `--bg-focus` 값 조정 | `rgba(91,91,214, 0.10)` — focused 배경의 유일한 토큰. 기존 0.15에서 0.10으로 변경 | ✅ |
| `tokens.css` — `--bg-press` 신규 토큰 | `rgba(91,91,214, 0.18)` — active/press 상태 전용 | ✅ |
| `tokens.css` — `[data-theme="light"]` 내 `--bg-press` | 라이트 테마용 press 토큰 값 | ✅ 0.14 |
| `components.css` — focus 룰 | `:focus`, `[data-focused]`의 배경을 `--accent-dim` → `--bg-focus`로 교체 | ✅ + outline-color 추가 |
| `components.css` — active 룰 신규 | `:active` 상태에 `--bg-press` 배경 적용 | ✅ 8개 role |
| `components.css` — selected+focused 복합 룰 | `[aria-selected="true"]:focus` 등 → 배경 `--bg-select` 유지 + outline 추가 | ✅ |
| `components.css` — hover 억제 룰 | `[data-aria-container]:focus-within` 내 hover 스타일 비활성화 | ✅ `:not(:focus-within)` |
| `kanban.css` — `--accent-dim` → `--bg-focus` 교체 | 3곳 (`:focus` 관련) | ✅ + selected+focused도 수정 |
| `PageVisualCms.css` — focus/select 토큰 교체 | `.cms-step--focused` → `--bg-focus`, `[aria-selected]` → `--bg-select` | ✅ + `.cms-pattern--focused`도 수정 |
| `combobox.css` — `.combo-item--focused` → ARIA 방식 | className 기반 → `[data-focused]` 셀렉터로 전환 | 🔀 셀렉터 전환 안 함 — 드롭다운이 `[data-aria-container]` 밖이라 구조적으로 불가. 토큰만 `--bg-focus` 유지 |
| `spinbutton.css`, `slider.css` — `--focus-ring` 정리 | fallback chain 제거, 글로벌 outline 시스템 활용 | ✅ + 중복 invalid 룰 제거 |

> ⚠️ PRD에 없었지만 구현됨: outline 기본값 (`outline: 1.5px solid transparent`) 3곳 추가, Tab `[data-focused]` 방어적 차단

상태: 🟢

## 4. 경계

| 조건 | Data (before) | 예상 동작 | Data (after) | 역PRD |
|------|--------------|----------|-------------|-------|
| 키보드 포커스 후 마우스를 움직여 hover 발생 | focused 아이템 + hover 다른 아이템 | hover 아이템에 배경 변화 없음 | focused만 하이라이트 | ✅ |
| 마우스 클릭으로 포커스 획득 (키보드 아님) | hover 아이템 클릭 | focus 스타일 정상 적용, hover는 :focus-within으로 억제됨 | focused 아이템 | ✅ |
| multi-select 후 전체에 포커스 순회 | 5개 selected, 1개 focused | 5개 모두 green 배경 유지, 포커스된 1개만 outline 추가 | selected(green) + 1개만 outline | ✅ |
| Tab으로 컨테이너 밖으로 포커스 이동 | 컨테이너 내 focused 아이템 | :focus-within 해제 → hover 다시 활성화 | hover 정상 동작 | ✅ |
| `[data-aria-container]` 밖의 일반 버튼/링크 | 일반 DOM 요소 | hover 억제 영향 없음 — 스코프 밖 | 기존 동작 유지 | ✅ |
| CMS 영역 (`PageVisualCms`) | `--accent-dim` 장식 5곳 | focus 토큰 변경에 영향 없음 — `--accent-dim` 유지 | 장식 스타일 불변 | ✅ |
| Tab (탭 컴포넌트) focused+selected | tab: selected + focused | Tab 예외: border-bottom 방식 유지, outline 추가하지 않음. selected/focused 구분이 accent border로 이미 처리됨 | tab: accent border 유지 | ✅ + `[data-focused]` 방어 추가 |

상태: 🟢

## 5. 금지

| # | 하면 안 되는 것 | 이유 | 역PRD |
|---|---------------|------|-------|
| F1 | `--accent-dim` 토큰 자체를 삭제하거나 값을 변경 | 장식 용도(badge, 인용문, CMS UI)에서 사용 중. focus 분리가 목적이지 accent 스케일 변경이 아님 | ✅ 값 불변 확인 |
| F2 | hover 억제를 `[data-aria-container]` 밖으로 확장 | 일반 UI(버튼, 링크, CMS 도구)의 hover는 정상 동작해야 함 | ✅ 스코프 내 한정 |
| F3 | selected+focused에서 selected 배경을 제거하고 focus 배경으로 대체 | "내가 뭘 선택했는지" 정보 소실 — 현재 버그의 원인이 바로 이것 | ✅ `--bg-select` 보존 |
| F4 | 컴포넌트별 CSS에서 독자적 focus 토큰/값 발명 | `--focus-ring`, `--color-accent` 같은 미정의 변수 참조는 유지보수 불가 | ✅ 전수 제거 |
| F5 | hover와 selected가 시각적으로 동일해지는 토큰 값 설정 | "선택된 것"과 "마우스가 올라간 것"은 완전히 다른 상태 | ✅ 색조 분리 유지 |
| F6 | Tab 컴포넌트에 outline 기반 focus 표현 적용 | Tab은 border-bottom 방식이 확정된 예외. outline과 border가 겹치면 시각 노이즈 | ✅ outline-color: transparent 명시 |

상태: 🟢

## 6. 검증

| # | 시나리오 | 예상 결과 | 역PRD |
|---|---------|----------|-------|
| V1 | 리스트에서 ↓ 키로 포커스 이동, 마우스는 다른 아이템 위에 정지 | 하이라이트된 아이템이 정확히 1개 (focused만) | ✅ |
| V2 | focused 아이템에서 Enter press & hold | press 중 배경이 focused보다 강해짐 (indigo 0.18 vs 0.10) | ✅ |
| V3 | Shift+↓로 3개 아이템 선택 후 ↑로 포커스 이동 | 3개 모두 green 배경 유지, 포커스된 1개만 outline 추가 | ✅ |
| V4 | Tab으로 컨테이너 밖 이동 후 마우스 hover | hover 스타일 정상 동작 (억제 해제) | ✅ |
| V5 | CMS 페이지에서 badge/인용문 확인 | `--accent-dim` 장식 스타일 변화 없음 | ✅ |
| V6 | 다크/라이트 테마 전환 | 모든 상태(focus, press, select, hover)가 양쪽 테마에서 시각 구분 유지 | ✅ |
| V7 | 마우스 클릭으로 아이템 선택 후 키보드 탐색 시작 | 선택 아이템 green 유지, 키보드 포커스 outline로 순회 | ✅ |

상태: 🟢

---

**전체 상태:** 🟢 6/6
