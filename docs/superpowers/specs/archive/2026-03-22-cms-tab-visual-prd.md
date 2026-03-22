# CMS Tab Container 시각적 완성 — PRD

> Discussion: 탭 기능(schema/CRUD/키보드)은 완료됐으나 CSS 0줄 + 사이드바 탭 미지원. 캔버스 최소 스타일 + 사이드바 구분선 flat 펼침 + active 탭 하이라이트로 완성.
> 설계 원칙: **정규화된 트리 순회로 해결** — tab-specific 분기 0줄. os 조립의 모범 사례.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CMS 캔버스에 tab-group이 렌더링되어 있다 | 사용자가 페이지를 본다 | 탭바와 패널이 시각적으로 구분되어 "이것이 탭이다"를 즉시 인지한다 | |
| M2 | CMS 사이드바 썸네일 리스트를 본다 | 페이지에 tab-group이 포함되어 있다 | 탭 그룹의 각 탭이 구분선으로 묶여 flat하게 보이고, 탭 내부 section도 한눈에 파악된다 | |
| M3 | 사이드바에서 탭 내부 section을 클릭/Enter한다 | 해당 section이 비활성 탭 안에 있다 | 캔버스에서 해당 탭이 자동 활성화되고 section으로 스크롤된다 | |
| M4 | 캔버스에서 ←→로 탭을 전환한다 | 사이드바가 열려 있다 | 사이드바에서 현재 active 탭의 라벨이 하이라이트된다 | |
| M5 | 새로운 컨테이너 타입(accordion 등)이 추가된다 | 사이드바 코드를 변경하지 않는다 | 정규화 트리 순회가 새 컨테이너 내부 section도 자동으로 수집한다 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마
> 핵심: tab-specific 코드 0줄. 정규화 트리 순회 + 조상 비교로 모든 기능 파생.

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `cms.css` 캔버스 탭 스타일 | `.cms-tablist`, `.cms-tab-item`, `.cms-tab-item--active`, `.cms-tab-panel` — 밑줄 기반 최소 구조 스타일 | |
| `collectSections(store, parentId)` | 정규화 트리를 깊이 우선 순회하여 `type === 'section'`인 노드만 수집하는 범용 함수. tab-group, accordion 등 컨테이너 타입을 몰라도 동작 | |
| `CmsSidebar.tsx` sectionIds 교체 | `getChildren(store, ROOT_ID)` → `collectSections(store, ROOT_ID)`로 교체. 사이드바 listbox 아이템이 자동으로 탭 내부 section 포함 | |
| `CmsSidebar.tsx` 구분선 렌더링 | 연속된 section의 root 조상(getParent 체인)이 바뀌는 지점에 구분선 + 탭 라벨 삽입. 조상 비교 로직만으로 그룹 경계 감지 | |
| `CmsSidebar.tsx` active 탭 하이라이트 | section의 tab-item 조상을 getParent 체인으로 탐색하여 active 여부 판단. CmsLayout 변경 없음, 사이드바 내부에서 store만으로 해결 | |
| `cms.css` 사이드바 구분선 스타일 | `.cms-sidebar__group-sep`, `.cms-sidebar__group-label`, `.cms-sidebar__group-label--active` | |

완성도: 🟢

## ③ 인터페이스

### 캔버스 탭 스타일 (CSS only, 기존 마크업 활용)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 페이지 로드 | tab-group 렌더링됨 | tablist가 밑줄 기반 탭바로 표시, active 탭에 accent 밑줄 | CMS 편집 화면이므로 구조를 드러내는 최소 스타일. "이것이 탭이다"를 인지시키되 디자인 편집을 유도하지 않음 | 탭바 + 패널 시각 구분 | |
| tab-item에 포커스 | 탭바 표시 중 | 해당 탭에 accent 밑줄 + 패널 전환 | aria-selected + focused 상태가 CSS로 반영됨. 기존 activeTabMap 로직이 포커스 시 탭 전환 처리 | active 탭 변경, 패널 교체 | |

### 사이드바 section 수집 (collectSections)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| store에 tab-group 포함 | ROOT_ID 하위에 section + tab-group 혼재 | collectSections가 깊이 우선 순회로 모든 section 수집. tab-group → tab-item → tab-panel → section 경로를 재귀적으로 탐색 | 정규화된 트리에서 `type === 'section'`인 리프를 수집하는 범용 연산. 컨테이너 타입을 알 필요 없음 | `['hero', 'stats', 'features', 'tab-1-section', 'tab-2-section', 'tab-3-section', 'workflow', ...]` | |
| store에 tab-group 없음 | ROOT_ID 하위에 section만 | collectSections 결과 = getChildren(ROOT_ID)와 동일 | section의 자식에는 section이 없으므로(text, card 등) 재귀가 즉시 종료 | 기존과 동일한 리스트 | |

