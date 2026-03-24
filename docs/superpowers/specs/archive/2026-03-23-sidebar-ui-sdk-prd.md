# NavList UI SDK — PRD

> Discussion: UI 컴포넌트를 실제 앱 표준 UI 완성품으로 고도화. 첫 번째 대상 = NavList. hook-first 구조로 설계하고 App.tsx Sidebar 교체로 실전 검증.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | 개발자가 앱에 항목 목록 네비게이션을 만들려 한다 | `interactive-os/ui`에서 NavList를 import한다 | 키보드/마우스 인터랙션이 완성된 네비게이션 리스트를 바로 사용할 수 있다 | |
| M2 | App.tsx Sidebar가 `<Aria behavior={listbox}>`로 직접 조립되어 있다 (boilerplate 30줄+) | `<NavList>`로 교체한다 | 동일 동작이 10줄 이내로 구현된다 | |
| M3 | 개발자가 렌더링/키맵을 커스터마이징해야 한다 (예: CmsSidebar의 썸네일, CRUD) | `useNavList` hook을 사용한다 | rootProps + getItemProps + state + dispatch로 JSX를 자유롭게 구성. Aria primitives 직접 사용 불필요 | |
| M4 | 멀티존 앱에서 NavList가 공유 engine의 한 zone이어야 한다 | `useNavList({ engine, scope })` 형태로 외부 engine을 주입한다 | NavList가 독립 store 대신 공유 engine의 zone으로 동작한다 | |
| M5 | 현재 비주얼이 데모 수준이다 | NavList 완성품에 Surface 토큰 체계 + 포커스/호버/액티브 상태가 적용되어 있다 | 별도 CSS 작성 없이 제품 수준의 비주얼로 동작한다 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `useNavList` hook | `src/interactive-os/ui/useNavList.ts` — 제어 모드. engine/scope/keyMap/plugins 주입 가능. rootProps, getItemProps(id), getItemState(id), focused, dispatch 반환 | `useNavList.ts::useNavList` |
| `<NavList>` component | `src/interactive-os/ui/NavList.tsx` — 편의 모드. useNavList를 내부에서 호출하는 래퍼. data + onActivate + renderItem만으로 동작 | `NavList.tsx::NavList` |
| `NavList.module.css` | `src/interactive-os/ui/NavList.module.css` — Surface 토큰 기반 스타일. 포커스/호버/액티브 상태 | `NavList.module.css` |
| App.tsx Sidebar 교체 | 기존 `<Aria behavior={listbox}>` 직접 조립 → `<NavList>` 컴포넌트로 교체 | `NavList.tsx (AppShell.tsx에서 사용)` |
| 기존 `ListBox.tsx` | 별개 유지. ListBox = selection 중심(multi-select), NavList = activation 중심(followFocus + onActivate). 용도가 다르므로 별개 완성품 | — |

완성도: 🟢

## ③ 인터페이스

> NavList는 세로 배치. listbox behavior 기반, followFocus + onActivate 패턴.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↓ ArrowDown | 항목 A 포커스 | 다음 항목 B로 포커스 이동 + B 활성화(onActivate) | 세로 목록에서 ↓는 다음 항목. followFocus이므로 포커스 이동 = 활성화 | 항목 B 포커스 + 활성 | |
| ↑ ArrowUp | 항목 B 포커스 | 이전 항목 A로 포커스 이동 + A 활성화 | ↑는 이전 항목. followFocus 동일 | 항목 A 포커스 + 활성 | |
| Home | 임의 항목 포커스 | 첫 번째 항목으로 이동 + 활성화 | 표준 listbox Home 동작 | 첫 항목 포커스 + 활성 | |
| End | 임의 항목 포커스 | 마지막 항목으로 이동 + 활성화 | 표준 listbox End 동작 | 마지막 항목 포커스 + 활성 | |
| Enter | 항목 A 포커스 | A 활성화(onActivate 호출) | 명시적 활성화. followFocus로 이미 활성화된 경우에도 재확인 용도 | 항목 A 활성 (변화 없음) | |
| Space | 항목 A 포커스 | N/A — NavList는 selection 아님 | NavList는 activation 패턴. Space로 select/deselect하는 ListBox와 구분 | 변화 없음 | |
| ← → | 임의 항목 포커스 | N/A — 세로 목록이므로 좌우 키 불필요 | 1차원 세로 탐색. 가로 동작은 NavList의 역할이 아님 | 변화 없음 | |
| Tab | NavList 바깥 포커스 | NavList 컨테이너로 포커스 진입, 마지막 활성 항목에 포커스 | 표준 탭 네비게이션. roving tabindex로 마지막 포커스 위치 복원 | 마지막 활성 항목 포커스 | |
| Tab (NavList 내부) | 항목 A 포커스 | NavList 바깥 다음 탭 정지로 포커스 이동 | NavList는 단일 탭 정지(roving tabindex). 내부 항목 간 Tab 이동 아님 | NavList 바깥 포커스 | |
| Escape | 항목 A 포커스 | N/A — NavList 자체는 Escape 핸들링 없음 | 닫을 것이 없다. 컨테이너(drawer 등)가 있다면 그쪽이 처리 | 변화 없음 | |
| 클릭 | 항목 B 클릭 | B로 포커스 이동 + B 활성화 | 마우스 클릭 = 직접 선택 + 활성화 | 항목 B 포커스 + 활성 | |
| 타이핑 (typeahead) | 임의 항목 포커스, 'S' 입력 | 'S'로 시작하는 첫 항목으로 포커스 이동 + 활성화 | 표준 listbox typeahead. 긴 목록에서 빠른 탐색 | 매칭 항목 포커스 + 활성 | |

