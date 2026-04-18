---
id: 2-areas/pattern/prds/form-pattern-detail-panel-prd
title: 'CMS DetailPanel os화 — form 패턴 + zone 전환 PRD'
status: active
kind: prd
created: 2026-04-11
updated: 2026-04-11
summary: 'Discussion: slot-only 노드에서 Enter drill-down 시 sr-only 프록시에 포커스되어 무반응. form 패턴 신규 + DetailPanel os화 + zone 전환으로 근본 해결.'
topics: [2-areas]
relates: []
supersedes: []
---
# CMS DetailPanel os화 — form 패턴 + zone 전환 PRD

> Discussion: slot-only 노드에서 Enter drill-down 시 sr-only 프록시에 포커스되어 무반응. form 패턴 신규 + DetailPanel os화 + zone 전환으로 근본 해결.

## ① 동기

### WHY

- **Impact**: CMS에서 slot-only 노드(children 0, slot > 0)에 Enter drill-down하면 sr-only div에 포커스가 가서 키보드 사용 불가. 키보드 사용자가 slot 자식의 편집 필드에 도달할 수 없음
- **Forces**: FlatLayout 전환으로 렌더 위치(DetailWidget)와 포커스 위치(CmsCanvas sr-only 프록시)가 분리됨. 렌더/포커스 분리는 FlatLayout의 구조적 특성(위젯이 별도 영역에 렌더)이라 바꿀 수 없음
- **Assets**: navigate('natural') 이미 존재 (Tab 순서 보존, Arrow 없음), expand axis, useAriaZone (CalendarGrid 선례), renameCommands (DetailPanel이 이미 사용)
- **Decision**: form 패턴 + zone 전환. 기각: A) DOM focus만 이동 — 엔진 밖 임시방편, B) listbox 패턴 — Arrow가 textarea 커서와 충돌
- **Non-Goals**: DetailPanel 필드 타입 추가/변경, CMS store 구조 변경, value axis를 form 필드에 적용 (숫자 전용이라 부적합)

### 시나리오

| # | Given | When | Then | 역PRD |
|---|-------|------|------|-------|
| S1 | slot-only 노드에 포커스 | Enter | DetailPanel zone으로 전환, 첫 편집 필드(input/textarea)에 포커스 | |
| S2 | DetailPanel 필드에 포커스 | Escape | CmsCanvas zone으로 복귀, 원래 slot-only 노드에 포커스 | |
| S3 | DetailPanel 필드에 포커스 | Tab | 다음 편집 필드로 이동 (브라우저 네이티브) | |
| S4 | DetailPanel 그룹이 접힘 | Enter/Click on 그룹 헤더 | 그룹 펼침, 하위 필드 노출 | |
| S5 | children > 0인 노드에 포커스 | Enter | 기존 동작 유지 (children drill-down) | |

완성도: 🟢

## ② 산출물

| 산출물 | 설명 | 역PRD |
|--------|------|-------|
| `src/interactive-os/pattern/roles/form.ts` | form 패턴: navigate('natural') + expand(). role='form', childRole='group' | |
| `src/interactive-os/ui/Form.tsx` | Form UI 완성품. useAria + form 패턴. 그룹/필드 렌더링 | |
| `src/pages/cms/CmsDetailPanel.tsx` | os화 전환: Form UI 사용, useAriaZone으로 zone 참여 | |
| `src/pages/cms/CmsCanvas.tsx` | sr-only 프록시 제거 (L438~453), Enter handler에 zone 전환 추가 | |
| `src/pages/cms/cmsWidgets.tsx` | DetailWidget에 zone 연결 | |

완성도: 🟢

## ③ 인터페이스

