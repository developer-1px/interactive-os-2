# CMS Detail Panel Container Edit — PRD

> Discussion: 포커스된 노드가 컨테이너(card/stat/step/section)일 때 자식 필드를 재귀 수집하여 그룹별 Form으로 우측 패널에 표시. 숙련자에게 인라인 편집보다 Form 일괄 편집이 더 빠르다.

## ① 동기

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| M1 | CMS 캔버스에서 card(컨테이너)에 포커스됨 | 우측 Detail Panel을 봄 | 해당 card의 자식 필드(title, desc)가 Form input으로 표시되어 즉시 편집 가능 | |
| M2 | CMS 캔버스에서 section에 포커스됨 | 우측 Detail Panel을 봄 | section header(label, title, desc) + 하위 컨테이너(card/stat/step/pattern)별 그룹으로 모든 편집 가능 필드가 표시됨 | |
| M3 | section 포커스 상태에서 Enter로 card 깊이 진입 | Detail Panel이 갱신됨 | 패널 범위가 해당 card 자식 필드만으로 좁혀짐 (포커스 깊이 = 패널 범위) | |
| M4 | 컨테이너 패널에서 input 수정 후 blur | 캔버스 텍스트가 즉시 반영됨 | confirmRename 경유, undo 가능 | |

완성도: 🟢

## ② 산출물

> 구조, 관계, 이름 — 파일/컴포넌트/데이터 스키마

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `collectEditableGroups()` 함수 | store + nodeId → `EditableGroup[]` 반환. children 재귀 순회, 컨테이너는 그룹 헤더, leaf는 필드 수집 | |
| `EditableGroup` 타입 | `{ groupLabel: string, nodeId: string, fields: EditableField[] }` — 그룹 헤더 라벨 + 해당 노드 ID + 편집 필드 목록 | |
| `CmsDetailPanel` 확장 | 기존 단일 노드 Form → 컨테이너일 때 그룹별 `<fieldset>` 렌더링. 기존 `DetailField` 컴포넌트 재사용 | |
| 그룹별 자동 스크롤 | 캔버스에서 포커스가 card 내부 노드로 이동하면, 패널에서 해당 그룹으로 scrollIntoView | |

완성도: 🟢

## ③ 인터페이스

> Detail Panel은 별도 Zone — 캔버스 키보드 인터랙션과 격리됨. 여기서는 Panel 내부 + 캔버스↔패널 연동만 다룬다.

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| 캔버스에서 컨테이너(card) 포커스 | 패널: 이전 노드 표시 또는 빈 상태 | 패널이 card 자식 필드로 갱신 | focusedNodeId 변경 → collectEditableGroups 재계산 | 패널: title·desc 필드 Form 표시 | |
| 캔버스에서 section 포커스 | 패널: 이전 노드 표시 | 패널이 section 전체 자식 필드를 그룹별로 갱신 | section children 재귀 수집 → 그룹별 렌더링 | 패널: section header 그룹 + 하위 컨테이너 그룹들 | |
| 캔버스에서 Enter (section → card 깊이 진입) | 패널: section 전체 필드 | 패널이 해당 card 자식 필드만으로 좁혀짐 | focusedNodeId가 card로 변경 → 재수집 범위 축소 | 패널: card 필드만 | |
| 캔버스에서 Escape (card → section 깊이 복귀) | 패널: card 필드만 | 패널이 section 전체 필드로 넓어짐 | focusedNodeId가 section으로 변경 | 패널: section 전체 그룹 | |
| Form input 값 변경 + blur | input에 새 값 | confirmRename(nodeId, field, newValue) 실행 | rename plugin 경유 → history에 기록 → 캔버스 반영 | entity.data[field] 갱신, 캔버스 텍스트 변경 | |
| Form input Enter | input에 새 값 | blur와 동일하게 confirmRename | 키보드 완결성 — blur 없이도 확정 가능 | 동일 | |
| Mod+Z (캔버스에서) | Form에 수정된 값 | undo → entity 복원 → 패널 Form도 갱신 | store 구독으로 패널이 자동 반영 | entity.data[field] 이전값, 패널 input도 이전값 | |
| 캔버스에서 leaf 노드 포커스 | 패널: 컨테이너 그룹 표시 중 | 패널이 해당 leaf 단일 필드로 전환 | leaf에는 children이 없으므로 기존 단일 노드 동작 유지 | 패널: 단일 노드 필드 | |

