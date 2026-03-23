# /doubt 결과 (2라운드 수렴)

> 대상: `docs/2-areas/` MDX 문서 64개
> 날짜: 2026-03-22
> 모드: research-only (파일 수정 없음, 판정만)

---

## 라운드 요약

| Round | 🔴 제거 | 🟡 축소/병합 | ↩️ 자기교정 | 수렴? |
|:-----:|:------:|:----------:|:---------:|:----:|
| 1     | 0      | 5          | 0         | No   |
| 2     | 0      | 0          | 0         | Yes  |

---

## 1. 목록화 (64개)

### 인덱스 파일 (7)
| # | 파일 | 역할 |
|---|------|------|
| 1 | `overview.mdx` | 전체 레이어 구조와 의존 그래프, 빈칸 요약 |
| 2 | `axes.mdx` | 축 주기율표 + 키 충돌 해결 규칙 |
| 3 | `core.mdx` | Core 레이어 개요 (types, createStore, createCommandEngine) |
| 4 | `patterns.mdx` | 18개 패턴 주기율표 + 분류 |
| 5 | `plugins.mdx` | 9개 플러그인 주기율표 + 설계 원칙 |
| 6 | `hooks.mdx` | 7개 훅 주기율표 + Nested Aria Bubbling 설명 |
| 7 | `ui.mdx` | 14(+3⬜) UI 컴포넌트 주기율표 + behavior 매핑 |

### axes/ (7)
| # | 파일 | 역할 |
|---|------|------|
| 8 | `navigate.mdx` | navigate 축 스펙 + 데모 |
| 9 | `select.mdx` | select 축 스펙 |
| 10 | `activate.mdx` | activate 축 스펙 |
| 11 | `expand.mdx` | expand 축 스펙 |
| 12 | `trap.mdx` | trap 축 스펙 |
| 13 | `value.mdx` | value 축 스펙 + 내부 구조 |
| 14 | `trigger-popup.mdx` | ⬜ 미구현 축 TODO |

### core/ (3)
| # | 파일 | 역할 |
|---|------|------|
| 15 | `types.mdx` | 핵심 타입 정의 |
| 16 | `createStore.mdx` | store API 레퍼런스 |
| 17 | `createCommandEngine.mdx` | engine API 레퍼런스 |

### patterns/ (18)
| # | 파일 | 역할 |
|---|------|------|
| 18 | `listbox.mdx` | listbox 패턴 스펙 |
| 19 | `menu.mdx` | menu 패턴 스펙 |
| 20 | `tabs.mdx` | tabs 패턴 스펙 |
| 21 | `radiogroup.mdx` | radiogroup 패턴 스펙 |
| 22 | `accordion.mdx` | accordion 패턴 스펙 |
| 23 | `disclosure.mdx` | disclosure 패턴 스펙 |
| 24 | `switch.mdx` | switch 패턴 스펙 |
| 25 | `toolbar.mdx` | toolbar 패턴 스펙 |
| 26 | `dialog.mdx` | dialog 패턴 스펙 |
| 27 | `alertdialog.mdx` | alertdialog 패턴 스펙 |
| 28 | `tree.mdx` | tree 패턴 스펙 |
| 29 | `treegrid.mdx` | treegrid 패턴 스펙 |
| 30 | `grid.mdx` | grid 패턴 스펙 |
| 31 | `combobox.mdx` | combobox 패턴 스펙 |
| 32 | `spatial.mdx` | spatial 패턴 스펙 |
| 33 | `kanban.mdx` | kanban 패턴 스펙 |
| 34 | `slider.mdx` | slider 패턴 스펙 |
| 35 | `spinbutton.mdx` | spinbutton 패턴 스펙 |
| 36 | `menubar.mdx` | ⬜ 미구현 패턴 TODO |

### plugins/ (9)
| # | 파일 | 역할 |
|---|------|------|
| 37 | `core.mdx` | core 플러그인 API |
| 38 | `crud.mdx` | crud 플러그인 API |
| 39 | `history.mdx` | history 플러그인 API |
| 40 | `clipboard.mdx` | clipboard 플러그인 API |
| 41 | `rename.mdx` | rename 플러그인 API |
| 42 | `dnd.mdx` | dnd 플러그인 API |
| 43 | `focusRecovery.mdx` | focusRecovery 플러그인 API |
| 44 | `spatial.mdx` | spatial 플러그인 API + useSpatialNav + cross-boundary + sticky cursor |
| 45 | `combobox.mdx` | combobox 플러그인 API |