| 입력 | 현재 상태 | 행동 | 왜 이 결과가 나는가 | 결과 상태 | 역PRD |
|------|----------|------|-------------------|----------|-------|
| Enter (CmsCanvas) | slot-only 노드 포커스 | zone 전환 dispatch | slot-only = children 0 + slot > 0이므로 drill-down 대상이 DetailPanel | DetailPanel 첫 필드 포커스 | |
| Escape (DetailPanel) | 필드 포커스 | zone 복귀 dispatch | DetailPanel은 부차 zone이므로 Escape로 주 zone(Canvas)에 복귀 | CmsCanvas 원래 노드 포커스 | |
| Tab (DetailPanel) | 필드 N 포커스 | 브라우저 네이티브 Tab | form은 랜드마크, Tab 순회가 표준 (APG) | 필드 N+1 포커스 | |
| Shift+Tab (DetailPanel) | 필드 N 포커스 | 브라우저 네이티브 | 역방향 순회 | 필드 N-1 포커스 | |
| Enter (DetailPanel 그룹 헤더) | 그룹 접힘 | expand axis toggle | 그룹은 expand 가능 엔티티 | 그룹 펼침, 하위 필드 노출 | |
| Enter (DetailPanel input) | 필드 편집 중 | commit (renameCommands) | Enter = 값 확정 (기존 동작 유지) | 값 커밋, 포커스 유지 | |
| Cmd+Z (DetailPanel) | 필드 편집 중 | undo (historyCommands) | 기존 undo 동작 유지 | 이전 값 복원 | |
| blur (DetailPanel input) | 필드 편집 중 | commit | 포커스 이탈 시 자동 저장 (기존 동작 유지) | 값 커밋 | |

완성도: 🟢

## ④ 경계

| 극단 조건 | 현재 상태 | 왜 이렇게 동작해야 하는가 | 예상 동작 | 결과 상태 | 역PRD |
|----------|----------|------------------------|----------|----------|-------|
| E1: 편집 필드 0개 노드 | slot-only, 모든 필드 read-only | drill-down 대상이 없음 | Enter 무시 (기존 leaf rename 시도) | 변화 없음 | |
| E2: DetailPanel 마지막 필드에서 Tab | 마지막 필드 포커스 | Tab이 zone 밖으로 나가면 Canvas로 자연스럽게 돌아와야 함 | 브라우저 Tab이 다음 focusable 요소(Canvas)로 이동 | Canvas 포커스 | |
| E3: Canvas에서 다른 노드 클릭 중 DetailPanel 열림 | DetailPanel에 이전 노드 필드 표시 | focusedNodeId 변경 시 DetailPanel 내용도 갱신되어야 함 | DetailPanel이 새 노드의 필드로 갱신 | 새 필드 목록 | |
| E4: 그룹 전부 접힌 상태에서 Tab | 접힌 그룹 내 필드 | 접힌 그룹의 필드는 DOM에서 제거되어 Tab 순회에서 빠져야 함 | Tab이 접힌 그룹 건너뜀 | 다음 펼친 그룹 필드 포커스 | |
| E5: IconField 그리드 펼침 중 Escape | 아이콘 선택 그리드 열림 | Escape 의도 모호: 그리드 닫기 vs zone 탈출 | 그리드 닫기 우선 (expand collapse). 이미 접혀있으면 zone 탈출 | 그리드 접힘 or zone 복귀 | |

완성도: 🟢

## ⑤ 원칙 대조

| # | 원칙 (출처) | 관련 항목 | 위반 여부 | 위반 시 수정 | 역PRD |
|---|------------|----------|----------|------------|-------|
| P1 | os 기반 개발 — pages에서 useAria/useAriaZone 직접 사용 금지 (CLAUDE.md) | ② CmsDetailPanel | 위반 가능 | Form UI 완성품을 ui/에 먼저 만들고, CmsDetailPanel은 Form을 import | |
| P2 | 모든 상태는 NormalizedData+Command, useState 금지 (feedback_all_state_normalized_command) | ② CmsDetailPanel IconField | 위반 | IconField의 useState(expanded) → expand axis로 전환 | |
| P3 | UI 컴포넌트만 노출, primitives 직접 사용 금지 (feedback_ui_over_primitives) | ② Form | 준수 | Form이 ui/ 완성품으로 존재 | |
| P4 | 중첩 이벤트 버블링 가드 (feedback_nested_bubbling_guard) | ③ zone 전환 | 주의 | Canvas와 DetailPanel 두 zone 간 키 이벤트에 defaultPrevented 가드 | |
| P5 | expand/collapse는 view state, undo 대상 아님 (feedback_expand_not_history) | ③ 그룹 접기 | 준수 | useAriaZone이 meta command를 local state로 격리하므로 자동 준수 | |
| P6 | interactive 축 필수 (CLAUDE.md) | ② Form 필드 | 준수 | 필드에 interactive: 'input', 그룹 헤더에 interactive: 'button' | |
| P7 | 선언=등록, 합성 런타임 불변 (feedback_declarative_ocp) | ② form 패턴 | 준수 | composePattern으로 정적 합성 | |
| P8 | renderItem에 ARIA props 전달 필수 (CLAUDE.md) | ② Form 렌더링 | 준수 | Form UI가 getItemProps(id) 전달 | |
| P9 | 레이어 의존 순서 store→engine→axis→pattern→primitives→ui→pages (CLAUDE.md) | ② 전체 | 준수 | form.ts(pattern) → Form.tsx(ui) → CmsDetailPanel(pages) | |

