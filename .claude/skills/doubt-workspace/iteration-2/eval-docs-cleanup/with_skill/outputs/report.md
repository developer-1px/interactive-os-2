# /doubt 결과

> 대상: `docs/2-areas/` MDX 문서 65건
> 모드: 정리 요청 -> 필터 체인 직행

---

## 목록화

65개 MDX 파일을 7개 카테고리로 분류:

| 카테고리 | 파일 수 | 역할 |
|---------|--------|------|
| 인덱스 (overview, core, plugins, patterns, axes, hooks, ui) | 7 | 카테고리별 주기율표 + 의존 그래프 + 갭 |
| core/ | 3 | types, createStore, createCommandEngine API 문서 |
| axes/ | 7 | 6개 축 + 1개 미구현(trigger-popup) 스펙 |
| patterns/ | 18 | 17개 패턴 + 1개 미구현(menubar) 스펙 |
| plugins/ | 9 | 9개 플러그인 커맨드/옵션 문서 |
| hooks/ | 7 | 7개 훅 API 문서 |
| ui/ | 14 | 14개 UI 컴포넌트 Props/DOM 구조 문서 |

---

## 필터 체인

### 1. patterns/alertdialog.mdx

- **1 쓸모가 있나?** Yes - alertdialog는 W3C APG에서 dialog와 별개 패턴
- **2 형태가 맞나?** Yes
- **3 줄일 수 있나?** Yes
- **4 더 적게?** Yes - dialog.mdx와 95% 동일. 차이점: role=alertdialog, aria-modal="true" 한 줄뿐. 키맵, 축 조합(trap만), DOM 구조 전부 동일.

판정: **🟡 병합 후보** - dialog.mdx에 alertdialog variant 섹션 추가로 해결 가능

**Chesterton's Fence**: dialog와 alertdialog를 분리한 이유 = W3C APG가 별도 패턴으로 정의. 이유는 유효하지만, 코드에서 `alertdialog` behavior는 `dialog`와 거의 동일하게 `trap()` 축만 사용. 문서 수준에서 병합해도 패턴 정체성은 주기율표(patterns.mdx)의 한 행으로 충분히 보존됨.

-> **🟡 축소 확정**: dialog.mdx에 "alertdialog variant" 섹션 1개 추가, alertdialog.mdx 제거 가능

### 2. plugins/spatial.mdx vs hooks/useSpatialNav.mdx

- **1 쓸모가 있나?** 둘 다 Yes
- **2 형태가 맞나?** Yes
- **3 줄일 수 있나?** Yes
- **4 더 적게?** Yes - 두 파일이 cross-boundary 동작, sticky cursor를 각각 설명. plugins/spatial.mdx의 "useSpatialNav Hook" 섹션이 hooks/useSpatialNav.mdx와 내용 중복.

판정: **🟡 축소 후보** - plugins/spatial.mdx에서 useSpatialNav 상세를 hooks/ 링크로 대체

**Chesterton's Fence**: plugins/spatial.mdx가 useSpatialNav를 포함한 이유 = spatial plugin과 hook이 쌍으로 동작하므로 한 곳에서 전체 그림을 보여주려 함. 이유는 유효하나, hooks/useSpatialNav.mdx가 더 상세한 canonical 문서. plugins/spatial.mdx는 커맨드(enterChild, exitToParent)에 집중하고 hook 상세는 링크로 위임하면 중복 제거.

-> **🟡 축소 확정**: plugins/spatial.mdx의 "useSpatialNav Hook" 섹션을 `[useSpatialNav](../hooks/useSpatialNav.mdx)` 링크 1줄로 대체

### 3. patterns/slider.mdx의 Walkthrough 섹션