### 사이드바 구분선 (조상 비교)

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| sectionIds 렌더링 | 연속된 section 나열 | 이전 section과 현재 section의 "root 자식 조상"을 비교. 다르면 구분선 삽입 | root 자식 조상 = getParent 체인을 ROOT_ID 직속까지 올린 것. 같은 tab-group 안이면 같은 조상, tab-group → root section 경계면 조상 변경 | 구분선이 tab-group 시작/끝 + 탭 라벨 경계에 삽입 | |
| 조상이 tab-group 타입 | 구분선 삽입 지점 | 조상의 data.type이 'tab-group'이면 → 해당 section의 tab-item 조상에서 label을 읽어 구분선에 탭 라벨 표시 | tab-item.data.label이 탭 이름. getParent 체인에서 type === 'tab-item'인 노드를 찾아 label 추출 | 구분선에 "Overview", "Details" 등 탭 이름 표시 | |

### 사이드바 키보드/마우스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| ↑↓ | 사이드바 포커스 | section 간 이동. 구분선은 DOM에 있지만 listbox 아이템이 아니므로 자동 건너뜀 | listbox behavior가 아이템(section)만 순회. 구분선은 aria role 없는 장식 요소 | 다음/이전 section 포커스 | |
| Enter | 탭 내부 section 포커스 | scrollToSection 호출 → 캔버스가 해당 section의 tab-item 조상을 찾아 탭 활성화 → 스크롤 | 캔버스의 onFocusChange → activeTabMap 업데이트 체인이 이미 존재. 사이드바가 캔버스에 포커스를 보내면 나머지는 기존 로직 | 캔버스: 탭 전환 + 스크롤 | |
| Escape | 사이드바 포커스 | 캔버스로 포커스 이동 (기존 동작 유지) | 변경 없음 | 캔버스 포커스 | |
| ← → | 사이드바 포커스 | N/A (listbox는 ↑↓만 사용) | 변경 없음 | — | |
| 클릭 (구분선/탭 라벨) | 사이드바 표시 중 | N/A — pointer-events: none | 구분선은 시각적 구분용. 사이드바 CRUD 금지 | — | |
| 클릭 (section 썸네일) | 사이드바 표시 중 | Enter과 동일 (탭 활성화 + 스크롤) | 기존 클릭 동작과 동일 경로 | 캔버스: 탭 전환 + 스크롤 | |

### 캔버스 ↔ 사이드바 동기화

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 캔버스에서 ←→ 탭 전환 | 사이드바 열림 | 사이드바에서 active 탭 라벨에 하이라이트 표시 | 사이드바가 canvasFocusedId로부터 해당 section의 tab-item 조상을 getParent 체인으로 탐색. activeTabMap 없이 store 관계만으로 판단 | active 탭 라벨 강조 | |
| 캔버스에서 탭 내부 section 포커스 | 사이드바 열림 | 해당 section 썸네일 하이라이트 + active 탭 라벨 강조 | activeSectionId 동기화(기존) + tab-item 조상 탐색(추가). 둘 다 store 관계 연산 | section + 탭 라벨 동시 강조 | |

### 인터페이스 체크리스트 (AI 자가 검증용)