### 인터페이스 체크리스트

- [x] ↑↓←→: Panel은 별도 Zone, 캔버스 키와 격리. Panel 내부 Tab 이동
- [x] Enter: Form input에서 confirmRename
- [x] Escape: N/A (패널 내부에서 cancel 동작 없음 — blur commit)
- [x] Tab: Form input 간 이동 (브라우저 기본)
- [x] Space: Form input 텍스트 입력 (브라우저 기본)
- [x] Home/End: Form input 커서 이동 (브라우저 기본)
- [x] Mod+Z: 캔버스 Zone에서 처리 → store 변경 → 패널 자동 반영
- [x] 클릭: Form input 포커스 (브라우저 기본)
- [x] 이벤트 버블링: Detail Panel은 별도 Zone — 캔버스 이벤트와 격리

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| leaf 노드 포커스 (children 없음) | 기존 단일 노드 패널 | leaf는 컨테이너가 아니므로 재귀 수집 불필요. 기존 동작 유지 = 회귀 방지 | 기존과 동일: 해당 노드 필드만 Form 표시 | 변경 없음 | |
| 편집 가능 필드 없는 컨테이너 (links) | links 포커스, children = link 노드들 | links 자체 필드 없지만 자식 link에는 label·href 있음 → 그룹 수집으로 표시 가능 | link 노드들이 그룹으로 표시 | 그룹별 Form | |
| section 내 패턴 14개 (patterns) | patterns 포커스, 17개 필드 | 접기 없이 모두 펼침 — 17개는 스크롤로 충분, accordion UX 비용이 더 큼 | 모든 pattern name 필드가 한 줄씩 나열, 스크롤 가능 | 스크롤 가능한 Form | |
| 패널 Form 편집 중 캔버스 포커스 변경 | Form input에 미저장 값 | blur 발생 → 자동 commit → 패널 새 노드로 갱신. 기존 inline-edit PRD와 동일 동작 | 이전 값 확정, 새 노드 Form 표시 | 이전 entity 갱신 + 새 패널 | |
| 초기 상태 (focusedNodeId 없음) | 아무 노드도 포커스 안됨 | 기존 동작 유지 | "Select a node" 빈 상태 | 변경 없음 | |
| 그룹 라벨 결정 — 자식 중 대표 텍스트가 없는 경우 | stat 컨테이너 (자식: stat-value + text) | stat-value의 value("14")를 라벨로 사용하면 의미 불명 → text(label) 자식의 값을 우선 | 그룹 라벨: "APG Patterns" (text label 자식의 localized 값) | 의미 있는 그룹 헤더 | |
| 그룹 라벨 — pattern 노드 (leaf, 그룹 아님) | pattern에 name 필드 있음 | pattern은 leaf라 그룹이 아닌 단일 필드 행. section 펼침 시 각각 독립 행 | "Treegrid" name 필드 1개짜리 행 | 단일 필드 행 | |
| 캔버스 포커스가 card 내부 leaf로 이동 | 패널: section 전체 표시 중 | focusedNodeId가 leaf로 변경 → leaf 단일 필드로 전환. BUT spatial 모델에서 leaf 직접 포커스는 card 진입 후에만 가능 → 실제로는 card 범위 | 패널: leaf 단일 필드 (card Enter 진입 후 상황) | leaf 단일 필드 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | CMS에서 디자인 변경 불가 (feedback) | ③ Form 필드 | ✅ 준수 — 콘텐츠(텍스트)만 편집, variant/className 노출 안 함 | — | |
| P2 | 하나의 앱 = 하나의 store (feedback) | ② 산출물 | ✅ 준수 — Detail Panel은 같은 store 구독, 별도 store 생성 없음 | — | |
| P3 | rename plugin 경유 필수 (inline-edit PRD) | ③ confirmRename | ✅ 준수 — 기존 DetailField의 confirmRename 경로 재사용 | — | |
| P4 | rich text 금지 (feedback) | ③ Form input | ✅ 준수 — plain text input만 | — | |
| P5 | 중첩 이벤트 버블링 가드 (feedback) | ③ 이벤트 격리 | ✅ 준수 — Detail Panel은 별도 Zone, 캔버스와 이벤트 격리 자동 | — | |
| P6 | 설계 원칙 > 요구 충족 (feedback) | 전체 | ✅ 준수 — engine 우회 없음, rename plugin 경유 | — | |
| P7 | 파일명 = 주 export (CLAUDE.md) | ② 산출물 | ✅ 준수 — CmsDetailPanel.tsx에 기존 확장 | — | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| S1 | `CmsDetailPanel.tsx` — 기존 단일 노드 로직 | 기존 leaf 편집이 깨질 수 있음 | 중 | leaf일 때 기존 경로 유지 (분기). ④ 경계 첫 행에 명시 | |
| S2 | `cms-schema.ts` `getEditableFields` | 현재 단일 노드용. 재귀 수집은 별도 함수로 추가하므로 기존 함수 변경 없음 | 낮 | 기존 함수 그대로, 새 `collectEditableGroups`가 내부에서 호출 | |
| S3 | 패널 스크롤 — 현재 필드 적어서 스크롤 불필요 | section 레벨에서 17필드 → 패널 높이 초과 | 낮 | overflow-y: auto 추가 (이미 있을 가능성 높음) | |
| S4 | 캔버스 포커스 변경 빈도 증가 → 패널 재렌더 빈도 | 성능 영향 미미 (React 기본 최적화 + 필드 수 최대 17개) | 낮 | 허용 | |