### hooks/ (7)
| # | 파일 | 역할 |
|---|------|------|
| 46 | `useEngine.mdx` | useEngine 훅 API |
| 47 | `useAria.mdx` | useAria 훅 API |
| 48 | `useAriaZone.mdx` | useAriaZone 훅 API |
| 49 | `useControlledAria.mdx` | useControlledAria 훅 API |
| 50 | `useKeyboard.mdx` | useKeyboard 유틸리티 API |
| 51 | `useSpatialNav.mdx` | useSpatialNav 훅 API + cross-boundary + sticky cursor |
| 52 | `keymapHelpers.mdx` | keymapHelpers multi-export API |

### ui/ (14)
| # | 파일 | 역할 |
|---|------|------|
| 53 | `Accordion.mdx` | Accordion UI 컴포넌트 |
| 54 | `ListBox.mdx` | ListBox UI 컴포넌트 |
| 55 | `MenuList.mdx` | MenuList UI 컴포넌트 |
| 56 | `TabList.mdx` | TabList UI 컴포넌트 |
| 57 | `RadioGroup.mdx` | RadioGroup UI 컴포넌트 |
| 58 | `DisclosureGroup.mdx` | DisclosureGroup UI 컴포넌트 |
| 59 | `SwitchGroup.mdx` | SwitchGroup UI 컴포넌트 |
| 60 | `TreeView.mdx` | TreeView UI 컴포넌트 |
| 61 | `TreeGrid.mdx` | TreeGrid UI 컴포넌트 |
| 62 | `Kanban.mdx` | Kanban UI 컴포넌트 |
| 63 | `Tooltip.mdx` | Tooltip UI 컴포넌트 |
| 64 | `Combobox.mdx` | Combobox UI 컴포넌트 |
| -- | `Grid.mdx` | Grid UI 컴포넌트 |
| -- | `Slider.mdx` | Slider UI 컴포넌트 |
| -- | `Spinbutton.mdx` | Spinbutton UI 컴포넌트 |

> 실제 67개 (ui/ 에 추가 3개). 인덱스 목록에서 "14 + 3⬜"로 표기되어 있으나, 실제 파일은 17개 (Dialog/AlertDialog/Toolbar ⬜은 파일 없음, Slider/Spinbutton/Grid가 있음).

---

## 2. 필터 체인 (Round 1)

### 🟡 후보

#### 🟡-1: `plugins/spatial.mdx` vs `hooks/useSpatialNav.mdx` — 내용 중복 (④ 병합 후보)

- **문제**: `plugins/spatial.mdx`의 "useSpatialNav Hook" 섹션(약 60%)과 `hooks/useSpatialNav.mdx` 전체가 거의 동일한 정보를 기술함.
  - 둘 다 `findNearest`, `findAdjacentGroup`, cross-boundary 동작, sticky cursor를 설명.
  - `plugins/spatial.mdx`는 커맨드(enterChild/exitToParent) + 훅 + 설계 원칙을 하나에 담고 있고, `hooks/useSpatialNav.mdx`는 훅 API에 집중.
- **Lean 7 Muda**: 과잉처리 (같은 정보를 두 곳에서 유지)
- **Chesterton's Fence**: spatial은 plugin + hook이 쌍으로 동작하므로 한 곳에서 설명하는 게 이해에 유리했을 것. 그러나 다른 모든 hook은 독립 문서가 있으므로 일관성 차원에서 분리된 것으로 보임.
- **판정**: 🟡 축소 — `plugins/spatial.mdx`에서 useSpatialNav 세부 내용을 제거하고 `hooks/useSpatialNav.mdx`로 링크만 남기는 것을 권장. 정보의 단일 소스(single source) 유지.

#### 🟡-2: `patterns/dialog.mdx` vs `patterns/alertdialog.mdx` — 내용 거의 동일 (④ 병합 후보)