- [x] ↑ 키: section 간 이동, 구분선 자동 건너뜀 (listbox behavior)
- [x] ↓ 키: 위와 동일
- [x] ← 키: N/A (listbox)
- [x] → 키: N/A (listbox)
- [x] Enter: 캔버스 포커스 전달 → 기존 탭 활성화 체인 작동
- [x] Escape: 기존 동작 유지
- [x] Space: N/A
- [x] Tab: N/A (단일 AriaZone)
- [x] Home/End: listbox 기본 (첫/끝 section, collectSections 결과 기준)
- [x] Cmd/Ctrl 조합: 탭 내부 section에서 Mod+↑↓/Delete → ④ 경계에서 "동작 없음" 처리
- [x] 클릭: section 썸네일 = 탭 활성화 + 스크롤, 구분선 = pointer-events: none
- [x] 더블클릭: N/A
- [x] 이벤트 버블링: 단일 AriaZone, 중첩 없음

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| tab-group 0개 | 탭 없음 | collectSections = getChildren(ROOT_ID)와 동일. 조상이 모두 ROOT_ID 직속이므로 구분선 0개 | 기존 section 리스트 불변 | 변화 없음 | |
| tab-group 2개 이상 | 탭 그룹 여러 개 | 조상 비교가 각 tab-group을 별도 root 자식으로 인식. 각 그룹 경계에서 독립 구분선 | 각 그룹마다 별도 구분선 블록 | 독립 블록 | |
| 탭 1개짜리 tab-group | 탭 하나뿐 | root 자식 조상이 tab-group이면 구분선 생성. 탭이 1개여도 "이것은 탭 그룹이다"를 인지시킴 | 구분선 + 라벨 1개 + section | 단일 탭 표시 | |
| 탭 내부 section 0개 | tab-panel 안에 section 없음 | collectSections가 해당 tab-panel에서 section을 찾지 못함. 구분선에 탭 라벨은 표시되지만 포커스 대상 없음 | 라벨만 표시, 해당 탭 건너뜀 | — | |
| Mod+↑↓ 탭 내부 section | 탭 내부 section 포커스 | 사이드바 dndCommands.moveUp/Down은 같은 부모의 형제 간 이동. 탭 내부 section의 부모는 tab-panel이므로 root reorder와 무관 | 같은 tab-panel 내 section 리오더 (section이 여러 개면) 또는 동작 없음 (1개면) | 탭 내부 리오더 | |
| Delete 탭 내부 section | 탭 내부 section 포커스 | crudCommands.remove는 어떤 section이든 삭제. 단, 탭 내부 section이 마지막이면 tab-panel이 비게 됨 | 삭제 → 포커스 복구 → 구분선에 라벨만 남음 | section 삭제됨 | |
| 사이드바 Enter → 비활성 탭 section | 해당 탭의 패널이 캔버스 DOM에 없음 | 사이드바가 캔버스에 포커스를 전달 → 캔버스 onFocusChange → tab-item 조상 감지 → activeTabMap 업데이트 → 리렌더 → DOM 등장 → 스크롤 | 탭 활성화 → 렌더 → 스크롤 순서 보장 필요 | 해당 탭 활성화 + 스크롤 | |
| 새 컨테이너 타입 추가 (accordion 등) | 기존 코드 변경 없음 | collectSections는 `type === 'section'`만 확인하므로 새 컨테이너 내부 section도 자동 수집. 조상 비교도 자동으로 새 컨테이너 경계 감지 | 사이드바 코드 변경 0줄로 새 컨테이너 지원 | 자동 대응 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | CMS에서 디자인 변경 불가 (memory: no_design_in_cms) | ②③ 캔버스 탭 CSS | ✅ 준수 | — 편집 화면용 구조 스타일, 디자인 편집 UI 아님 | |
| P2 | inactive cursor: background만, outline은 :focus-within (memory: inactive_focus_cursor) | ③ active 탭 하이라이트 | ✅ 준수 | — 탭 라벨 하이라이트는 background 기반, outline 아님 | |
| P3 | 이벤트 버블링 가드: defaultPrevented 우선 (memory: nested_bubbling_guard) | ③ 사이드바 키보드 | ✅ 준수 | — 단일 AriaZone, 중첩 없음 | |
| P4 | 가역적 동선 (memory: reversible_motion) | ③ 사이드바 ↑↓ | ✅ 준수 | — ↑↓로 구분선 통과, 역방향 복귀 가능 | |
| P5 | 사이드바 = 읽기 전용, 탭 CRUD 캔버스 전용 (Discussion K1) | ③④ 전체 | ✅ 준수 | — 사이드바에서 탭 생성/삭제/편집/순서변경 없음 | |
| P6 | 포커스 단위 = section (Discussion 합의) | ③ 포커스 모델 | ✅ 준수 | — 구분선은 비포커스 장식 요소 | |
| P7 | 테스트: 인터랙션은 통합(userEvent→DOM), mock 금지 (CLAUDE.md) | ⑧ 검증 | ✅ 준수 | — | |
| P8 | Visual CMS는 보편적 도구 (memory: visual_cms_universal_tool) | ② collectSections | ✅ 준수 | — 컨테이너 타입을 몰라도 동작하는 범용 연산. DOM 위치 기반이 아닌 트리 구조 기반 | |
| P9 | 설계 원칙 > 사용자 요구 충족 (memory: design_over_request) | ② 전체 | ✅ 준수 | — tab-specific 분기 대신 정규화 원칙으로 해결. engine 우회 없음 | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `CmsSidebar.tsx` sectionIds 계산 | `getChildren(ROOT_ID)` → `collectSections(ROOT_ID)` 교체. 기존에 section만 root에 있었으므로 결과 동일. tab-group 포함 시만 차이 | 낮 | tab-group 없으면 결과 동일 — 기존 동작 보존. ④ 경계에서 검증 | |
| S2 | `CmsSidebar.tsx` 렌더링 | 구분선 삽입으로 DOM 구조 변경. listbox의 아이템 순서는 불변 (section만 아이템) | 낮 | 구분선은 role 없는 장식 div, listbox behavior에 영향 없음 | |
| S3 | `CmsLayout.tsx` activeSectionId | activeSectionId가 tab-group ID를 반환하는 기존 로직. 사이드바의 sectionIds에 tab-group이 없으므로 동기화 불일치 가능 | 중 | activeSectionId 계산도 collectSections와 동일하게 "section까지 walk-up"으로 변경. 또는 canvasFocusedId를 사이드바에 직접 전달하여 sectionIds 내에서 가장 가까운 section을 찾음 | |
| S4 | `cms.css` | 새 클래스 추가 | 낮 | `cms-tablist`, `cms-sidebar__group-*` 네임스페이스로 격리 | |
| S5 | 사이드바 Enter → scrollToSection | 비활성 탭 section은 캔버스 DOM에 없음 → 스크롤 대상 없음 | 중 | scrollToSection이 캔버스에 sectionId를 전달 → 캔버스가 해당 section의 tab-item 조상을 감지 → activeTabMap 업데이트 → 리렌더 후 스크롤. requestAnimationFrame 또는 useEffect 순서로 보장 | |
| S6 | 사이드바 CRUD (Delete, Mod+↑↓) | 탭 내부 section이 sectionIds에 포함되면서 사이드바 CRUD 대상이 됨 | 중 | 허용: dnd/delete는 os engine이 정규화된 관계에 따라 처리. 탭 내부 section 삭제/리오더는 유효한 편집 — ④ 경계에서 재검토하여 "동작 없음" → "허용"으로 변경 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| X1 | 사이드바에서 탭 생성/삭제/이름변경/순서변경 UI 만들기 | ⑤ P5 | 사이드바 = 읽기 전용 아웃라인, 탭 CRUD는 캔버스 전용 | |
| X2 | 구분선/탭 라벨을 포커스 대상으로 만들기 | ⑤ P6 | 포커스 단위 = section, listbox 모델 유지 | |
| X3 | collectSections에 컨테이너 타입별 분기 넣기 | ⑤ P8, P9 | `type === 'section'` 판정만으로 충분. 타입별 분기는 범용성 훼손 | |
| X4 | CmsLayout에 activeTabId 전달 채널 추가 | ⑤ P9 | 사이드바가 store의 getParent 체인만으로 판단. 별도 props 불필요 | |
| X5 | 탭 스타일에 색상/폰트/패딩 편집 UI 추가 | ⑤ P1 | CMS 디자인 변경 불가 원칙 | |

