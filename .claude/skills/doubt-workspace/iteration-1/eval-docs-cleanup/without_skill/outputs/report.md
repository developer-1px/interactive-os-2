# docs/2-areas/ MDX 문서 중복/불필요 점검 보고서

> 점검일: 2026-03-22
> 대상: `/Users/user/Desktop/aria/docs/2-areas/` 내 MDX 65개 + MD 1개

---

## 1. 전체 파일 목록 (65 MDX + 1 MD)

| 카테고리 | 파일 수 | 파일 |
|---------|--------|------|
| 인덱스 (top-level) | 7 | overview, axes, core, hooks, patterns, plugins, ui |
| axes/ | 7 | navigate, select, activate, expand, trap, value, trigger-popup |
| core/ | 3 | createStore, createCommandEngine, types |
| hooks/ | 7 | useEngine, useAria, useAriaZone, useControlledAria, useKeyboard, useSpatialNav, keymapHelpers |
| patterns/ | 17 | listbox, menu, tabs, radiogroup, accordion, disclosure, switch, toolbar, dialog, alertdialog, tree, treegrid, grid, combobox, spatial, kanban, menubar, slider, spinbutton |
| plugins/ | 9 | core, crud, history, clipboard, rename, dnd, focusRecovery, spatial, combobox |
| ui/ | 14 | Accordion, ListBox, MenuList, TabList, RadioGroup, DisclosureGroup, SwitchGroup, TreeView, TreeGrid, Kanban, Tooltip, Combobox, Grid, Slider, Spinbutton |
| 기타 (MD) | 1 | plugin-showcase.md |

---

## 2. 중복 발견 사항

### 2-1. plugins/spatial.mdx와 hooks/useSpatialNav.mdx 내용 중복 (높음)

**문제**: `plugins/spatial.mdx`의 하단 절반이 `useSpatialNav Hook` 섹션으로, `hooks/useSpatialNav.mdx`의 내용과 거의 동일하다.

| 항목 | plugins/spatial.mdx | hooks/useSpatialNav.mdx |
|------|---------------------|------------------------|
| useSpatialNav API | O (요약) | O (상세) |
| findNearest / findAdjacentGroup | O (동일) | O (동일) |
| Cross-Boundary 동작 | O (1줄 요약) | O (상세 fallback 체인) |
| Sticky Cursor | O (1줄 요약) | O (상세 리셋 시점) |
| 플러그인 커맨드 (enterChild, exitToParent) | O | X (관계로만 언급) |

**판정**: plugins/spatial.mdx에서 `## useSpatialNav Hook` 섹션을 제거하고 hooks/useSpatialNav.mdx로의 링크만 남기는 것이 적절하다. 플러그인 문서는 커맨드와 설계 원칙에 집중해야 한다.

---

### 2-2. patterns/dialog.mdx와 patterns/alertdialog.mdx 거의 동일 (중간)

**문제**: 두 문서의 구조와 내용이 95% 동일하다. 차이점은 role명(`dialog` vs `alertdialog`)과 alertdialog에 `aria-modal: "true"` 한 줄뿐이다.

| 항목 | dialog.mdx | alertdialog.mdx |
|------|-----------|-----------------|
| 축 조합 | trap() | trap() |
| 키맵 | Tab, Shift+Tab, Escape | Tab, Shift+Tab, Escape |
| ARIA 속성 | aria-expanded | aria-modal, aria-expanded |
| UI 상태 | 미구현 | 미구현 |

**판정**: 둘 다 실질적 구현이 미구현(UI 컴포넌트 없음)이고 behavior도 동일(trap 축만 사용)하므로 하나의 문서로 합치는 것이 가능하다. 단, W3C APG에서 dialog와 alertdialog를 별개 패턴으로 정의하고 있으므로, ARIA 표준 용어 1:1 매핑 정책을 따르면 **분리 유지가 맞다**. 다만 현재 내용이 거의 복사-붙여넣기 수준이므로, alertdialog 문서에 "dialog와의 차이점"만 기술하고 공통 부분은 dialog 참조로 대체하면 유지보수가 쉬워진다.

---

### 2-3. patterns/disclosure.mdx와 patterns/switch.mdx 구조적 중복 (낮음)

**문제**: 두 패턴 모두 축 조합이 `activate(onClick, toggleExpand)` 하나뿐이고, 키맵도 Enter/Space 2개로 동일하다.

| 항목 | disclosure | switch |
|------|-----------|--------|
| 축 조합 | activate(onClick, toggleExpand) | activate(onClick, toggleExpand) |
| 키맵 | Enter, Space | Enter, Space |
| role | group | switch |
| childRole | button | switch |
| ARIA 속성 | aria-expanded | aria-checked |

**판정**: 구현은 동일하지만 의미(disclosure = 콘텐츠 가시성 토글, switch = on/off 상태 토글)가 다르고 role/ARIA 속성도 다르다. W3C APG 별개 패턴이므로 **분리 유지가 맞다**. 중복이 아닌 정상적 유사성이다.

---

### 2-4. patterns/slider.mdx와 ui/Slider.mdx, patterns/spinbutton.mdx와 ui/Spinbutton.mdx 레이어 간 중복 (중간)