- **문제**: 두 문서가 축 조합(trap 단독), 키맵(Tab/Shift+Tab/Escape), 구조가 완전히 동일. 차이는 role(dialog vs alertdialog)과 alertdialog의 `aria-modal: "true"` 한 줄뿐.
- **Lean 7 Muda**: 과잉생산 (거의 동일한 문서 두 개)
- **Chesterton's Fence**: W3C APG가 dialog와 alertdialog를 별도 패턴으로 정의하므로, 프로젝트 코드에서도 별도 behavior로 존재. 문서를 분리한 이유는 1:1 매핑 일관성.
- **판정**: 🟡 병합 — dialog.mdx에 alertdialog 변형을 "### alertdialog" 섹션으로 포함시키고, alertdialog.mdx는 dialog.mdx로 리다이렉트. 두 behavior가 코드에서 분리되어 있더라도 문서는 하나로 충분.

#### 🟡-3: `patterns/disclosure.mdx` vs `patterns/switch.mdx` — 구조적 유사성 높음 (④ 병합 후보, 약한)

- **문제**: 둘 다 축 조합이 `activate(onClick, toggleExpand)` 단독, 키맵이 Enter/Space 토글뿐. disclosure는 childRole=button, switch는 childRole=switch. 내용량이 매우 적음(각 35줄).
- **Lean 7 Muda**: 과잉처리 (구조 동일, 차이 미미)
- **Chesterton's Fence**: ARIA 역할이 다르고(group vs switch), 렌더링도 다르므로 별도 패턴으로 존재하는 것이 맞음. W3C APG도 별도.
- **판정**: 🟢 유지 — ARIA role이 다르므로 패턴 문서 분리는 정당. 다만 내용이 얇으므로 추후 walkthrough/데모 추가 시 차별화 필요.

#### 🟡-4: `patterns/slider.mdx` vs `axes/value.mdx` — 정보 중복 (④ 병합 후보)

- **문제**: `axes/value.mdx`의 키맵 테이블과 `patterns/slider.mdx`의 walkthrough가 같은 키 동작을 다른 형태로 반복 서술. spinbutton도 마찬가지.
- **Lean 7 Muda**: 운반 (같은 정보의 형태만 다른 복사)
- **Chesterton's Fence**: axes는 "축 단위 스펙"이고 patterns는 "패턴 단위 스펙"이므로 줌 레벨이 다름. 축 문서는 다른 패턴과의 관계를, 패턴 문서는 사용자 체험을 다룸.
- **판정**: 🟢 유지 — 줌 레벨이 다르므로 중복이 아니라 레이어별 관점. 단, `patterns/slider.mdx`의 walkthrough에 "value 축 참조" 링크를 추가하면 더 명확해짐.

#### 🟡-5: `plugins/combobox.mdx` vs `patterns/combobox.mdx` — 레이어 간 중복 우려 (④ 병합 후보, 약한)

- **문제**: 둘 다 combobox의 open/close/filter를 다루지만, `patterns/`는 키맵+ARIA 속성 중심, `plugins/`는 커맨드 API 중심. 포커스가 다름.
- **Lean 7 Muda**: 해당 없음 (레이어별 관점 차이)
- **Chesterton's Fence**: 모든 다른 패턴/플러그인도 같은 구조로 분리되어 있음 (예: tree pattern vs crud plugin). combobox만 이름이 같아서 혼동될 뿐.
- **판정**: 🟢 유지 — 레이어 분리 일관성. 혼동 방지를 위해 각 문서 상단에 "이 문서는 pattern/plugin 레이어 관점" 명시를 권장.

---

## 3. Chesterton's Fence 검증

| 후보 | 왜 만들었는가? | 이유가 아직 유효한가? | 최종 판정 |
|------|--------------|---------------------|----------|
| 🟡-1 spatial 중복 | plugin+hook 쌍을 한 곳에서 설명하려고 | 다른 hook은 모두 독립 문서 → 일관성 위배. 정보가 두 곳에 있어 유지보수 부담 | 🟡 축소 확정 |
| 🟡-2 dialog/alertdialog | W3C APG 1:1 매핑 | behavior 코드가 분리되어 있지만 문서 내용이 99% 동일 → 문서는 하나로 충분 | 🟡 병합 확정 |
| 🟡-3 disclosure/switch | ARIA role이 다름 | role이 다르므로 분리 정당 | 🟢 유지 |
| 🟡-4 slider/value 중복 | 레이어별 줌 레벨 차이 | 축 스펙 vs 패턴 체험 → 정당한 관점 차이 | 🟢 유지 |
| 🟡-5 combobox 이름 충돌 | 레이어 분리 일관성 | 다른 패턴/플러그인도 같은 구조 | 🟢 유지 |