완성도: 🟡

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | 캔버스에서 tab-group 렌더링 시, tablist에 밑줄 인디케이터가 보인다 | `.cms-tablist` 내 `[aria-selected=true]`에 accent 하단 border | |
| V2 | ①M2 | 사이드바에서 tab-group 영역이 구분선 + 탭 라벨로 구분되어 보인다 | 조상 변화 지점에 구분선, tab-item.label 표시 | |
| V3 | ①M3 | 사이드바에서 비활성 탭 내부 section 클릭 → 캔버스 탭 활성화 + 스크롤 | activeTabMap 업데이트 → tabpanel 렌더 → scrollIntoView | |
| V4 | ①M3 | 사이드바에서 비활성 탭 내부 section Enter → V3과 동일 | V3과 동일 결과 | |
| V5 | ①M4 | 캔버스 ←→ 탭 전환 → 사이드바 active 탭 라벨 하이라이트 변경 | getParent 체인으로 tab-item 조상 감지 → 라벨 강조 | |
| V6 | ①M5 | collectSections에 tab-specific 분기가 0줄인지 코드 리뷰 | `type === 'section'` 조건만 존재, 컨테이너 타입 참조 없음 | |
| V7 | ④경계: tab-group 0개 | 탭 없는 페이지에서 사이드바 정상 동작 | collectSections = 기존 getChildren(ROOT_ID)와 동일, 구분선 0개 | |
| V8 | ④경계: tab-group 2개 | 여러 탭 그룹이 각각 독립 구분선 블록 표시 | 조상 비교로 각 블록 자동 분리 | |
| V9 | ④경계: 탭 1개 | 단일 탭도 구분선 + 라벨 표시 | 조상이 tab-group이면 구분선 생성 | |
| V10 | ④경계: 비활성 탭 Enter | 사이드바 Enter → DOM에 없는 section → 탭 활성화 → 렌더 → 스크롤 | 순서 보장으로 정상 스크롤 | |
| V11 | ④경계: 새 컨테이너 | accordion 등 추가 시 사이드바 코드 변경 없이 동작 | collectSections 재귀 순회가 자동 수집 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