완성도: 🟢

## ⑥ 부작용

| # | 이 기능이 건드리는 기존 것 | 예상 부작용 | 심각도 | 대응 | 역PRD |
|---|------------------------|-----------|--------|------|-------|
| B1 | CmsCanvas sr-only 프록시 제거 | cms-tab-flow.integration.test.tsx 실패 가능 | 중 | 테스트 확인 후 수정 | |
| B2 | CmsCanvas Enter handler 분기 변경 | 기존 children drill-down, tab-item 분기에 영향 | 중 | slot-only 조건을 기존 분기보다 먼저 평가 | |
| B3 | DetailPanel 완전 재작성 | 기존 필드 렌더링/커밋 로직 변경 | 중 | useFieldCommit 로직은 Form UI items/ 렌더러로 이식, 동작 보존 | |
| B4 | cmsStore에 form 노드 추가 시 셀렉터 오염 | cmsState 셀렉터가 form 노드를 잘못 순회 | 높 | useAriaZone이 meta를 local state로 격리. 데이터 command만 real engine으로 통과하므로 store에 form 전용 노드 불필요 — collectEditableGroups는 기존 store 노드의 data 필드를 읽기만 함 | |

완성도: 🟡 (B1 테스트 확인 필요 — 구현 시 확인)

## ⑦ 금지

| # | 하면 안 되는 것 | 출처 (⑤ 위반 / ⑥ 부작용) | 이유 | 역PRD |
|---|---------------|------------------------|------|-------|
| F1 | pages/에서 useAria/useAriaZone 직접 사용 | P1 위반 | Form UI 완성품을 거쳐야 함 | |
| F2 | DetailPanel에 useState로 view state 관리 | P2 위반 | expand axis 사용 | |
| F3 | cmsStore에 form 전용 합성 노드 추가 | B4 부작용 | 셀렉터 오염. 기존 노드를 그대로 사용 | |
| F4 | form 패턴에 Arrow 키 바인딩 | APG 표준 | form은 Tab 순회가 표준. Arrow는 개별 위젯 내부용 | |
| F5 | sr-only 프록시를 다른 형태로 재도입 | ⑥ 근본 원인 | 렌더/포커스 분리가 버그의 원인. zone 전환이 해법 | |

완성도: 🟢

## ⑧ 검증

| # | 출처 | 시나리오 | 예상 결과 | 역PRD |
|---|------|---------|----------|-------|
| V1 | S1 동기 | slot-only 노드에서 Enter | DetailPanel 첫 input에 document.activeElement 일치 | |
| V2 | S2 동기 | DetailPanel에서 Escape | CmsCanvas 원래 노드에 포커스 복귀 | |
| V3 | S3 동기 | DetailPanel에서 Tab 연타 | 모든 편집 필드를 순서대로 순회 | |
| V4 | S4 동기 | 접힌 그룹 헤더에서 Enter | 그룹 펼침, aria-expanded="true" | |
| V5 | S5 동기 | children > 0 노드에서 Enter | 기존 children drill-down 동작 유지 (regression 없음) | |
| V6 | E1 경계 | 편집 필드 0개 노드에서 Enter | zone 전환 없이 기존 동작 | |
| V7 | E4 경계 | 접힌 그룹 내 필드 Tab 건너뜀 | Tab이 접힌 그룹을 skip | |
| V8 | E5 경계 | IconField 그리드 열림 중 Escape | 그리드 접힘 (zone 탈출 아님) | |
| V9 | B1 부작용 | sr-only 프록시 제거 후 CMS 키보드 전체 | 기존 CMS 키보드 네비게이션 regression 없음 | |

완성도: 🟢

---

**전체 완성도:** 🟢 7/8 (⑥만 🟡 — B1 테스트는 구현 시 확인)