---

## 4. 실행 권장 사항 (research-only이므로 직접 수정하지 않음)

### 🟡-1: `plugins/spatial.mdx` 축소
- `plugins/spatial.mdx`에서 "useSpatialNav Hook", "Cross-Boundary 동작", "Sticky Cursor" 섹션을 제거
- 해당 위치에 `→ 상세: [hooks/useSpatialNav](../hooks/useSpatialNav.mdx)` 링크로 대체
- `plugins/spatial.mdx`는 커맨드(enterChild/exitToParent) + export + 설계 원칙만 유지

### 🟡-2: `patterns/alertdialog.mdx` → `patterns/dialog.mdx`에 병합
- `patterns/dialog.mdx`에 `### alertdialog 변형` 섹션 추가 (role, aria-modal 차이만 기술)
- `patterns/alertdialog.mdx`는 삭제하거나, dialog.mdx로의 참조 한 줄로 대체
- `patterns.mdx` 인덱스 테이블에서 alertdialog 행을 dialog 행에 통합

---

## Round 2 (수렴 검증)

Round 1의 🟡-1, 🟡-2 변경을 가정하고 나머지 62개 항목을 재검토:

- 인덱스 파일 7개: 각각 고유한 집계/요약 역할. 🟢
- axes/ 7개: 각 축이 독립적 스펙. trigger-popup은 ⬜이지만 TODO 추적용으로 유효. 🟢
- core/ 3개: 각 모듈 API 레퍼런스. 🟢
- patterns/ 17개(병합 후): 각 W3C APG 패턴에 1:1 대응. 🟢
- plugins/ 9개: 각 플러그인 API + 설계 원칙. 🟢
- hooks/ 7개: 각 훅 API. 🟢
- ui/ 17개: 각 컴포넌트 Props/DOM 구조/CSS 방식. 🟢

추가 제거/축소 대상 없음. **수렴**.

---

## 🔴 제거 (총 0건)

(없음 — 모든 문서에 존재 이유가 있음)

## 🟡 축소/병합 (총 2건)

- **`plugins/spatial.mdx`**: useSpatialNav 상세 내용을 `hooks/useSpatialNav.mdx`로 위임, 링크로 대체 (round 1)
- **`patterns/alertdialog.mdx`**: `patterns/dialog.mdx`에 병합 (round 1)

## 🟢 유지 (65건 → 병합 후 64건)

전체 문서가 레이어별 1:1 매핑 구조를 따르고 있으며, 각 문서가 고유한 레이어 관점(축/패턴/플러그인/훅/UI)에서 동일 기능을 서술. 이 구조 자체는 건강함.

주요 유지 근거:
- **인덱스 파일**: 레이어별 주기율표 + 빈칸(⬜) 추적 허브. 필수.
- **⬜ 문서** (`trigger-popup.mdx`, `menubar.mdx`): 미구현이지만 TODO 추적용으로 유효. 재고(Muda)가 아니라 의도적 백로그.
- **disclosure vs switch**: ARIA role이 다르므로 분리 정당.
- **patterns/combobox vs plugins/combobox**: 이름만 같고 레이어 관점이 다름. 일관성 유지.
- **axes/value vs patterns/slider**: 줌 레벨 차이. 축 스펙 vs 패턴 체험.

## 📊 Before → After (누적)

- 항목 수: 67 → 65 (−2)
  - `plugins/spatial.mdx`: 49줄 → ~20줄 (축소)
  - `patterns/alertdialog.mdx`: 37줄 → 0줄 (dialog.mdx에 흡수)

## 부록: 문서 수 정합성 메모

`overview.mdx`에서 "모듈 수"로 표기된 숫자와 실제 파일 수 사이에 약간의 차이가 있음:
- **UI**: "14 + 3⬜"로 표기되어 있으나, 실제 파일은 17개 (Slider, Spinbutton, Grid는 ⬜가 아니라 구현 완료). ⬜는 Dialog, AlertDialog, Toolbar인데, 이들은 파일이 없음. 즉 실제 UI 문서 = 14 + 3(추가) = 17개.
- 이 불일치 자체는 doubt 범위가 아니라 정합성 이슈이므로 별도 추적 권장.