완성도: 🟢

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| N1 | 컨테이너 그룹에서 디자인 속성(variant, className, role) 노출 | P1 디자인 변경 불가 | 콘텐츠만 편집 | |
| N2 | 그룹 Form에서 store 직접 mutation (engine 우회) | P6 설계 원칙 우선 | undo/redo history 끊김 | |
| N3 | 그룹 접기(accordion) UI 추가 | Discussion 합의 | 17필드까지 스크롤로 충분, 클릭 한번 더 = 빠른 편집 목적에 역행 | |
| N4 | 별도 store로 패널 상태 관리 | P2 단일 store | 동기화 문제 원천 차단 | |
| N5 | 재귀 수집에서 기존 `getEditableFields` 시그니처 변경 | S2 부작용 방지 | 기존 호출처(leaf 편집) 회귀 방지 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 (①동기N / ④경계N) | 시나리오 | 예상 결과 | 역PRD |
|---|----------------------|---------|----------|-------|
| V1 | ①M1 | card(card-store) 포커스 → 패널 확인 | "Normalized Store" 그룹: title input + desc input 표시 | |
| V2 | ①M2 | section(features) 포커스 → 패널 확인 | Section Header 그룹(label·title·desc) + card 4개 그룹(각 title·desc) = 11필드 | |
| V3 | ①M3 | section 포커스 → Enter → card 깊이 진입 | 패널이 해당 card 필드만으로 좁혀짐 | |
| V4 | ①M3 역 | card 깊이에서 Escape → section 복귀 | 패널이 section 전체 그룹으로 넓어짐 | |
| V5 | ①M4 | 컨테이너 패널에서 title input 수정 + blur | 캔버스 텍스트 즉시 갱신 | |
| V6 | ①M4 + undo | V5 후 캔버스에서 Mod+Z | 캔버스 텍스트 + 패널 input 모두 이전 값 복원 | |
| V7 | ④ leaf 기존 동작 | leaf 노드(hero-title) 포커스 → 패널 | 기존과 동일: 단일 Text 필드 Form (회귀 없음) | |
| V8 | ④ patterns 17필드 | patterns section 포커스 → 패널 | 14 pattern name + section header 3 = 17필드, 스크롤 가능 | |
| V9 | ④ 편집 중 포커스 변경 | 패널 input 편집 중 캔버스에서 다른 노드 클릭 | blur → commit → 패널 새 노드로 갱신 | |
| V10 | ④ 그룹 라벨 | stat 컨테이너 그룹 라벨 | text(label) 자식의 localized 값이 그룹 헤더로 표시 (예: "APG Patterns") | |
| V11 | ④ 초기 상태 | CMS 진입 직후 (포커스 없음) | "Select a node" 빈 상태 (기존 동작) | |
| V12 | ④ links 컨테이너 | footer-links 포커스 → 패널 | link 3개 그룹: 각 label + href 필드 | |

완성도: 🟢

---

**전체 완성도:** 🟢 8/8