- **1 쓸모가 있나?** Yes
- **2 형태가 맞나?** No - 다른 patterns/*.mdx는 스펙(role, 축 조합, 키맵, ARIA 속성)만 담고 있으나, slider.mdx만 Walkthrough(체험 시나리오 10개)와 UI 구조를 포함. 이 내용은 ui/Slider.mdx에 속하는 것이 자연스러움.

판정: **🟡 재설계 후보** - Walkthrough + UI 구조를 ui/Slider.mdx로 이동

**Chesterton's Fence**: slider가 신규 패턴이라 pattern과 UI 문서를 한꺼번에 작성한 결과. 다른 패턴 문서와 형태가 불일치하므로 분리가 바람직.

-> **🟡 축소 확정**: patterns/slider.mdx에서 Walkthrough + UI 구조 섹션 제거, ui/Slider.mdx로 이동

### 4. patterns/spinbutton.mdx의 Walkthrough 섹션

- 위 slider와 동일한 패턴.

판정: **🟡 재설계 후보** - Walkthrough + UI 구조를 ui/Spinbutton.mdx로 이동

**Chesterton's Fence**: 위와 동일.

-> **🟡 축소 확정**: patterns/spinbutton.mdx에서 Walkthrough + UI 구조 + APG 참조 제거, ui/Spinbutton.mdx로 이동

### 5. hooks.mdx의 Pointer Interaction / Nested Aria Bubbling 섹션

- **1 쓸모가 있나?** Yes - 중요한 설계 결정 기록
- **2 형태가 맞나?** No - 다른 인덱스 파일(core.mdx, plugins.mdx 등)은 주기율표 + 의존 + 갭만 담음. hooks.mdx만 구현 상세(Pointer Interaction 5항목, Nested Aria Bubbling 4항목)를 인덱스에 포함.
- **3 줄일 수 있나?** Yes - 이 내용은 hooks/useAria.mdx에 속하는 것이 자연스러움. useAria가 pointer/keyboard 핸들링의 주체이므로.

판정: **🟡 재설계 후보** - Pointer Interaction + Nested Aria Bubbling 섹션을 hooks/useAria.mdx로 이동

**Chesterton's Fence**: retro 결과를 hooks.mdx에 빠르게 기록한 결과. useAria.mdx에 이미 "Pointer Interaction" 언급이 있으므로(37행) 이동이 자연스러움.

-> **🟡 축소 확정**: hooks.mdx에서 상세 이동, useAria.mdx에 병합

### 6. patterns/disclosure.mdx와 patterns/switch.mdx의 유사성

- **1 쓸모가 있나?** 둘 다 Yes - W3C APG에서 별도 패턴
- **2 형태가 맞나?** Yes
- **3 줄일 수 있나?** No - 짧은 문서(각 35행). 이미 최소 형태
- **4 더 적게?** No - 축 조합은 동일하지만 role, childRole, ARIA 속성(aria-expanded vs aria-checked)이 다름. 별도 패턴으로서 정체성 유지 필요.

판정: **🟢 유지** - 형태적으로 유사하나 의미적으로 구분 필요

### 7. patterns/combobox.mdx vs plugins/combobox.mdx

- **1 쓸모가 있나?** 둘 다 Yes
- **2 형태가 맞나?** Yes - 하나는 패턴(behavior 스펙), 하나는 플러그인(커맨드 API). 레이어가 다름.
- 중복 없음.

판정: **🟢 유지** - 같은 이름이지만 레이어가 다르고 내용도 다름

---

## 변경

| 항목 | 판정 | 이유 | 검증 |
|------|------|------|------|
| patterns/alertdialog.mdx | 🟡 병합 | dialog.mdx와 95% 동일, role/aria-modal 차이만. dialog.mdx에 variant 섹션 추가 후 제거 | 확인 필요 |
| plugins/spatial.mdx "useSpatialNav Hook" 섹션 | 🟡 축소 | hooks/useSpatialNav.mdx와 내용 중복. 링크로 대체 | 확인 필요 |
| patterns/slider.mdx Walkthrough+UI 구조 | 🟡 축소 | 다른 pattern 문서와 형태 불일치. ui/Slider.mdx로 이동 | 확인 필요 |
| patterns/spinbutton.mdx Walkthrough+UI+APG | 🟡 축소 | 위와 동일 패턴. ui/Spinbutton.mdx로 이동 | 확인 필요 |
| hooks.mdx Pointer Interaction+Nested Bubbling | 🟡 축소 | 인덱스 문서에 구현 상세가 혼입. hooks/useAria.mdx로 이동 | 확인 필요 |

## 🟢 유지 (60건)

- **인덱스**: 6건 (overview, core, plugins, patterns, axes, ui) -- 각 카테고리의 주기율표+의존 그래프+갭 관리
- **core/**: 3건 (types, createStore, createCommandEngine) -- 핵심 API 문서, 중복 없음
- **axes/**: 7건 (navigate, select, activate, expand, trap, value, trigger-popup) -- 축별 독립 스펙, 각자 고유 키맵+옵션
- **patterns/**: 15건 (listbox, menu, tabs, radiogroup, accordion, disclosure, switch, toolbar, dialog, tree, treegrid, grid, combobox, spatial, kanban, menubar에서 alertdialog 제외) -- W3C APG 패턴별 독립 문서
- **plugins/**: 8건 (core, crud, history, clipboard, rename, dnd, focusRecovery, combobox에서 spatial 축소만) -- 플러그인별 커맨드/옵션 문서
- **hooks/**: 7건 (useAria, useEngine, useAriaZone, useControlledAria, useKeyboard, useSpatialNav, keymapHelpers) -- 훅별 API 문서
- **ui/**: 14건 -- 컴포넌트별 Props/DOM 구조 문서

## 📊 Before -> After

- 파일 수: 65 -> 64 (-1, alertdialog.mdx 병합 제거)
- 축소 대상 섹션: 4건 (plugins/spatial, patterns/slider, patterns/spinbutton, hooks.mdx)
- 전체 구조: 변경 없음 (7개 카테고리 유지)

---

## 부록: Lean 7 Muda 분류

| 항목 | Muda 유형 |
|------|----------|
| alertdialog.mdx (dialog와 95% 동일) | 과잉생산 -- 미리 분리할 필요 없었음 |
| plugins/spatial.mdx useSpatialNav 중복 | 재고 -- 두 곳에 쌓여만 있음 |
| slider/spinbutton Walkthrough in patterns | 운반 -- UI 레이어 내용이 pattern 레이어에 복사 |
| hooks.mdx 구현 상세 | 운반 -- useAria 내용이 인덱스에 복사 |