## 인터페이스 체크리스트 (AI 자가 검증용)

- [x] ↑ 키: 이전 항목 이동 + 활성화
- [x] ↓ 키: 다음 항목 이동 + 활성화
- [x] ← 키: N/A (세로 목록)
- [x] → 키: N/A (세로 목록)
- [x] Enter: 명시적 활성화
- [x] Escape: N/A (NavList 자체 핸들링 없음)
- [x] Space: N/A (activation 패턴, selection 아님)
- [x] Tab: roving tabindex 진입/이탈
- [x] Home/End: 첫/마지막 항목
- [x] Cmd/Ctrl 조합: N/A (기본 NavList에는 없음. hook에서 keyMap으로 확장 가능)
- [x] 클릭: 포커스 + 활성화
- [x] 더블클릭: N/A
- [x] 이벤트 버블링: NavList가 중첩되는 경우는 없음 (단일 레벨)

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: 빈 목록 (항목 0개) | data.relationships[ROOT_ID] = [] | 빈 목록도 유효한 상태. 컨테이너는 렌더되어야 접근성 트리에 존재 | 빈 listbox 렌더. 포커스 불가. aria-label만 표시 | 빈 컨테이너 | |
| E2: 항목 1개 | 항목 A만 존재 | ↑↓ 이동 대상 없음. 유일한 항목이 항상 활성 | A에 포커스 고정. ↑↓ 무반응. Home/End도 A | 항목 A 포커스 고정 | |
| E3: 외부에서 activeId 변경 | 항목 B 포커스 중 activeId가 C로 변경됨 | URL 변경 등 외부 요인으로 활성 항목이 바뀔 때 포커스도 동기화되어야 | 포커스가 C로 이동. 단, NavList에 포커스가 있을 때만 DOM focus 이동 | 항목 C 포커스 + 활성 | |
| E4: activeId가 존재하지 않는 항목 | activeId="nonexistent" | 잘못된 ID가 들어올 수 있음 (URL 직접 입력 등) | 첫 번째 항목으로 fallback | 첫 항목 포커스 | |
| E5: 항목이 동적으로 추가/제거 | 항목 B 포커스 중 B가 제거됨 | focusRecovery 불변 조건. CRUD 있으면 반드시 동작 | 인접 항목으로 포커스 이동 (focusRecovery) | 인접 항목 포커스 | |
| E6: 스크롤이 필요한 긴 목록 | 30+ 항목, 뷰포트 초과 | 포커스된 항목이 보여야 사용자가 위치를 알 수 있음 | 포커스 이동 시 scrollIntoView({ block: 'nearest' }) | 포커스 항목 뷰포트 내 | |
| E7: useNavList hook에서 engine 주입 | 외부 engine + scope 제공 | 멀티존 앱에서 engine 공유 필수 (M4) | useAriaZone으로 동작, 독립 store 미생성 | 공유 engine의 zone으로 동작 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | UI 컴포넌트만 노출, Aria primitives 노출 금지 (feedback_ui_over_primitives) | ②전체 | ✅ 준수 — useNavList가 Aria/behavior/useAriaZone을 캡슐화 | — | |
| P2 | 같은 behavior라도 용도 다르면 별개 완성품 (feedback_ui_sdk_principles) | ② ListBox vs NavList | ✅ 준수 — ListBox(selection) ≠ NavList(activation) 별개 유지 | — | |
| P3 | 파일명 = 주 export 식별자 (feedback_filename_equals_export) | ② 산출물 | ✅ 준수 — NavList.tsx → export function NavList, useNavList.ts → export function useNavList | — | |
| P4 | focusRecovery는 불변 조건 (feedback_focus_recovery_invariant) | ④ E5 | ✅ 준수 — hook 사용 시 plugins에 focusRecovery 포함 가능, 컴포넌트 모드는 기본 plugins에 포함 | — | |
| P5 | Plugin은 keyMap까지 소유 (feedback_plugin_owns_keymap) | ③ 인터페이스 | ✅ 준수 — NavList의 기본 keyMap은 behavior(listbox)가 제공. hook 모드에서 keyMap override 가능 | — | |
| P6 | barrel export 금지 (CLAUDE.md) | ② 산출물 | ✅ 준수 — 개별 파일에서 직접 import | — | |
| P7 | ARIA 표준 용어 우선, 자체 이름 발명 금지 (feedback_naming_convention) | ② NavList 이름 | ✅ 준수 — NavList는 GitHub Primer 등 업계 표준. role="listbox" + nav 컨테이너 | — | |
| P8 | 설계 원칙 > 사용자 요구 충족, engine 우회 금지 (feedback_design_over_request) | ② useNavList | ✅ 준수 — hook도 engine을 통해 동작, 직접 DOM 조작 없음 | — | |
| P9 | 테스트: 계산은 unit, 인터랙션은 통합(userEvent→DOM) (feedback_test_strategy) | ⑧ 검증 | ✅ 준수 — 검증 시나리오는 userEvent + DOM/ARIA 상태 검증으로 작성 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | App.tsx Sidebar 함수 | 교체 대상. 기존 함수 제거됨 | 낮 | 허용 — 교체가 목적 | |
| S2 | PageUiShowcase.tsx (ListBox 사용) | NavList와 ListBox가 별개이므로 영향 없음 | 낮 | 허용 — 변경 불필요 | |
| S3 | 기존 ListBox.tsx | NavList가 별개 파일이므로 ListBox 코드 변경 없음 | 낮 | 허용 — 공존 | |
| S4 | showcaseRegistry.tsx | /ui 쇼케이스에 NavList 데모 추가 필요 | 중 | 추가 — NavList 항목을 showcaseRegistry에 등록 | |
| S5 | CmsSidebar.tsx | 이 PRD 범위에서는 미교체. 향후 useNavList로 교체 가능성 검증만 | 낮 | 허용 — 이 PRD에서는 건드리지 않음 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | NavList 내부에서 `<Aria>` 직접 노출 | ⑤ P1 | UI 컴포넌트가 primitives를 캡슐화해야 함 | |
| F2 | ListBox.tsx 수정/삭제 | ⑥ S3 | NavList와 별개 완성품. 이 PRD에서 건드리지 않음 | |
| F3 | CmsSidebar를 이 PRD에서 교체 | ⑥ S5 | 범위 초과. CmsSidebar는 engine 공유 + 커스텀 keyMap + 썸네일 등 복잡도가 높아 별도 검증 필요 | |
| F4 | NavList에 selection 기능 추가 | ⑤ P2 | selection은 ListBox의 역할. NavList는 activation 전용 | |
| F5 | 범용 useWidget/useComponent 같은 단일 hook으로 통합 | ⑤ P2 | 용도별 완성품 원칙 위반. NavList는 NavList의 hook(useNavList)을 가짐 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | M1 | `<NavList data={store} onActivate={fn} />`을 렌더하고 ↓ 키를 누른다 | 다음 항목으로 포커스 이동 + onActivate 호출 | `navlist.integration.test.tsx::ArrowDown moves focus to next item and activates it` |
| V2 | M2 | App.tsx Sidebar를 `<NavList>`로 교체 후 동일 페이지 네비게이션 | 기존과 동일하게 URL 변경 + 포커스 이동 동작 | ❌ 테스트 없음 |
| V3 | M3 | `useNavList` hook으로 커스텀 renderItem(아이콘+뱃지) 구현 | rootProps + getItemProps로 자유 JSX, 키보드 동작 유지 | `navlist.integration.test.tsx::supports custom renderItem` |
| V4 | M4 | `useNavList({ engine, scope: 'sidebar' })` + 다른 zone과 engine 공유 | 양쪽 zone이 같은 store를 공유하며 독립적 포커스 | ❌ 테스트 없음 |
| V5 | M5 | NavList를 dark/light 테마에서 렌더 | Surface 토큰에 따라 포커스/호버/액티브 상태 비주얼 자동 대응 | ❌ 테스트 없음 |
| V6 | E1 | 빈 data로 `<NavList>` 렌더 | 빈 listbox 렌더, 에러 없음, aria-label 표시 | `navlist.integration.test.tsx::renders empty listbox without error` |
| V7 | E3 | NavList 외부에서 activeId를 변경 | 포커스가 해당 항목으로 동기화 | `navlist.integration.test.tsx::syncs focus when data changes with new FOCUS_ID` |
| V8 | E4 | 존재하지 않는 activeId 전달 | 첫 번째 항목으로 fallback, 에러 없음 | `navlist.integration.test.tsx::handles nonexistent activeId gracefully` |
| V9 | E5 | 포커스된 항목을 동적 제거 | focusRecovery로 인접 항목에 포커스 | ❌ 테스트 없음 |
| V10 | E6 | 30개 항목 + 마지막 항목으로 End 키 | 마지막 항목으로 스크롤 + 포커스 | `navlist.integration.test.tsx::End key reaches last item in a long list` |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8

교차 검증:
1. 동기 ↔ 검증: ✅ M1~M5 전부 V1~V5로 커버
2. 인터페이스 ↔ 산출물: ✅ useNavList 반환값(rootProps, getItemProps, state, dispatch)이 ③의 모든 인터랙션 커버
3. 경계 ↔ 검증: ✅ E1,E3~E6 → V6~V10으로 커버. E2(항목 1개)와 E7(engine 주입)은 V1, V4에 포함
4. 금지 ↔ 출처: ✅ F1~F5 전부 ⑤/⑥에서 파생
5. 원칙 대조 ↔ 전체: ✅ 위반 없음