**문제**: patterns/ 문서에 `## Walkthrough`와 `## UI 구조`가 포함되어 있어, ui/ 문서의 `## DOM 구조`와 내용이 겹친다.

| 항목 | patterns/slider.mdx | ui/Slider.mdx |
|------|---------------------|---------------|
| 스펙 (role, ARIA) | O | O (축약) |
| Walkthrough (체험 시나리오) | O (10개 항목) | X |
| UI 구조 (DOM 트리) | O | O (유사) |
| Props | X | O |

**판정**: patterns/ 문서의 `## UI 구조`를 제거하고 ui/ 문서로의 참조를 남기면 레이어 분리가 깔끔해진다. Walkthrough는 patterns/ 레이어에 남기는 것이 적절하다(behavior 수준 체험이므로). 같은 분석이 spinbutton 쌍에도 적용된다.

---

### 2-5. plugins/combobox.mdx와 patterns/combobox.mdx 이름 충돌 (낮음, 구조적)

**문제**: `plugins/combobox.mdx`와 `patterns/combobox.mdx`가 동일한 파일명(`combobox.mdx`)을 가진다. 내용상 중복은 없다(plugin은 상태 관리 커맨드, pattern은 축 조합/키맵/ARIA).

**판정**: 중복은 아니지만, 문서 검색이나 참조 시 혼동 소지가 있다. 현재 디렉토리로 구분되므로 실질적 문제는 아니나, 인지적 비용이 발생한다. 같은 상황이 `plugins/spatial.mdx`와 `patterns/spatial.mdx`에도 해당한다.

---

## 3. 불필요 문서 점검

### 3-1. axes/trigger-popup.mdx -- 미구현 placeholder (의문)

- 내용: 3줄 설명 + TODO 3개
- 총 16줄

**판정**: 미결정 기능의 placeholder로서 의미가 있다. axes.mdx 인덱스에서 참조하고 있고, 아키텍처 갭을 추적하는 역할을 한다. **유지**가 적절하다.

### 3-2. patterns/menubar.mdx -- 미구현 placeholder (의문)

- 내용: 2줄 설명 + TODO 2개
- 총 11줄

**판정**: trigger-popup과 동일한 이유로 **유지**가 적절하다. patterns.mdx 인덱스에서 참조 중이다.

### 3-3. plugin-showcase.md -- MDX가 아닌 MD 파일 (의문)

- 유일한 `.md` 파일 (나머지는 전부 `.mdx`)
- 최종 갱신: 2026-03-21

**판정**: 포맷 불일치(md vs mdx)가 있다. MDX 컴포넌트를 사용하지 않으므로 md로도 충분하지만, 일관성을 위해 `.mdx`로 변환하거나 그대로 두어도 무방하다. **낮은 우선순위**.

---

## 4. 구조적 관찰

### 4-1. 인덱스 문서(top-level)와 하위 문서의 관계가 일관적이다

모든 top-level 인덱스(axes.mdx, core.mdx 등)가 하위 문서를 정확히 참조하고 있다. 인덱스에 나열된 모듈 수와 실제 하위 문서 수가 일치한다.

### 4-2. patterns/ 17개와 ui/ 14개의 비대칭은 의도적이다

ui.mdx 인덱스에서 명시적으로 3개 미구현(Dialog, AlertDialog, Toolbar)과 1개 독립(Tooltip)을 설명하고 있다. spatial은 Kanban 내부 사용으로 별도 UI 불필요로 명시.

### 4-3. 문서 간 참조 정합성

- patterns/ 문서의 `## 관련 > UI:` 필드가 ui/ 문서와 1:1 대응한다.
- axes/ 문서의 `## 관련 > 사용 패턴:` 목록이 patterns.mdx 주기율표와 정합한다.
- hooks/ 문서의 `## 관계` 섹션이 hooks.mdx 인덱스의 의존 그래프와 일치한다.

---

## 5. 요약 -- 조치 권장사항

| # | 대상 | 유형 | 심각도 | 권장 조치 |
|---|------|------|--------|----------|
| 1 | plugins/spatial.mdx `## useSpatialNav Hook` 섹션 | 내용 중복 | 높음 | hooks/useSpatialNav.mdx로 링크만 남기고 섹션 제거 |
| 2 | patterns/slider.mdx, patterns/spinbutton.mdx의 `## UI 구조` | 레이어 간 중복 | 중간 | ui/ 문서 참조로 대체 |
| 3 | patterns/alertdialog.mdx | dialog와 거의 동일 | 중간 | 공통부 dialog 참조로 대체, 차이점만 기술 |
| 4 | plugin-showcase.md | 포맷 불일치 | 낮음 | .mdx로 변환 또는 유지 |
| 5 | 나머지 60개 문서 | 정상 | -- | 변경 불필요 |

**전체 평가**: 65개 MDX 문서 중 실질적 중복은 3건(#1, #2, #3)이며 불필요한 문서는 없다. 문서 구조(인덱스 → 하위 문서)가 일관적이고, 레이어 간 역할 분리(axes/patterns/plugins/hooks/ui)가 명확하다. 권장 조치를 적용하면 약 50줄 분량의 중복이 제거된다.
